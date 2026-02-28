import { Module } from '@nestjs/common';
import { StudentClassesService } from './student-classes.service';
import { StudentClassesController } from './student-classes.controller';
import { Student } from 'src/students/entities/student.entity';
import { Class } from 'src/classes/entities/class.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentClass } from './entities/student-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Student,StudentClass])],
  controllers: [StudentClassesController],
  providers: [StudentClassesService],
})
export class StudentClassesModule {}
