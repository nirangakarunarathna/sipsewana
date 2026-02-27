import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './entities/class.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from 'rxjs';
import { Grade } from 'src/grades/entities/grade.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Teacher, Grade, Subject])],

  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
