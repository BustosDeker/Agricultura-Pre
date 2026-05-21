import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CropsService, CreateCropDto } from './crops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('cultivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cultivos')
export class CropsController {
  constructor(private cropsService: CropsService) {}

  @Get()
  findAll() {
    return this.cropsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cropsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCropDto) {
    return this.cropsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCropDto>) {
    return this.cropsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cropsService.remove(id);
  }
}
