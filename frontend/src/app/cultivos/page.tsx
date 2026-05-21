'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { cropsApi } from '@/lib/api';
import { Sprout, Plus, Search, Calendar, Leaf, Weight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CultivosPage() {
  const [cultivos, setCultivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '', nombre_cientifico: '', tipo: '', ciclo_dias: '', rendimiento_promedio_kg_ha: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await cropsApi.list();
      setCultivos(res.data);
    } catch {
      toast.error('Error cargando cultivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cropsApi.create({
        ...form,
        ciclo_dias: form.ciclo_dias ? parseInt(form.ciclo_dias) : undefined,
        rendimiento_promedio_kg_ha: form.rendimiento_promedio_kg_ha ? parseFloat(form.rendimiento_promedio_kg_ha) : undefined,
      });
      toast.success('Cultivo creado exitosamente');
      setShowForm(false);
      setForm({ nombre: '', nombre_cientifico: '', tipo: '', ciclo_dias: '', rendimiento_promedio_kg_ha: '' });
      loadData();
    } catch {
      toast.error('Error creando cultivo');
    }
  };

  const filteredCultivos = cultivos.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.tipo?.toLowerCase().includes(search.toLowerCase())
  );

  const tiposCultivo = ['Grano', 'Legumbre', 'Hortaliza', 'Fruta', 'Tuberculo', 'Otro'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Cultivos</h2>
            <p className="text-gray-500 text-sm">Administra los tipos de cultivos de tu finca</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo Cultivo
          </button>
        </div>

        {/* Formulario nuevo cultivo */}
        {showForm && (
          <div className="card border-primary-200">
            <h3 className="font-semibold text-gray-800 mb-4">Crear Nuevo Cultivo</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input className="input" placeholder="Maíz" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Científico</label>
                <input className="input" placeholder="Zea mays" value={form.nombre_cientifico}
                  onChange={e => setForm({ ...form, nombre_cientifico: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select className="input" value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="">Seleccionar</option>
                  {tiposCultivo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo (días)</label>
                <input className="input" type="number" placeholder="120" value={form.ciclo_dias}
                  onChange={e => setForm({ ...form, ciclo_dias: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rend. Promedio (kg/ha)</label>
                <input className="input" type="number" step="100" placeholder="8000" value={form.rendimiento_promedio_kg_ha}
                  onChange={e => setForm({ ...form, rendimiento_promedio_kg_ha: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                <button type="submit" className="btn-primary">Crear Cultivo</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Buscador */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar cultivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid de cultivos */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin text-primary-500 w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredCultivos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Sprout size={48} className="mx-auto mb-4 opacity-30" />
            <p>No se encontraron cultivos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCultivos.map((cultivo) => (
              <div key={cultivo.id} className="card hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-lg">
                      <Leaf size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cultivo.nombre}</h3>
                      {cultivo.nombre_cientifico && (
                        <p className="text-xs text-gray-400 italic">{cultivo.nombre_cientifico}</p>
                      )}
                    </div>
                  </div>
                  {cultivo.tipo && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                      {cultivo.tipo}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {cultivo.ciclo_dias && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Calendar size={12} />
                        Ciclo
                      </div>
                      <p className="text-lg font-bold text-gray-800">{cultivo.ciclo_dias} días</p>
                    </div>
                  )}
                  {cultivo.rendimiento_promedio_kg_ha && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Weight size={12} />
                        Rendimiento
                      </div>
                      <p className="text-lg font-bold text-gray-800">{cultivo.rendimiento_promedio_kg_ha} kg/ha</p>
                    </div>
                  )}
                </div>

                {cultivo.created_at && (
                  <p className="text-xs text-gray-400 mt-3">
                    Creado el {new Date(cultivo.created_at).toLocaleDateString('es-PE')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
