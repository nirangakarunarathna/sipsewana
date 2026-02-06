import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  async registerStudent(fullName: string) {
    // 1. Save student first
    const student = await this.studentRepo.save({
      fullName,
      joined_date: new Date(),
    });

    // 2. Generate Reg No using ID
    const year = new Date().getFullYear();
    const regNo = `ST-${year}-${student.id.toString().padStart(4, '0')}`;

    // 3. Update Reg No
    await this.studentRepo.update(student.id, { reg_no: regNo });

    return {
      id: student.id,
      reg_no: regNo,
      full_name: student.full_name,
    };
  }
}
