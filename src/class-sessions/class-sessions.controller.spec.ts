import { Test, TestingModule } from '@nestjs/testing';
import { ClassSessionController } from './class-sessions.controller';
import { ClassSessionService } from './class-sessions.service';

describe('ClassSessionController', () => {
  let controller: ClassSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassSessionController],
      providers: [ClassSessionService],
    }).compile();

    controller = module.get<ClassSessionController>(ClassSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
