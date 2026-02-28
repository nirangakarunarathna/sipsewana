import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StudentPaymentsService } from './student-payments.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { MarkPaymentDto } from './dto/mark-payment.dto';

@Controller('student-payments')
export class StudentPaymentsController {
  constructor(private readonly service: StudentPaymentsService) {}

  // ✅ used by UI to load the table for a month
  // GET /student-payments/report?yearMonth=2026-02&classId=3&search=niranga&onlyNotPaid=true
  @Get('report')
  report(@Query() q: ReportQueryDto) {
    return this.service.report(q);
  }

  // POST /student-fees/mark-paid
  @Post('mark-paid')
  markPaid(@Body() dto: MarkPaymentDto) {
    return this.service.markPaid(dto);
  }

  // POST /student-fees/mark-not-paid
  @Post('mark-not-paid')
  markNotPaid(@Body() dto: MarkPaymentDto) {
    return this.service.markNotPaid(dto);
  }
}