import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCropDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  nombre_cientifico?: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsNumber()
  @IsOptional()
  ciclo_dias?: number;

  @IsNumber()
  @IsOptional()
  rendimiento_promedio_kg_ha?: number;
}

@Injectable()
export class CropsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cultivo.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const cultivo = await this.prisma.cultivo.findUnique({
      where: { id },
      include: {
        temporadas: {
          include: { lote: true },
          orderBy: { fecha_inicio: 'desc' },
        },
      },
    });
    if (!cultivo) throw new NotFoundException('Cultivo no encontrado');
    return cultivo;
  }

  async create(dto: CreateCropDto) {
    return this.prisma.cultivo.create({
      data: dto,
    });
  }

  async update(id: string, dto: Partial<CreateCropDto>) {
    await this.findOne(id);
    return this.prisma.cultivo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cultivo.delete({ where: { id } });
  }
}
