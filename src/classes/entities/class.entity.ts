import { Grade } from 'src/grades/entities/grade.entity';
import { StudentClass } from 'src/student-classes/entities/student-class.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'fee', type: 'decimal' })
  fee: number;

  // -------------------
  // Foreign keys
  // -------------------

  @ManyToOne(() => Teacher, (teacher) => teacher.classes, { nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ManyToOne(() => Subject, (subject) => subject.classes, { nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => Grade, (grade) => grade.classes, { nullable: false })
  @JoinColumn({ name: 'grade_id' })
  grade: Grade;

  @OneToMany(() => StudentClass, (studentClass) => studentClass.class)
  studentClasses: StudentClass[];
}
