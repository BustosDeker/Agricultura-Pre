import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FarmsService, CreateFarmDto } from './farms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('fincas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fincas')
export class FarmsController {
  constructor(private farmsService: FarmsService) {}

  @Get()
  findAll(@Request() req) {
    return this.farmsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFarmDto, @Request() req) {
    return this.farmsService.create(dto, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFarmDto>) {
    return this.farmsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.farmsService.remove(id);
  }
}
