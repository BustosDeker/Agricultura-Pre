'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Leaf, Loader } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, init } = useAuthStore();

  useEffect(() => {
    init();
    const token = localStorage.getItem('access_token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50">
      <div className="text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm inline-flex flex-col items-center gap-4">
          <div className="bg-primary-100 p-4 rounded-2xl">
            <Leaf className="text-primary-600 w-10 h-10" />
          </div>
          <p className="text-gray-500 text-sm">Cargando AgroSmart...</p>
          <Loader className="animate-spin text-primary-500 w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
