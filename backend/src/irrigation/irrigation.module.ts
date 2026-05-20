import { Module } from '@nestjs/common';
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateIrrigationEventDto {
  @IsString()
  lote_id: string;

  @IsString()
  fecha_hora_inicio: string;

  @IsNumber()
  @IsOptional()
  duracion_minutos?: number;

  @IsNumber()
  @IsOptional()
  volumen_litros?: number;

  @IsEnum(['GOTEO', 'ASPERSION', 'INUNDACION', 'SURCOS'])
  @IsOptional()
  tipo_riego?: string;

  @IsBoolean()
  @IsOptional()
  automatico?: boolean;

  @IsString()
  @IsOptional()
  notas?: string;
}

@Injectable()
export class IrrigationService {
  constructor(private prisma: PrismaService) {}

  findAll(loteId?: string, limit = 50) {
    return this.prisma.eventoRiego.findMany({
      where: loteId ? { lote_id: loteId } : undefined,
      include: { lote: { select: { nombre: true, finca: { select: { nombre: true } } } } },
      orderBy: { fecha_hora_inicio: 'desc' },
      take: limit,
    });
  }

  create(dto: CreateIrrigationEventDto) {
    return this.prisma.eventoRiego.create({
      data: {
        ...dto,
        fecha_hora_inicio: new Date(dto.fecha_hora_inicio),
        tipo_riego: dto.tipo_riego as any,
      },
    });
  }

  async getStats(loteId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const eventos = await this.prisma.eventoRiego.findMany({
      where: { lote_id: loteId, fecha_hora_inicio: { gte: thirtyDaysAgo } },
    });

    const totalVolumen = eventos.reduce((sum, e) => sum + (e.volumen_litros || 0), 0);
    const totalDuracion = eventos.reduce((sum, e) => sum + (e.duracion_minutos || 0), 0);

    return {
      total_eventos: eventos.length,
      volumen_total_litros: totalVolumen,
      duracion_total_minutos: totalDuracion,
      promedio_volumen_litros: eventos.length > 0 ? totalVolumen / eventos.length : 0,
    };
  }

  getOptimizations(loteId: string) {
    return this.prisma.optimizacionRiego.findMany({
      where: { lote_id: loteId },
      orderBy: { fecha: 'desc' },
      take: 30,
    });
  }
}

@ApiTags('riego')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('riego')
export class IrrigationController {
  constructor(private irrigationService: IrrigationService) {}

  @Get()
  findAll(@Query('lote_id') loteId?: string, @Query('limit') limit?: number) {
    return this.irrigationService.findAll(loteId, limit);
  }

  @Post()
  create(@Body() dto: CreateIrrigationEventDto) {
    return this.irrigationService.create(dto);
  }

  @Get('stats/:loteId')
  getStats(@Param('loteId') loteId: string) {
    return this.irrigationService.getStats(loteId);
  }

  @Get('optimizaciones/:loteId')
  getOptimizations(@Param('loteId') loteId: string) {
    return this.irrigationService.getOptimizations(loteId);
  }
}

@Module({
  controllers: [IrrigationController],
  providers: [IrrigationService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
