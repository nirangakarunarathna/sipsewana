// dto/bulk-attendance.dto.ts
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAttendanceRecordDto {
  @IsInt()
  sessionId: number;

  @IsInt()
  studentId: number;

  @IsIn(['P', 'A', 'L', 'E'])
  status: 'P' | 'A' | 'L' | 'E';

  @IsOptional()
  @IsBoolean()
  isNewStudent?: boolean;

  @IsOptional()
  @IsBoolean()
  isExtraClass?: boolean;

  @IsOptional()
  @IsInt()
  extraClassId?: number | null;

  @IsOptional()
  @IsString()
  remarks?: string | null;
}

export class BulkAttendanceDto {
  @IsNotEmpty()
  @IsInt()
  classId: number;

  @IsNotEmpty()
  @IsString()
  yearMonth: string; // "YYYY-MM" (optional for server, but matches your UI)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceRecordDto)
  records: BulkAttendanceRecordDto[];
}