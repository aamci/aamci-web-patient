'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

export default function DoctorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') ?? '';
  const city = searchParams.get('city') ?? '';
  const apiBase = useMemo(() => getApiBase(), []);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const url = apiBase
        ? `${apiBase}/search/doctors?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`
        : `/search/doctors?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`;
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        setDoctors(Array.isArray(data) ? data : data?.data || []);
      } catch {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, q, city]);

  function onSubmit(formData: FormData) {
    const nxtQ = formData.get('q')?.toString() ?? '';
    const nxtCity = formData.get('city')?.toString() ?? '';
    const params = new URLSearchParams();
    if (nxtQ) params.set('q', nxtQ);
    if (nxtCity) params.set('city', nxtCity);
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: '24px 0' }}>
      <h1>Médecins</h1>

      <form
        action={onSubmit}
        style={{ display: 'grid', gridTemplateColumns: '1fr 200px 120px', gap: 10 }}
      >
        <input className="input" name="q" placeholder="Nom / spécialité" defaultValue={q} />
        <input className="input" name="city" placeholder="Ville" defaultValue={city} />
        <button className="btn primary" type="submit">
          Rechercher
        </button>
      </form>

      {loading ? (
        <div className="card">Chargement…</div>
      ) : (
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}
        >
          {!doctors.length && <div className="card">Aucun résultat pour cette recherche.</div>}
          {doctors.map((d) => {
            const prof = d.doctorProfile || {};
            const fullName = d.fullName || d.email || 'Docteur';
            const specialty = prof.specialty || 'Médecine générale';
            const cityName = prof.city || d.city || '—';
            const hospitalType = prof.hospitalType || '';

            return (
              <div key={d.id} className="card" style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {d.avatarUrl ? (
                    <img
                      src={d.avatarUrl}
                      alt={fullName}
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {fullName[0]?.toUpperCase() ?? 'D'}
                    </div>
                  )}
                  <div>
                    <strong>{fullName}</strong>
                    <div className="small" style={{ color: 'var(--muted)' }}>
                      {specialty} • {cityName} {hospitalType ? `• ${hospitalType}` : ''}
                    </div>
                  </div>
                </div>

                {prof.presentation && (
                  <p style={{ fontSize: 13, margin: '4px 0', color: '#555' }}>
                    {prof.presentation.length > 110
                      ? prof.presentation.slice(0, 110) + '…'
                      : prof.presentation}
                  </p>
                )}

                <div className="row" style={{ marginTop: 6, gap: 8 }}>
                  <Link className="btn outline" href={`/doctors/${d.id}`}>
                    Voir la fiche
                  </Link>
                  <Link className="btn primary" href={`/doctors/${d.id}#slots`}>
                    Prendre RDV
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}