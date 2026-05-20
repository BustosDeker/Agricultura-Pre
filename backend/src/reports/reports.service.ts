import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { GenerateReportDto } from './dto/generate-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  findAll(userId: string) {
    return this.prisma.reporte.findMany({
      where: { usuario_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.reporte.findUnique({ where: { id } });
  }

  async generateOperationalReport(dto: GenerateReportDto, userId: string) {
    const fechaInicio = dto.fecha_inicio
      ? new Date(dto.fecha_inicio)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const fechaFin = new Date();

    const eventos = await this.prisma.eventoRiego.findMany({
      where: {
        ...(dto.lote_id ? { lote_id: dto.lote_id } : {}),
        fecha_hora_inicio: { gte: fechaInicio, lte: fechaFin },
      },
      include: { 
        lote: { 
          include: { 
            finca: { select: { nombre: true } },
            temporadas: { where: { estado: 'ACTIVA' }, select: { cultivo: { select: { nombre: true } } } }
          } 
        } 
      },
      orderBy: { fecha_hora_inicio: 'desc' },
    });

    // Agrupar eventos por lote
    const eventosPorLote = eventos.reduce((acc, evento) => {
      const key = evento.lote_id;
      if (!acc[key]) {
        acc[key] = {
          lote: evento.lote.nombre,
          finca: evento.lote.finca.nombre,
          cultivo: evento.lote.temporadas[0]?.cultivo?.nombre || 'N/A',
          eventos: [],
        };
      }
      acc[key].eventos.push({
        id: evento.id,
        fecha: evento.fecha_hora_inicio.toISOString(),
        duracion_minutos: evento.duracion_minutos || 0,
        volumen_litros: evento.volumen_litros || 0,
        tipo_riego: evento.tipo_riego,
        automatico: evento.automatico,
        notas: evento.notas || '-',
      });
      return acc;
    }, {} as Record<string, any>);

    const contenidoJson = JSON.stringify({
      resumen: {
        total_eventos: eventos.length,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        total_volumen_litros: Number((eventos.reduce((sum, e) => sum + (e.volumen_litros || 0), 0)).toFixed(2)),
        total_duracion_minutos: eventos.reduce((sum, e) => sum + (e.duracion_minutos || 0), 0),
      },
      eventosPorLote,
      eventos: eventos.map(e => ({
        id: e.id,
        lote: e.lote.nombre,
        finca: e.lote.finca.nombre,
        fecha: e.fecha_hora_inicio.toISOString(),
        duracion_minutos: e.duracion_minutos || 0,
        volumen_litros: e.volumen_litros || 0,
        tipo_riego: e.tipo_riego,
        automatico: e.automatico,
        notas: e.notas || '-',
      })),
    });

    console.log('[REPORT] Contenido guardado - longitud:', contenidoJson.length);
    console.log('[REPORT] Primeros 200 caracteres:', contenidoJson.substring(0, 200));

    const reporte = await this.prisma.reporte.create({
      data: {
        usuario_id: userId,
        tipo: 'OPERACIONAL',
        titulo: `Reporte Operacional - ${new Date().toLocaleDateString('es-PE')}`,
        contenido: contenidoJson,
        url_pdf: 'pending',
      },
    });

    // Disparar workflow en n8n
    await this.triggerN8nWorkflow('operacional', {
      report_type: 'operacional',
      lote_id: dto.lote_id,
      finca_id: dto.finca_id,
      usuario_id: userId,
      fecha_inicio: fechaInicio.toISOString(),
      report_id: reporte.id,
    });

    return { reporte, eventos };
  }

  async generateManagementReport(dto: GenerateReportDto, userId: string) {
    const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const predicciones = await this.prisma.prediccionRendimiento.findMany({
      where: {
        temporada: {
          ...(dto.lote_id ? { lote_id: dto.lote_id } : {}),
          ...(dto.finca_id ? { lote: { finca_id: dto.finca_id } } : {}),
        },
        fecha_prediccion: { gte: fechaInicio },
      },
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

    // Calcular estadísticas
    const rendimientos = predicciones.map(p => p.rendimiento_predicho_kg_ha).filter(Boolean);
    const rendimientosPromedio = rendimientos.length > 0 ? rendimientos.reduce((a, b) => a + b, 0) / rendimientos.length : 0;
    const rendimientoMax = rendimientos.length > 0 ? Math.max(...rendimientos) : 0;
    const rendimientoMin = rendimientos.length > 0 ? Math.min(...rendimientos) : 0;

    const contenidoJson = JSON.stringify({
      resumen: {
        total_predicciones: predicciones.length,
        rendimiento_promedio_kg_ha: Number(rendimientosPromedio.toFixed(2)),
        rendimiento_maximo_kg_ha: rendimientoMax,
        rendimiento_minimo_kg_ha: rendimientoMin,
        fecha_desde: fechaInicio.toISOString(),
        fecha_hasta: new Date().toISOString(),
      },
      predicciones: predicciones.map(p => ({
        id: p.id,
        lote: p.temporada.lote.nombre,
        finca: p.temporada.lote.finca.nombre,
        cultivo: p.temporada.cultivo.nombre,
        rendimiento_predicho_kg_ha: p.rendimiento_predicho_kg_ha,
        intervalo_inferior_kg_ha: p.rendimiento_intervalo_inferior || 'N/A',
        intervalo_superior_kg_ha: p.rendimiento_intervalo_superior || 'N/A',
        precision_modelo: p.precision_modelo ? `${(p.precision_modelo * 100).toFixed(2)}%` : 'N/A',
        metodo_ensemble: p.metodo_ensemble || 'N/A',
        fecha_prediccion: p.fecha_prediccion.toISOString(),
        factores_influyentes: p.factores_influyentes || {},
      })),
    });

    console.log('[REPORT] Contenido de gestión - longitud:', contenidoJson.length);
    console.log('[REPORT] Primeros 200 caracteres:', contenidoJson.substring(0, 200));

    const reporte = await this.prisma.reporte.create({
      data: {
        usuario_id: userId,
        tipo: 'GESTION',
        titulo: `Reporte de Gestión - ${new Date().toLocaleDateString('es-PE')}`,
        contenido: contenidoJson,
        url_pdf: 'pending',
      },
    });

    // Disparar workflow en n8n
    await this.triggerN8nWorkflow('gestion', {
      report_type: 'gestion',
      lote_id: dto.lote_id,
      finca_id: dto.finca_id,
      usuario_id: userId,
      fecha_inicio: fechaInicio.toISOString(),
      report_id: reporte.id,
    });

    return { reporte, predicciones };
  }

  private async triggerN8nWorkflow(type: string, payload: any) {
    // Obtener la URL específica según el tipo de reporte
    const webhookKey = `N8N_WEBHOOK_${type.toUpperCase()}`;
    const webhookUrl = this.config.get<string>(webhookKey);
    
    if (!webhookUrl) {
      console.warn(`${webhookKey} no configurado en .env`);
      return;
    }

    try {
      console.log(`[n8n] Disparando webhook ${type}:`, webhookUrl);
      console.log(`[n8n] Payload:`, payload);

      const response = await axios.post(webhookUrl, payload, { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`[n8n] Webhook disparado exitosamente para ${type}:`, response.status);
    } catch (error: any) {
      console.error(`[n8n] Error en webhook ${type}:`, error.message);
      console.error(`[n8n] URL intentada:`, webhookUrl);
      // No lanzar error, permitir que continúe
      // n8n puede no estar disponible en desarrollo
    }
  }
}
