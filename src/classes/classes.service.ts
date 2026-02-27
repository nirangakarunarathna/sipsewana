import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Class } from './entities/class.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { Subject } from 'src/subjects/entities/subject.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    @InjectRepository(Grade)
    private gradeRepo: Repository<Grade>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
  ) {}
  async create(createClassDto: CreateClassDto) {
    const teacher = await this.teacherRepo.findOne({
      where: { id: createClassDto.teacherId },
    });

    if (!teacher) {
     throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }
    const subject = await this.subjectRepo.findOne({
      where: { id: createClassDto.subjectId },
    });

    if (!subject) {
     throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

    const grade = await this.gradeRepo.findOne({
      where: { id: createClassDto.gradeId },
    });

    if (!teacher || !subject || !grade) {
      throw new NotFoundException('Teacher, Subject, or Grade not found');
    }

    const newClass = this.classRepo.create({
      name: createClassDto.name,
      fee: createClassDto.fee,
      teacher,
      subject,
      grade,
    });

    return this.classRepo.save(newClass);
  }

  findAll() {
    return `This action returns all classes`;
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
