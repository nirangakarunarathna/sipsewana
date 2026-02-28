import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from 'src/students/entities/student.entity';
import { Class } from 'src/classes/entities/class.entity';

@Entity('student_classes')
export class StudentClass {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, (student) => student.studentClasses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Class, (cls) => cls.studentClasses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;
}