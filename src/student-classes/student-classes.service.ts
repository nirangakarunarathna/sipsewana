import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateStudentClassDto } from './dto/create-student-class.dto';
import { UpdateStudentClassDto } from './dto/update-student-class.dto';
import { Repository } from 'typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from 'src/students/entities/student.entity';
import { StudentClass } from './entities/student-class.entity';

@Injectable()
export class StudentClassesService {
  constructor(
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(StudentClass)
    private studentClassRepo: Repository<StudentClass>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}
  async create(createStudentClassDto: CreateStudentClassDto) {
    const student = await this.studentRepo.findOne({
      where: { id: createStudentClassDto.studentId },
    });

    const classEntity = await this.classRepo.findOne({
      where: { id: createStudentClassDto.classId },
    });

    if (!student || !classEntity) {
      throw new HttpException(
        'Teacher, Subject, or Grade not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const newStudentClass = this.studentClassRepo.create({
      student,
      classEntity,
    });

    return this.studentClassRepo.save(newStudentClass);
  }

  async findAll() {
    return await this.classRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.grade', 'g')
      .leftJoinAndSelect('c.subject', 's')
      .leftJoinAndSelect('c.teacher', 't')
      .select([
        'c.id',
        'c.name',
        'c.fee',
        'c.isActive',
        'g.id',
        'g.name',
        's.id',
        's.name',
        't.id',
        't.fullName',
        't.mobile',
      ])
      .orderBy('c.id', 'DESC')
      .getMany();
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
