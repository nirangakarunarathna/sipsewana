import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGradeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value) as string,
  )
  name: string;
}
