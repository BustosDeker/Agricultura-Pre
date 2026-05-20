import { Module } from '@nestjs/common';
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  @IsOptional()
  lote_id?: string;

  @IsString()
  tipo: string;

  @IsEnum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'])
  @IsOptional()
  severidad?: string;

  @IsString()
  mensaje: string;
}

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  findAll(leida?: boolean, loteId?: string) {
    return this.prisma.alerta.findMany({
      where: {
        ...(leida !== undefined ? { leida } : {}),
        ...(loteId ? { lote_id: loteId } : {}),
      },
      include: {
        lote: { select: { nombre: true, finca: { select: { nombre: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  getUnreadCount() {
    return this.prisma.alerta.count({ where: { leida: false } });
  }

  create(dto: CreateAlertDto) {
    return this.prisma.alerta.create({
      data: {
        ...dto,
        severidad: dto.severidad as any,
      },
    });
  }

  markAsRead(id: string) {
    return this.prisma.alerta.update({ where: { id }, data: { leida: true } });
  }

  markAllAsRead() {
    return this.prisma.alerta.updateMany({ where: { leida: false }, data: { leida: true } });
  }
}

@ApiTags('alertas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alertas')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  findAll(@Query('leida') leida?: string, @Query('lote_id') loteId?: string) {
    const leidaBool = leida === 'true' ? true : leida === 'false' ? false : undefined;
    return this.alertsService.findAll(leidaBool, loteId);
  }

  @Get('count/unread')
  getUnreadCount() {
    return this.alertsService.getUnreadCount();
  }

  @Post()
  create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.alertsService.markAsRead(id);
  }

  @Put('mark-all-read')
  markAllAsRead() {
    return this.alertsService.markAllAsRead();
  }
}

@Module({
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
