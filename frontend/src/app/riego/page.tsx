'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { irrigationApi, plotsApi } from '@/lib/api';
import { Droplets, Plus, Loader, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPO_RIEGO_LABELS: Record<string, string> = {
  GOTEO: 'Goteo',
  ASPERSION: 'Aspersión',
  INUNDACION: 'Inundación',
  SURCOS: 'Surcos',
};

const TIPO_RIEGO_COLORS: Record<string, string> = {
  GOTEO: 'bg-blue-100 text-blue-700',
  ASPERSION: 'bg-cyan-100 text-cyan-700',
  INUNDACION: 'bg-indigo-100 text-indigo-700',
  SURCOS: 'bg-teal-100 text-teal-700',
};

export default function RiegoPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLote, setSelectedLote] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    lote_id: '',
    fecha_hora_inicio: new Date().toISOString().slice(0, 16),
    duracion_minutos: '',
    volumen_litros: '',
    tipo_riego: 'GOTEO',
    automatico: false,
    notas: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventosRes, lotesRes] = await Promise.all([
        irrigationApi.list(selectedLote || undefined, 100),
        plotsApi.list(),
      ]);
      setEventos(eventosRes.data);
      setLotes(lotesRes.data);
    } catch {
      toast.error('Error cargando datos de riego');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedLote]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await irrigationApi.create({
        ...form,
        duracion_minutos: form.duracion_minutos ? parseInt(form.duracion_minutos) : undefined,
        volumen_litros: form.volumen_litros ? parseFloat(form.volumen_litros) : undefined,
      });
      toast.success('Evento de riego registrado');
      setShowForm(false);
      setForm({ lote_id: '', fecha_hora_inicio: new Date().toISOString().slice(0, 16), duracion_minutos: '', volumen_litros: '', tipo_riego: 'GOTEO', automatico: false, notas: '' });
      loadData();
    } catch {
      toast.error('Error registrando evento de riego');
    }
  };

  // Agrupar eventos por día para el gráfico
  const chartData = (() => {
    const map: Record<string, number> = {};
    eventos.slice(0, 30).forEach(e => {
      const dia = new Date(e.fecha_hora_inicio).toISOString().split('T')[0];
      map[dia] = (map[dia] || 0) + (e.volumen_litros || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, volumen]) => ({ fecha: fecha.slice(5), volumen }));
  })();

  const totalVolumen = eventos.reduce((s, e) => s + (e.volumen_litros || 0), 0);
  const totalDuracion = eventos.reduce((s, e) => s + (e.duracion_minutos || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Riego</h2>
            <p className="text-gray-500 text-sm">Registro y seguimiento de eventos de riego</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Registrar Riego
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Eventos</p>
            <p className="text-3xl font-bold text-cyan-600 mt-1">{eventos.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Volumen Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {(totalVolumen / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-400">litros</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Duración Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {Math.floor(totalDuracion / 60)}h {totalDuracion % 60}m
            </p>
          </div>
        </div>

        {/* Gráfico */}
        {chartData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Volumen Diario de Riego</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" L" />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()} L`, 'Volumen']} />
                <Bar dataKey="volumen" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Formulario nuevo evento */}
        {showForm && (
          <div className="card border-cyan-200">
            <h3 className="font-semibold text-gray-800 mb-4">Registrar Evento de Riego</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                <select className="input" value={form.lote_id}
                  onChange={e => setForm({ ...form, lote_id: e.target.value })} required>
                  <option value="">Seleccionar lote</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
                <input type="datetime-local" className="input" value={form.fecha_hora_inicio}
                  onChange={e => setForm({ ...form, fecha_hora_inicio: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de riego</label>
                <select className="input" value={form.tipo_riego}
                  onChange={e => setForm({ ...form, tipo_riego: e.target.value })}>
                  {Object.entries(TIPO_RIEGO_LABELS).map(([k, v]) =>
                    <option key={k} value={k}>{v}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
                <input type="number" className="input" placeholder="60" value={form.duracion_minutos}
                  onChange={e => setForm({ ...form, duracion_minutos: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volumen (litros)</label>
                <input type="number" step="0.1" className="input" placeholder="500" value={form.volumen_litros}
                  onChange={e => setForm({ ...form, volumen_litros: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <input className="input" placeholder="Observaciones..." value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.automatico}
                    onChange={e => setForm({ ...form, automatico: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600" />
                  Riego automático
                </label>
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                <button type="submit" className="btn-primary">Registrar</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Filtro por lote */}
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select className="input w-48" value={selectedLote} onChange={e => setSelectedLote(e.target.value)}>
            <option value="">Todos los lotes</option>
            {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </div>

        {/* Lista de eventos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-primary-500 w-6 h-6" />
          </div>
        ) : eventos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Droplets size={48} className="mx-auto mb-4 opacity-30" />
            <p>No hay eventos de riego registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {eventos.map(evento => (
              <div key={evento.id} className="card py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-cyan-50 p-2 rounded-lg shrink-0">
                      <Droplets size={18} className="text-cyan-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{evento.lote?.nombre}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TIPO_RIEGO_COLORS[evento.tipo_riego] || 'bg-gray-100 text-gray-600'}`}>
                          {TIPO_RIEGO_LABELS[evento.tipo_riego] || evento.tipo_riego}
                        </span>
                        {evento.automatico && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Auto</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(evento.fecha_hora_inicio), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                        {evento.lote?.finca && ` · ${evento.lote.finca.nombre}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm shrink-0">
                    {evento.duracion_minutos && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Duración</p>
                        <p className="font-semibold text-gray-800">{evento.duracion_minutos} min</p>
                      </div>
                    )}
                    {evento.volumen_litros && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Volumen</p>
                        <p className="font-semibold text-cyan-600">{evento.volumen_litros.toLocaleString()} L</p>
                      </div>
                    )}
                  </div>
                </div>
                {evento.notas && (
                  <p className="text-xs text-gray-400 mt-2 ml-14">{evento.notas}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
