// class-session.entity.ts
import { Class } from 'src/classes/entities/class.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
@Entity('class_sessions')
export class ClassSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  class_id: number;

  @Column({ type: 'date' })
  session_date: string;

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  created_by: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Class, (cls) => cls.classSessions, { nullable: false })
  @JoinColumn({ name: 'class_id' })
  class: Class;
}