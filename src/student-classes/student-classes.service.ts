import { Injectable } from '@nestjs/common';
import { CreateStudentClassDto } from './dto/create-student-class.dto';
import { UpdateStudentClassDto } from './dto/update-student-class.dto';

@Injectable()
export class StudentClassesService {
  create(createStudentClassDto: CreateStudentClassDto) {
    return 'This action adds a new studentClass';
  }

  findAll() {
    return `This action returns all studentClasses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentClass`;
  }

  update(id: number, updateStudentClassDto: UpdateStudentClassDto) {
    return `This action updates a #${id} studentClass`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentClass`;
  }
}
