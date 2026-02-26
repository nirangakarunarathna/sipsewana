import { Injectable } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Teacher } from './entities/teacher.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
  ) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const teacher = await this.teacherRepo.save({
      fullName: createTeacherDto.fullName,
      address: createTeacherDto.address,
      mobile: createTeacherDto.mobile,
      joinedDate: new Date(),
    });

    return {
      ...teacher,
    };
  }

  findAll() {
    return `This action returns all teachers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} teacher`;
  }

  update(id: number, updateTeacherDto: UpdateTeacherDto) {
    return `This action updates a #${id} teacher`;
  }

  remove(id: number) {
    return `This action removes a #${id} teacher`;
  }
}
