import { Test, TestingModule } from '@nestjs/testing';
import { StudentPaymentsController } from './student-payments.controller';
import { StudentPaymentsService } from './student-payments.service';

describe('StudentPaymentsController', () => {
  let controller: StudentPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentPaymentsController],
      providers: [StudentPaymentsService],
    }).compile();

    controller = module.get<StudentPaymentsController>(StudentPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
