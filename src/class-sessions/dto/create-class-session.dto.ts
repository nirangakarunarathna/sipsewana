// create-class-session.dto.ts
import { IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateClassSessionDto {
  @IsNotEmpty()
  classId: number;

  @IsDateString()
  sessionDate: string;

  @IsOptional()
  startTime?: string;

  @IsOptional()
  endTime?: string;

  @IsOptional()
  note?: string;
}