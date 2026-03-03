// dto/student-payments.dto.ts
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentRowDto {
  @IsInt()
  studentId: number;

  @IsBoolean()
  paid: boolean;

  @IsNumber()
  amount: number;
}

export class BulkPaymentsDto {
  @IsInt()
  classId: number;

  @IsNotEmpty()
  @IsString()
  yearMonth: string; // YYYY-MM

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentRowDto)
  payments: PaymentRowDto[];
}