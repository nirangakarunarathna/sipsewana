import { Module } from '@nestjs/common';
import { StudentClassesService } from './student-classes.service';
import { StudentClassesController } from './student-classes.controller';

@Module({
  controllers: [StudentClassesController],
  providers: [StudentClassesService],
})
export class StudentClassesModule {}
