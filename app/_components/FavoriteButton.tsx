'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';

interface FavoriteButtonProps {
  doctorId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
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

export default function FavoriteButton({ doctorId, size = 'md', showCount = false }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const apiBase = getApiBase();

  // Vérifier si le médecin est en favori
  useEffect(() => {
    async function checkFavorite() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${apiBase}/favorites/check/${doctorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFavorite(data.isFavorite);
        }
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    }

    async function fetchCount() {
      if (!showCount) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/favorites/count/${doctorId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching count:', error);
      }
    }

    checkFavorite();
    fetchCount();
  }, [doctorId, apiBase, showCount]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/favorites/${doctorId}/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
        if (showCount) {
          setCount((prev) => (data.isFavorite ? prev + 1 : Math.max(0, prev - 1)));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeStyles = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`
        ${sizeStyles[size]}
        inline-flex items-center justify-center gap-1
        rounded-full border-none
        transition-all duration-200
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
        ${isFavorite
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300'
        }
      `}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Heart className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''}`} />
      )}
      {showCount && count > 0 && (
        <span className="text-xs font-medium text-slate-400">{count}</span>
      )}
    </button>
  );
}
