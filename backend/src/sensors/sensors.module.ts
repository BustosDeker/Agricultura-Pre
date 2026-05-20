import { Module } from '@nestjs/common';
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSensorDto {
  @IsString()
  lote_id: string;

  @IsEnum(['HUMEDAD_SUELO', 'TEMPERATURA', 'PH', 'LLUVIA', 'VIENTO', 'RADIACION_SOLAR'])
  tipo: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsString()
  @IsOptional()
  ubicacion?: string;
}

export class CreateReadingDto {
  @IsNumber()
  valor: number;

  @IsString()
  @IsOptional()
  unidad?: string;
}

@Injectable()
export class SensorsService {
  constructor(private prisma: PrismaService) {}

  findAll(loteId?: string) {
    return this.prisma.sensor.findMany({
      where: loteId ? { lote_id: loteId } : undefined,
      include: {
        lote: { select: { nombre: true } },
        _count: { select: { lecturas: true } },
      },
    });
  }

  async findOne(id: string) {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id },
      include: {
        lote: true,
        lecturas: { orderBy: { timestamp: 'desc' }, take: 100 },
      },
    });
    if (!sensor) throw new NotFoundException('Sensor no encontrado');
    return sensor;
  }

  create(dto: CreateSensorDto) {
    return this.prisma.sensor.create({ data: dto as any });
  }

  addReading(sensorId: string, dto: CreateReadingDto) {
    return this.prisma.lecturaSensor.create({
      data: { sensor_id: sensorId, ...dto },
    });
  }

  getLatestReadings(loteId: string) {
    return this.prisma.lecturaSensor.findMany({
      where: { sensor: { lote_id: loteId } },
      include: { sensor: { select: { tipo: true, ubicacion: true } } },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }
}

@ApiTags('sensores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sensores')
export class SensorsController {
  constructor(private sensorsService: SensorsService) {}

  @Get()
  findAll(@Query('lote_id') loteId?: string) {
    return this.sensorsService.findAll(loteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sensorsService.findOne(id);
  }

  @Get(':id/lecturas')
  getReadings(@Param('id') id: string) {
    return this.sensorsService.getLatestReadings(id);
  }

  @Post()
  create(@Body() dto: CreateSensorDto) {
    return this.sensorsService.create(dto);
  }

  @Post(':id/lecturas')
  addReading(@Param('id') id: string, @Body() dto: CreateReadingDto) {
    return this.sensorsService.addReading(id, dto);
  }
}

@Module({
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
