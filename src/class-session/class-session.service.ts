import { Injectable } from '@nestjs/common';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';

@Injectable()
export class ClassSessionService {
  create(createClassSessionDto: CreateClassSessionDto) {
    return 'This action adds a new classSession';
  }

  findAll() {
    return `This action returns all classSession`;
  }

  findOne(id: number) {
    return `This action returns a #${id} classSession`;
  }

  update(id: number, updateClassSessionDto: UpdateClassSessionDto) {
    return `This action updates a #${id} classSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} classSession`;
  }
}
