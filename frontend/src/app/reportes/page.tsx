'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { reportsApi, farmsApi, plotsApi } from '@/lib/api';
import { FileText, Download, Plus, Loader, ChevronDown, ChevronRight, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPO_LABELS: Record<string, string> = {
  OPERACIONAL: 'Operacional',
  GESTION: 'Gestión',
  PREDICCION: 'Predicción',
  RIEGO: 'Riego',
};

const TIPO_COLORS: Record<string, string> = {
  OPERACIONAL: 'bg-blue-50 text-blue-700',
  GESTION: 'bg-purple-50 text-purple-700',
  PREDICCION: 'bg-primary-50 text-primary-700',
  RIEGO: 'bg-cyan-50 text-cyan-700',
};

export default function ReportesPage() {
  const [reportes, setReportes] = useState<any[]>([]);
  const [fincas, setFincas] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tipo: 'OPERACIONAL',
    lote_id: '',
    finca_id: '',
    fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedReporte, setSelectedReporte] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportesRes, fincasRes, lotesRes] = await Promise.all([
        reportsApi.list(),
        farmsApi.list(),
        plotsApi.list(),
      ]);
      setReportes(reportesRes.data);
      setFincas(fincasRes.data);
      setLotes(lotesRes.data);
    } catch {
      toast.error('Error cargando reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const isOperacional = form.tipo === 'OPERACIONAL';
      const fn = isOperacional ? reportsApi.generateOperational : reportsApi.generateManagement;
      await fn({
        tipo: form.tipo,
        lote_id: form.lote_id || undefined,
        finca_id: form.finca_id || undefined,
        fecha_inicio: form.fecha_inicio,
      });
      toast.success('Reporte generado exitosamente');
      setShowForm(false);
      loadData();
    } catch {
      toast.error('Error generando reporte');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: string, titulo: string) => {
    setDownloadingId(id);
    try {
      const res = await reportsApi.downloadPdf(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titulo.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch {
      toast.error('Error descargando PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
            <p className="text-gray-500 text-sm">Genera y descarga reportes operacionales y de gestión</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Generar Reporte
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="card border-primary-200">
            <h3 className="font-semibold text-gray-800 mb-4">Configurar Reporte</h3>
            <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte *</label>
                <select className="input" value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value })} required>
                  <option value="OPERACIONAL">Operacional (Riego diario)</option>
                  <option value="GESTION">Gestión (Rendimiento y eficiencia)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input type="date" className="input" value={form.fecha_inicio}
                  onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              {form.tipo === 'OPERACIONAL' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lote (opcional)</label>
                  <select className="input" value={form.lote_id}
                    onChange={e => setForm({ ...form, lote_id: e.target.value })}>
                    <option value="">Todos los lotes</option>
                    {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Finca (opcional)</label>
                  <select className="input" value={form.finca_id}
                    onChange={e => setForm({ ...form, finca_id: e.target.value })}>
                    <option value="">Todas las fincas</option>
                    {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={generating} className="btn-primary flex items-center gap-2">
                  {generating ? <Loader className="animate-spin w-4 h-4" /> : <FileText size={16} />}
                  {generating ? 'Generando...' : 'Generar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tipos de reporte info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/50">
            <h4 className="font-medium text-blue-800 mb-1">📊 Reporte Operacional</h4>
            <p className="text-xs text-blue-600">
              Incluye detalle de riegos diarios, monitoreo de cultivos y actividades realizadas por lote.
            </p>
          </div>
          <div className="border border-dashed border-purple-200 rounded-xl p-4 bg-purple-50/50">
            <h4 className="font-medium text-purple-800 mb-1">📈 Reporte de Gestión</h4>
            <p className="text-xs text-purple-600">
              Comparativas de rendimiento predicho, eficiencia hídrica y tendencias por campaña.
            </p>
          </div>
        </div>

        {/* Lista de reportes */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-primary-500 w-6 h-6" />
          </div>
        ) : reportes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>No hay reportes generados aún</p>
            <p className="text-sm mt-1">Usa el botón "Generar Reporte" para crear tu primer reporte</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reportes.map(reporte => {
              const isExpanded = expandedId === reporte.id;
              let reportData = null;
              try {
                reportData = reporte.contenido ? JSON.parse(reporte.contenido) : null;
              } catch {
                // Silenciar errores de parsing para reportes con datos antiguos/inválidos
                reportData = null;
              }

              return (
                <div key={reporte.id} className="border rounded-lg overflow-hidden bg-white">
                  {/* Encabezado del reporte */}
                  <div className="card py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-primary-50 p-2.5 rounded-xl shrink-0">
                        <FileText size={20} className="text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{reporte.titulo}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${TIPO_COLORS[reporte.tipo] || 'bg-gray-100 text-gray-600'}`}>
                            {TIPO_LABELS[reporte.tipo] || reporte.tipo}
                          </span>
                          {reportData?.resumen && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {reportData.resumen?.total_eventos || reportData.resumen?.total_predicciones || 0} registros
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(reporte.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : reporte.id)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                        Detalles
                      </button>
                      <button
                        onClick={() => handleDownload(reporte.id, reporte.titulo)}
                        disabled={downloadingId === reporte.id}
                        className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        {downloadingId === reporte.id ? (
                          <Loader className="animate-spin w-4 h-4" />
                        ) : (
                          <Download size={16} />
                        )}
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Contenido expandible con tabla */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      {!reportData ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No hay datos disponibles para este reporte</p>
                          <p className="text-sm mt-2">Intenta descargar el PDF o generar un nuevo reporte</p>
                        </div>
                      ) : reporte.tipo === 'OPERACIONAL' ? (
                        <div className="space-y-6">
                          {/* Resumen */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Resumen General</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Total de Eventos</p>
                                <p className="text-2xl font-bold text-primary-600">{reportData.resumen?.total_eventos || 0}</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Duración Total</p>
                                <p className="text-2xl font-bold text-blue-600">{reportData.resumen?.total_duracion_minutos || 0}</p>
                                <p className="text-xs text-gray-500">minutos</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Volumen Total</p>
                                <p className="text-2xl font-bold text-cyan-600">{reportData.resumen?.total_volumen_litros || 0}</p>
                                <p className="text-xs text-gray-500">litros</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Período</p>
                                <p className="text-sm font-semibold text-gray-900">{reportData.resumen?.total_eventos > 0 ? '30 días' : 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Tabla de eventos */}
                          {reportData.eventos && reportData.eventos.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-4">Detalle de Eventos de Riego</h4>
                              <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-primary-50 border-b border-gray-200">
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Fecha</th>
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Lote</th>
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Finca</th>
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Tipo</th>
                                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Duración (min)</th>
                                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Volumen (L)</th>
                                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Automático</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {reportData.eventos.map((evento: any, idx: number) => (
                                      <tr key={evento.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{format(new Date(evento.fecha), 'd/M HH:mm')}</td>
                                        <td className="px-4 py-3 text-gray-700">{evento.lote}</td>
                                        <td className="px-4 py-3 text-gray-700">{evento.finca}</td>
                                        <td className="px-4 py-3">
                                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{evento.tipo_riego}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{evento.duracion_minutos}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{evento.volumen_litros}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${evento.automatico ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {evento.automatico ? 'Sí' : 'No'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Resumen de gestión */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Resumen de Rendimientos</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Total de Predicciones</p>
                                <p className="text-2xl font-bold text-primary-600">{reportData.resumen?.total_predicciones || 0}</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Promedio</p>
                                <p className="text-2xl font-bold text-green-600">{reportData.resumen?.rendimiento_promedio_kg_ha || 0}</p>
                                <p className="text-xs text-gray-500">kg/ha</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Máximo</p>
                                <p className="text-2xl font-bold text-blue-600">{reportData.resumen?.rendimiento_maximo_kg_ha || 0}</p>
                                <p className="text-xs text-gray-500">kg/ha</p>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">Mínimo</p>
                                <p className="text-2xl font-bold text-orange-600">{reportData.resumen?.rendimiento_minimo_kg_ha || 0}</p>
                                <p className="text-xs text-gray-500">kg/ha</p>
                              </div>
                            </div>
                          </div>

                          {/* Tabla de predicciones */}
                          {reportData.predicciones && reportData.predicciones.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-4">Detalle de Predicciones</h4>
                              <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-purple-50 border-b border-gray-200">
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Cultivo</th>
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Lote</th>
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Finca</th>
                                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Rendimiento (kg/ha)</th>
                                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Intervalo</th>
                                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Precisión</th>
                                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Fecha</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {reportData.predicciones.map((pred: any, idx: number) => (
                                      <tr key={pred.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="px-4 py-3 font-medium text-gray-900">{pred.cultivo}</td>
                                        <td className="px-4 py-3 text-gray-700">{pred.lote}</td>
                                        <td className="px-4 py-3 text-gray-700">{pred.finca}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-semibold">{pred.rendimiento_predicho_kg_ha}</td>
                                        <td className="px-4 py-3 text-center text-xs">
                                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{pred.intervalo_inferior_kg_ha} - {pred.intervalo_superior_kg_ha}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{pred.precision_modelo}</td>
                                        <td className="px-4 py-3 text-gray-600 text-sm">{format(new Date(pred.fecha_prediccion), 'd/M/yyyy')}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
