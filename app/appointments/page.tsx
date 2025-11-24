'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// Helper "safe" pour l’URL API
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

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

type Appointment = {
  id: string;
  status: AppointmentStatus;
  createdAt: string;
  notes?: string | null;
  slot?: {
    start?: string;
    end?: string;
    ownerType?: 'DOCTOR' | 'HOSPITAL';
    ownerId?: string;
  } | null;
  doctor?: { id: string; name: string } | null;
  hospital?: { id: string; name: string } | null;
};

export default function AppointmentsPage() {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  async function callApi(path: string, init?: RequestInit) {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) throw new Error('Non authentifié');

    const headers: Record<string, string> = {
      ...(init?.headers as any),
      Authorization: `Bearer ${token}`,
    };
    if (init?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const url = apiBase ? `${apiBase}${path}` : `/api-proxy${path}`;
    const r = await fetch(url, { ...init, headers, cache: 'no-store' });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${txt ? ` — ${txt}` : ''}`);
    }
    return r.json();
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await callApi('/appointments', { method: 'GET' });
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
      setItems((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: 'CANCELLED' } : a)),
      );
    } catch (e: any) {
      setErr(e?.message || 'Échec de l’annulation');
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.replace('/auth/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-slate-900">
          Mes rendez-vous
        </h1>
        <p className="text-sm text-slate-500">
          Retrouvez ici tous vos rendez-vous passés et à venir.
        </p>
      </header>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="card text-sm text-slate-600">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col gap-3">
          <div className="text-sm font-medium text-slate-900">
            Aucun rendez-vous pour le moment.
          </div>
          <p className="text-sm text-slate-500">
            Prenez votre premier rendez-vous en ligne avec un médecin ou un
            établissement partenaire.
          </p>
          <div>
            <a className="btn-primary" href="/doctors">
              Trouver un médecin
            </a>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((a) => {
            const start = a.slot?.start ? new Date(a.slot.start) : null;
            const end = a.slot?.end ? new Date(a.slot.end) : null;
            const who =
              a.doctor?.name ??
              a.hospital?.name ??
              (a.slot?.ownerType === 'DOCTOR'
                ? 'Consultation avec un médecin'
                : 'Consultation en établissement');

            return (
              <article
                key={a.id}
                className="card flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                {/* Bloc gauche : infos rendez-vous */}
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {who}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {start ? (
                        <>
                          {start.toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          •{' '}
                          {start.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {end &&
                            ` – ${end.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                        </>
                      ) : (
                        'Date à venir'
                      )}
                    </div>
                  </div>

                  {a.notes && (
                    <p className="text-xs text-slate-600">{a.notes}</p>
                  )}

                  <p className="text-[11px] text-slate-400">
                    Créé le{' '}
                    {new Date(a.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Bloc droit : statut + actions */}
                <div className="mt-2 flex flex-col items-start gap-2 sm:mt-0 sm:items-end">
                  <StatusBadge status={a.status} />

                  <div className="flex flex-wrap gap-2">
                    {a.slot?.ownerId && (
                      <a
                        className="btn-outline text-xs"
                        href={`/doctors/${a.slot.ownerId}`}
                      >
                        Voir la fiche
                      </a>
                    )}
                    {a.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        className="btn text-xs bg-rose-50 text-rose-700 hover:bg-rose-100"
                        disabled={actionId === a.id}
                        onClick={() => cancel(a.id)}
                      >
                        {actionId === a.id ? 'Annulation…' : 'Annuler'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<
    AppointmentStatus,
    { label: string; classes: string }
  > = {
    PENDING: {
      label: 'En attente',
      classes: 'bg-amber-50 text-amber-700',
    },
    CONFIRMED: {
      label: 'Confirmé',
      classes: 'bg-emerald-50 text-emerald-700',
    },
    CANCELLED: {
      label: 'Annulé',
      classes: 'bg-rose-50 text-rose-700',
    },
    NO_SHOW: {
      label: 'Non-présent',
      classes: 'bg-slate-100 text-slate-700',
    },
  };

  const v = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.classes}`}
    >
      {v.label}
    </span>
  );
}