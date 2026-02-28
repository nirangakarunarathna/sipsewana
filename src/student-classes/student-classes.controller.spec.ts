import { Test, TestingModule } from '@nestjs/testing';
import { StudentClassesController } from './student-classes.controller';
import { StudentClassesService } from './student-classes.service';

describe('StudentClassesController', () => {
  let controller: StudentClassesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentClassesController],
      providers: [StudentClassesService],
    }).compile();

    controller = module.get<StudentClassesController>(StudentClassesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
