import { Test, TestingModule } from '@nestjs/testing';
import { StudentPaymentsService } from './student-payments.service';

describe('StudentPaymentsService', () => {
  let service: StudentPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentPaymentsService],
    }).compile();

    service = module.get<StudentPaymentsService>(StudentPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
