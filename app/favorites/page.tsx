'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FavoriteDoctor {
  id: string;
  addedAt: string;
  doctor: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    email: string;
    phone: string | null;
    doctorProfile: {
      specialty: string | null;
      city: string | null;
      address: string | null;
      presentation: string | null;
    } | null;
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
      <div style={{ padding: '24px 0' }}>
        <h1>Mes Médecins Favoris</h1>
        <div className="card" style={{ marginTop: 16 }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Mes Médecins Favoris</h1>
        <span style={{ color: '#6b7280', fontSize: 14 }}>
          {favorites.length} médecin{favorites.length !== 1 ? 's' : ''}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Aucun médecin favori</h3>
          <p style={{ color: '#6b7280', margin: 0, marginBottom: 16 }}>
            Ajoutez des médecins à vos favoris pour les retrouver facilement
          </p>
          <Link href="/doctors" className="btn primary">
            Rechercher des médecins
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {favorites.map((fav) => {
            const d = fav.doctor;
            const prof = d.doctorProfile;
            const fullName = d.fullName || d.email || 'Docteur';
            const specialty = prof?.specialty || 'Médecine générale';
            const cityName = prof?.city || '—';

            return (
              <div
                key={fav.id}
                className="card"
                style={{ display: 'grid', gap: 12, position: 'relative' }}
              >
                {/* Header avec avatar et info */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {d.avatarUrl ? (
                    <img
                      src={d.avatarUrl}
                      alt={fullName}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        color: 'white',
                        fontSize: 20,
                      }}
                    >
                      {fullName[0]?.toUpperCase() ?? 'D'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 16 }}>{fullName}</strong>
                    <div style={{ color: '#3b82f6', fontSize: 13, marginTop: 2 }}>
                      {specialty}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
                      📍 {cityName}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFavorite(d.id)}
                    disabled={removing === d.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: removing === d.id ? 'not-allowed' : 'pointer',
                      fontSize: 20,
                      opacity: removing === d.id ? 0.5 : 1,
                      padding: 4,
                    }}
                    title="Retirer des favoris"
                  >
                    ❤️
                  </button>
                </div>

                {/* Présentation */}
                {prof?.presentation && (
                  <p style={{ fontSize: 13, margin: 0, color: '#555', lineHeight: 1.5 }}>
                    {prof.presentation.length > 150
                      ? prof.presentation.slice(0, 150) + '…'
                      : prof.presentation}
                  </p>
                )}

                {/* Contact info */}
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  {d.phone && <div>📞 {d.phone}</div>}
                  {prof?.address && <div>📍 {prof.address}</div>}
                </div>

                {/* Date d'ajout */}
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  Ajouté le {new Date(fav.addedAt).toLocaleDateString('fr-FR')}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Link
                    href={`/doctors/${d.id}`}
                    className="btn outline"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    Voir la fiche
                  </Link>
                  <Link
                    href={`/doctors/${d.id}#slots`}
                    className="btn primary"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
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
