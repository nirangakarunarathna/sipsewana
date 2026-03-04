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

  @Get('summary')
  async summary(
    @Query('scope') scope: 'month' | 'year',
    @Query('yearMonth') yearMonth?: string,
    @Query('year') year?: string,
  ) {

    if (scope !== 'month' && scope !== 'year') {
      throw new BadRequestException('scope must be month or year');
    }

    if (scope === 'month') {
      if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
        throw new BadRequestException('yearMonth must be YYYY-MM');
      }
      return this.studentPaymentsService.subjectWiseSummaryMonth(yearMonth);
    }

    if (!year || !/^\d{4}$/.test(year)) {
      throw new BadRequestException('year must be YYYY');
    }
    return this.studentPaymentsService.subjectWiseSummaryYear(year);
  }
}
