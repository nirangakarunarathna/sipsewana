import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}
  async create(createStudentDto: CreateStudentDto) {
    // 1. Save student first
    const student = await this.studentRepo.save({
      fullName: createStudentDto.fullName,
      parentMobile: createStudentDto.parentMobile,
      parentName: createStudentDto.parentName,
      address: createStudentDto.address,
      studentMobile: createStudentDto.studentMobile,
      studentWhatsApp: createStudentDto.studentWhatsApp,
      joinedDate: new Date(),
    });

    return {
      ...student
    };
  }

  async findAll() {
    return await this.studentRepo.find({});
  }

  findOne(id: number) {
    return `This action returns a #${id} student`;
  }

  update(id: number, updateStudentDto: UpdateStudentDto) {
    return `This action updates a #${id} student`;
  }

  remove(id: number) {
    return `This action removes a #${id} student`;
  }
}
