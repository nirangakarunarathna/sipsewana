import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentPaymentDto } from './create-student-payment.dto';

export class UpdateStudentPaymentDto extends PartialType(CreateStudentPaymentDto) {}
