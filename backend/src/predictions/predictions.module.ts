import { Module } from '@nestjs/common';
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  temporada_id: string;

  @IsNumber()
  @IsOptional()
  rendimiento_predicho_kg_ha?: number;
}

export class TriggerPredictionDto {
  @IsString()
  temporada_id: string;
}

@Injectable()
export class PredictionsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  findAll(temporadaId?: string) {
    return this.prisma.prediccionRendimiento.findMany({
      where: temporadaId ? { temporada_id: temporadaId } : undefined,
      include: {
        temporada: {
          include: {
            lote: { include: { finca: { select: { nombre: true } } } },
            cultivo: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha_prediccion: 'desc' },
    });
  }

  findLatest() {
    return this.prisma.prediccionRendimiento.findMany({
      include: {
        temporada: {
          include: {
            lote: { select: { nombre: true, area_ha: true } },
            cultivo: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha_prediccion: 'desc' },
      take: 20,
    });
  }

  async triggerPrediction(dto: TriggerPredictionDto) {
    const temporada = await this.prisma.temporada.findUnique({
      where: { id: dto.temporada_id },
      include: {
        lote: true,
        cultivo: true,
      },
    });
    if (!temporada) throw new Error('Temporada no encontrada');

    const climaticData = await this.prisma.datoClimatico.findMany({
      where: {
        lote_id: temporada.lote_id,
        fecha: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { fecha: 'desc' },
    });

    const mlUrl = this.config.get('ML_SERVICE_URL', 'http://localhost:5000');
    try {
      const response = await axios.post(`${mlUrl}/predict/yield`, {
        area_ha: temporada.lote.area_ha,
        ph_suelo: temporada.lote.ph_suelo,
        materia_organica: temporada.lote.materia_organica,
        datos_climaticos: climaticData,
        dias_trasplante: Math.floor(
          (Date.now() - new Date(temporada.fecha_inicio).getTime()) / 86400000
        ),
      });

      const prediction = response.data;
      return this.prisma.prediccionRendimiento.create({
        data: {
          temporada_id: dto.temporada_id,
          rendimiento_predicho_kg_ha: prediction.predicted_yield || prediction.rendimiento_predicho,
          rendimiento_intervalo_inferior: prediction.lower_bound,
          rendimiento_intervalo_superior: prediction.upper_bound,
          precision_modelo: prediction.accuracy || prediction.precision_modelo,
          metodo_ensemble: prediction.ensemble_method || 'random_forest',
          factores_influyentes: prediction.factores_influyentes || [],
        },
      });
    } catch (error) {
      // Si el servicio ML no está disponible, usamos una predicción simulada
      const simulatedYield = (temporada.lote.area_ha || 10) * 
        (temporada.cultivo.rendimiento_promedio_kg_ha || 6000) * 
        (0.85 + Math.random() * 0.3);
      
      return this.prisma.prediccionRendimiento.create({
        data: {
          temporada_id: dto.temporada_id,
          rendimiento_predicho_kg_ha: Math.round(simulatedYield),
          rendimiento_intervalo_inferior: Math.round(simulatedYield * 0.9),
          rendimiento_intervalo_superior: Math.round(simulatedYield * 1.1),
          precision_modelo: 0.85,
          metodo_ensemble: 'simulated',
          factores_influyentes: ['ph_suelo', 'humedad', 'temperatura'],
        },
      });
    }
  }
}

@ApiTags('predicciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('predicciones')
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get()
  findAll(@Query('temporada_id') temporadaId?: string) {
    return this.predictionsService.findAll(temporadaId);
  }

  @Get('latest')
  findLatest() {
    return this.predictionsService.findLatest();
  }

  @Post('trigger')
  trigger(@Body() dto: TriggerPredictionDto) {
    return this.predictionsService.triggerPrediction(dto);
  }
}

@Module({
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
