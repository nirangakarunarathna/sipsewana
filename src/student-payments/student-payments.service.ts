// student-payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { StudentPayment } from './entities/student-payment.entity';

type PaymentRow = { studentId: number; paid: boolean; amount: number };

function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

@Injectable()
export class StudentPaymentsService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly repo: Repository<StudentPayment>,
    private readonly dataSource: DataSource, // ✅ ADD THIS
  ) {}

  async list(classId: number, yearMonth: string) {
    const rows = await this.repo.find({
      where: { class_id: classId, year_month: yearMonth },
      select: ['student_id', 'is_paid', 'amount', 'paid_at'],
    });

    return rows.map((r) => ({
      studentId: r.student_id,
      paid: !!r.is_paid,
      amount: Number(r.amount ?? 0),
      paidAt: r.paid_at ?? null,
    }));
  }

  async bulkUpsert(classId: number, yearMonth: string, payments: PaymentRow[]) {
    if (!classId) throw new BadRequestException('classId required');
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new BadRequestException('yearMonth must be YYYY-MM');
    }
    if (!payments?.length)
      throw new BadRequestException('payments cannot be empty');

    const studentIds = payments.map((p) => p.studentId);

    const existing = await this.repo.find({
      where: {
        class_id: classId,
        year_month: yearMonth,
        student_id: In(studentIds),
      },
      select: ['id', 'student_id', 'is_paid', 'paid_at'],
    });

    const existingMap = new Map<
      number,
      { is_paid: boolean; paid_at: Date | null }
    >();
    for (const e of existing) {
      existingMap.set(e.student_id, {
        is_paid: !!e.is_paid,
        paid_at: e.paid_at ?? null,
      });
    }

    const now = new Date();

    const rows: Partial<StudentPayment>[] = payments.map((p) => {
      const prev = existingMap.get(p.studentId);
      const nextPaid = !!p.paid;

      let paidAt: Date | null = null;
      if (nextPaid) {
        paidAt = prev?.is_paid ? (prev.paid_at ?? now) : now;
      } else {
        paidAt = null;
      }

      return {
        class_id: classId,
        year_month: yearMonth,
        student_id: p.studentId,
        is_paid: nextPaid,
        amount: Number(p.amount ?? 0),
        paid_at: paidAt,
      };
    });

    const chunks = chunkArray(rows, 1000);
    for (const part of chunks) {
      await this.repo.upsert(part, {
        conflictPaths: ['class_id', 'student_id', 'year_month'],
      });
    }

    return { ok: true, upserted: rows.length };
  }

  // ==========================================================
  // ✅ NEW: SUBJECT WISE SUMMARY (MONTH)
  // GET /student-payments/summary?scope=month&yearMonth=2026-02
  // ==========================================================
  private buildTotals(rows: any[]) {
    const t = rows.reduce(
      (acc, r) => {
        acc.totalStudents += r.totalStudents;
        acc.paidCount += r.paidCount;
        acc.notPaidCount += r.notPaidCount;
        acc.totalIncome += r.totalIncome;
        acc.instituteIncome += r.instituteIncome;
        return acc;
      },
      {
        totalStudents: 0,
        paidCount: 0,
        notPaidCount: 0,
        totalIncome: 0,
        instituteIncome: 0,
      },
    );

    return {
      ...t,
      paidPct: t.totalStudents
        ? Math.round((t.paidCount / t.totalStudents) * 100)
        : 0,
    };
  }

  async subjectWiseSummaryMonth(yearMonth: string) {
    const rows = await this.subjectWiseCore({
      joinFilterSql: 'sp.year_month = :ym',
      params: { ym: yearMonth },
    });

    return {
      scope: 'month',
      period: yearMonth,
      rows,
      totals: this.buildTotals(rows),
    };
  }

  async subjectWiseSummaryYear(year: string) {
    const rows = await this.subjectWiseCore({
      joinFilterSql: 'sp.year_month LIKE :y',
      params: { y: `${year}-%` },
    });

    return {
      scope: 'year',
      period: year,
      rows,
      totals: this.buildTotals(rows),
    };
  }

  private async subjectWiseCore(args: {
    joinFilterSql: string;
    params: Record<string, any>;
  }) {
    const raw = await this.dataSource
      .createQueryBuilder()
      .select('s.id', 'subjectId')
      .addSelect('s.name', 'subjectName') // change to s.subject_name if your DB uses that

      .addSelect('COUNT(DISTINCT sc.student_id)', 'totalStudents')

      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_paid = 1 THEN sc.student_id ELSE NULL END)',
        'paidCount',
      )

      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 THEN sp.amount ELSE 0 END), 0)',
        'totalIncome',
      )

      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 THEN (sp.amount * (c.institute_percentage / 100)) ELSE 0 END), 0)',
        'instituteIncome',
      )

      .from('subjects', 's')
      .leftJoin('classes', 'c', 'c.subject_id = s.id')
      .leftJoin('student_classes', 'sc', 'sc.class_id = c.id')

      .leftJoin(
        'student_payments',
        'sp',
        `sp.class_id = c.id AND sp.student_id = sc.student_id AND ${args.joinFilterSql}`,
        args.params,
      )

      .groupBy('s.id')
      .addGroupBy('s.name')
      .orderBy('totalStudents', 'DESC')
      .getRawMany();

    return raw.map((r) => {
      const totalStudents = Number(r.totalStudents || 0);
      const paidCount = Number(r.paidCount || 0);

      return {
        subjectId: Number(r.subjectId),
        subjectName: String(r.subjectName),
        totalStudents,
        paidCount,
        notPaidCount: Math.max(0, totalStudents - paidCount),
        paidPct: totalStudents
          ? Math.round((paidCount / totalStudents) * 100)
          : 0,
        totalIncome: Number(r.totalIncome || 0),
        instituteIncome: Number(r.instituteIncome || 0),
      };
    });
  }
}
