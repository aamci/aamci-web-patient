'use client';
import { useEffect, useMemo, useState } from 'react';

type Slot = {
  id: string;
  start: string; // ISO
  end: string;   // ISO
  status?: string;
  appointments?: Array<any>; // si ton API les renvoie
};

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

const DAYS_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function SlotsGridForPatient({ doctorId }: { doctorId: string }) {
  const apiBase = useMemo(() => getApiBase(), []);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // charger les créneaux du doctor
  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const url = apiBase
          ? `${apiBase}/slots?ownerId=${doctorId}`
          : `/slots?ownerId=${doctorId}`;
        const r = await fetch(url, { cache: 'no-store' });
        const data = await r.json().catch(() => []);
        const list: Slot[] = Array.isArray(data) ? data : data?.data || [];

        // on garde seulement les créneaux actifs et non pris
        const filtered = list.filter((s) => {
          const taken = Array.isArray(s.appointments) && s.appointments.length > 0;
          const notActive = s.status && s.status !== 'ACTIVE';
          return !taken && !notActive;
        });

        setSlots(filtered);
      } catch (e: any) {
        setErr(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, doctorId]);

  // on extrait les jours et les heures
  const { days, hours, grid } = useMemo(() => {
    if (!slots.length) return { days: [], hours: [], grid: {} as Record<string, Slot> };

    // on limite à 7 jours max
    const byDay = new Map<string, Slot[]>();
    for (const s of slots) {
      const d = new Date(s.start);
      const dayKey = d.toISOString().substring(0, 10); // YYYY-MM-DD
      if (!byDay.has(dayKey)) byDay.set(dayKey, []);
      byDay.get(dayKey)!.push(s);
    }

    const dayKeys = Array.from(byDay.keys()).sort(); // tri chrono

    // heures possibles
    const hourSet = new Set<string>();
    const cellMap: Record<string, Slot> = {};
    for (const dayKey of dayKeys) {
      const daySlots = byDay.get(dayKey)!;
      for (const s of daySlots) {
        const d = new Date(s.start);
        const hourKey = d.toTimeString().substring(0, 5); // HH:MM
        hourSet.add(hourKey);
        cellMap[`${dayKey}__${hourKey}`] = s;
      }
    }

    const hourList = Array.from(hourSet).sort(); // "07:00", "07:30", ...

    return { days: dayKeys, hours: hourList, grid: cellMap };
  }, [slots]);

  async function confirmBooking() {
    if (!selected) return;
    setBooking(true);
    setErr(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setErr('Veuillez vous connecter pour réserver.');
        setBooking(false);
        return;
      }
      const r = await fetch(
        apiBase ? `${apiBase}/appointments` : '/appointments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slotId: selected.id,
            notes: 'Prise de rendez-vous depuis le planning',
          }),
        },
      );
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(t || `HTTP ${r.status}`);
      }
      const d = await r.json().catch(() => null);
      setSuccess('Rendez-vous réservé ✔');
      // on enlève le créneau de la liste
      setSlots((prev) => prev.filter((s) => s.id !== selected.id));
      setSelected(null);
    } catch (e: any) {
      setErr(e?.message || 'Réservation impossible');
    } finally {
      setBooking(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h3>Créneaux disponibles</h3>
      {err && <div className="banner error">{err}</div>}
      {success && <div className="banner success">{success}</div>}
      {loading ? (
        <div className="card">Chargement…</div>
      ) : !days.length ? (
        <div className="card">Aucun créneau disponible pour le moment.</div>
      ) : (
        <div
          className="card"
          style={{
            overflowX: 'auto',
            maxHeight: 420,
          }}
        >
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 650,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    fontSize: 12,
                    color: '#6b7280',
                    background: '#f9fafb',
                    position: 'sticky',
                    left: 0,
                  }}
                >
                  Heure
                </th>
                {days.map((dayKey, idx) => {
                  const d = new Date(dayKey);
                  const labelDay = DAYS_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
                  return (
                    <th
                      key={dayKey}
                      style={{
                        padding: '6px 8px',
                        fontSize: 12,
                        color: '#6b7280',
                        background: '#f9fafb',
                        textAlign: 'left',
                      }}
                    >
                      {labelDay} {d.getDate()}/{d.getMonth() + 1}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => (
                <tr key={h}>
                  <td
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      color: '#374151',
                      background: '#fff',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#fff',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {h}
                  </td>
                  {days.map((dayKey) => {
                    const slot = grid[`${dayKey}__${h}`];
                    return (
                      <td
                        key={dayKey}
                        style={{
                          padding: 4,
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        {slot ? (
                          <button
                            onClick={() => setSelected(slot)}
                            className="btn small"
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                            }}
                          >
                            Réserver
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* petit modal de confirmation */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 360, width: '100%', display: 'grid', gap: 12 }}
          >
            <h4>Confirmer le rendez-vous ?</h4>
            <p style={{ fontSize: 13 }}>
              {new Date(selected.start).toLocaleString('fr-FR', {
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'short',
              })}
            </p>
            {err && <div className="banner error">{err}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn outline" onClick={() => setSelected(null)} disabled={booking}>
                Annuler
              </button>
              <button className="btn primary" onClick={confirmBooking} disabled={booking}>
                {booking ? '...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}