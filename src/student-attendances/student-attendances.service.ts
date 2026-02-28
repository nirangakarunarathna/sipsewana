// attendance.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentAttendance } from './entities/student-attendance.entity';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';

function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

@Injectable()
export class StudentAttendanceService {
  constructor(
    @InjectRepository(StudentAttendance)
    private readonly attendanceRepo: Repository<StudentAttendance>,
  ) {}

  async bulkUpsert(dto: BulkAttendanceDto) {
    if (!dto.records?.length) {
      throw new BadRequestException('records cannot be empty');
    }

    // Optional: sanity check statuses
    for (const r of dto.records) {
      if (!r.sessionId || !r.studentId) {
        throw new BadRequestException('Each record must have sessionId and studentId');
      }
    }

    // Map DTO -> DB columns
    const rows: Partial<StudentAttendance>[] = dto.records.map((r) => ({
      session_id: r.sessionId,
      student_id: r.studentId,
      status: r.status, // checkbox: P or A
      is_new_student: !!r.isNewStudent,
      is_extra_class: !!r.isExtraClass,
      extra_class_id: r.extraClassId ?? null,
      remarks: r.remarks ?? null,
      // if you want marked_at always updated on every save:
      marked_at: new Date(),
    }));

    // Upsert in chunks to avoid max packet / query limits
    const CHUNK_SIZE = 1000; // adjust if needed
    const chunks = chunkArray(rows, CHUNK_SIZE);

    for (const part of chunks) {
      await this.attendanceRepo.upsert(part, {
        conflictPaths: ['session_id', 'student_id'],
        // TypeORM will update all provided columns on conflict
      });
    }

    return {
      ok: true,
      upserted: rows.length,
    };
  }

  async findByClassAndMonth(classId: number, yearMonth: string) {
    const [year, month] = yearMonth.split('-').map((x) => Number(x));
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1); // next month first day (exclusive)

    // Joins ClassSession to filter by class and date range
    // NOTE: Table names below assume:
    // StudentAttendance table: StudentAttendance
    // ClassSession table: ClassSession
    // Columns: StudentAttendance.session_id -> ClassSession.id
    //          ClassSession.class_id, ClassSession.session_date
    return this.attendanceRepo
      .createQueryBuilder('a')
      .innerJoin('ClassSession', 's', 's.id = a.session_id')
      .where('s.class_id = :classId', { classId })
      .andWhere('s.session_date >= :start', { start: start.toISOString().slice(0, 10) })
      .andWhere('s.session_date < :end', { end: end.toISOString().slice(0, 10) })
      .orderBy('s.session_date', 'ASC')
      .addOrderBy('s.start_time', 'ASC')
      .addOrderBy('a.student_id', 'ASC')
      .select([
        'a.id as id',
        'a.session_id as session_id',
        'a.student_id as student_id',
        'a.status as status',
        'a.is_new_student as is_new_student',
        'a.remarks as remarks',
        'a.marked_at as marked_at',
        // include payment fields if you added them:
        // 'a.is_paid as is_paid',
        // 'a.paid_at as paid_at',
      ])
      .getRawMany();
  }

  async create(createStudentAttendanceDto: CreateStudentAttendanceDto) {
      return this.attendanceRepo.save(createStudentAttendanceDto);
    }
  
    async findAll() {
      return await this.attendanceRepo.find({
      
    });
    }
  
    findOne(id: number) {
      return `This action returns a #${id} class`;
    }
  
    update(id: number, updateStudentAttendanceDto: UpdateStudentAttendanceDto) {
      return `This action updates a #${id} student attendance`;
    }
  
    remove(id: number) {
      return `This action removes a #${id} class`;
    }
}