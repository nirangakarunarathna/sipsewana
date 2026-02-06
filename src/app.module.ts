import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';

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
  ],
})
export class AppModule {}
