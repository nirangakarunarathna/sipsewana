import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;
}
