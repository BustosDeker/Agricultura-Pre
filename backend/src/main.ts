import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('🔧 Inicializando base de datos...');
  try {
    const existingFincas = await prisma.finca.count().catch(() => 0);
    
    if (existingFincas === 0) {
      console.log('🌱 Ejecutando seed inicial completo...');
      
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      const hashedOperatorPassword = await bcrypt.hash('operador123', 10);

      const admin = await prisma.usuario.create({
        data: {
          nombre: 'Administrador',
          email: 'admin@agro.pe',
          password: hashedAdminPassword,
          rol: 'ADMIN',
        },
      });

      await prisma.usuario.create({
        data: {
          nombre: 'Operador',
          email: 'operador@agro.pe',
          password: hashedOperatorPassword,
          rol: 'OPERADOR',
        },
      });

      await prisma.cultivo.createMany({
        data: [
          {
            nombre: 'Maíz',
            nombre_cientifico: 'Zea mays',
            tipo: 'Grano',
            ciclo_dias: 120,
            rendimiento_promedio_kg_ha: 8000,
          },
          {
            nombre: 'Trigo',
            nombre_cientifico: 'Triticum aestivum',
            tipo: 'Grano',
            ciclo_dias: 150,
            rendimiento_promedio_kg_ha: 6000,
          },
          {
            nombre: 'Soja',
            nombre_cientifico: 'Glycine max',
            tipo: 'Legumbre',
            ciclo_dias: 110,
            rendimiento_promedio_kg_ha: 3500,
          },
        ],
      });

      const finca = await prisma.finca.create({
        data: {
          nombre: 'Finca Santa Rosa',
          ubicacion: 'Trujillo, La Libertad',
          latitud: -8.112,
          longitud: -79.029,
          area_total_ha: 50,
          propietario: 'Sr. Juan Pérez',
          usuario_id: admin.id,
        },
      });

      const lote1 = await prisma.lote.create({
        data: {
          nombre: 'Lote A1',
          finca_id: finca.id,
          area_ha: 10,
          tipo_suelo: 'Franco arcilloso',
          ph_suelo: 6.8,
          materia_organica: 2.5,
        },
      });

      const lote2 = await prisma.lote.create({
        data: {
          nombre: 'Lote A2',
          finca_id: finca.id,
          area_ha: 15,
          tipo_suelo: 'Franco arenoso',
          ph_suelo: 7.2,
          materia_organica: 1.8,
        },
      });

      const lote3 = await prisma.lote.create({
        data: {
          nombre: 'Lote B1',
          finca_id: finca.id,
          area_ha: 25,
          tipo_suelo: 'Arcilloso',
          ph_suelo: 6.5,
          materia_organica: 3.2,
        },
      });

      const cultivosList = await prisma.cultivo.findMany();

      const temporada1 = await prisma.temporada.create({
        data: {
          lote_id: lote1.id,
          cultivo_id: cultivosList[0].id,
          fecha_inicio: new Date('2024-01-15'),
          fecha_fin_estimada: new Date('2024-05-15'),
          estado: 'COSECHADA',
          rendimiento_estimado_kg_ha: 8000,
          rendimiento_real_kg_ha: 7850,
        },
      });

      const temporada2 = await prisma.temporada.create({
        data: {
          lote_id: lote1.id,
          cultivo_id: cultivosList[0].id,
          fecha_inicio: new Date('2024-06-01'),
          fecha_fin_estimada: new Date('2024-09-30'),
          estado: 'ACTIVA',
          rendimiento_estimado_kg_ha: 8200,
        },
      });

      const temporada3 = await prisma.temporada.create({
        data: {
          lote_id: lote2.id,
          cultivo_id: cultivosList[1].id,
          fecha_inicio: new Date('2024-04-01'),
          fecha_fin_estimada: new Date('2024-08-30'),
          estado: 'ACTIVA',
          rendimiento_estimado_kg_ha: 5800,
        },
      });

      const temporada4 = await prisma.temporada.create({
        data: {
          lote_id: lote3.id,
          cultivo_id: cultivosList[2].id,
          fecha_inicio: new Date('2024-03-01'),
          fecha_fin_estimada: new Date('2024-06-20'),
          estado: 'ACTIVA',
          rendimiento_estimado_kg_ha: 3400,
        },
      });

      const sensor1 = await prisma.sensor.create({
        data: { lote_id: lote1.id, tipo: 'HUMEDAD_SUELO', modelo: 'SensorTech H-100', ubicacion: 'Centro del lote' },
      });

      const sensor2 = await prisma.sensor.create({
        data: { lote_id: lote1.id, tipo: 'TEMPERATURA', modelo: 'SensorTech T-200', ubicacion: 'Borde norte' },
      });

      const sensor3 = await prisma.sensor.create({
        data: { lote_id: lote2.id, tipo: 'HUMEDAD_SUELO', modelo: 'SensorTech H-100', ubicacion: 'Centro' },
      });

      const sensor4 = await prisma.sensor.create({
        data: { lote_id: lote3.id, tipo: 'PH', modelo: 'SensorTech P-300', ubicacion: 'Centro' },
      });

      const now = new Date();
      const lecturasSensor = [];
      for (let i = 0; i < 10; i++) {
        const timestamp = new Date(now.getTime() - i * 3600000);
        lecturasSensor.push(
          { sensor_id: sensor1.id, valor: 45 + Math.random() * 20, unidad: '%', timestamp },
          { sensor_id: sensor2.id, valor: 20 + Math.random() * 10, unidad: '°C', timestamp },
          { sensor_id: sensor3.id, valor: 40 + Math.random() * 25, unidad: '%', timestamp },
        );
      }
      await prisma.lecturaSensor.createMany({ data: lecturasSensor });

      await prisma.eventoRiego.create({
        data: {
          lote_id: lote1.id,
          fecha_hora_inicio: new Date(now.getTime() - 2 * 24 * 3600000),
          duracion_minutos: 120,
          volumen_litros: 50000,
          tipo_riego: 'GOTEO',
          automatico: true,
          notas: 'Riego programado',
        },
      });

      await prisma.eventoRiego.create({
        data: {
          lote_id: lote2.id,
          fecha_hora_inicio: new Date(now.getTime() - 1 * 24 * 3600000),
          duracion_minutos: 90,
          volumen_litros: 35000,
          tipo_riego: 'ASPERSION',
          automatico: false,
          notas: 'Riego manual',
        },
      });

      await prisma.eventoRiego.create({
        data: {
          lote_id: lote3.id,
          fecha_hora_inicio: new Date(now.getTime() - 3 * 24 * 3600000),
          duracion_minutos: 150,
          volumen_litros: 75000,
          tipo_riego: 'GOTEO',
          automatico: true,
        },
      });

      const datosClimaticos = [];
      for (let i = 0; i < 30; i++) {
        const fecha = new Date(now.getTime() - i * 24 * 3600000);
        datosClimaticos.push(
          {
            lote_id: lote1.id,
            fecha,
            temperatura_max: 25 + Math.random() * 8,
            temperatura_min: 15 + Math.random() * 5,
            humedad_promedio: 60 + Math.random() * 20,
            precipitacion_mm: Math.random() > 0.7 ? Math.random() * 20 : 0,
            velocidad_viento_ms: 2 + Math.random() * 5,
          },
          {
            lote_id: lote2.id,
            fecha,
            temperatura_max: 24 + Math.random() * 7,
            temperatura_min: 14 + Math.random() * 4,
            humedad_promedio: 55 + Math.random() * 18,
            precipitacion_mm: Math.random() > 0.75 ? Math.random() * 15 : 0,
            velocidad_viento_ms: 1.5 + Math.random() * 4,
          },
        );
      }
      await prisma.datoClimatico.createMany({ data: datosClimaticos });

      await prisma.prediccionRendimiento.create({
        data: {
          temporada_id: temporada2.id,
          rendimiento_predicho_kg_ha: 8150,
          rendimiento_intervalo_inferior: 7700,
          rendimiento_intervalo_superior: 8600,
          precision_modelo: 0.89,
          metodo_ensemble: 'voting_rf_gb',
          factores_influyentes: [
            { factor: 'humedad_suelo', importancia: 0.28 },
            { factor: 'temperatura', importancia: 0.22 },
            { factor: 'ph_suelo', importancia: 0.18 },
          ],
        },
      });

      await prisma.prediccionRendimiento.create({
        data: {
          temporada_id: temporada3.id,
          rendimiento_predicho_kg_ha: 5900,
          rendimiento_intervalo_inferior: 5500,
          rendimiento_intervalo_superior: 6300,
          precision_modelo: 0.86,
          metodo_ensemble: 'voting_rf_gb',
        },
      });

      await prisma.prediccionRendimiento.create({
        data: {
          temporada_id: temporada4.id,
          rendimiento_predicho_kg_ha: 3450,
          rendimiento_intervalo_inferior: 3100,
          rendimiento_intervalo_superior: 3800,
          precision_modelo: 0.84,
          metodo_ensemble: 'voting_rf_gb',
        },
      });

      await prisma.optimizacionRiego.createMany({
        data: [
          { lote_id: lote1.id, fecha: now, recomendacion_riego_mm: 15, necesidad_riego_mm: 12, humedad_actual: 48 },
          { lote_id: lote2.id, fecha: now, recomendacion_riego_mm: 18, necesidad_riego_mm: 16, humedad_actual: 42 },
          { lote_id: lote3.id, fecha: now, recomendacion_riego_mm: 10, necesidad_riego_mm: 8, humedad_actual: 55 },
        ],
      });

      await prisma.alerta.createMany({
        data: [
          {
            lote_id: lote1.id,
            tipo: 'HUMEDAD_BAJA',
            severidad: 'MEDIA',
            mensaje: 'Humedad del suelo por debajo del óptimo en Lote A1',
            leida: false,
          },
          {
            lote_id: lote2.id,
            tipo: 'TEMPERATURA_ALTA',
            severidad: 'BAJA',
            mensaje: 'Temperatura elevada detectada en Lote A2',
            leida: true,
          },
          {
            tipo: 'MANTENIMIENTO',
            severidad: 'BAJA',
            mensaje: 'Revisar calibración de sensores',
            leida: false,
          },
        ],
      });

      console.log('✅ Seed COMPLETO exitosamente! Datos de prueba agregados.');
    } else {
      console.log('ℹ️  La base de datos ya tiene datos, saltando seed');
    }
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  }
}

async function bootstrap() {
  await initDatabase();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Agricultura de Precisión API')
    .setDescription('API para el Sistema de Información de Agricultura de Precisión')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap();
