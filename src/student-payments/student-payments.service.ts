// student-payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { StudentPayment } from './entities/student-payment.entity';

// ✅ add isFree
type PaymentRow = { studentId: number; paid: boolean; amount: number; isFree?: boolean };

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
    private readonly dataSource: DataSource,
  ) {}

  async list(classId: number, yearMonth: string) {
    const rows = await this.repo.find({
      where: { class_id: classId, year_month: yearMonth },
      // ✅ include is_free
      select: ['student_id', 'is_paid', 'amount', 'paid_at', 'is_free'],
    });

    return rows.map((r) => ({
      studentId: r.student_id,
      paid: !!r.is_paid,
      amount: Number(r.amount ?? 0),
      paidAt: r.paid_at ?? null,
      isFree: !!(r as any).is_free,
    }));
  }

  async bulkUpsert(classId: number, yearMonth: string, payments: PaymentRow[]) {
    if (!classId) throw new BadRequestException('classId required');
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new BadRequestException('yearMonth must be YYYY-MM');
    }
    if (!payments?.length) throw new BadRequestException('payments cannot be empty');

    const studentIds = payments.map((p) => p.studentId);

    const existing = await this.repo.find({
      where: {
        class_id: classId,
        year_month: yearMonth,
        student_id: In(studentIds),
      },
      select: ['id', 'student_id', 'is_paid', 'paid_at', 'is_free'],
    });

    const existingMap = new Map<number, { is_paid: boolean; paid_at: Date | null; is_free: boolean }>();
    for (const e of existing) {
      existingMap.set(e.student_id, {
        is_paid: !!e.is_paid,
        paid_at: e.paid_at ?? null,
        is_free: !!(e as any).is_free,
      });
    }

    const now = new Date();

    const rows: Partial<StudentPayment>[] = payments.map((p) => {
      const prev = existingMap.get(p.studentId);

      const isFree = !!p.isFree;
      const nextPaid = isFree ? false : !!p.paid;

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
        is_free: isFree,
        is_paid: nextPaid,
        amount: isFree ? 0 : Number(p.amount ?? 0),
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
  // ✅ SUBJECT WISE SUMMARY (MONTH/YEAR) WITH FREE COUNT
  // Paid % denominator excludes free students:
  // paidPct = paidCount / (totalStudents - freeCount)
  // ==========================================================
  private buildTotals(rows: any[]) {
  const totalStudents = rows.reduce((s, r) => s + Number(r.totalStudents || 0), 0);
  const paidCount = rows.reduce((s, r) => s + Number(r.paidCount || 0), 0);
  const freeCount = rows.reduce((s, r) => s + Number(r.freeCount || 0), 0);
  const totalIncome = rows.reduce((s, r) => s + Number(r.totalIncome || 0), 0);
  const instituteIncome = rows.reduce((s, r) => s + Number(r.instituteIncome || 0), 0);

  // ✅ free not included in notPaid
  const notPaidCount = Math.max(0, totalStudents - paidCount - freeCount);

  // ✅ paid percentage denominator excludes free students
  const denom = Math.max(0, totalStudents - freeCount);
  const paidPct = denom ? Math.round((paidCount / denom) * 100) : 0;

  return {
    totalStudents,
    paidCount,
    freeCount,
    notPaidCount,
    totalIncome,
    instituteIncome,
    paidPct,
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

  private async subjectWiseCore(args: { joinFilterSql: string; params: Record<string, any> }) {
    const raw = await this.dataSource
      .createQueryBuilder()
      .select('s.id', 'subjectId')
      .addSelect('s.name', 'subjectName')

      .addSelect('COUNT(DISTINCT sc.student_id)', 'totalStudents')

      // ✅ count free students
      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_free = 1 THEN sc.student_id ELSE NULL END)',
        'freeCount',
      )

      // ✅ count paid students (ignore free)
      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN sc.student_id ELSE NULL END)',
        'paidCount',
      )

      // ✅ income (ignore free)
      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN sp.amount ELSE 0 END), 0)',
        'totalIncome',
      )

      // ✅ institute income (ignore free)
      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN (sp.amount * (c.institute_percentage / 100)) ELSE 0 END), 0)',
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
      const freeCount = Number(r.freeCount || 0);

      // ✅ free should NOT be counted as notPaid
      const notPaidCount = Math.max(0, totalStudents - paidCount - freeCount);

      // ✅ paidPct denominator excludes free students (totalStudents stays same)
      const denom = Math.max(0, totalStudents - freeCount);
      const paidPct = denom ? Math.round((paidCount / denom) * 100) : 0;

      return {
        subjectId: Number(r.subjectId),
        subjectName: String(r.subjectName),
        totalStudents,
        paidCount,
        freeCount,
        notPaidCount,
        paidPct, // ✅ FIXED LOGIC
        totalIncome: Number(r.totalIncome || 0),
        instituteIncome: Number(r.instituteIncome || 0),
      };
    });
  }
}