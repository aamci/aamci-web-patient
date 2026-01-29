'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  ArrowLeft,
  Send,
} from 'lucide-react';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification de votre email en cours...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    async function verifyEmail() {
      const apiBase = getApiBase();
      const url = apiBase
        ? `${apiBase}/auth/verify-email?token=${token}`
        : `/auth/verify-email?token=${token}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email vérifié avec succès !');

          // Refetch user session
          await login();

          // Redirect après 2 secondes
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Erreur lors de la vérification de l\'email.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erreur de connexion au serveur.');
      }
    }

    verifyEmail();
  }, [token, router, login]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Vérification en cours...
            </h2>
            <p className="text-slate-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-green-400 mb-2">
              Email vérifié !
            </h2>
            <p className="text-slate-400 mb-4">{message}</p>
            <p className="text-sm text-slate-500">
              Redirection vers l'accueil...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Erreur de vérification
            </h2>
            <p className="text-slate-400 mb-6">{message}</p>

            {message.includes('expired') && <ResendVerificationForm />}

            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white">Chargement...</h2>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function ResendVerificationForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const apiBase = getApiBase();
    const url = apiBase
      ? `${apiBase}/auth/resend-verification`
      : `/auth/resend-verification`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Email de vérification envoyé ! Vérifiez votre boîte de réception.',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Erreur lors de l\'envoi',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erreur de connexion au serveur',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
      <h3 className="text-sm font-medium text-white mb-4">
        Renvoyer l'email de vérification
      </h3>
      <form onSubmit={handleResend} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Renvoyer l'email
            </>
          )}
        </button>
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
