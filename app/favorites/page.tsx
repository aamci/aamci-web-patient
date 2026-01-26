'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartOff, Loader2 } from 'lucide-react';
import { DoctorCard, type Doctor } from '@/components/cards';

interface FavoriteDoctor {
  id: string;
  addedAt: string;
  doctor: Doctor & {
    phone: string | null;
  };
}

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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes Médecins Favoris</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes Médecins Favoris</h1>
        <span className="text-gray-500 text-sm">
          {favorites.length} médecin{favorites.length !== 1 ? 's' : ''}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 px-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <HeartOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun médecin favori</h3>
          <p className="text-gray-500 mb-6">
            Ajoutez des médecins à vos favoris pour les retrouver facilement
          </p>
          <Link
            href="/doctors"
            className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Rechercher des médecins
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <DoctorCard
              key={fav.id}
              doctor={fav.doctor}
              showFavorite={true}
              showPhone={true}
              showAddress={true}
              showPresentation={true}
              presentationMaxLength={150}
              onRemoveFavorite={() => removeFavorite(fav.doctor.id)}
              isRemovingFavorite={removing === fav.doctor.id}
              footer={
                <>Ajouté le {new Date(fav.addedAt).toLocaleDateString('fr-FR')}</>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
