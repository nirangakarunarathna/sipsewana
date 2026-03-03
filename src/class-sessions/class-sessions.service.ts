import {
  BadRequestException,
  Get,
  HttpException,
  HttpStatus,
  Injectable,
  ParseIntPipe,
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
    @Query('classId', ParseIntPipe) classId: number,
    @Query('yearMonth') yearMonth: string,
  ) {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new BadRequestException('yearMonth must be YYYY-MM');
    }

    const [yStr, mStr] = yearMonth.split('-');
    const year = Number(yStr);
    const month = Number(mStr);

    // start = YYYY-MM-01
    const start = new Date(year, month - 1, 1);
    // end = first day of next month
    const end = new Date(year, month, 1);

    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.class_id = :classId', { classId })
      .andWhere('session.session_date >= :start', { start: startDate })
      .andWhere('session.session_date < :end', { end: endDate })
      .orderBy('session.session_date', 'ASC')
      .addOrderBy('session.start_time', 'ASC')
      .getMany();

    return sessions;
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
