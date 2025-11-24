'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try {
    new URL(b);
    return b;
  } catch {
    return null;
  }
}

export default function AccountPage() {
  const { token, updateUser } = useAuth();
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // champs du profil
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [birthdate, setBirthdate] = useState(''); // yyyy-mm-dd
  const [city, setCity] = useState('');

  // champs mot de passe
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  function buildUrl(path: string) {
    return apiBase ? `${apiBase}${path}` : `/api-proxy${path}`;
  }

  async function authedFetch(path: string, init?: RequestInit) {
    if (!token) throw new Error('Non authentifié');
    const headers: Record<string, string> = { ...(init?.headers as any) };
    headers['Authorization'] = `Bearer ${token}`;
    if (init?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const r = await fetch(buildUrl(path), {
      ...init,
      headers,
      cache: 'no-store',
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
    }
    return r;
  }

  // charger le profil au montage
  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await authedFetch('/me', { method: 'GET' });
        const data = await r.json();
        setEmail(data.email ?? '');
        setFullName(data.fullName ?? '');
        setAvatarUrl(data.avatarUrl ?? '');
        setPhone(data.phone ?? '');
        setSex(data.sex ?? '');
        setCity(data.city ?? '');
        if (data.birthdate) {
          setBirthdate(String(data.birthdate).substring(0, 10));
        }
      } catch (e: any) {
        setErr(e.message || 'Impossible de charger le compte');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    try {
      const r = await authedFetch('/me', {
        method: 'PUT',
        body: JSON.stringify({
          email,
          fullName,
          avatarUrl: avatarUrl || null,
          phone,
          sex: sex || null,
          birthdate: birthdate ? new Date(birthdate).toISOString() : null,
          city,
        }),
      });
      const updated = await r.json();
      updateUser({
        email: updated.email,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
      });
      setOk('Profil mis à jour ✅');
    } catch (e: any) {
      setErr(e.message || 'Mise à jour impossible');
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (!newPwd || newPwd.length < 6) {
      setErr('Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setErr('Les deux mots de passe ne correspondent pas.');
      return;
    }
    try {
      const r = await authedFetch('/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });
      await r.json();
      setOk('Mot de passe mis à jour ✅');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (e: any) {
      setErr(e.message || 'Impossible de changer le mot de passe');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="card text-sm text-slate-600">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">Mon compte</h1>
        <p className="text-sm text-slate-500">
          Mettez à jour vos informations personnelles et votre mot de passe.
        </p>
      </header>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}
      {ok && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {ok}
        </div>
      )}

      {/* Profil */}
      <form
        onSubmit={handleProfileSubmit}
        className="card space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Informations personnelles
            </h2>
            <p className="text-xs text-slate-500">
              Ces informations sont utilisées pour vos rendez-vous et vos
              documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AvatarLarge src={avatarUrl} name={fullName || email} />
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              URL de la photo
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-slate-400">
              L’upload direct arrivera plus tard. Pour l’instant, vous pouvez
              coller l’URL d’une image.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Nom complet
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Prénom Nom"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Téléphone
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Sexe
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
              >
                <option value="">—</option>
                <option value="MALE">Homme</option>
                <option value="FEMALE">Femme</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Date de naissance
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Ville
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Paris, Lyon…"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn primary text-sm">
            Enregistrer
          </button>
        </div>
      </form>

      {/* Mot de passe */}
      <form onSubmit={handlePasswordSubmit} className="card space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Mot de passe
          </h2>
          <p className="text-xs text-slate-500">
            Choisissez un mot de passe fort pour sécuriser votre compte.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Mot de passe actuel
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Nouveau mot de passe
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Confirmer le mot de passe
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn text-sm">
            Mettre à jour le mot de passe
          </button>
        </div>
      </form>
    </div>
  );
}

function AvatarLarge({ src, name }: { src?: string | null; name: string }) {
  const initials =
    name
      ?.split(' ')
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'U';

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className="h-14 w-14 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-200 text-base font-semibold text-slate-700">
      {initials}
    </div>
  );
}