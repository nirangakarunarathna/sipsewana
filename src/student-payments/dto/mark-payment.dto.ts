import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class MarkPaymentDto {
  @IsInt()
  @Min(1)
  studentId: number;

  @IsInt()
  @Min(1)
  classId: number;

  @IsString()
  yearMonth: string; // "2026-02"

  @IsOptional()
  paidFee?: number;

  @IsOptional()
  discount?: number;
}