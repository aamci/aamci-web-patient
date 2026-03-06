'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

async function callApi(p: string, i?: RequestInit) {
  const b = getApiBase();
  return fetch(b ? `${b}${p}` : `/api${p}`, i);
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email) { setErr("L'email est obligatoire."); return; }
    setLoading(true);
    try {
      await callApi('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">💊</span>
          <span className="text-lg font-bold">Plateforme Santé</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-xl font-bold mb-2">Email envoyé !</h2>
            <p className="text-slate-300 text-sm mb-6">
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <button
              onClick={() => router.push('/auth/login' as any)}
              className="text-teal-400 text-sm hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-1">Mot de passe oublié ?</h2>
            <p className="text-slate-300 text-sm mb-6">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Votre email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@email.fr"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>

              {err && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-lg">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-500 text-white rounded-lg font-semibold text-sm hover:bg-teal-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/auth/login' as any)}
                className="w-full py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Retour à la connexion
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
