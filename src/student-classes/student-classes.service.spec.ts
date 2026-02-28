import { Test, TestingModule } from '@nestjs/testing';
import { StudentClassesService } from './student-classes.service';

describe('StudentClassesService', () => {
  let service: StudentClassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentClassesService],
    }).compile();

    service = module.get<StudentClassesService>(StudentClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
