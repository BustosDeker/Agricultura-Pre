import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PlotsService, CreatePlotDto } from './plots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('lotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lotes')
export class PlotsController {
  constructor(private plotsService: PlotsService) {}

  @Get()
  findAll(@Query('finca_id') fincaId?: string) {
    return this.plotsService.findAll(fincaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plotsService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.plotsService.getStats(id);
  }

  @Post()
  create(@Body() dto: CreatePlotDto) {
    return this.plotsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePlotDto>) {
    return this.plotsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plotsService.remove(id);
  }
}
