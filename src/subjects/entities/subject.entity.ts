import { Class } from 'src/classes/entities/class.entity';
import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from 'typeorm';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({})
  name: string;

  @OneToMany(() => Class, (classEntity) => classEntity.subject)
  classes: Class[];
}
