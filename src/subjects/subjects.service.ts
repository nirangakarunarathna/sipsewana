import { Injectable } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject } from './entities/subject.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto) {
    const subject = await this.subjectRepo.save({
      name: createSubjectDto.name,
    });
    return { ...subject };
  }

  async findAll() {
    return await this.subjectRepo.find({});
  }

  findOne(id: number) {
    return `This action returns a #${id} subject`;
  }

  update(id: number, updateSubjectDto: UpdateSubjectDto) {
    return `This action updates a #${id} subject`;
  }

  remove(id: number) {
    return `This action removes a #${id} subject`;
  }
}
