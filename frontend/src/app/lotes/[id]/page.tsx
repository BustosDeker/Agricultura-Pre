'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { plotsApi, irrigationApi, climateApi, predictionsApi } from '@/lib/api';
import {
  ArrowLeft, Sprout, Droplets, Thermometer, Wind, CloudRain,
  Activity, TrendingUp, Loader, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lote, setLote] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [climaData, setClimaData] = useState<any[]>([]);
  const [irrigStats, setIrrigStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [loteRes, climaRes] = await Promise.all([
        plotsApi.stats(id),
        climateApi.byLote(id, 14),
      ]);
      setLote(loteRes.data.lote);
      setStats(loteRes.data);
      setClimaData(climaRes.data.reverse());

      if (loteRes.data.lote) {
        try {
          const irrigRes = await irrigationApi.stats(id);
          setIrrigStats(irrigRes.data);
        } catch (_) {}
      }
    } catch {
      toast.error('Error cargando datos del lote');
    } finally {
      setLoading(false);
    }
  };

  const triggerPrediction = async () => {
    const temporadaActiva = lote?.temporadas?.find((t: any) => t.estado === 'ACTIVA');
    if (!temporadaActiva) {
      toast.error('No hay temporada activa en este lote');
      return;
    }
    setTriggering(true);
    try {
      await predictionsApi.trigger(temporadaActiva.id);
      toast.success('Predicción generada exitosamente');
      loadAll();
    } catch {
      toast.error('Error generando predicción');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-500 w-8 h-8" />
      </div>
    </AppLayout>
  );

  if (!lote) return (
    <AppLayout>
      <div className="text-center py-16 text-gray-400">
        <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
        <p>Lote no encontrado</p>
        <Link href="/lotes" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
          Volver a lotes
        </Link>
      </div>
    </AppLayout>
  );

  const temporadaActiva = lote.temporadas?.find((t: any) => t.estado === 'ACTIVA');
  const ultimaPrediccion = stats?.ultimaPrediccion;
  const ultimoClima = stats?.ultimoClima;
  const ultimaOptimizacion = stats?.ultimaOptimizacion;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{lote.nombre}</h2>
            <p className="text-gray-500 text-sm">{lote.finca?.nombre} · {lote.area_ha} ha</p>
          </div>
          <button
            onClick={triggerPrediction}
            disabled={triggering || !temporadaActiva}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggering ? <Loader className="animate-spin w-4 h-4" /> : <TrendingUp size={16} />}
            {triggering ? 'Generando...' : 'Nueva Predicción'}
          </button>
        </div>

        {/* Info básica */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Área', value: `${lote.area_ha} ha`, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'pH Suelo', value: lote.ph_suelo || '—', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Mat. Orgánica', value: lote.materia_organica ? `${lote.materia_organica}%` : '—', color: 'text-earth-600', bg: 'bg-earth-50' },
            { label: 'Tipo Suelo', value: lote.tipo_suelo || '—', color: 'text-gray-600', bg: 'bg-gray-50' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Temporada activa + Predicción */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temporada */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sprout size={18} className="text-primary-500" />
              Temporada Activa
            </h3>
            {temporadaActiva ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Cultivo</span>
                  <span className="text-sm font-medium text-gray-800">{temporadaActiva.cultivo?.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Inicio</span>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(temporadaActiva.fecha_inicio).toLocaleDateString('es-PE')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fin estimado</span>
                  <span className="text-sm font-medium text-gray-800">
                    {temporadaActiva.fecha_fin_estimada
                      ? new Date(temporadaActiva.fecha_fin_estimada).toLocaleDateString('es-PE')
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Rend. estimado</span>
                  <span className="text-sm font-bold text-primary-600">
                    {temporadaActiva.rendimiento_estimado_kg_ha?.toLocaleString() || '—'} kg/ha
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Sin temporada activa</p>
            )}
          </div>

          {/* Última predicción */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-500" />
              Última Predicción ML
            </h3>
            {ultimaPrediccion ? (
              <div className="space-y-3">
                <div className="text-center py-3 bg-primary-50 rounded-xl">
                  <p className="text-3xl font-bold text-primary-700">
                    {ultimaPrediccion.rendimiento_predicho_kg_ha?.toLocaleString()}
                  </p>
                  <p className="text-sm text-primary-500">kg/ha predichos</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Intervalo</span>
                  <span className="font-medium">
                    {ultimaPrediccion.rendimiento_intervalo_inferior?.toLocaleString()} —{' '}
                    {ultimaPrediccion.rendimiento_intervalo_superior?.toLocaleString()} kg/ha
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precisión</span>
                  <span className="font-medium text-green-600">
                    {ultimaPrediccion.precision_modelo
                      ? `${(ultimaPrediccion.precision_modelo * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Método</span>
                  <span className="font-medium capitalize">
                    {ultimaPrediccion.metodo_ensemble?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3">Sin predicciones aún</p>
                {temporadaActiva && (
                  <button onClick={triggerPrediction} className="btn-primary text-sm">
                    Generar primera predicción
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Gráfico clima */}
        {climaData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Thermometer size={18} className="text-orange-500" />
              Condiciones Climáticas (últimos 14 días)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={climaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}`,
                    name === 'temperatura_max' ? 'T° Max (°C)' : name === 'temperatura_min' ? 'T° Min (°C)' : 'Humedad (%)',
                  ]}
                />
                <Line type="monotone" dataKey="temperatura_max" stroke="#ef4444" strokeWidth={2} dot={false} name="temperatura_max" />
                <Line type="monotone" dataKey="temperatura_min" stroke="#3b82f6" strokeWidth={2} dot={false} name="temperatura_min" />
                <Line type="monotone" dataKey="humedad_promedio" stroke="#22c55e" strokeWidth={2} dot={false} name="humedad_promedio" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Riego y Optimización */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Droplets size={18} className="text-cyan-500" />
              Estadísticas de Riego (30 días)
            </h3>
            {irrigStats ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Eventos', value: irrigStats.total_eventos },
                  { label: 'Volumen Total', value: `${(irrigStats.volumen_total_litros / 1000).toFixed(1)}k L` },
                  { label: 'Duración Total', value: `${irrigStats.duracion_total_minutos} min` },
                  { label: 'Vol. Promedio', value: `${irrigStats.promedio_volumen_litros?.toFixed(0)} L` },
                ].map(item => (
                  <div key={item.label} className="bg-cyan-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-lg font-bold text-cyan-700">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos de riego</p>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              Optimización de Riego
            </h3>
            {ultimaOptimizacion ? (
              <div className="space-y-3">
                <div className="text-center py-3 bg-cyan-50 rounded-xl">
                  <p className="text-3xl font-bold text-cyan-700">
                    {ultimaOptimizacion.recomendacion_riego_mm?.toFixed(1)}
                  </p>
                  <p className="text-sm text-cyan-500">mm recomendados</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Necesidad estimada</span>
                  <span className="font-medium">{ultimaOptimizacion.necesidad_riego_mm?.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Humedad actual</span>
                  <span className="font-medium">{ultimaOptimizacion.humedad_actual?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium">
                    {new Date(ultimaOptimizacion.fecha).toLocaleDateString('es-PE')}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">
                Sin recomendaciones de riego aún.<br />
                <span className="text-xs">Se generan automáticamente via n8n cada 6h.</span>
              </p>
            )}
          </div>
        </div>

        {/* Sensores */}
        {lote.sensores?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Sensores del Lote</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lote.sensores.map((sensor: any) => (
                <div key={sensor.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {sensor.tipo.replace('_', ' ')}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${sensor.activo ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{sensor.modelo || 'Sin modelo'}</p>
                  <p className="text-xs text-gray-400 mt-1">{sensor.ubicacion || 'Ubicación no especificada'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
