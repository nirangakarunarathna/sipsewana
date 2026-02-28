import { Test, TestingModule } from '@nestjs/testing';
import { StudentAttendanceService } from './student-attendances.service';

describe('StudentAttendanceService', () => {
  let service: StudentAttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentAttendanceService],
    }).compile();

    service = module.get<StudentAttendanceService>(StudentAttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
