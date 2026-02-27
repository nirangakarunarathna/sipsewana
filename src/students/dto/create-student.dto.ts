import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  fullName: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  studentMobile?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  parentMobile?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  parentName?: string;
}
