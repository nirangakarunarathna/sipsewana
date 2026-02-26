import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength ,IsOptional} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  studentMobile?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  parentMobile?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  parentName?: string;
}
