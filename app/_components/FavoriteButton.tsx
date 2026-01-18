'use client';

import { useState, useEffect } from 'react';

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
    sm: { width: 28, height: 28, fontSize: 14 },
    md: { width: 36, height: 36, fontSize: 18 },
    lg: { width: 44, height: 44, fontSize: 22 },
  };

  const style = sizeStyles[size];

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        border: 'none',
        borderRadius: '50%',
        background: isFavorite ? '#fef2f2' : '#f3f4f6',
        color: isFavorite ? '#ef4444' : '#9ca3af',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = isFavorite ? '#fee2e2' : '#e5e7eb';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = isFavorite ? '#fef2f2' : '#f3f4f6';
      }}
    >
      <span style={{ fontSize: style.fontSize }}>
        {isFavorite ? '❤️' : '🤍'}
      </span>
      {showCount && count > 0 && (
        <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>
          {count}
        </span>
      )}
    </button>
  );
}
