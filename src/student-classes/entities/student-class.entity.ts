import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Student } from 'src/students/entities/student.entity';
import { Class } from 'src/classes/entities/class.entity';

@Entity('student_classes')
export class StudentClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id' })
  student_id: number;

  @Column({ name: 'class_id' })
  class_id: number;

  @ManyToOne(() => Student, (student) => student.studentClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Class, (cls) => cls.studentClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: Class;
}
