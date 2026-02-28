import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradesModule } from './grades/grades.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { StudentClassesModule } from './student-classes/student-classes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '12345678',
      database: 'sipsewana',
      autoLoadEntities: true,
      synchronize: true, // ⚠️ dev only
    }),
    StudentsModule,
    SubjectsModule,
    GradesModule,
    TeachersModule,
    ClassesModule,
    StudentClassesModule,
  ],
})
export class AppModule {}
