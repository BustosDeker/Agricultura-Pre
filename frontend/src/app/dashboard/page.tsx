'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { dashboardApi, workflowsApi } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Droplets, AlertTriangle, MapPin, Leaf, Activity,
  ArrowUpRight, ArrowDownRight, Loader, Play, Cloud, Sprout
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardData {
  resumen: {
    total_fincas: number;
    total_lotes: number;
    temporadas_activas: number;
    alertas_pendientes: number;
    rendimiento_promedio_kg_ha: number;
    volumen_riego_30d_litros: number;
    total_eventos_riego_30d: number;
  };
  ultimas_predicciones: any[];
  ultimos_riegos: any[];
  clima_reciente: any[];
}

interface ChartData {
  riego_diario: { fecha: string; volumen: number }[];
  predicciones_por_lote: { lote: string; cultivo: string; rendimiento: number; fecha: string }[];
  alertas_por_tipo: { tipo: string; cantidad: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningClimate, setRunningClimate] = useState(false);
  const [runningYield, setRunningYield] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());

  // Función para refrescar datos
  const fetchData = async () => {
    try {
      const [sum, ch] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.charts()
      ]);
      setData(sum.data);
      setCharts(ch.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      // Silenciar error de red para evitar overlay de Next.js
      // El error se loguea solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Dashboard: Error de conexión con backend (esperado si backend no está corriendo)');
      }
    }
  };

  const handleRunClimate = async () => {
    setRunningClimate(true);
    try {
      const res = await workflowsApi.triggerClimate();
      toast.success(res.data.message || 'Workflow de clima ejecutado');
      
      // Refrescar datos después de 3 segundos (tiempo para que n8n procese)
      setTimeout(() => {
        fetchData();
        toast.success('Datos actualizados');
      }, 3000);
    } catch {
      toast.error('Error ejecutando workflow de clima');
    } finally {
      setRunningClimate(false);
    }
  };

  const handleRunYield = async () => {
    setRunningYield(true);
    try {
      const res = await workflowsApi.triggerYield();
      toast.success(res.data.message || 'Workflow de prediccion ejecutado');
      
      // Refrescar datos después de 3 segundos (tiempo para que n8n procese)
      setTimeout(() => {
        fetchData();
        toast.success('Datos actualizados');
      }, 3000);
    } catch {
      toast.error('Error ejecutando workflow de prediccion');
    } finally {
      setRunningYield(false);
    }
  };

  // Cargar datos iniciales y configurar refresh automático cada 15 segundos
  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));

    // Refrescar automáticamente cada 15 segundos
    const interval = setInterval(() => {
      fetchData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-500 w-8 h-8" />
      </div>
    </AppLayout>
  );

  const stats = data?.resumen;

  const metricCards = [
    {
      label: 'Lotes Activos',
      value: stats?.total_lotes || 0,
      sub: `${stats?.temporadas_activas || 0} temporadas`,
      icon: MapPin,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: '+2',
      up: true,
    },
    {
      label: 'Rendimiento Promedio',
      value: `${(stats?.rendimiento_promedio_kg_ha || 0).toLocaleString()}`,
      sub: 'kg/ha predichos',
      icon: TrendingUp,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      trend: '+5.2%',
      up: true,
    },
    {
      label: 'Volumen Riego (30d)',
      value: `${Math.round((stats?.volumen_riego_30d_litros || 0) / 1000)}k L`,
      sub: `${stats?.total_eventos_riego_30d || 0} eventos`,
      icon: Droplets,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      trend: '-3.1%',
      up: false,
    },
    {
      label: 'Alertas Pendientes',
      value: stats?.alertas_pendientes || 0,
      sub: 'sin leer',
      icon: AlertTriangle,
      color: stats?.alertas_pendientes > 0 ? 'text-red-600' : 'text-gray-400',
      bg: stats?.alertas_pendientes > 0 ? 'bg-red-50' : 'bg-gray-50',
      trend: stats?.alertas_pendientes > 0 ? 'Atención' : 'OK',
      up: false,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
            <p className="text-gray-500 text-sm mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} · Actualizado: {lastUpdate}
            </p>
          </div>
          
          {/* Botones de Workflows */}
          <div className="flex gap-2">
            <button
              onClick={handleRunClimate}
              disabled={runningClimate}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {runningClimate ? (
                <Loader className="animate-spin w-4 h-4" />
              ) : (
                <Cloud size={16} className="text-blue-500" />
              )}
              {runningClimate ? 'Ejecutando...' : 'Clima'}
            </button>
            <button
              onClick={handleRunYield}
              disabled={runningYield}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {runningYield ? (
                <Loader className="animate-spin w-4 h-4" />
              ) : (
                <Sprout size={16} className="text-green-500" />
              )}
              {runningYield ? 'Ejecutando...' : 'Prediccion'}
            </button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div key={card.label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                </div>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <card.icon size={20} className={card.color} />
                </div>
              </div>
              <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${card.up ? 'text-primary-600' : 'text-red-500'}`}>
                {card.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {card.trend} vs mes anterior
              </div>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Riego diario */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Volumen de Riego (últimos 30 días)</h3>
            {charts?.riego_diario && charts.riego_diario.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts.riego_diario}>
                  <defs>
                    <linearGradient id="gradientRiego" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} L`, 'Volumen']} />
                  <Area type="monotone" dataKey="volumen" stroke="#22c55e" fill="url(#gradientRiego)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Sin datos de riego disponibles
              </div>
            )}
          </div>

          {/* Predicciones por lote */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Rendimiento Predicho por Lote</h3>
            {charts?.predicciones_por_lote && charts.predicciones_por_lote.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.predicciones_por_lote.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="lote" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg/ha`, 'Rendimiento']} />
                  <Bar dataKey="rendimiento" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Sin predicciones disponibles
              </div>
            )}
          </div>
        </div>

        {/* Últimas actividades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimas predicciones */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Últimas Predicciones</h3>
            <div className="space-y-3">
              {data?.ultimas_predicciones && data.ultimas_predicciones.length > 0 ? (
                data.ultimas_predicciones.map((pred: any) => (
                  <div key={pred.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 p-1.5 rounded-lg">
                        <Leaf size={14} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {pred.temporada?.lote?.nombre || 'Lote'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pred.temporada?.cultivo?.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">
                        {pred.rendimiento_predicho_kg_ha?.toLocaleString()} kg/ha
                      </p>
                      <p className="text-xs text-gray-400">
                        {pred.precision_modelo ? `${(pred.precision_modelo * 100).toFixed(0)}% preciso` : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">
                  Sin predicciones recientes
                </p>
              )}
            </div>
          </div>

          {/* Clima reciente */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Condiciones Climáticas Recientes</h3>
            <div className="space-y-3">
              {data?.clima_reciente && data.clima_reciente.length > 0 ? (
                // Agrupar por lote y tomar el más reciente de cada uno
                Object.values(
                  data.clima_reciente.reduce((acc: any, clima: any) => {
                    if (!acc[clima.lote_id] || new Date(clima.fecha) > new Date(acc[clima.lote_id].fecha)) {
                      acc[clima.lote_id] = clima;
                    }
                    return acc;
                  }, {})
                ).slice(0, 5).map((clima: any) => (
                  <div key={clima.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <Activity size={14} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {clima.lote?.nombre || `Lote ${clima.lote_id?.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(clima.fecha).toLocaleDateString('es-PE')} {new Date(clima.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {clima.temperatura_max?.toFixed(1)}°C max / {clima.temperatura_min?.toFixed(1)}°C min
                      </p>
                      <p className="text-xs text-gray-400">
                        Hum: {clima.humedad_promedio?.toFixed(0)}% | Viento: {clima.velocidad_viento_ms?.toFixed(1)} m/s
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">
                  Sin datos climáticos recientes. Ejecuta el workflow de clima para obtener datos actualizados.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
