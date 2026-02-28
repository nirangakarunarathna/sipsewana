import { Module } from '@nestjs/common';
import {StudentAttendanceService } from './student-attendances.service';
import { StudentAttendancesController } from './student-attendances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAttendance } from './entities/student-attendance.entity';

@Module({
    imports: [
    TypeOrmModule.forFeature([StudentAttendance]), // ✅ this provides the repository
  ],
  controllers: [StudentAttendancesController],
  providers: [StudentAttendanceService],
})
export class StudentAttendancesModule {}
