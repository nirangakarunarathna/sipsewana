import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { StudentPaymentsService } from './student-payments.service';
// import { UpdateStudentPaymentDto } from './dto/update-student-payment.dto';
import { BulkPaymentsDto } from './dto/student-payments.dto';

@Controller('student-payments')
export class StudentPaymentsController {
  constructor(private readonly studentPaymentsService: StudentPaymentsService) {}

  @Get()
  async list(@Query('classId') classIdStr: string, @Query('yearMonth') yearMonth: string) {
    const classId = Number(classIdStr);
    if (!classId || Number.isNaN(classId)) throw new BadRequestException('classId is required');
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new BadRequestException('yearMonth must be YYYY-MM');
    }
    return this.studentPaymentsService.list(classId, yearMonth);
  }

  // POST /student-payments/bulk
  @Post('bulk')
  async bulk(@Body() dto: BulkPaymentsDto) {
    return this.studentPaymentsService.bulkUpsert(dto.classId, dto.yearMonth, dto.payments);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.studentPaymentsService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateStudentPaymentDto: UpdateStudentPaymentDto) {
  //   // return this.studentPaymentsService.update(+id, updateStudentPaymentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   // return this.studentPaymentsService.remove(+id);
  // }
}
