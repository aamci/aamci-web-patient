'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  Stethoscope,
  Building2,
  Search,
  X,
  Loader2,
  ChevronRight,
  Hospital,
  Building,
  Home,
  Landmark,
} from 'lucide-react';

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

const FACILITY_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  CLINIC: {
    label: 'Clinique',
    icon: <Home className="w-4 h-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  CHU: {
    label: 'CHU',
    icon: <Hospital className="w-4 h-4" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
  POLYCLINIC: {
    label: 'Polyclinique',
    icon: <Building className="w-4 h-4" />,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
  },
  CENTER: {
    label: 'Centre Médical',
    icon: <Landmark className="w-4 h-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
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
  const [searchInput, setSearchInput] = useState(q);
  const [cityInput, setCityInput] = useState(city);
  const [typeInput, setTypeInput] = useState(type);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('q', searchInput);
    if (cityInput) params.set('city', cityInput);
    if (typeInput) params.set('type', typeInput);

    const href = `/facilities${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(href as any);
  }

  function clearFilters() {
    setSearchInput('');
    setCityInput('');
    setTypeInput('');
    router.push('/facilities');
  }

  const hasFilters = q || city || type;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-teal-500/10 rounded-xl">
            <Building2 className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Établissements de Santé</h1>
        </div>
        <p className="text-slate-400 ml-14">Trouvez des cliniques, hôpitaux et centres médicaux près de chez vous</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="Nom de l'établissement..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full py-3 px-4 pl-11 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
            </div>

            {/* City Input */}
            <div className="relative">
              <input
                type="text"
                name="city"
                placeholder="Ville..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full py-3 px-4 pl-11 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
            </div>

            {/* Type Select */}
            <select
              name="type"
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              className="py-3 px-4 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 cursor-pointer appearance-none"
            >
              <option value="">Tous les types</option>
              <option value="CHU">CHU</option>
              <option value="CLINIC">Clinique</option>
              <option value="POLYCLINIC">Polyclinique</option>
              <option value="CENTER">Centre Médical</option>
            </select>

            {/* Submit Button */}
            <button
              type="submit"
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Rechercher
            </button>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
              <span className="text-xs text-slate-500">Filtres actifs:</span>
              {q && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                  "{q}"
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                  <MapPin className="w-3 h-3" /> {city}
                </span>
              )}
              {type && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                  {FACILITY_TYPE_CONFIG[type]?.label || type}
                </span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Effacer
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-800 rounded-2xl">
              <Building2 className="w-12 h-12 text-slate-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Aucun établissement trouvé</h3>
          <p className="text-slate-400 mb-6">
            {hasFilters
              ? 'Essayez de modifier vos critères de recherche'
              : 'Aucun établissement n\'est disponible pour le moment'}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">
            {facilities.length} établissement{facilities.length !== 1 ? 's' : ''} trouvé{facilities.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility, index) => {
              const config = FACILITY_TYPE_CONFIG[facility.type] || FACILITY_TYPE_CONFIG.CENTER;
              const doctorCount = facility._count?.doctors || 0;

              return (
                <Link
                  key={facility.id}
                  href={`/facilities/${facility.id}`}
                  className="group block"
                >
                  <div
                    className="bg-slate-800 rounded-2xl border border-slate-700 p-5 h-full hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
                          {facility.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-medium border ${config.bgColor} ${config.color} ${config.borderColor}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>

                    {/* Description */}
                    {facility.description && (
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {facility.description}
                      </p>
                    )}

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      {facility.city && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span>{facility.city}</span>
                        </div>
                      )}
                      {facility.phone && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span>{facility.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                      <div className="p-1.5 bg-teal-500/10 rounded-lg">
                        <Stethoscope className="w-4 h-4 text-teal-400" />
                      </div>
                      <span className="text-sm font-medium text-teal-400">
                        {doctorCount} médecin{doctorCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
