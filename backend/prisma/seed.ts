import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Usuarios
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@agro.pe' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@agro.pe',
      password: adminPass,
      rol: 'ADMIN',
    },
  });

  const operadorPass = await bcrypt.hash('operador123', 10);
  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@agro.pe' },
    update: {},
    create: {
      nombre: 'Juan Operador',
      email: 'operador@agro.pe',
      password: operadorPass,
      rol: 'OPERADOR',
    },
  });

  // Finca
  const finca = await prisma.finca.upsert({
    where: { id: 'finca-001' },
    update: {},
    create: {
      id: 'finca-001',
      nombre: 'Finca El Progreso',
      ubicacion: 'Valle Chicama, La Libertad',
      latitud: -7.9215,
      longitud: -79.0019,
      area_total_ha: 45.5,
      propietario: 'Agroindustrias del Norte SAC',
      usuario_id: admin.id,
    },
  });

  // Cultivos
  const esparrago = await prisma.cultivo.upsert({
    where: { nombre: 'Espárrago' },
    update: {},
    create: {
      nombre: 'Espárrago',
      nombre_cientifico: 'Asparagus officinalis',
      tipo: 'Hortaliza',
      ciclo_dias: 730,
      rendimiento_promedio_kg_ha: 8000,
    },
  });

  const arandano = await prisma.cultivo.upsert({
    where: { nombre: 'Arándano' },
    update: {},
    create: {
      nombre: 'Arándano',
      nombre_cientifico: 'Vaccinium corymbosum',
      tipo: 'Fruta',
      ciclo_dias: 365,
      rendimiento_promedio_kg_ha: 12000,
    },
  });

  const maiz = await prisma.cultivo.upsert({
    where: { nombre: 'Maíz Amarillo' },
    update: {},
    create: {
      nombre: 'Maíz Amarillo',
      nombre_cientifico: 'Zea mays',
      tipo: 'Cereal',
      ciclo_dias: 120,
      rendimiento_promedio_kg_ha: 6000,
    },
  });

  // Lotes
  const lote1 = await prisma.lote.upsert({
    where: { id: 'lote-001' },
    update: {},
    create: {
      id: 'lote-001',
      nombre: 'Lote A1 - Norte',
      finca_id: finca.id,
      area_ha: 12.5,
      tipo_suelo: 'Franco arenoso',
      ph_suelo: 6.8,
      materia_organica: 2.3,
    },
  });

  const lote2 = await prisma.lote.upsert({
    where: { id: 'lote-002' },
    update: {},
    create: {
      id: 'lote-002',
      nombre: 'Lote B2 - Sur',
      finca_id: finca.id,
      area_ha: 18.0,
      tipo_suelo: 'Franco arcilloso',
      ph_suelo: 7.1,
      materia_organica: 3.1,
    },
  });

  const lote3 = await prisma.lote.upsert({
    where: { id: 'lote-003' },
    update: {},
    create: {
      id: 'lote-003',
      nombre: 'Lote C3 - Centro',
      finca_id: finca.id,
      area_ha: 15.0,
      tipo_suelo: 'Franco',
      ph_suelo: 6.5,
      materia_organica: 2.8,
    },
  });

  // Temporadas activas
  const hoy = new Date();
  const inicioTemp = new Date(hoy);
  inicioTemp.setMonth(hoy.getMonth() - 3);
  const finTemp = new Date(hoy);
  finTemp.setMonth(hoy.getMonth() + 9);

  const temporada1 = await prisma.temporada.upsert({
    where: { id: 'temp-001' },
    update: {},
    create: {
      id: 'temp-001',
      lote_id: lote1.id,
      cultivo_id: esparrago.id,
      fecha_inicio: inicioTemp,
      fecha_fin_estimada: finTemp,
      estado: 'ACTIVA',
      rendimiento_estimado_kg_ha: 8500,
    },
  });

  const temporada2 = await prisma.temporada.upsert({
    where: { id: 'temp-002' },
    update: {},
    create: {
      id: 'temp-002',
      lote_id: lote2.id,
      cultivo_id: arandano.id,
      fecha_inicio: inicioTemp,
      fecha_fin_estimada: finTemp,
      estado: 'ACTIVA',
      rendimiento_estimado_kg_ha: 13000,
    },
  });

  // Sensores
  await prisma.sensor.createMany({
    skipDuplicates: true,
    data: [
      { id: 'sensor-001', lote_id: lote1.id, tipo: 'HUMEDAD_SUELO', modelo: 'Sentek EnviroSCAN', ubicacion: 'Zona norte' },
      { id: 'sensor-002', lote_id: lote1.id, tipo: 'TEMPERATURA', modelo: 'Davis Vantage Pro', ubicacion: 'Estación central' },
      { id: 'sensor-003', lote_id: lote2.id, tipo: 'HUMEDAD_SUELO', modelo: 'Sentek EnviroSCAN', ubicacion: 'Zona sur' },
      { id: 'sensor-004', lote_id: lote2.id, tipo: 'PH', modelo: 'Hanna HI98129', ubicacion: 'Punto medio' },
    ],
  });

  // Datos climáticos históricos (últimos 7 días)
  const climaticosData = [];
  for (let i = 7; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    fecha.setHours(0, 0, 0, 0);

    for (const loteId of [lote1.id, lote2.id, lote3.id]) {
      climaticosData.push({
        lote_id: loteId,
        fecha,
        temperatura_max: 22 + Math.random() * 8,
        temperatura_min: 14 + Math.random() * 4,
        humedad_promedio: 65 + Math.random() * 20,
        precipitacion_mm: Math.random() > 0.7 ? Math.random() * 5 : 0,
        velocidad_viento_ms: 2 + Math.random() * 3,
        fuente: 'OpenWeatherMap',
      });
    }
  }

  for (const dato of climaticosData) {
    await prisma.datoClimatico.upsert({
      where: { lote_id_fecha: { lote_id: dato.lote_id, fecha: dato.fecha } },
      update: dato,
      create: dato,
    });
  }

  // Eventos de riego últimos 30 días
  for (let i = 0; i < 15; i++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));

    await prisma.eventoRiego.create({
      data: {
        lote_id: [lote1.id, lote2.id, lote3.id][Math.floor(Math.random() * 3)],
        fecha_hora_inicio: fecha,
        duracion_minutos: 30 + Math.floor(Math.random() * 90),
        volumen_litros: 500 + Math.random() * 1500,
        tipo_riego: ['GOTEO', 'ASPERSION'][Math.floor(Math.random() * 2)] as any,
        automatico: Math.random() > 0.5,
      },
    });
  }

  // Predicciones
  await prisma.prediccionRendimiento.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'pred-001',
        temporada_id: temporada1.id,
        rendimiento_predicho_kg_ha: 8230,
        rendimiento_intervalo_inferior: 7800,
        rendimiento_intervalo_superior: 8660,
        precision_modelo: 0.87,
        metodo_ensemble: 'random_forest',
        factores_influyentes: ['humedad_suelo', 'temperatura', 'ph_suelo'],
      },
      {
        id: 'pred-002',
        temporada_id: temporada2.id,
        rendimiento_predicho_kg_ha: 12400,
        rendimiento_intervalo_inferior: 11800,
        rendimiento_intervalo_superior: 13100,
        precision_modelo: 0.91,
        metodo_ensemble: 'gradient_boosting',
        factores_influyentes: ['precipitacion', 'materia_organica', 'temperatura_min'],
      },
    ],
  });

  // Alertas
  await prisma.alerta.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'alerta-001',
        lote_id: lote1.id,
        tipo: 'humedad_baja',
        severidad: 'ALTA',
        mensaje: 'Humedad de suelo por debajo del umbral crítico (30%). Se recomienda riego inmediato.',
      },
      {
        id: 'alerta-002',
        lote_id: lote2.id,
        tipo: 'rendimiento_bajo',
        severidad: 'MEDIA',
        mensaje: 'Predicción de rendimiento 15% por debajo del estimado. Revisar condiciones de cultivo.',
      },
    ],
  });

  console.log('✅ Seed completado exitosamente');
  console.log(`   👤 Admin: admin@agro.pe / admin123`);
  console.log(`   👤 Operador: operador@agro.pe / operador123`);
  console.log(`   🏡 Finca: ${finca.nombre}`);
  console.log(`   🌱 Lotes: ${[lote1, lote2, lote3].map(l => l.nombre).join(', ')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
