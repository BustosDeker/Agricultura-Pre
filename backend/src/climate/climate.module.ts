import { Module } from '@nestjs/common';
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
export class ClimateService {
  constructor(private prisma: PrismaService) {}

  findByLote(loteId: string, days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.datoClimatico.findMany({
      where: { lote_id: loteId, fecha: { gte: from } },
      orderBy: { fecha: 'desc' },
    });
  }

  getLatest(loteId: string) {
    return this.prisma.datoClimatico.findFirst({
      where: { lote_id: loteId },
      orderBy: { fecha: 'desc' },
    });
  }

  async getSummary(loteId: string) {
    const data = await this.findByLote(loteId, 30);
    if (data.length === 0) return null;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      periodo_dias: data.length,
      temperatura_max_promedio: avg(data.map(d => d.temperatura_max || 0)).toFixed(1),
      temperatura_min_promedio: avg(data.map(d => d.temperatura_min || 0)).toFixed(1),
      humedad_promedio: avg(data.map(d => d.humedad_promedio || 0)).toFixed(1),
      precipitacion_total_mm: data.reduce((s, d) => s + (d.precipitacion_mm || 0), 0).toFixed(1),
    };
  }
}

@ApiTags('clima')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clima')
export class ClimateController {
  constructor(private climateService: ClimateService) {}

  @Get('lote/:loteId')
  findByLote(@Param('loteId') loteId: string, @Query('days') days?: number) {
    return this.climateService.findByLote(loteId, days || 30);
  }

  @Get('lote/:loteId/latest')
  getLatest(@Param('loteId') loteId: string) {
    return this.climateService.getLatest(loteId);
  }

  @Get('lote/:loteId/summary')
  getSummary(@Param('loteId') loteId: string) {
    return this.climateService.getSummary(loteId);
  }
}

@Module({
  controllers: [ClimateController],
  providers: [ClimateService],
  exports: [ClimateService],
})
export class ClimateModule {}
