import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateClassDto {
  @IsNumber()
  @IsNotEmpty()
  teacherId: number;

  @IsNumber()
  @IsNotEmpty()
  subjectId: number;

  @IsNumber()
  @IsNotEmpty()
  gradeId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  fee: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  institutePercentage: number;
}
