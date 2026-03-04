// student-payment.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('student_payments')
@Unique(['class_id', 'student_id', 'year_month'])
export class StudentPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  class_id: number;

  @Column({ type: 'int' })
  student_id: number;

  @Column({ type: 'varchar', length: 7 })
  year_month: string; // "YYYY-MM"

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'tinyint', default: 0 })
  is_paid: boolean;

  @Column({ type: 'tinyint', default: 0 })
  is_free: boolean;

  @Column({ type: 'datetime', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}