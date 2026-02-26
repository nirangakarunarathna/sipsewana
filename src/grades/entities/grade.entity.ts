import { Class } from 'src/classes/entities/class.entity';
import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from 'typeorm';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({})
  name: string;

  @OneToMany(() => Class, (classEntity) => classEntity.grade)
  classes: Class[];
}
