import { Controller, Post, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import axios from 'axios';

@ApiTags('workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private config: ConfigService) {}

  private async triggerWebhook(webhookUrl: string, payload: any) {
    console.log(`[n8n] Disparando webhook: ${webhookUrl}`);
    
    // Disparar el webhook sin esperar respuesta (fire and forget)
    axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      console.log(`[n8n] ✅ Webhook disparado exitosamente: ${webhookUrl}`);
      console.log(`[n8n] Respuesta:`, res.data);
    }).catch(err => {
      console.error(`[n8n] ❌ Error en webhook ${webhookUrl}:`, err.message);
    });

    // Retornar inmediatamente sin esperar
    return { success: true, queued: true };
  }

  @Post('climate/trigger')
  @ApiOperation({ summary: 'Ejecutar workflow de ingesta de datos climaticos manualmente' })
  async triggerClimateWorkflow(@Request() req) {
    try {
      const webhookUrl = this.config.get<string>('N8N_WEBHOOK_CLIMATE');
      
      if (!webhookUrl) {
        throw new Error('N8N_WEBHOOK_CLIMATE no configurada');
      }
      
      const result = await this.triggerWebhook(webhookUrl, {
        triggered_by: req.user.sub || req.user.id || req.user.userId,
        triggered_at: new Date().toISOString(),
        manual: true,
      });

      return {
        success: true,
        message: 'Workflow de clima ejecutado exitosamente',
        result,
      };
    } catch (error: any) {
      console.error('[Workflows] Error ejecutando climate workflow:', error.message);
      return {
        success: false,
        message: 'Error ejecutando workflow de clima',
        error: error.message,
      };
    }
  }

  @Post('yield/trigger')
  @ApiOperation({ summary: 'Ejecutar workflow de prediccion de rendimiento manualmente' })
  async triggerYieldWorkflow(@Request() req) {
    try {
      const webhookUrl = this.config.get<string>('N8N_WEBHOOK_YIELD');
      
      if (!webhookUrl) {
        throw new Error('N8N_WEBHOOK_YIELD no configurada');
      }
      
      const result = await this.triggerWebhook(webhookUrl, {
        triggered_by: req.user.sub || req.user.id || req.user.userId,
        triggered_at: new Date().toISOString(),
        manual: true,
      });

      return {
        success: true,
        message: 'Workflow de prediccion ejecutado exitosamente',
        result,
      };
    } catch (error: any) {
      console.error('[Workflows] Error ejecutando yield workflow:', error.message);
      return {
        success: false,
        message: 'Error ejecutando workflow de prediccion',
        error: error.message,
      };
    }
  }
}
