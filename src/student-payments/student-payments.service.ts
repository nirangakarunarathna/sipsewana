import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { StudentPayment } from './entities/student-payment.entity';

type PaymentRow = {
  studentId: number;
  paid: boolean;
  amount: number;
  isFree?: boolean;
  feeRemaining?: boolean;
  paidAt?: string | null;
};

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
      select: ['student_id', 'is_paid', 'amount', 'paid_at', 'is_free', 'fee_remaining'],
    });

    return rows.map((r) => ({
      studentId: r.student_id,
      paid: !!r.is_paid,
      amount: Number(r.amount ?? 0),
      paidAt: r.paid_at ? new Date(r.paid_at).toISOString().slice(0, 10) : null,
      isFree: !!(r as any).is_free,
      feeRemaining: !!(r as any).fee_remaining,
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
      select: ['id', 'student_id', 'is_paid', 'paid_at', 'is_free', 'fee_remaining'],
    });

    const existingMap = new Map<
      number,
      {
        is_paid: boolean;
        paid_at: Date | null;
        is_free: boolean;
        fee_remaining: boolean;
      }
    >();

    for (const e of existing) {
      existingMap.set(e.student_id, {
        is_paid: !!e.is_paid,
        paid_at: e.paid_at ?? null,
        is_free: !!(e as any).is_free,
        fee_remaining: !!(e as any).fee_remaining,
      });
    }

    const now = new Date();

    const rows: Partial<StudentPayment>[] = payments.map((p) => {
      const prev = existingMap.get(p.studentId);

      const isFree = !!p.isFree;
      const nextPaid = isFree ? false : !!p.paid;
      const feeRemaining = isFree ? false : !!p.feeRemaining;

      let paidAt: Date | null = null;

      if (nextPaid) {
        if (p.paidAt) {
          paidAt = new Date(p.paidAt);
        } else {
          paidAt = prev?.is_paid ? (prev.paid_at ?? now) : now;
        }
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
        fee_remaining: feeRemaining,
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

  private buildTotals(rows: any[]) {
    const totalStudents = rows.reduce((s, r) => s + Number(r.totalStudents || 0), 0);
    const paidCount = rows.reduce((s, r) => s + Number(r.paidCount || 0), 0);
    const freeCount = rows.reduce((s, r) => s + Number(r.freeCount || 0), 0);
    const totalIncome = rows.reduce((s, r) => s + Number(r.totalIncome || 0), 0);
    const instituteIncome = rows.reduce((s, r) => s + Number(r.instituteIncome || 0), 0);

    const notPaidCount = Math.max(0, totalStudents - paidCount - freeCount);
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
      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_free = 1 THEN sc.student_id ELSE NULL END)',
        'freeCount',
      )
      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN sc.student_id ELSE NULL END)',
        'paidCount',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN sp.amount ELSE 0 END), 0)',
        'totalIncome',
      )
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

      const notPaidCount = Math.max(0, totalStudents - paidCount - freeCount);
      const denom = Math.max(0, totalStudents - freeCount);
      const paidPct = denom ? Math.round((paidCount / denom) * 100) : 0;

      return {
        subjectId: Number(r.subjectId),
        subjectName: String(r.subjectName),
        totalStudents,
        paidCount,
        freeCount,
        notPaidCount,
        paidPct,
        totalIncome: Number(r.totalIncome || 0),
        instituteIncome: Number(r.instituteIncome || 0),
      };
    });
  }

  async teacherBillSummaryMonth(args: {
    teacherId: number;
    yearMonth: string;
    subjectId: number | null;
  }) {
    const { teacherId, yearMonth, subjectId } = args;

    const teacher = await this.getTeacherBasic(teacherId);
    const subject = subjectId ? await this.getSubjectBasic(subjectId) : null;

    const rows = await this.teacherBillCoreMonth({
      teacherId,
      yearMonth,
      subjectId,
    });

    const totals = this.buildTeacherBillTotals(rows);

    return {
      scope: 'month',
      period: yearMonth,
      teacher,
      subject,
      rows,
      totals,
    };
  }

  private async teacherBillCoreMonth(args: {
    teacherId: number;
    yearMonth: string;
    subjectId: number | null;
  }) {
    const { teacherId, yearMonth, subjectId } = args;

    const qb = this.dataSource
      .createQueryBuilder()
      .select('c.id', 'classId')
      .addSelect('c.name', 'className')
      .addSelect('COALESCE(c.institute_percentage, 0)', 'institutePercentage')
      .addSelect('COUNT(DISTINCT sc.student_id)', 'totalStudents')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN sc.student_id ELSE NULL END)',
        'paidCount',
      )
      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_free = 1 THEN sc.student_id ELSE NULL END)',
        'freeCount',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN sp.amount ELSE 0 END), 0)',
        'totalIncome',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 AND (sp.is_free IS NULL OR sp.is_free = 0) THEN (sp.amount * (COALESCE(c.institute_percentage,0) / 100)) ELSE 0 END), 0)',
        'instituteIncome',
      )
      .from('classes', 'c')
      .leftJoin('student_classes', 'sc', 'sc.class_id = c.id')
      .leftJoin(
        'student_payments',
        'sp',
        'sp.class_id = c.id AND sp.student_id = sc.student_id AND sp.year_month = :ym',
        { ym: yearMonth },
      )
      .where('c.teacher_id = :teacherId', { teacherId });

    if (subjectId) {
      qb.andWhere('c.subject_id = :subjectId', { subjectId });
    }

    qb.groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.institute_percentage')
      .orderBy('totalStudents', 'DESC');

    const raw = await qb.getRawMany();

    return raw.map((r) => {
      const totalStudents = Number(r.totalStudents || 0);
      const paidCount = Number(r.paidCount || 0);
      const freeCount = Number(r.freeCount || 0);

      const totalIncome = Number(r.totalIncome || 0);
      const instituteIncome = Number(r.instituteIncome || 0);
      const teacherIncome = totalIncome - instituteIncome;

      return {
        classId: Number(r.classId),
        className: String(r.className),
        institutePercentage: Number(r.institutePercentage || 0),
        totalStudents,
        paidCount,
        freeCount,
        notPaidCount: Math.max(0, totalStudents - (paidCount + freeCount)),
        totalIncome,
        instituteIncome,
        teacherIncome,
      };
    });
  }

  private buildTeacherBillTotals(rows: any[]) {
    const t = rows.reduce(
      (acc, r) => {
        acc.totalStudents += Number(r.totalStudents || 0);
        acc.paidCount += Number(r.paidCount || 0);
        acc.freeCount += Number(r.freeCount || 0);
        acc.notPaidCount += Number(r.notPaidCount || 0);
        acc.totalIncome += Number(r.totalIncome || 0);
        acc.instituteIncome += Number(r.instituteIncome || 0);
        acc.teacherIncome += Number(r.teacherIncome || 0);
        return acc;
      },
      {
        totalStudents: 0,
        paidCount: 0,
        freeCount: 0,
        notPaidCount: 0,
        totalIncome: 0,
        instituteIncome: 0,
        teacherIncome: 0,
      },
    );

    return {
      ...t,
      paidPct: t.totalStudents ? Math.round((t.paidCount / t.totalStudents) * 100) : 0,
    };
  }

  private async getTeacherBasic(teacherId: number) {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('t.id', 'id')
      .addSelect('t.fullName', 'fullName')
      .from('teachers', 't')
      .where('t.id = :id', { id: teacherId })
      .getRawOne();

    if (!row) return { id: teacherId, fullName: `Teacher #${teacherId}` };
    return { id: Number(row.id), fullName: row.fullName ?? row.name ?? `Teacher #${teacherId}` };
  }

  private async getSubjectBasic(subjectId: number) {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .from('subjects', 's')
      .where('s.id = :id', { id: subjectId })
      .getRawOne();

    if (!row) return { id: subjectId, name: `Subject #${subjectId}` };
    return { id: Number(row.id), name: String(row.name ?? `Subject #${subjectId}`) };
  }

  private money(n: any) {
    const v = Number(n || 0);
    return `${Math.round(v).toLocaleString()} `;
  }
}