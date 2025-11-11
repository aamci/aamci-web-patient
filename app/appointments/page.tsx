'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// Helper "safe" pour l’URL API (évite les throws si env manquant)
function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

// Types (adapte si besoin à ton schéma réel)
type Appointment = {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: string;
  notes?: string | null;
  slot?: {
    start?: string;
    end?: string;
    ownerType?: 'DOCTOR' | 'HOSPITAL';
    ownerId?: string;
  } | null;
  doctor?: { id: string; name: string } | null;   // si ton API hydrate
  hospital?: { id: string; name: string } | null; // si ton API hydrate
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const apiBase = useMemo(() => getApiBase(), []);

  async function callApi(path: string, init?: RequestInit) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) throw new Error('Non authentifié');
    const headers: Record<string, string> = { ...(init?.headers as any) };
    headers['Authorization'] = `Bearer ${token}`;
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';

    const url = apiBase ? `${apiBase}${path}` : `/api-proxy${path}`;
    const r = await fetch(url, { ...init, headers, cache: 'no-store' });
    if (!r.ok) {
      const txt = await r.text().catch(()=>'');
      throw new Error(`HTTP ${r.status}${txt ? ` — ${txt}` : ''}`);
    }
    return r.json();
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await callApi('/appointments', { method: 'GET' });
      // Ton API peut renvoyer {data:[...]} ou un tableau direct
      const list: Appointment[] = Array.isArray(data) ? data : data?.data || [];
      setItems(list);
    } catch (e: any) {
      if (e?.message?.includes('Non authentifié')) {
        router.replace('/auth/login');
      } else {
        setErr(e?.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }

  async function cancel(apptId: string) {
    setActionId(apptId);
    setErr(null);
    try {
      await callApi(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      // rafraîchit la liste localement sans recharger tout
      setItems(prev => prev.map(a => a.id === apptId ? { ...a, status: 'CANCELLED' } : a));
    } catch (e: any) {
      setErr(e?.message || 'Échec de l’annulation');
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    // pas de token → go login
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.replace('/auth/login');
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display:'grid', gap:16, padding:'24px 0' }}>
      <h1>Mes rendez-vous</h1>

      {err && <div className="banner error">{err}</div>}

      {loading ? (
        <div className="card">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="card">
          <strong>Aucun rendez-vous pour le moment.</strong>
          <div style={{ marginTop:8 }}>
            <a className="btn primary" href="/doctors">Prendre un rendez-vous</a>
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns:'1fr', gap:12 }}>
          {items.map((a) => {
            const start = a.slot?.start ? new Date(a.slot.start) : null;
            const end = a.slot?.end ? new Date(a.slot.end) : null;
            const who = a.doctor?.name ?? a.hospital?.name ?? (a.slot?.ownerType === 'DOCTOR' ? 'Docteur' : 'Hôpital');

            return (
              <div key={a.id} className="card" style={{ display:'grid', gap:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                  <div>
                    <strong>{who}</strong>
                    <div className="small" style={{ color:'var(--muted)' }}>
                      {start ? start.toLocaleString() : 'Date à venir'}
                      {end ? ` — ${end.toLocaleTimeString()}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {a.notes && <div className="small" style={{ color:'var(--muted)' }}>{a.notes}</div>}

                <div style={{ display:'flex', gap:8 }}>
                  <a className="btn outline" href={`/doctors/${a.slot?.ownerId ?? ''}`}>Voir la fiche</a>
                  {a.status !== 'CANCELLED' && (
                    <button
                      className="btn"
                      disabled={actionId === a.id}
                      onClick={() => cancel(a.id)}
                    >
                      {actionId === a.id ? 'Annulation…' : 'Annuler'}
                    </button>
                  )}
                </div>

                <div className="small" style={{ color:'var(--muted)' }}>
                  Créé le {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }:{ status: Appointment['status'] }) {
  const map: Record<Appointment['status'], { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'En attente',   bg: '#fff6e5', color: '#a15c00' },
    CONFIRMED: { label: 'Confirmé',     bg: '#e9f8ee', color: '#0f7b3b' },
    CANCELLED: { label: 'Annulé',       bg: '#f6e9eb', color: '#8a1023' },
    NO_SHOW:   { label: 'Non-présent',  bg: '#f0f3f7', color: '#3c4a5e' },
  };
  const s = map[status];
  return (
    <span style={{
      background:s.bg, color:s.color, padding:'4px 8px',
      borderRadius:999, fontSize:12, fontWeight:600
    }}>
      {s.label}
    </span>
  );
}