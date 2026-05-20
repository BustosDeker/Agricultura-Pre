'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/auth-store';
import { Leaf, Eye, EyeOff, Loader } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@agro.pe');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const { login, loading, user, init } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success(`¡Bienvenido!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/20 p-2 rounded-xl">
              <Leaf className="text-white w-8 h-8" />
            </div>
            <span className="text-white text-2xl font-bold">AgroSmart</span>
          </div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-6">
            Agricultura de<br />Precisión Inteligente
          </h1>
          <p className="text-primary-100 text-lg">
            Optimiza tus cultivos con predicciones de rendimiento, monitoreo de sensores y automatización de riego.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Precisión ML', value: '87%' },
            { label: 'Ahorro Agua', value: '30%' },
            { label: 'Lotes', value: '+500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-white text-2xl font-bold">{stat.value}</div>
              <div className="text-primary-200 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Leaf className="text-primary-600 w-8 h-8" />
            <span className="text-2xl font-bold text-primary-700">AgroSmart</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h2>
          <p className="text-gray-500 mb-8">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="correo@empresa.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin w-4 h-4" />
                  Ingresando...
                </>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-primary-50 rounded-lg text-sm text-primary-800">
            <p className="font-medium mb-1">Credenciales de prueba:</p>
            <p>Admin: admin@agro.pe / admin123</p>
            <p>Operador: operador@agro.pe / operador123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
