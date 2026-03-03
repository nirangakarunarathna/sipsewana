import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Class } from './entities/class.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Student } from 'src/students/entities/student.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,

  ) {}
  async create(createClassDto: CreateClassDto) {
    const teacher = await this.teacherRepo.findOne({
      where: { id: createClassDto.teacherId },
    });

    const subject = await this.subjectRepo.findOne({
      where: { id: createClassDto.subjectId },
    });

    const grade = await this.gradeRepo.findOne({
      where: { id: createClassDto.gradeId },
    });

    if (!teacher || !subject || !grade) {
      throw new HttpException(
        'Teacher, Subject, or Grade not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const newClass = this.classRepo.create({
      name: createClassDto.name,
      fee: createClassDto.fee,
      teacher,
      subject,
      grade,
      institute_percentage: createClassDto.institutePercentage,
    });

    return this.classRepo.save(newClass);
  }

  async findAll() {
    return await this.classRepo.find({
    relations: {
      grade: true,
      subject: true,
      teacher: true,
    },
    order: { id: 'DESC' },
  });
  }

  findOne(id: number) {
    return `This action returns a #${id} class`;
  }

  update(id: number, updateClassDto: UpdateClassDto) {
    return `This action updates a #${id} class`;
  }

  remove(id: number) {
    return `This action removes a #${id} class`;
  }
}
