import { Controller, Get, Post, Body, Param, Res, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reportes')
@Controller('reportes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  private sanitizeReport(reporte: any) {
    if (!reporte) return reporte;
    
    return {
      ...reporte,
      contenido: reporte.contenido ? 
        (typeof reporte.contenido === 'string' ? reporte.contenido : JSON.stringify(reporte.contenido))
        : null
    };
  }

  @Get()
  async list(@Request() req) {
    const reportes = await this.reportsService.findAll(req.user.sub || req.user.id || req.user.userId);
    return reportes.map(r => this.sanitizeReport(r));
  }

  @Post('operacional')
  async generateOperational(
    @Body() dto: GenerateReportDto,
    @Request() req,
  ) {
    const result = await this.reportsService.generateOperationalReport(dto, req.user.sub || req.user.id || req.user.userId);
    return {
      ...result,
      reporte: this.sanitizeReport(result.reporte)
    };
  }

  @Post('gestion')
  async generateManagement(
    @Body() dto: GenerateReportDto,
    @Request() req,
  ) {
    const result = await this.reportsService.generateManagementReport(dto, req.user.sub || req.user.id || req.user.userId);
    return {
      ...result,
      reporte: this.sanitizeReport(result.reporte)
    };
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const reporte = await this.reportsService.findOne(id);
    if (!reporte) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reporte.titulo.replace(/\s+/g, '_')}.pdf"`);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Parsear contenido del reporte
    let data = null;
    try {
      data = reporte.contenido ? JSON.parse(reporte.contenido) : null;
    } catch {
      data = null;
    }

    const pageWidth = 520;
    const accentColor = '#16a34a'; // Verde AgroSmart
    let y = 30;

    // ===== HEADER CON ESTILO =====
    // Barra superior decorativa
    doc.fillColor(accentColor).rect(40, 20, pageWidth, 4).fill();
    
    // Logo/Brand
    doc.fillColor(accentColor).fontSize(24).font('Helvetica-Bold').text('AgroSmart', 40, y);
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text('Sistema de Gestion Agricola', 40, y + 22);
    
    // Info del reporte a la derecha
    doc.fillColor('#374151').fontSize(11).font('Helvetica-Bold').text(reporte.titulo, 300, y, { align: 'right', width: 260 });
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`Generado: ${new Date(reporte.created_at).toLocaleString('es-PE')}`, 300, y + 16, { align: 'right', width: 260 });
    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica').text(`ID: ${reporte.id.slice(0, 8)}...`, 300, y + 28, { align: 'right', width: 260 });
    
    y = 95;

    if (!data) {
      doc.fillColor('#ef4444').fontSize(12).text('No hay datos disponibles para este reporte.', 40, y);
      doc.pipe(res);
      doc.end();
      return;
    }

    // ===== RESUMEN CON CARDS =====
    doc.fillColor('#374151').fontSize(13).font('Helvetica-Bold').text('Resumen General', 40, y);
    y += 25;

    if (reporte.tipo === 'OPERACIONAL' && data.resumen) {
      const stats = [
        { label: 'EVENTOS', value: data.resumen.total_eventos || 0, color: '#3b82f6' },
        { label: 'DURACION', value: `${data.resumen.total_duracion_minutos || 0} min`, color: '#f59e0b' },
        { label: 'VOLUMEN', value: `${data.resumen.total_volumen_litros || 0} L`, color: '#06b6d4' },
      ];

      // Cards de stats
      const cardWidth = 160;
      stats.forEach((stat, i) => {
        const x = 40 + (i * (cardWidth + 10));
        // Fondo del card
        doc.fillColor('#f8fafc').roundedRect(x, y, cardWidth, 45, 6).fill();
        doc.strokeColor('#e2e8f0').lineWidth(1).roundedRect(x, y, cardWidth, 45, 6).stroke();
        // Barra de color
        doc.fillColor(stat.color).rect(x, y, 4, 45).fill();
        // Label
        doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(stat.label, x + 12, y + 8);
        // Valor
        doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text(String(stat.value), x + 12, y + 22);
      });
      y += 60;

      // ===== TABLA COMPACTA =====
      if (data.eventos && data.eventos.length > 0) {
        doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold').text('Detalle de Eventos de Riego', 40, y);
        y += 18;

        // Headers compactos
        const cols = [65, 80, 75, 50, 60, 60, 40];
        const headers = ['Fecha', 'Lote', 'Finca', 'Tipo', 'Dur.', 'Vol.', 'Auto'];
        let x = 40;

        // Header background
        doc.fillColor(accentColor).roundedRect(40, y - 2, pageWidth, 18, 3).fill();
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        headers.forEach((h, i) => {
          doc.text(h, x + 4, y + 4, { width: cols[i] - 8, align: i === 0 ? 'left' : 'center' });
          x += cols[i];
        });
        y += 18;

        // Rows compactos - máximo 12 filas para que quepan en una página
        const maxRows = Math.min(data.eventos.length, 12);
        for (let idx = 0; idx < maxRows; idx++) {
          const evt = data.eventos[idx];
          const isAlt = idx % 2 === 1;
          
          if (isAlt) {
            doc.fillColor('#f8fafc').rect(40, y, pageWidth, 14).fill();
          }

          x = 40;
          const fecha = new Date(evt.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          const row = [
            fecha,
            (evt.lote || '-').substring(0, 10),
            (evt.finca || '-').substring(0, 8),
            (evt.tipo_riego || '-').substring(0, 6),
            `${evt.duracion_minutos || 0}m`,
            `${Math.round(evt.volumen_litros || 0)}L`,
            evt.automatico ? 'SI' : 'NO',
          ];

          doc.fillColor('#475569').fontSize(7).font('Helvetica');
          row.forEach((cell, i) => {
            // Color especial para automático
            if (i === 6 && cell === '✓') doc.fillColor(accentColor);
            else if (i === 6) doc.fillColor('#ef4444');
            else doc.fillColor('#475569');
            
            doc.text(String(cell), x + 4, y + 3, { width: cols[i] - 8, align: i === 0 ? 'left' : 'center' });
            x += cols[i];
          });
          y += 14;
        }

        if (data.eventos.length > maxRows) {
          y += 5;
          doc.fillColor('#6b7280').fontSize(7).font('Helvetica-Oblique').text(`... y ${data.eventos.length - maxRows} eventos más`, 40, y);
        }
      }
    } else if (reporte.tipo === 'GESTION' && data.resumen) {
      const stats = [
        { label: 'PREDICCIONES', value: data.resumen.total_predicciones || 0, color: '#8b5cf6' },
        { label: 'PROMEDIO', value: `${data.resumen.rendimiento_promedio_kg_ha || 0} kg/ha`, color: '#10b981' },
        { label: 'MAXIMO', value: `${data.resumen.rendimiento_maximo_kg_ha || 0} kg/ha`, color: '#3b82f6' },
        { label: 'MINIMO', value: `${data.resumen.rendimiento_minimo_kg_ha || 0} kg/ha`, color: '#f59e0b' },
      ];

      // Cards de stats en 2x2
      const cardWidth = 120;
      stats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 40 + (col * (cardWidth + 15));
        const cardY = y + (row * 50);
        
        doc.fillColor('#f8fafc').roundedRect(x, cardY, cardWidth, 42, 6).fill();
        doc.strokeColor('#e2e8f0').lineWidth(1).roundedRect(x, cardY, cardWidth, 42, 6).stroke();
        doc.fillColor(stat.color).rect(x, cardY, 4, 42).fill();
        doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(stat.label, x + 10, cardY + 6);
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(String(stat.value), x + 10, cardY + 18, { width: 100 });
      });
      y += 110;

      // ===== TABLA DE PREDICCIONES =====
      if (data.predicciones && data.predicciones.length > 0) {
        doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold').text('Predicciones de Rendimiento', 40, y);
        y += 18;

        const cols = [55, 65, 65, 80, 110, 55, 55];
        const headers = ['Cultivo', 'Lote', 'Finca', 'Rendim.', 'Intervalo', 'Prec.', 'Fecha'];
        let x = 40;

        doc.fillColor(accentColor).roundedRect(40, y - 2, pageWidth, 18, 3).fill();
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        headers.forEach((h, i) => {
          doc.text(h, x + 4, y + 4, { width: cols[i] - 8, align: i === 0 ? 'left' : 'center' });
          x += cols[i];
        });
        y += 18;

        const maxRows = Math.min(data.predicciones.length, 10);
        for (let idx = 0; idx < maxRows; idx++) {
          const pred = data.predicciones[idx];
          const isAlt = idx % 2 === 1;
          
          if (isAlt) {
            doc.fillColor('#f8fafc').rect(40, y, pageWidth, 16).fill();
          }

          x = 40;
          const fecha = new Date(pred.fecha_prediccion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
          const intervalo = `${Math.round(pred.intervalo_inferior_kg_ha || 0)}-${Math.round(pred.intervalo_superior_kg_ha || 0)}`;
          const row = [
            (pred.cultivo || '-').substring(0, 8),
            (pred.lote || '-').substring(0, 8),
            (pred.finca || '-').substring(0, 8),
            `${Math.round(pred.rendimiento_predicho_kg_ha || 0)} kg/ha`,
            intervalo,
            pred.precision_modelo || 'N/A',
            fecha,
          ];

          doc.fillColor('#475569').fontSize(7).font('Helvetica');
          row.forEach((cell, i) => {
            doc.text(String(cell), x + 4, y + 4, { width: cols[i] - 8, align: i === 0 ? 'left' : 'center' });
            x += cols[i];
          });
          y += 16;
        }

        if (data.predicciones.length > maxRows) {
          y += 5;
          doc.fillColor('#6b7280').fontSize(7).font('Helvetica-Oblique').text(`... y ${data.predicciones.length - maxRows} predicciones más`, 40, y);
        }
      }
    }

    // ===== FOOTER ESTILIZADO =====
    y = 750;
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(40, y - 10).lineTo(40 + pageWidth, y - 10).stroke();
    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica').text('AgroSmart - Sistema de Gestion Agricola de Precision', 40, y, { align: 'center', width: pageWidth });
    doc.fillColor('#9ca3af').fontSize(6).text(`Reporte generado automáticamente • ${new Date().toLocaleString('es-PE')}`, 40, y + 12, { align: 'center', width: pageWidth });

    doc.pipe(res);
    doc.end();
  }
}
