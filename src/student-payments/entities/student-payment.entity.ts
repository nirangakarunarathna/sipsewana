import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity('student_payments')
@Unique('uq_student_class_month', ['student_id', 'class_id', 'year_month'])
export class StudentPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'int' })
  @Index()
  student_id: number;

  @Column({ name: 'class_id', type: 'int' })
  @Index()
  class_id: number;

  // "2026-02"
  @Column({ name: 'year_month', type: 'varchar', length: 7 })
  @Index()
  year_month: string;

  @Column({ name: 'paid', type: 'tinyint', default: 0 })
  paid: boolean;

  @Column({ name: 'paid_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
  paid_fee: number | null;

  @Column({ name: 'discount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount: number | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paid_at: Date | null;
}