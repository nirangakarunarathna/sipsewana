import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { StudentAttendanceService } from './student-attendances.service';
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Controller('student-attendances')
export class StudentAttendancesController {
  constructor(private readonly studentAttendancesService: StudentAttendanceService) {}

  // @Post()
  // create(@Body() createStudentAttendanceDto: CreateStudentAttendanceDto) {
  //   return this.studentAttendancesService.create(createStudentAttendanceDto);
  // }

  @Post('bulk')
  bulkUpsert(@Body() dto: BulkAttendanceDto) {
    return this.studentAttendancesService.bulkUpsert(dto);
  }

 @Get()
  async findByClassAndMonth(
    @Query('classId') classIdStr: string,
    @Query('yearMonth') yearMonth: string,
  ) {
    const classId = Number(classIdStr);
    if (!classId || Number.isNaN(classId)) {
      throw new BadRequestException('classId is required and must be a number');
    }
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new BadRequestException('yearMonth is required in format YYYY-MM');
    }

    return this.studentAttendancesService.findByClassAndMonth(classId, yearMonth);
  }

  // @Get()
  // findAll() {
  //   return this.studentAttendancesService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.studentAttendancesService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateStudentAttendanceDto: UpdateStudentAttendanceDto) {
  //   return this.studentAttendancesService.update(+id, updateStudentAttendanceDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.studentAttendancesService.remove(+id);
  // }
}
