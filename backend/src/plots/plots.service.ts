import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlotDto {
  @IsString()
  nombre: string;

  @IsString()
  finca_id: string;

  @IsNumber()
  area_ha: number;

  @IsString()
  @IsOptional()
  tipo_suelo?: string;

  @IsNumber()
  @IsOptional()
  ph_suelo?: number;

  @IsNumber()
  @IsOptional()
  materia_organica?: number;
}

@Injectable()
export class PlotsService {
  constructor(private prisma: PrismaService) {}

  async findAll(fincaId?: string) {
    return this.prisma.lote.findMany({
      where: fincaId ? { finca_id: fincaId } : undefined,
      include: {
        finca: { select: { nombre: true } },
        temporadas: {
          where: { estado: 'ACTIVA' },
          include: { cultivo: { select: { nombre: true } } },
          take: 1,
        },
        _count: { select: { sensores: true, eventos_riego: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const lote = await this.prisma.lote.findUnique({
      where: { id },
      include: {
        finca: true,
        sensores: true,
        temporadas: {
          include: {
            cultivo: true,
            predicciones: { orderBy: { fecha_prediccion: 'desc' }, take: 1 },
          },
          orderBy: { fecha_inicio: 'desc' },
        },
        datos_climaticos: { orderBy: { fecha: 'desc' }, take: 7 },
        optimizaciones: { orderBy: { fecha: 'desc' }, take: 1 },
      },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    return lote;
  }

  async create(dto: CreatePlotDto) {
    return this.prisma.lote.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreatePlotDto>) {
    await this.findOne(id);
    return this.prisma.lote.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lote.update({ where: { id }, data: { activo: false } });
  }

  async getStats(id: string) {
    const lote = await this.findOne(id);
    const [ultimoClima, ultimaOptimizacion, totalRiegos, ultimaPrediccion] = await Promise.all([
      this.prisma.datoClimatico.findFirst({ where: { lote_id: id }, orderBy: { fecha: 'desc' } }),
      this.prisma.optimizacionRiego.findFirst({ where: { lote_id: id }, orderBy: { fecha: 'desc' } }),
      this.prisma.eventoRiego.count({ where: { lote_id: id } }),
      this.prisma.prediccionRendimiento.findFirst({
        where: { temporada: { lote_id: id } },
        orderBy: { fecha_prediccion: 'desc' },
      }),
    ]);

    return { lote, ultimoClima, ultimaOptimizacion, totalRiegos, ultimaPrediccion };
  }
}
