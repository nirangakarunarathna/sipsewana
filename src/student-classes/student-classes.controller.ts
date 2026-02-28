import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentClassesService } from './student-classes.service';
import { CreateStudentClassDto } from './dto/create-student-class.dto';
import { UpdateStudentClassDto } from './dto/update-student-class.dto';

@Controller('student-classes')
export class StudentClassesController {
  constructor(private readonly studentClassesService: StudentClassesService) {}

  @Post()
  create(@Body() createStudentClassDto: CreateStudentClassDto) {
    return this.studentClassesService.create(createStudentClassDto);
  }

  @Get()
  findAll() {
    return this.studentClassesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentClassesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentClassDto: UpdateStudentClassDto) {
    return this.studentClassesService.update(+id, updateStudentClassDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentClassesService.remove(+id);
  }
}
