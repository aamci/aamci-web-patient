'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function OAuthSuccessPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // Refetch user to get the current session
    login();

    // Redirect to home after a brief delay
    const timer = setTimeout(() => {
      router.push('/');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, login]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Connexion réussie !</h2>
        <p className="text-slate-400 mb-4">Redirection en cours...</p>
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Chargement de votre profil</span>
        </div>
      </div>
    </div>
  );
}
