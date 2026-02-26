import { Class } from 'src/classes/entities/class.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('teachers')
export class Teacher {
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
    name: 'mobile',
    type: 'varchar',
    length: 15,
    nullable: true,
    default: null,
  })
  mobile: string;

  @Column({ name: 'joined_date' })
  joinedDate: Date;

  @OneToMany(() => Class, (classEntity) => classEntity.teacher)
  classes: Class[];
}
