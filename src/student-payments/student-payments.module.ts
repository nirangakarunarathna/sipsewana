import { Module } from '@nestjs/common';
import { StudentPaymentsService } from './student-payments.service';
import { StudentPaymentsController } from './student-payments.controller';
import { StudentPayment } from './entities/student-payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([StudentPayment])],
  controllers: [StudentPaymentsController],
  providers: [StudentPaymentsService],
  exports: [StudentPaymentsService],
})
export class StudentPaymentsModule {}
