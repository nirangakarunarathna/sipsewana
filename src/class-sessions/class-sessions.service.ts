import {
  BadRequestException,
  Get,
  HttpException,
  HttpStatus,
  Injectable,
  Query,
} from '@nestjs/common';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassSession } from './entities/class-sessions.entity';
import { Repository } from 'typeorm';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class ClassSessionService {
  constructor(
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(ClassSession)
    private sessionRepo: Repository<ClassSession>,
  ) {}
  async create(dto: CreateClassSessionDto) {
    const classEntity = await this.classRepo.findOne({
      where: { id: dto.classId },
    });

    if (!classEntity) {
      throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
    }
    const session = this.sessionRepo.create({
      class_id: dto.classId,
      session_date: dto.sessionDate,
      start_time: dto.startTime,
      end_time: dto.endTime,
      note: dto.note,
    });

    return this.sessionRepo.save(session);
  }

  @Get()
  async findAll(
    @Query('classId') classId: number,
    @Query('yearMonth') yearMonth: string,
  ) {
    if (!classId || !yearMonth) {
      throw new BadRequestException('classId and yearMonth required');
    }

    const [year, month] = yearMonth.split('-');

    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    return this.sessionRepo
      .createQueryBuilder('session')
      .where('session.class_id = :classId', { classId })
      .andWhere('session.session_date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .orderBy('session.session_date', 'ASC')
      .addOrderBy('session.start_time', 'ASC')
      .getMany();
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
