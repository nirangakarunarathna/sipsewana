import { IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsString()
  yearMonth: string; 

  @IsOptional()
  @IsString()
  classId?: string; 

  @IsOptional()
  @IsString()
  search?: string; // name or phone

  @IsOptional()
  @IsString()
  onlyNotPaid?: string; // "true" / "false"
}