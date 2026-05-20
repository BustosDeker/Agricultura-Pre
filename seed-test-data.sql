-- Insertar usuario de prueba
INSERT INTO "Usuario" (id, nombre, email, password, rol, activo, created_at, updated_at)
VALUES ('usuario-001', 'Usuario Prueba', 'prueba@agro.pe', 'hashed_password', 'OPERADOR', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertar finca de prueba
INSERT INTO "Finca" (id, nombre, ubicacion, latitud, longitud, area_total_ha, propietario, usuario_id, created_at, updated_at)
VALUES ('finca-001', 'Finca Prueba', 'Arequipa', -16.3988, -71.5350, 100, 'Juan Pérez', 'usuario-001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertar lote de prueba
INSERT INTO "Lote" (id, nombre, finca_id, area_ha, tipo_suelo, ph_suelo, materia_organica, activo, created_at, updated_at)
VALUES ('lote-001', 'Lote 1', 'finca-001', 25, 'Franco', 7.2, 3.5, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertar cultivo de prueba
INSERT INTO "Cultivo" (id, nombre, nombre_cientifico, tipo, ciclo_dias, rendimiento_promedio_kg_ha, created_at)
VALUES ('cultivo-001', 'Papa', 'Solanum tuberosum', 'Tubérculo', 120, 20000, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertar temporada de prueba
INSERT INTO "Temporada" (id, lote_id, cultivo_id, fecha_inicio, fecha_fin_estimada, estado, rendimiento_estimado_kg_ha, created_at, updated_at)
VALUES ('temporada-001', 'lote-001', 'cultivo-001', '2026-04-01', '2026-08-01', 'ACTIVA', 18000, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertar evento de riego de prueba
INSERT INTO "EventoRiego" (id, lote_id, fecha_hora_inicio, duracion_minutos, volumen_litros, tipo_riego, automatico, created_at)
VALUES ('riego-001', 'lote-001', NOW(), 60, 5000, 'GOTEO', true, NOW())
ON CONFLICT (id) DO NOTHING;
