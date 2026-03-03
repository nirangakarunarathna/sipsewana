// student-payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  ) {}

  async list(classId: number, yearMonth: string) {
    // Return shape that frontend expects:
    // [{ studentId, paid, amount }]
    const rows = await this.repo.find({
      where: { class_id: classId, year_month: yearMonth },
      select: ['student_id', 'is_paid', 'amount', 'paid_at'],
    });

    return rows.map((r) => ({
      studentId: r.student_id,
      paid: !!r.is_paid,
      amount: Number(r.amount ?? 0),
      paidAt: r.paid_at ?? null, // optional
    }));
  }

  async bulkUpsert(classId: number, yearMonth: string, payments: PaymentRow[]) {
    if (!classId) throw new BadRequestException('classId required');
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new BadRequestException('yearMonth must be YYYY-MM');
    }
    if (!payments?.length) throw new BadRequestException('payments cannot be empty');

    const studentIds = payments.map((p) => p.studentId);

    // Load existing payments for these students (to keep paid_at stable)
    const existing = await this.repo.find({
      where: { class_id: classId, year_month: yearMonth, student_id: In(studentIds) },
      select: ['id', 'student_id', 'is_paid', 'paid_at'],
    });

    const existingMap = new Map<number, { is_paid: boolean; paid_at: Date | null }>();
    for (const e of existing) {
      existingMap.set(e.student_id, { is_paid: !!e.is_paid, paid_at: e.paid_at ?? null });
    }

    const now = new Date();

    const rows: Partial<StudentPayment>[] = payments.map((p) => {
      const prev = existingMap.get(p.studentId);
      const nextPaid = !!p.paid;

      let paidAt: Date | null = null;

      if (nextPaid) {
        // keep old paid_at if already paid before, otherwise set now
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

    // Upsert in chunks
    const chunks = chunkArray(rows, 1000);
    for (const part of chunks) {
      await this.repo.upsert(part, {
        conflictPaths: ['class_id', 'student_id', 'year_month'],
      });
    }

    return { ok: true, upserted: rows.length };
  }
}