'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, HeartOff, Loader2, Stethoscope, Search, X, SortAsc } from 'lucide-react';
import { DoctorCard, type Doctor } from '@/components/cards';

interface FavoriteDoctor {
  id: string;
  addedAt: string;
  doctor: Doctor & {
    phone: string | null;
  };
}

type SortOption = 'recent' | 'name' | 'specialty';

function getApiBase(): string {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const apiBase = getApiBase();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchFavorites() {
      try {
        const res = await fetch(`${apiBase}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [apiBase, router]);

  const removeFavorite = async (doctorId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRemoving(doctorId);
    try {
      const res = await fetch(`${apiBase}/favorites/${doctorId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.doctor.id !== doctorId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemoving(null);
    }
  };

  // Filter and sort favorites
  const filteredFavorites = favorites
    .filter((fav) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const name = (fav.doctor.fullName || '').toLowerCase();
      const specialty = (fav.doctor.doctorProfile?.specialty || '').toLowerCase();
      const city = (fav.doctor.doctorProfile?.city || fav.doctor.city || '').toLowerCase();
      return name.includes(query) || specialty.includes(query) || city.includes(query);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.doctor.fullName || '').localeCompare(b.doctor.fullName || '');
        case 'specialty':
          return (a.doctor.doctorProfile?.specialty || '').localeCompare(
            b.doctor.doctorProfile?.specialty || ''
          );
        case 'recent':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-500/10 rounded-xl">
            <Heart className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mes Médecins Favoris</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-red-500/10 rounded-xl">
              <Heart className="w-6 h-6 text-red-400 fill-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mes Médecins Favoris</h1>
          </div>
          <p className="text-slate-400 ml-14">
            {favorites.length} médecin{favorites.length !== 1 ? 's' : ''} dans vos favoris
          </p>
        </div>

        {favorites.length > 0 && (
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
          >
            <Stethoscope className="w-4 h-4" />
            Découvrir plus
          </Link>
        )}
      </div>

      {favorites.length > 0 && (
        <>
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher un médecin favori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 px-4 pl-11 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none py-3 px-4 pr-10 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
              >
                <option value="recent">Plus récents</option>
                <option value="name">Nom A-Z</option>
                <option value="specialty">Spécialité</option>
              </select>
              <SortAsc className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          {searchQuery && (
            <p className="text-sm text-slate-500 mb-4">
              {filteredFavorites.length} résultat{filteredFavorites.length !== 1 ? 's' : ''} pour "{searchQuery}"
            </p>
          )}
        </>
      )}

      {/* Content */}
      {favorites.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-800 rounded-2xl">
              <HeartOff className="w-12 h-12 text-slate-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Aucun médecin favori</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Ajoutez des médecins à vos favoris pour les retrouver facilement et prendre rendez-vous rapidement
          </p>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
          >
            <Stethoscope className="w-5 h-5" />
            Rechercher des médecins
          </Link>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-800 rounded-2xl">
              <Search className="w-12 h-12 text-slate-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Aucun résultat</h3>
          <p className="text-slate-400 mb-6">
            Aucun médecin favori ne correspond à "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.map((fav, index) => (
            <DoctorCard
              key={fav.id}
              doctor={fav.doctor}
              showFavorite={true}
              showPhone={true}
              showAddress={true}
              showPresentation={true}
              presentationMaxLength={120}
              onRemoveFavorite={() => removeFavorite(fav.doctor.id)}
              isRemovingFavorite={removing === fav.doctor.id}
              animationDelay={index * 50}
              footer={
                <>Ajouté le {new Date(fav.addedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
