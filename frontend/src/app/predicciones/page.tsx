'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { predictionsApi } from '@/lib/api';
import { TrendingUp, Loader, AlertCircle, CheckCircle, Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ErrorBar, Cell
} from 'recharts';
import toast from 'react-hot-toast';

export default function PrediccionesPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    predictionsApi.latest()
      .then(res => setPredictions(res.data))
      .catch(() => toast.error('Error cargando predicciones'))
      .finally(() => setLoading(false));
  }, []);

  const chartData = predictions.slice(0, 10).map(p => ({
    name: p.temporada?.lote?.nombre?.slice(0, 12) || 'Lote',
    rendimiento: p.rendimiento_predicho_kg_ha,
    error: [
      p.rendimiento_predicho_kg_ha - (p.rendimiento_intervalo_inferior || p.rendimiento_predicho_kg_ha),
      (p.rendimiento_intervalo_superior || p.rendimiento_predicho_kg_ha) - p.rendimiento_predicho_kg_ha,
    ],
    cultivo: p.temporada?.cultivo?.nombre,
  }));

  const avgRendimiento = predictions.length > 0
    ? predictions.reduce((s, p) => s + p.rendimiento_predicho_kg_ha, 0) / predictions.length
    : 0;

  const avgPrecision = predictions.length > 0
    ? predictions.filter(p => p.precision_modelo).reduce((s, p) => s + p.precision_modelo, 0) /
      predictions.filter(p => p.precision_modelo).length
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Predicciones de Rendimiento</h2>
          <p className="text-gray-500 text-sm">Resultados del ensemble de modelos ML</p>
        </div>

        {/* Resumen estadístico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Predicciones</p>
            <p className="text-3xl font-bold text-primary-600 mt-1">{predictions.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Rendimiento Promedio</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {Math.round(avgRendimiento).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">kg/ha</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Precisión Promedio</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {avgPrecision > 0 ? `${(avgPrecision * 100).toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>

        {/* Gráfico comparativo */}
        {chartData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">
              Comparativa de Rendimiento por Lote
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" kg/ha" width={80} />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString()} kg/ha`, 'Rendimiento']}
                />
                <Bar dataKey="rendimiento" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#22c55e' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Lista de predicciones */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="animate-spin text-primary-500 w-6 h-6" />
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
            <p>No hay predicciones generadas aún</p>
            <p className="text-sm mt-1">Ve a un lote con temporada activa para generar predicciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map((pred) => {
              const precision = pred.precision_modelo || 0;
              const isHigh = precision >= 0.85;
              const isMed = precision >= 0.7 && precision < 0.85;

              return (
                <div key={pred.id} className="card hover:border-primary-100 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary-50 p-2.5 rounded-xl shrink-0">
                        <TrendingUp size={20} className="text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {pred.temporada?.lote?.nombre || 'Lote desconocido'}
                          </p>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {pred.temporada?.cultivo?.nombre}
                          </span>
                          {isHigh && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} /> Alta precisión
                            </span>
                          )}
                          {isMed && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Info size={10} /> Precisión media
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Generado: {new Date(pred.fecha_prediccion).toLocaleString('es-PE')} ·{' '}
                          Método: {pred.metodo_ensemble?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      {/* Intervalo de confianza */}
                      {pred.rendimiento_intervalo_inferior && (
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-gray-400">Intervalo</p>
                          <p className="text-sm text-gray-600">
                            {pred.rendimiento_intervalo_inferior.toLocaleString()} –{' '}
                            {pred.rendimiento_intervalo_superior.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">kg/ha</p>
                        </div>
                      )}

                      {/* Precisión */}
                      <div className="text-center hidden sm:block">
                        <p className="text-xs text-gray-400">Precisión</p>
                        <p className={`text-sm font-bold ${isHigh ? 'text-green-600' : isMed ? 'text-amber-600' : 'text-gray-500'}`}>
                          {pred.precision_modelo ? `${(pred.precision_modelo * 100).toFixed(0)}%` : '—'}
                        </p>
                      </div>

                      {/* Rendimiento principal */}
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Rendimiento</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {pred.rendimiento_predicho_kg_ha.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">kg/ha</p>
                      </div>
                    </div>
                  </div>

                  {/* Factores influyentes */}
                  {pred.factores_influyentes && Array.isArray(pred.factores_influyentes) && pred.factores_influyentes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                      <span className="text-xs text-gray-400">Factores:</span>
                      {pred.factores_influyentes.map((f: any, i: number) => (
                        <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                          {typeof f === 'string' ? f : f.factor} {f.importancia ? `(${(f.importancia * 100).toFixed(0)}%)` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
