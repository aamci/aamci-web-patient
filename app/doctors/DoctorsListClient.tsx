'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { DoctorCard, type Doctor } from '@/components/cards';

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

  const [doctors, setDoctors] = useState<Doctor[]>([]);
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

    const href = `/doctors${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(href as any);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Médecins</h1>

      {/* Search Form */}
      <form
        action={onSubmit}
        className="grid grid-cols-1 sm:grid-cols-[1fr_180px_120px] gap-3 mb-6"
      >
        <div className="relative">
          <input
            name="q"
            placeholder="Nom / spécialité"
            defaultValue={q}
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <div className="relative">
          <input
            name="city"
            placeholder="Ville"
            defaultValue={city}
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!doctors.length && (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun résultat pour cette recherche.</p>
            </div>
          )}
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              showFavorite={true}
              showPresentation={true}
              presentationMaxLength={100}
            />
          ))}
        </div>
      )}
    </div>
  );
}
