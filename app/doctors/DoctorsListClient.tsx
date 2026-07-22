'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, Calendar, Video } from 'lucide-react';
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
  const availableIn = searchParams.get('availableIn') ?? '';
  const video = searchParams.get('video') ?? '';
  const apiBase = useMemo(() => getApiBase(), []);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      if (availableIn) params.set('availableIn', availableIn);
      if (video) params.set('video', video);
      const qs = params.toString();
      const url = apiBase
        ? `${apiBase}/search/doctors${qs ? `?${qs}` : ''}`
        : `/search/doctors${qs ? `?${qs}` : ''}`;
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
  }, [apiBase, q, city, availableIn, video]);

  function onSubmit(formData: FormData) {
    const nxtQ = formData.get('q')?.toString() ?? '';
    const nxtCity = formData.get('city')?.toString() ?? '';
    const params = new URLSearchParams();
    if (nxtQ) params.set('q', nxtQ);
    if (nxtCity) params.set('city', nxtCity);
    if (availableIn) params.set('availableIn', availableIn);
    if (video) params.set('video', video);
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}` as any);
  }

  function toggleFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
      // availability filters are mutually exclusive
      if (key === 'availableIn') {
        params.set('availableIn', value);
      }
    }
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}` as any);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Trouver un médecin</h1>

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
            className="w-full px-4 py-3 pl-11 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
        <div className="relative">
          <input
            name="city"
            placeholder="Ville"
            defaultValue={city}
            className="w-full px-4 py-3 pl-11 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-500 transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => toggleFilter('availableIn', '3')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            availableIn === '3'
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-teal-500 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Dispo dans 3 jours
        </button>
        <button
          onClick={() => toggleFilter('availableIn', '7')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            availableIn === '7'
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-teal-500 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Dispo dans 7 jours
        </button>
        <button
          onClick={() => toggleFilter('video', 'true')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            video === 'true'
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-500 hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Consultation vidéo
        </button>
        {(availableIn || video) && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('availableIn');
              params.delete('video');
              router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}` as any);
            }}
            className="px-4 py-2 rounded-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!doctors.length && (
            <div className="col-span-full text-center py-16 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucun médecin trouvé.</p>
              <p className="text-slate-500 text-sm mt-1">
                {availableIn || video
                  ? 'Essayez d\'élargir les filtres ou de choisir une autre période.'
                  : 'Essayez avec un autre nom ou une autre spécialité.'}
              </p>
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
