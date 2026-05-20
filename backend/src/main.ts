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
    const existingUsers = await prisma.usuario.count().catch(() => 0);
    if (existingUsers === 0) {
      console.log('🌱 Ejecutando seed inicial...');
      
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      const hashedOperatorPassword = await bcrypt.hash('operador123', 10);

      await prisma.usuario.createMany({
        data: [
          {
            nombre: 'Administrador',
            email: 'admin@agro.pe',
            password: hashedAdminPassword,
            rol: 'ADMIN',
          },
          {
            nombre: 'Operador',
            email: 'operador@agro.pe',
            password: hashedOperatorPassword,
            rol: 'OPERADOR',
          },
        ],
      }).catch(() => console.log('⚠️  Usuarios ya existen o error al crear'));

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
      }).catch(() => console.log('⚠️  Cultivos ya existen o error al crear'));

      console.log('✅ Seed completado exitosamente');
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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
