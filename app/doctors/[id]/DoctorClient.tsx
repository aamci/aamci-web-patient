'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

async function callApi(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  return fetch(url, init);
}

type Doctor = {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
  city?: string | null;
  doctorProfile?: {
    specialty?: string | null;
    hospitalType?: string | null;
    address?: string | null;
    city?: string | null;
    presentation?: string | null;
    formations?: string | null;
    experiences?: string | null;
  } | null;
};

type Slot = {
  id: string;
  start: string;
  end: string;
  status?: string;
};

export default function DoctorClient({ id }: { id: string }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // charger doctor + slots
  useEffect(() => {
    (async () => {
      try {
        // 1) doctor
        const base = getApiBase();
        const url = base ? `${base}/search/doctors` : `/search/doctors`;
        const r = await fetch(url, { cache: 'no-store' });
        const list = await r.json().catch(() => []);
        const found: Doctor | undefined = Array.isArray(list)
          ? list.find((d: any) => d.id === id)
          : undefined;

        if (found) {
          setDoctor(found);
        } else {
          // fallback si pas trouvé
          setDoctor({
            id,
            fullName: 'Dr. Démo',
            city: 'Paris',
            doctorProfile: {
              specialty: 'Médecine générale',
              hospitalType: 'Cabinet',
              address: 'Paris',
              presentation: 'Médecin généraliste.',
              formations: null,
              experiences: null,
            },
          });
        }

        // 2) slots réels
        const slotsUrl = base ? `${base}/slots?ownerId=${id}` : `/slots?ownerId=${id}`;
        const rs = await fetch(slotsUrl, { cache: 'no-store' });
        const slotsData = await rs.json().catch(() => []);
        // on accepte array direct ou {data:[]}
        const finalSlots: Slot[] = Array.isArray(slotsData)
          ? slotsData
          : slotsData?.data || [];
        setSlots(finalSlots);
      } catch (e) {
        // fallback doctor
        setDoctor({
          id,
          fullName: 'Dr. Démo',
          city: 'Paris',
          doctorProfile: {
            specialty: 'Médecine générale',
            hospitalType: 'Cabinet',
            address: 'Paris',
            presentation: 'Médecin généraliste.',
            formations: null,
            experiences: null,
          },
        });
      }
    })();
  }, [id]);

  async function book(slotId: string) {
    setErr(null);
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setErr('Veuillez vous connecter.');
        router.push('/auth/login');
        return;
      }
      const r = await callApi('/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotId,
          notes: doctor?.fullName ? `RDV avec ${doctor.fullName}` : 'RDV',
          // si tu as rendu dynamique le kindId, tu peux l’ajouter ici
        }),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        setErr(`Erreur ${r.status} ${txt}`);
        return;
      }
      const data = await r.json();
      router.push(`/doctors/${id}/success?aid=${data.id || ''}`);
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  if (!doctor) {
    return <div style={{ padding: '24px 0' }}>Chargement…</div>;
  }

  const prof = doctor.doctorProfile;

  return (
    <div style={{ display: 'grid', gap: 16, padding: '24px 0' }}>
      <a className="link" href="/doctors">
        ← Retour à la liste
      </a>

      {/* Carte doctor */}
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {doctor.avatarUrl ? (
            <img
              src={doctor.avatarUrl}
              alt={doctor.fullName || doctor.email || 'Doctor'}
              style={{ width: 56, height: 56, borderRadius: '999px', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '999px',
                background: '#d1e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              {(doctor.fullName || 'Dr')
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0 }}>
              {doctor.fullName || doctor.email || 'Docteur'}
            </h1>
            <div className="small" style={{ color: 'var(--muted)' }}>
              {prof?.specialty || 'Médecin'} • {prof?.city || doctor.city || '—'}{' '}
              {prof?.hospitalType ? `• ${prof.hospitalType}` : ''}
            </div>
          </div>
        </div>

        {prof?.presentation && <p style={{ marginTop: 4 }}>{prof.presentation}</p>}

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
          {prof?.address && (
            <div>
              <strong>Adresse :</strong> {prof.address}
            </div>
          )}
          {prof?.formations && (
            <div>
              <strong>Formations :</strong> {prof.formations}
            </div>
          )}
          {prof?.experiences && (
            <div>
              <strong>Expérience :</strong> {prof.experiences}
            </div>
          )}
        </div>
      </div>

      {/* Créneaux */}
      <div id="slots" className="card">
        <h3>Créneaux disponibles</h3>
          {slots.length === 0 ? (
            <div className="small">Aucun créneau disponible pour le moment.</div>
          ) : (
            <div className="row">
              {slots.map((s) => (
                <button key={s.id} className="btn outline" onClick={() => book(s.id)}>
                  {new Date(s.start).toLocaleString('fr-FR', {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                  })}
                </button>
              ))}
            </div>
          )}
        {err && (
          <div className="banner error" style={{ marginTop: 12 }}>
            {err}
          </div>
        )}
      </div>
    </div>
  );
}