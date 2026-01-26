'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, Phone, Stethoscope } from 'lucide-react';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

interface Facility {
  id: string;
  name: string;
  type: 'CLINIC' | 'CHU' | 'POLYCLINIC' | 'CENTER';
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  _count?: {
    doctors: number;
  };
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  CLINIC: 'Clinique',
  CHU: 'CHU',
  POLYCLINIC: 'Polyclinique',
  CENTER: 'Centre Medical',
};

export default function FacilitiesListClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') ?? '';
  const city = searchParams.get('city') ?? '';
  const type = searchParams.get('type') ?? '';
  const apiBase = useMemo(() => getApiBase(), []);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      if (type) params.set('type', type);

      const url = apiBase
        ? `${apiBase}/facilities?${params.toString()}`
        : `/facilities?${params.toString()}`;

      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        setFacilities(Array.isArray(data) ? data : data?.data || []);
      } catch {
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, q, city, type]);

  function onSubmit(formData: FormData) {
    const nxtQ = formData.get('q')?.toString() ?? '';
    const nxtCity = formData.get('city')?.toString() ?? '';
    const nxtType = formData.get('type')?.toString() ?? '';
    const params = new URLSearchParams();
    if (nxtQ) params.set('q', nxtQ);
    if (nxtCity) params.set('city', nxtCity);
    if (nxtType) params.set('type', nxtType);

    const href = `/facilities${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(href as any);
  }

  return (
    <div className="grid gap-4 py-6">
      <h1>Etablissements de Sante</h1>

      <form
        action={onSubmit}
        className="grid gap-2.5 md:grid-cols-[1fr_200px_180px_120px]"
      >
        <input className="input" name="q" placeholder="Nom de l'etablissement" defaultValue={q} />
        <input className="input" name="city" placeholder="Ville" defaultValue={city} />
        <select className="input" name="type" defaultValue={type}>
          <option value="">Tous les types</option>
          <option value="CHU">CHU</option>
          <option value="CLINIC">Clinique</option>
          <option value="POLYCLINIC">Polyclinique</option>
          <option value="CENTER">Centre Medical</option>
        </select>
        <button className="btn primary" type="submit">
          Rechercher
        </button>
      </form>

      {loading ? (
        <div className="card">Chargement...</div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {!facilities.length && <div className="card">Aucun etablissement trouve.</div>}
          {facilities.map((facility) => {
            const typeLabel = FACILITY_TYPE_LABELS[facility.type] || facility.type;
            const doctorCount = facility._count?.doctors || 0;

            return (
              <Link
                key={facility.id}
                href={`/facilities/${facility.id}`}
                className="no-underline text-inherit"
              >
                <div
                  className="card grid gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="m-0 text-lg font-semibold">
                        {facility.name}
                      </h3>
                      <span className="inline-block mt-1.5 px-2.5 py-1 rounded text-xs font-medium bg-sky-100 text-sky-700">
                        {typeLabel}
                      </span>
                    </div>
                  </div>

                  {facility.description && (
                    <p className="m-0 text-sm text-gray-600 leading-relaxed">
                      {facility.description}
                    </p>
                  )}

                  <div className="grid gap-1.5 text-sm">
                    {facility.city && (
                      <div className="flex gap-2 items-center">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{facility.city}</span>
                      </div>
                    )}
                    {facility.phone && (
                      <div className="flex gap-2 items-center">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{facility.phone}</span>
                      </div>
                    )}
                    <div className="flex gap-2 items-center pt-2 border-t border-gray-100 mt-1">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sky-700">
                        {doctorCount} medecin{doctorCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
