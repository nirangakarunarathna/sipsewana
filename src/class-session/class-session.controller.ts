import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassSessionService } from './class-session.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';

@Controller('class-session')
export class ClassSessionController {
  constructor(private readonly classSessionService: ClassSessionService) {}

  @Post()
  create(@Body() createClassSessionDto: CreateClassSessionDto) {
    return this.classSessionService.create(createClassSessionDto);
  }

  @Get()
  findAll() {
    return this.classSessionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classSessionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassSessionDto: UpdateClassSessionDto) {
    return this.classSessionService.update(+id, updateClassSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classSessionService.remove(+id);
  }
}
