import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { Grade } from './entities/grade.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Grade])],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
