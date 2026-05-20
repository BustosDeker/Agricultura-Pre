import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  nombre: string;

  @IsString()
  ubicacion: string;

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;

  @IsNumber()
  @IsOptional()
  area_total_ha?: number;

  @IsString()
  @IsOptional()
  propietario?: string;
}

@Injectable()
export class FarmsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.finca.findMany({
      where: { usuario_id: userId },
      include: {
        _count: { select: { lotes: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const finca = await this.prisma.finca.findUnique({
      where: { id },
      include: {
        lotes: {
          include: {
            temporadas: { where: { estado: 'ACTIVA' }, include: { cultivo: true } },
            _count: { select: { sensores: true } },
          },
        },
      },
    });
    if (!finca) throw new NotFoundException('Finca no encontrada');
    return finca;
  }

  async create(dto: CreateFarmDto, userId: string) {
    return this.prisma.finca.create({
      data: { ...dto, usuario_id: userId },
    });
  }

  async update(id: string, dto: Partial<CreateFarmDto>) {
    await this.findOne(id);
    return this.prisma.finca.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.finca.delete({ where: { id } });
  }
}
