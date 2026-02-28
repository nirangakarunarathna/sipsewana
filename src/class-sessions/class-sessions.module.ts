import { Module } from '@nestjs/common';
import { ClassSessionService } from './class-sessions.service';
import { ClassSessionController } from './class-sessions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSession } from './entities/class-sessions.entity';
import { Class } from 'src/classes/entities/class.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ClassSession,Class])],
  controllers: [ClassSessionController],
  providers: [ClassSessionService],
})
export class ClassSessionModule {}
