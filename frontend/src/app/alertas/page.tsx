'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { alertsApi } from '@/lib/api';
import { Bell, Check, CheckCheck, Loader, AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SEVERIDAD_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  CRITICA: { icon: Zap, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  ALTA: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  MEDIA: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  BAJA: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'leidas'>('pendientes');
  const [markingAll, setMarkingAll] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const leida = filtro === 'pendientes' ? false : filtro === 'leidas' ? true : undefined;
      const res = await alertsApi.list(leida);
      setAlertas(res.data);
    } catch {
      toast.error('Error cargando alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filtro]);

  const handleMarkRead = async (id: string) => {
    try {
      await alertsApi.markRead(id);
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, leida: true } : a));
    } catch {
      toast.error('Error actualizando alerta');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await alertsApi.markAllRead();
      toast.success('Todas las alertas marcadas como leídas');
      loadData();
    } catch {
      toast.error('Error actualizando alertas');
    } finally {
      setMarkingAll(false);
    }
  };

  const pendientes = alertas.filter(a => !a.leida).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h2>
            <p className="text-gray-500 text-sm">
              {pendientes > 0 ? `${pendientes} alertas pendientes de revisión` : 'Sin alertas pendientes'}
            </p>
          </div>
          {pendientes > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {markingAll ? <Loader className="animate-spin w-4 h-4" /> : <CheckCheck size={16} />}
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {(['pendientes', 'todas', 'leidas'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filtro === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Lista de alertas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-primary-500 w-6 h-6" />
          </div>
        ) : alertas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell size={48} className="mx-auto mb-4 opacity-30" />
            <p>
              {filtro === 'pendientes'
                ? '¡Sin alertas pendientes! Todo está bajo control.'
                : 'No hay alertas en esta categoría'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map(alerta => {
              const config = SEVERIDAD_CONFIG[alerta.severidad] || SEVERIDAD_CONFIG.BAJA;
              const Icon = config.icon;

              return (
                <div
                  key={alerta.id}
                  className={`border rounded-xl p-4 transition-all ${
                    alerta.leida
                      ? 'bg-white border-gray-100 opacity-60'
                      : `${config.bg} ${config.border}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg shrink-0 ${alerta.leida ? 'bg-gray-100' : config.bg}`}>
                      <Icon size={18} className={alerta.leida ? 'text-gray-400' : config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wide ${alerta.leida ? 'text-gray-400' : config.color}`}>
                          {alerta.severidad}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {alerta.tipo.replace(/_/g, ' ')}
                        </span>
                        {alerta.lote && (
                          <span className="text-xs text-gray-500">
                            📍 {alerta.lote.nombre}
                            {alerta.lote.finca && ` · ${alerta.lote.finca.nombre}`}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${alerta.leida ? 'text-gray-400' : 'text-gray-800'}`}>
                        {alerta.mensaje}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(alerta.created_at), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                    {!alerta.leida && (
                      <button
                        onClick={() => handleMarkRead(alerta.id)}
                        className="shrink-0 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                        title="Marcar como leída"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
