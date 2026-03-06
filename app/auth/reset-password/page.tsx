'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!token) { setErr('Token manquant ou invalide.'); return; }
    if (!password) { setErr('Le mot de passe est obligatoire.'); return; }
    if (password.length < 8) { setErr('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setErr('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      const r = await callApi('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.message || 'Token invalide ou expiré.');
        return;
      }
      setSuccess(true);
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

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">Mot de passe réinitialisé !</h2>
            <p className="text-slate-300 text-sm mb-6">
              Votre mot de passe a été mis à jour avec succès.
            </p>
            <button
              onClick={() => router.push('/auth/login' as any)}
              className="w-full py-3 bg-teal-500 text-white rounded-lg font-semibold text-sm hover:bg-teal-600 transition-colors"
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-1">Nouveau mot de passe</h2>
            <p className="text-slate-300 text-sm mb-6">Choisissez un mot de passe sécurisé.</p>

            {!token && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-lg mb-4">
                Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nouveau mot de passe</label>
                <div className="flex gap-2">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="px-3 bg-white/10 border border-white/20 rounded-lg text-xs text-slate-300 hover:bg-white/20"
                  >
                    {showPwd ? 'Masquer' : 'Voir'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirmer</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
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
                disabled={loading || !token}
                className="w-full py-3 bg-teal-500 text-white rounded-lg font-semibold text-sm hover:bg-teal-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password' as any)}
                className="w-full py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Refaire une demande
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
