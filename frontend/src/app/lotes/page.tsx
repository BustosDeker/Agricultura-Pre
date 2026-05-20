'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { plotsApi, farmsApi } from '@/lib/api';
import { MapPin, Plus, ChevronRight, Sprout, Droplets, Loader, Search, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LotesPage() {
  const [lotes, setLotes] = useState<any[]>([]);
  const [fincas, setFincas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFinca, setSelectedFinca] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFincaForm, setShowFincaForm] = useState(false);
  const [loadingFinca, setLoadingFinca] = useState(false);
  const [form, setForm] = useState({
    nombre: '', finca_id: '', area_ha: '', tipo_suelo: '', ph_suelo: '', materia_organica: ''
  });
  const [fincaForm, setFincaForm] = useState({
    nombre: '', ubicacion: '', area_total_ha: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotesRes, fincasRes] = await Promise.all([
        plotsApi.list(selectedFinca || undefined),
        farmsApi.list(),
      ]);
      setLotes(lotesRes.data);
      setFincas(fincasRes.data);
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedFinca]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await plotsApi.create({
        ...form,
        area_ha: parseFloat(form.area_ha),
        ph_suelo: form.ph_suelo ? parseFloat(form.ph_suelo) : undefined,
        materia_organica: form.materia_organica ? parseFloat(form.materia_organica) : undefined,
      });
      toast.success('Lote creado exitosamente');
      setShowForm(false);
      setForm({ nombre: '', finca_id: '', area_ha: '', tipo_suelo: '', ph_suelo: '', materia_organica: '' });
      loadData();
    } catch {
      toast.error('Error creando lote');
    }
  };

  const handleCreateFinca = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingFinca(true);
    try {
      const newFinca = await farmsApi.create({
        nombre: fincaForm.nombre,
        ubicacion: fincaForm.ubicacion,
        area_total_ha: parseFloat(fincaForm.area_total_ha),
      });
      toast.success('Finca creada exitosamente');
      setShowFincaForm(false);
      setFincaForm({ nombre: '', ubicacion: '', area_total_ha: '' });
      await loadData();
      // Seleccionar la finca recién creada
      setSelectedFinca(newFinca.data.id);
    } catch {
      toast.error('Error creando finca');
    } finally {
      setLoadingFinca(false);
    }
  };

  const filteredLotes = lotes.filter(l =>
    l.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const tipoSuelos = ['Franco arenoso', 'Franco arcilloso', 'Franco', 'Arenoso', 'Arcilloso', 'Limoso'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h2>
            <p className="text-gray-500 text-sm">Administra las parcelas de tus fincas</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo Lote
          </button>
        </div>

        {/* Formulario nuevo lote */}
        {showForm && (
          <div className="card border-primary-200">
            <h3 className="font-semibold text-gray-800 mb-4">Crear Nuevo Lote</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input className="input" placeholder="Lote A1" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Finca *</label>
                <select className="input" value={form.finca_id}
                  onChange={e => setForm({ ...form, finca_id: e.target.value })} required>
                  <option value="">Seleccionar finca</option>
                  {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área (ha) *</label>
                <input className="input" type="number" step="0.1" placeholder="10.5" value={form.area_ha}
                  onChange={e => setForm({ ...form, area_ha: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de suelo</label>
                <select className="input" value={form.tipo_suelo}
                  onChange={e => setForm({ ...form, tipo_suelo: e.target.value })}>
                  <option value="">Seleccionar</option>
                  {tipoSuelos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">pH suelo</label>
                <input className="input" type="number" step="0.1" min="0" max="14" placeholder="6.8" value={form.ph_suelo}
                  onChange={e => setForm({ ...form, ph_suelo: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materia orgánica (%)</label>
                <input className="input" type="number" step="0.1" placeholder="2.5" value={form.materia_organica}
                  onChange={e => setForm({ ...form, materia_organica: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                <button type="submit" className="btn-primary">Crear Lote</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Buscar lote..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select className="input sm:w-48" value={selectedFinca} onChange={e => setSelectedFinca(e.target.value)}>
                <option value="">Todas las fincas</option>
                {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
              <button
                onClick={() => setShowFincaForm(!showFincaForm)}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Home size={16} />
                Nueva Finca
              </button>
            </div>
          </div>

          {/* Formulario crear finca */}
          {showFincaForm && (
            <div className="card border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Home size={18} className="text-blue-600" />
                  Crear Nueva Finca
                </h3>
                <button
                  onClick={() => setShowFincaForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateFinca} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    className="input"
                    placeholder="Finca Las Piedras"
                    value={fincaForm.nombre}
                    onChange={e => setFincaForm({ ...fincaForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <input
                    className="input"
                    placeholder="Ciudad, Región"
                    value={fincaForm.ubicacion}
                    onChange={e => setFincaForm({ ...fincaForm, ubicacion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área Total (ha) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    placeholder="50"
                    value={fincaForm.area_total_ha}
                    onChange={e => setFincaForm({ ...fincaForm, area_total_ha: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-3 flex gap-3">
                  <button
                    type="submit"
                    disabled={loadingFinca}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loadingFinca ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    Crear Finca
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFincaForm(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Grid de lotes */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="animate-spin text-primary-500 w-6 h-6" />
          </div>
        ) : filteredLotes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MapPin size={48} className="mx-auto mb-4 opacity-30" />
            <p>No se encontraron lotes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLotes.map((lote) => {
              const temporadaActiva = lote.temporadas?.[0];
              const countSensores = lote._count?.sensores || 0;
              const countRiegos = lote._count?.eventos_riego || 0;

              return (
                <Link key={lote.id} href={`/lotes/${lote.id}`}>
                  <div className="card hover:border-primary-200 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {lote.nombre}
                        </h3>
                        <p className="text-xs text-gray-400">{lote.finca?.nombre}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Área</p>
                        <p className="text-sm font-bold text-gray-800">{lote.area_ha} ha</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">pH suelo</p>
                        <p className="text-sm font-bold text-gray-800">{lote.ph_suelo || '—'}</p>
                      </div>
                    </div>

                    {temporadaActiva && (
                      <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2 mb-3">
                        <Sprout size={14} className="text-primary-600" />
                        <span className="text-xs text-primary-700 font-medium">
                          {temporadaActiva.cultivo?.nombre} — Activo
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        {countSensores} sensores
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets size={12} />
                        {countRiegos} riegos
                      </span>
                      {lote.tipo_suelo && (
                        <span className="bg-earth-50 text-earth-600 px-2 py-0.5 rounded-full">
                          {lote.tipo_suelo}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
