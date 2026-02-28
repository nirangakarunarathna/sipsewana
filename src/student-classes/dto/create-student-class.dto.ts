import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateStudentClassDto {
  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @IsNumber()
  @IsNotEmpty()
  studentId: number;
}
