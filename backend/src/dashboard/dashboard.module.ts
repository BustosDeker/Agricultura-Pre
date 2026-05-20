import { Module } from '@nestjs/common';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [
      totalFincas,
      totalLotes,
      totalTemporadasActivas,
      totalAlertas,
      ultimasPredicciones,
      ultimosRiegos,
      climaticaReciente,
    ] = await Promise.all([
      this.prisma.finca.count(),
      this.prisma.lote.count({ where: { activo: true } }),
      this.prisma.temporada.count({ where: { estado: 'ACTIVA' } }),
      this.prisma.alerta.count({ where: { leida: false } }),
      this.prisma.prediccionRendimiento.findMany({
        include: {
          temporada: {
            include: {
              lote: { select: { nombre: true } },
              cultivo: { select: { nombre: true } },
            },
          },
        },
        orderBy: { fecha_prediccion: 'desc' },
        take: 5,
      }),
      this.prisma.eventoRiego.findMany({
        include: { lote: { select: { nombre: true } } },
        orderBy: { fecha_hora_inicio: 'desc' },
        take: 5,
      }),
      this.prisma.datoClimatico.findMany({
        orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
        take: 20,
        include: {
          lote: { select: { nombre: true } }
        }
      }),
    ]);

    // Rendimiento promedio predicho
    const predicciones = await this.prisma.prediccionRendimiento.findMany({
      where: { fecha_prediccion: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const rendimientoPromedio =
      predicciones.length > 0
        ? predicciones.reduce((s, p) => s + p.rendimiento_predicho_kg_ha, 0) / predicciones.length
        : 0;

    // Eficiencia hídrica (últimos 30 días)
    const riegos30 = await this.prisma.eventoRiego.findMany({
      where: { fecha_hora_inicio: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const volumenTotal = riegos30.reduce((s, r) => s + (r.volumen_litros || 0), 0);

    return {
      resumen: {
        total_fincas: totalFincas,
        total_lotes: totalLotes,
        temporadas_activas: totalTemporadasActivas,
        alertas_pendientes: totalAlertas,
        rendimiento_promedio_kg_ha: Math.round(rendimientoPromedio),
        volumen_riego_30d_litros: Math.round(volumenTotal),
        total_eventos_riego_30d: riegos30.length,
      },
      ultimas_predicciones: ultimasPredicciones,
      ultimos_riegos: ultimosRiegos,
      clima_reciente: climaticaReciente,
    };
  }

  async getChartData() {
    // Datos para gráficos de los últimos 30 días
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [riegosPorDia, prediccionesPorLote, alertasPorTipo] = await Promise.all([
      // Riego diario (agrupado en memoria)
      this.prisma.eventoRiego.findMany({
        where: { fecha_hora_inicio: { gte: from } },
        select: { fecha_hora_inicio: true, volumen_litros: true },
      }),
      // Predicciones por lote
      this.prisma.prediccionRendimiento.findMany({
        where: { fecha_prediccion: { gte: from } },
        include: {
          temporada: {
            include: {
              lote: { select: { nombre: true } },
              cultivo: { select: { nombre: true } },
            },
          },
        },
        orderBy: { fecha_prediccion: 'asc' },
      }),
      // Alertas por tipo
      this.prisma.alerta.groupBy({
        by: ['tipo'],
        _count: { tipo: true },
        where: { created_at: { gte: from } },
      }),
    ]);

    // Agrupar riego por día
    const riegoMap: Record<string, number> = {};
    riegosPorDia.forEach(r => {
      const dia = r.fecha_hora_inicio.toISOString().split('T')[0];
      riegoMap[dia] = (riegoMap[dia] || 0) + (r.volumen_litros || 0);
    });

    return {
      riego_diario: Object.entries(riegoMap)
        .map(([fecha, volumen]) => ({ fecha, volumen }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      predicciones_por_lote: prediccionesPorLote.map(p => ({
        lote: p.temporada.lote.nombre,
        cultivo: p.temporada.cultivo.nombre,
        rendimiento: p.rendimiento_predicho_kg_ha,
        fecha: p.fecha_prediccion,
      })),
      alertas_por_tipo: alertasPorTipo.map(a => ({
        tipo: a.tipo,
        cantidad: a._count.tipo,
      })),
    };
  }
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('charts')
  getChartData() {
    return this.dashboardService.getChartData();
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
