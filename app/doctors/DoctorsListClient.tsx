'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, Calendar, Video, SlidersHorizontal, X, User2, List, Map, GitCompare, CheckSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import { DoctorCard, type Doctor } from '@/components/cards';

const DoctorMapView = dynamic(() => import('@/components/DoctorMapView'), { ssr: false });

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

const SPECIALTIES = [
  'Médecin généraliste', 'Cardiologue', 'Dermatologue', 'Gynécologue',
  'Ophtalmologue', 'ORL', 'Pédiatre', 'Psychiatre', 'Rhumatologue',
  'Neurologue', 'Endocrinologue', 'Gastro-entérologue', 'Urologue',
  'Orthopédiste', 'Radiologue', 'Anesthésiste', 'Chirurgien',
];

const LANGUAGES = ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Portugais', 'Fang', 'Beti', 'Lingala'];

export default function DoctorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const q = searchParams.get('q') ?? '';
  const city = searchParams.get('city') ?? '';
  const availableIn = searchParams.get('availableIn') ?? '';
  const video = searchParams.get('video') ?? '';
  const gender = searchParams.get('gender') ?? '';
  const specialty = searchParams.get('specialty') ?? '';
  const language = searchParams.get('language') ?? '';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(!!(gender || specialty || language));
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const handleSelectDoctor = useCallback((id: string) => {
    router.push(`/doctors/${id}` as any);
  }, [router]);

  function toggleCompare(id: string) {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  const compareDoctors = useMemo(() => doctors.filter(d => compareIds.includes(d.id)), [doctors, compareIds]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      if (availableIn) params.set('availableIn', availableIn);
      if (video) params.set('video', video);
      if (gender) params.set('gender', gender);
      if (specialty) params.set('specialty', specialty);
      if (language) params.set('language', language);
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
  }, [apiBase, q, city, availableIn, video, gender, specialty, language]);

  function onSubmit(formData: FormData) {
    const nxtQ = formData.get('q')?.toString() ?? '';
    const nxtCity = formData.get('city')?.toString() ?? '';
    const params = new URLSearchParams();
    if (nxtQ) params.set('q', nxtQ);
    if (nxtCity) params.set('city', nxtCity);
    if (availableIn) params.set('availableIn', availableIn);
    if (video) params.set('video', video);
    if (gender) params.set('gender', gender);
    if (specialty) params.set('specialty', specialty);
    if (language) params.set('language', language);
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}` as any);
  }

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}` as any);
  }

  function toggleFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}` as any);
  }

  const hasActiveFilters = !!(availableIn || video || gender || specialty || language);

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams.toString());
    ['availableIn', 'video', 'gender', 'specialty', 'language'].forEach(k => params.delete(k));
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}` as any);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Trouver un médecin</h1>
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            Liste
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'map' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Carte
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form
        action={onSubmit}
        className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto_120px] gap-3 mb-4"
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
          type="button"
          onClick={() => setShowAdvanced(s => !s)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
            showAdvanced || hasActiveFilters
              ? 'bg-teal-600/10 border-teal-500 text-teal-400'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="w-4 h-4 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {[availableIn, video, gender, specialty, language].filter(Boolean).length}
            </span>
          )}
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-500 transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-4">
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
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-slate-500 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Specialty */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Spécialité</label>
            <select
              value={specialty}
              onChange={e => setFilter('specialty', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Toutes les spécialités</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Genre du médecin</label>
            <div className="flex gap-2">
              {(['', 'male', 'female'] as const).map(g => {
                const labels = { '': 'Tous', male: 'Homme', female: 'Femme' };
                return (
                  <button
                    key={g}
                    onClick={() => setFilter('gender', g)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      gender === g
                        ? 'bg-teal-600 border-teal-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <User2 className="w-3.5 h-3.5" />
                    {labels[g]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Langue parlée</label>
            <select
              value={language}
              onChange={e => setFilter('language', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Toutes les langues</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : viewMode === 'map' ? (
        <div>
          {doctors.length === 0 ? (
            <div className="text-center py-16 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucun médecin trouvé.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-3">{doctors.length} médecin{doctors.length > 1 ? 's' : ''} — cliquez sur un marqueur pour voir le profil</p>
              <DoctorMapView doctors={doctors} onSelectDoctor={handleSelectDoctor} />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!doctors.length && (
            <div className="col-span-full text-center py-16 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucun médecin trouvé.</p>
              <p className="text-slate-500 text-sm mt-1">
                {hasActiveFilters
                  ? 'Essayez de modifier ou d\'enlever des filtres.'
                  : 'Essayez avec un autre nom ou une autre spécialité.'}
              </p>
            </div>
          )}
          {doctors.map((doctor) => (
            <div key={doctor.id} className="relative group">
              <DoctorCard
                doctor={doctor}
                showFavorite={true}
                showPresentation={true}
                presentationMaxLength={100}
              />
              <button
                onClick={() => toggleCompare(doctor.id)}
                className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100 ${
                  compareIds.includes(doctor.id)
                    ? 'bg-violet-600 text-white opacity-100'
                    : 'bg-slate-700/90 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <CheckSquare className="w-3 h-3" />
                {compareIds.includes(doctor.id) ? 'Sélectionné' : 'Comparer'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Floating compare bar */}
      {compareIds.length >= 2 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-900 border border-violet-500/50 rounded-2xl px-5 py-3 shadow-2xl">
          <GitCompare className="w-5 h-5 text-violet-400 shrink-0" />
          <span className="text-sm text-white font-medium">{compareIds.length} médecins sélectionnés</span>
          <button
            onClick={() => setShowCompare(true)}
            className="px-4 py-1.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            Comparer
          </button>
          <button onClick={() => setCompareIds([])} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Comparison modal */}
      {showCompare && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowCompare(false)}>
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl mt-10 mb-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-violet-400" />
                Comparaison de médecins
              </h2>
              <button onClick={() => setShowCompare(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-medium w-36">Critère</th>
                    {compareDoctors.map(d => (
                      <th key={d.id} className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-teal-600/20 flex items-center justify-center text-teal-400 font-bold text-lg">
                            {(d.fullName || 'D').charAt(0)}
                          </div>
                          <span className="text-white font-semibold text-sm">{d.fullName || 'Médecin'}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Spécialité', key: (d: Doctor) => d.doctorProfile?.specialty || '—' },
                    { label: 'Ville', key: (d: Doctor) => d.doctorProfile?.city || d.city || '—' },
                    { label: 'Type', key: (d: Doctor) => d.doctorProfile?.hospitalType || '—' },
                    { label: 'Téléphone', key: (d: Doctor) => d.phone || '—' },
                    { label: 'Email', key: (d: Doctor) => d.email || '—' },
                  ].map(({ label, key }) => (
                    <tr key={label} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-400 font-medium">{label}</td>
                      {compareDoctors.map(d => (
                        <td key={d.id} className="p-4 text-center text-white">{key(d)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="p-4" />
                    {compareDoctors.map(d => (
                      <td key={d.id} className="p-4 text-center">
                        <a
                          href={`/doctors/${d.id}`}
                          className="inline-block px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-500 transition-colors"
                        >
                          Voir le profil
                        </a>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
