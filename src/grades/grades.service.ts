import { Injectable } from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private gradeRepo: Repository<Grade>,
  ) {}

  async create(createGradeDto: CreateGradeDto) {
    const grade = await this.gradeRepo.save({
      name: createGradeDto.name,
    });
    return { ...grade };
  }

  async findAll() {
    return await this.gradeRepo.find({});
  }
  findOne(id: number) {
    return `This action returns a #${id} grade`;
  }

  update(id: number, updateGradeDto: UpdateGradeDto) {
    return `This action updates a #${id} grade`;
  }

  remove(id: number) {
    return `This action removes a #${id} grade`;
  }
}
