import { Module } from '@nestjs/common';
import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

  findAll() {
    return this.prisma.cultivo.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    const cultivo = await this.prisma.cultivo.findUnique({
      where: { id },
      include: { temporadas: { include: { lote: true } } },
    });
    if (!cultivo) throw new NotFoundException('Cultivo no encontrado');
    return cultivo;
  }

  create(dto: CreateCropDto) {
    return this.prisma.cultivo.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateCropDto>) {
    await this.findOne(id);
    return this.prisma.cultivo.update({ where: { id }, data: dto });
  }
}

@ApiTags('cultivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cultivos')
export class CropsController {
  constructor(private cropsService: CropsService) {}

  @Get()
  findAll() { return this.cropsService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.cropsService.findOne(id); }

  @Post()
  create(@Body() dto: CreateCropDto) { return this.cropsService.create(dto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCropDto>) {
    return this.cropsService.update(id, dto);
  }
}

@Module({
  controllers: [CropsController],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}
