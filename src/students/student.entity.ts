import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  reg_no: string;

  @Column({})
  full_name: string;

  @Column()
  joined_date: Date;
}
