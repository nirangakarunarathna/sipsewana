import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentPayment } from './entities/student-payment.entity';
import { MarkPaymentDto } from './dto/mark-payment.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class StudentPaymentsService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly feeRepo: Repository<StudentPayment>,
  ) {}

  /**
   * REPORT rows for UI
   * Uses student_classes as base (who is enrolled in which class)
   * Left join student_fees for the selected month (so missing row => NOT PAID)
   */
  async report(q: ReportQueryDto) {
    const yearMonth = q.yearMonth; // "2026-02"
    const classId = q.classId ? Number(q.classId) : undefined;
    const search = q.search?.trim();
    const onlyNotPaid = q.onlyNotPaid === 'true';

    // student_classes = sc
    // students = s
    // classes = c
    // student_fees = f (LEFT JOIN by student_id, class_id, year_month)

    const qb = this.feeRepo.manager
      .createQueryBuilder()
      .from('student_classes', 'sc')
      .innerJoin('students', 's', 's.id = sc.student_id')
      .innerJoin('classes', 'c', 'c.id = sc.class_id')
      .leftJoin(
        'student_fees',
        'f',
        'f.student_id = sc.student_id AND f.class_id = sc.class_id AND f.year_month = :yearMonth',
        { yearMonth },
      )
      .select([
        'sc.id AS assignId',
        'sc.student_id AS studentId',
        'sc.class_id AS classId',
        's.full_name AS studentName',
        's.student_mobile AS studentMobile',
        'c.name AS className',
        'c.fee AS classFee',
        'IFNULL(f.paid, 0) AS paid',
        'f.paid_at AS paidAt',
        'f.paid_fee AS paidFee',
        'f.discount AS discount',
      ]);

    if (classId) {
      qb.andWhere('sc.class_id = :classId', { classId });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(s.full_name) LIKE :s OR s.student_mobile LIKE :p)',
        {
          s: `%${search.toLowerCase()}%`,
          p: `%${search}%`,
        },
      );
    }

    if (onlyNotPaid) {
      // paid is NULL or 0 => not paid
      qb.andWhere('(f.paid IS NULL OR f.paid = 0)');
    }

    qb.orderBy('s.full_name', 'ASC');

    // returns array of plain objects
    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      studentId: Number(r.studentId),
      classId: Number(r.classId),
      studentName: r.studentName,
      studentMobile: r.studentMobile,
      className: r.className,
      classFee: r.classFee,
      paid: !!Number(r.paid),
      paidAt: r.paidAt,
      paidFee: r.paidFee,
      discount: r.discount,
      yearMonth,
    }));
  }

  /**
   * Mark Paid:
   * UPSERT (create if missing, update if exists) based on unique key:
   * (student_id, class_id, year_month)
   */
  async markPaid(dto: MarkPaymentDto) {
    const where = {
      student_id: dto.studentId,
      class_id: dto.classId,
      year_month: dto.yearMonth,
    };

    const existing = await this.feeRepo.findOne({ where });

    if (!existing) {
      const created = this.feeRepo.create({
        ...where,
        paid: true,
        paid_at: new Date(),
        paid_fee: dto.paidFee ?? null,
        discount: dto.discount ?? null,
      });
      return this.feeRepo.save(created);
    }

    existing.paid = true;
    existing.paid_at = new Date();
    existing.paid_fee = dto.paidFee ?? existing.paid_fee ?? null;
    existing.discount = dto.discount ?? existing.discount ?? null;
    return this.feeRepo.save(existing);
  }

  async markNotPaid(dto: MarkPaymentDto) {
    const where = {
      student_id: dto.studentId,
      class_id: dto.classId,
      year_month: dto.yearMonth,
    };

    const existing = await this.feeRepo.findOne({ where });

    // If no row exists, we can create unpaid row OR just return OK
    if (!existing) {
      const created = this.feeRepo.create({
        ...where,
        paid: false,
        paid_at: null,
        paid_fee: null,
        discount: null,
      });
      return this.feeRepo.save(created);
    }

    existing.paid = false;
    existing.paid_at = null;
    existing.paid_fee = null;
    existing.discount = null;
    return this.feeRepo.save(existing);
  }
}