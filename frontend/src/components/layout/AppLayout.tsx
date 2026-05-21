'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf, LayoutDashboard, MapPin, FileText, Bell, Settings,
  LogOut, Menu, X, ChevronDown, User, Droplets, TrendingUp, Sprout
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { alertsApi } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cultivos', href: '/cultivos', icon: Sprout },
  { name: 'Lotes', href: '/lotes', icon: MapPin },
  { name: 'Predicciones', href: '/predicciones', icon: TrendingUp },
  { name: 'Riego', href: '/riego', icon: Droplets },
  { name: 'Reportes', href: '/reportes', icon: FileText },
  { name: 'Alertas', href: '/alertas', icon: Bell },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    // Cargar conteo de alertas
    alertsApi.unreadCount().then((res) => setUnreadAlerts(res.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-sm
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:flex lg:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-primary-100 p-1.5 rounded-lg">
              <Leaf className="text-primary-600 w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900">AgroSmart</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon size={18} />
                {item.name}
                {item.name === 'Alertas' && unreadAlerts > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary-100 rounded-full p-2">
              <User size={16} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-gray-800 font-semibold text-lg flex-1">
            {navigation.find(n => pathname.startsWith(n.href))?.name || 'Dashboard'}
          </h1>
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full font-medium">
            {user.rol}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
