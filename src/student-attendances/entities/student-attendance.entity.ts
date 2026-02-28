// student-attendance.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('student_attendances')
@Unique(['session_id', 'student_id'])
export class StudentAttendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  session_id: number;

  @Column()
  student_id: number;

  @Column({
    type: 'enum',
    enum: ['P', 'A', 'L', 'E'],
    default: 'P',
  })
  status: 'P' | 'A' | 'L' | 'E';

  @Column({ default: false })
  is_new_student: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  remarks: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  marked_at: Date;

  @Column({ default: false })
  is_paid: boolean;

  @Column({ type: 'datetime', nullable: true })
  paid_at: Date | null;
}
