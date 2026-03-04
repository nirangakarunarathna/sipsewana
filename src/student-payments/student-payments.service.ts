// student-payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
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

   // ============================
  // TEACHER BILL - MONTH SUMMARY
  // ============================
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

  // ============================
  // TEACHER BILL - PDF (A4)
  // ============================
  async teacherBillPdfMonth(args: {
    teacherId: number;
    yearMonth: string;
    subjectId: number | null;
    adjustments: Array<{ type: 'add' | 'deduct'; amount: number; note?: string }>;
  }) {
    const summary = await this.teacherBillSummaryMonth({
      teacherId: args.teacherId,
      yearMonth: args.yearMonth,
      subjectId: args.subjectId,
    });

    // adjustments sanitize
    const adjustments = (args.adjustments || [])
      .map((a) => ({
        type: a?.type === 'deduct' ? 'deduct' : 'add',
        amount: Number(a?.amount ?? 0) || 0,
        note: String(a?.note ?? '').trim(),
      }))
      .filter((a) => a.amount !== 0 || a.note);

    const addTotal = adjustments
      .filter((a) => a.type === 'add')
      .reduce((s, a) => s + a.amount, 0);

    const deductTotal = adjustments
      .filter((a) => a.type === 'deduct')
      .reduce((s, a) => s + a.amount, 0);

    const netAdj = addTotal - deductTotal;
    const finalTeacherTotal = Number(summary.totals.teacherIncome || 0) + netAdj;

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // HEADER
    doc.fontSize(18).text('Teacher Payment Bill', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Month: ${summary.period}`);
    doc.text(`Teacher: ${summary.teacher?.fullName ?? summary.teacher?.fullName ?? summary.teacher?.id}`);
    if (summary.subject) doc.text(`Subject: ${summary.subject.name}`);
    doc.moveDown();

    // TOTALS BOX
    doc.fontSize(12).text('Summary', { underline: true });
    doc.moveDown(0.3);

    const line = (label: string, value: string) => {
      doc.fontSize(11).text(label, { continued: true });
      doc.fontSize(11).text(value, { align: 'right' });
    };

    line('Total Students', String(summary.totals.totalStudents));
    line('Paid', String(summary.totals.paidCount));
    line('Free', String(summary.totals.freeCount));
    line('Not Paid', String(summary.totals.notPaidCount));
    line('Total Income', this.money(summary.totals.totalIncome));
    line('Institute Income', this.money(summary.totals.instituteIncome));
    line('Teacher Income (Base)', this.money(summary.totals.teacherIncome));
    doc.moveDown(0.7);

    // ADJUSTMENTS
    doc.fontSize(12).text('Adjustments', { underline: true });
    doc.moveDown(0.3);

    if (!adjustments.length) {
      doc.fontSize(10).text('No adjustments.');
    } else {
      adjustments.forEach((a, idx) => {
        doc.fontSize(10).text(
          `${idx + 1}. ${a.type.toUpperCase()}  ${this.money(a.amount)}  ${a.note ? `- ${a.note}` : ''}`,
        );
      });
    }
    doc.moveDown(0.3);
    line('Adjustments (Net)', this.money(netAdj));
    line('Final Teacher Total', this.money(finalTeacherTotal));
    doc.moveDown(1);

    // TABLE HEADER
    doc.fontSize(12).text('Class-wise Breakdown', { underline: true });
    doc.moveDown(0.4);

    // Simple table columns
    const startX = doc.x;
    let y = doc.y;

    const col = {
      className: startX,
      students: startX + 220,
      paid: startX + 290,
      free: startX + 340,
      notPaid: startX + 395,
      income: startX + 460,
    };

    doc.fontSize(9).text('Class', col.className, y);
    doc.text('Total', col.students, y);
    doc.text('Paid', col.paid, y);
    doc.text('Free', col.free, y);
    doc.text('Not Paid', col.notPaid, y);
    doc.text('Teacher Rs', col.income, y);

    y += 14;
    doc.moveTo(startX, y).lineTo(startX + 520, y).stroke();
    y += 8;

    // ROWS
    for (const r of summary.rows) {
      if (y > 760) {
        doc.addPage();
        y = doc.y;
      }

      doc.fontSize(9).text(String(r.className), col.className, y, { width: 210 });
      doc.text(String(r.totalStudents), col.students, y);
      doc.text(String(r.paidCount), col.paid, y);
      doc.text(String(r.freeCount), col.free, y);
      doc.text(String(r.notPaidCount), col.notPaid, y);
      doc.text(this.money(r.teacherIncome), col.income, y);

      y += 18;
    }

    doc.end();
    return await done;
  }

  // ============================
  // CORE QUERY (MONTH)
  // ============================
  private async teacherBillCoreMonth(args: {
    teacherId: number;
    yearMonth: string;
    subjectId: number | null;
  }) {
    const { teacherId, yearMonth, subjectId } = args;

    // IMPORTANT:
    // paidCount = paid AND amount > 0
    // freeCount = paid AND amount = 0
    // totalIncome = sum(amount where paid=1)
    // instituteIncome = sum(amount * institute_percentage/100 where paid=1)
    // teacherIncome = totalIncome - instituteIncome
    //
    // Not paid = totalStudents - (paidCount + freeCount)

    const qb = this.dataSource
      .createQueryBuilder()
      .select('c.id', 'classId')
      .addSelect('c.name', 'className')
      .addSelect('COALESCE(c.institute_percentage, 0)', 'institutePercentage')

      .addSelect('COUNT(DISTINCT sc.student_id)', 'totalStudents')

      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_paid = 1 AND sp.amount > 0 THEN sc.student_id ELSE NULL END)',
        'paidCount',
      )
      .addSelect(
        'COUNT(DISTINCT CASE WHEN sp.is_paid = 1 AND sp.amount = 0 THEN sc.student_id ELSE NULL END)',
        'freeCount',
      )

      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 THEN sp.amount ELSE 0 END), 0)',
        'totalIncome',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN sp.is_paid = 1 THEN (sp.amount * (COALESCE(c.institute_percentage,0) / 100)) ELSE 0 END), 0)',
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

  // ============================
  // TOTALS BUILDER
  // ============================
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

  // ============================
  // BASIC LOOKUPS
  // ============================
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