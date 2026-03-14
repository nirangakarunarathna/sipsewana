import { StudentClass } from 'src/student-classes/entities/student-class.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    name: 'address',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
  })
  address: string;

  @Column({
    name: 'student_mobile',
    type: 'varchar',
    length: 15,
    nullable: true,
    default: null,
  })
  studentMobile: string;

  @Column({
    name: 'student_whatsapp',
    type: 'varchar',
    length: 15,
    nullable: true,
    default: null,
  })
  studentWhatsApp: string;

  @Column({
    name: 'parent_mobile',
    type: 'varchar',
    length: 15,
    nullable: true,
    default: null,
  })
  parentMobile: string;

  @Column({
    name: 'parent_name',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
  })
  parentName: string;

  @Column({ name: 'joined_date' })
  joinedDate: Date;


@OneToMany(() => StudentClass, (studentClass) => studentClass.student)
studentClasses: StudentClass[];
}
