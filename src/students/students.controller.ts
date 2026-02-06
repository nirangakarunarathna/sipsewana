import { Controller, Post, Body } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/createStudent.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('register')
  async register(@Body() dto: CreateStudentDto) {
    return this.studentsService.registerStudent(dto.fullName);
  }
}
