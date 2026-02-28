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
      class: classEntity,
    });

    return this.studentClassRepo.save(newStudentClass);
  }

  async findAll(classId?: number, studentId?: number) {
    const qb = this.studentClassRepo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.student', 'student')
      .leftJoinAndSelect('sc.class', 'class');

    if (classId) {
      qb.andWhere('sc.class_id = :classId', { classId });
    }

    if (studentId) {
      qb.andWhere('sc.student_id = :studentId', { studentId });
    }

    return qb.getMany();
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
