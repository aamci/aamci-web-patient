'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';

function getApiBase(): string {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return 'http://localhost:3002';
  try {
    new URL(b);
    return b;
  } catch {
    return 'http://localhost:3002';
  }
}

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

type Appointment = {
  id: string;
  status: AppointmentStatus;
  createdAt: string;
  notes?: string | null;
  type?: string | null;
  slot?: {
    start?: string;
    end?: string;
    ownerType?: 'DOCTOR' | 'HOSPITAL';
    ownerId?: string;
  } | null;
  doctor?: { id: string; name: string; fullName?: string; avatarUrl?: string } | null;
  hospital?: { id: string; name: string } | null;
  kind?: { name: string } | null;
};

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const apiBase = useMemo(() => getApiBase(), []);

  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  async function callApi(path: string, init?: RequestInit) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
      ...(init?.headers as any),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (init?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${apiBase}${path}`;
    const r = await fetch(url, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store'
    });

    if (r.status === 401) {
      // Clear invalid token
      if (token) {
        localStorage.removeItem('token');
      }
      throw new Error('Non authentifié');
    }

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${txt ? ` — ${txt}` : ''}`);
    }
    return r.json();
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await callApi('/appointments', { method: 'GET' });
      const list: Appointment[] = Array.isArray(data) ? data : data?.data || [];
      // Trier par date décroissante
      list.sort((a, b) => {
        const dateA = a.slot?.start ? new Date(a.slot.start).getTime() : 0;
        const dateB = b.slot?.start ? new Date(b.slot.start).getTime() : 0;
        return dateB - dateA;
      });
      setItems(list);
    } catch (e: any) {
      if (e?.message?.includes('Non authentifié') || e?.message?.includes('401')) {
        router.replace('/auth/login');
      } else {
        setErr(e?.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }

  async function cancel(apptId: string) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;

    setActionId(apptId);
    setErr(null);
    try {
      await callApi(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      setItems((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: 'CANCELLED' } : a)),
      );
    } catch (e: any) {
      setErr(e?.message || 'Échec de l\'annulation');
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    // Attendre que l'auth soit chargée
    if (authLoading) return;

    // Si pas d'utilisateur, rediriger vers login
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    load();
  }, [authLoading, user]);

  // Filtrer les rendez-vous
  const filteredItems = useMemo(() => {
    const now = new Date();

    return items.filter((a) => {
      const start = a.slot?.start ? new Date(a.slot.start) : null;
      const isUpcoming = start ? start > now : false;
      const isPast = start ? start <= now : true;

      // Filtre par statut/temps
      if (filter === 'upcoming' && (!isUpcoming || a.status === 'CANCELLED')) return false;
      if (filter === 'past' && (!isPast || a.status === 'CANCELLED')) return false;
      if (filter === 'cancelled' && a.status !== 'CANCELLED') return false;

      // Filtre par recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const doctorName = (a.doctor?.fullName || a.doctor?.name || '').toLowerCase();
        const hospitalName = (a.hospital?.name || '').toLowerCase();
        const notes = (a.notes || '').toLowerCase();
        const kindName = (a.kind?.name || '').toLowerCase();

        if (!doctorName.includes(query) && !hospitalName.includes(query) &&
            !notes.includes(query) && !kindName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [items, filter, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: items.length,
      upcoming: items.filter((a) => {
        const start = a.slot?.start ? new Date(a.slot.start) : null;
        return start && start > now && a.status !== 'CANCELLED';
      }).length,
      past: items.filter((a) => {
        const start = a.slot?.start ? new Date(a.slot.start) : null;
        return start && start <= now && a.status !== 'CANCELLED';
      }).length,
      cancelled: items.filter((a) => a.status === 'CANCELLED').length,
    };
  }, [items]);

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#111' }}>
          Mes Rendez-vous
        </h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          Gérez vos consultations passées et à venir
        </p>
      </div>

      {/* Statistiques */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total"
          value={stats.total}
          color="#3b82f6"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <StatCard
          label="À venir"
          value={stats.upcoming}
          color="#10b981"
          active={filter === 'upcoming'}
          onClick={() => setFilter('upcoming')}
        />
        <StatCard
          label="Passés"
          value={stats.past}
          color="#6b7280"
          active={filter === 'past'}
          onClick={() => setFilter('past')}
        />
        <StatCard
          label="Annulés"
          value={stats.cancelled}
          color="#ef4444"
          active={filter === 'cancelled'}
          onClick={() => setFilter('cancelled')}
        />
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Rechercher par médecin, type de consultation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              fontSize: 14,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: '#9ca3af',
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Erreur */}
      {err && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            color: '#dc2626',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {err}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: '#f3f4f6',
                borderRadius: 16,
                height: 120,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState filter={filter} searchQuery={searchQuery} />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredItems.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onCancel={() => cancel(a.id)}
              isLoading={actionId === a.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        background: active ? `${color}10` : '#fff',
        border: `2px solid ${active ? color : '#e5e7eb'}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function EmptyState({ filter, searchQuery }: { filter: FilterType; searchQuery: string }) {
  const messages: Record<FilterType, { icon: string; title: string; desc: string }> = {
    all: {
      icon: '📅',
      title: 'Aucun rendez-vous',
      desc: 'Prenez votre premier rendez-vous avec un médecin',
    },
    upcoming: {
      icon: '🗓️',
      title: 'Aucun rendez-vous à venir',
      desc: 'Vous n\'avez pas de consultation prévue',
    },
    past: {
      icon: '📋',
      title: 'Aucun rendez-vous passé',
      desc: 'Votre historique de consultations est vide',
    },
    cancelled: {
      icon: '❌',
      title: 'Aucun rendez-vous annulé',
      desc: 'Vous n\'avez annulé aucune consultation',
    },
  };

  const msg = messages[filter];

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: '#f9fafb',
        borderRadius: 16,
        border: '2px dashed #e5e7eb',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>{searchQuery ? '🔍' : msg.icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 8 }}>
        {searchQuery ? 'Aucun résultat trouvé' : msg.title}
      </h3>
      <p style={{ color: '#6b7280', margin: 0, marginBottom: 20 }}>
        {searchQuery
          ? `Aucun rendez-vous ne correspond à "${searchQuery}"`
          : msg.desc}
      </p>
      {filter === 'all' && !searchQuery && (
        <Link
          href="/doctors"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Trouver un médecin
        </Link>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment: a,
  onCancel,
  isLoading,
}: {
  appointment: Appointment;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const start = a.slot?.start ? new Date(a.slot.start) : null;
  const now = new Date();
  const isUpcoming = start ? start > now : false;
  const isPast = start ? start <= now : false;

  const doctorName =
    a.doctor?.fullName ||
    a.doctor?.name ||
    (a.slot?.ownerType === 'HOSPITAL' ? a.hospital?.name : 'Médecin');

  const statusConfig: Record<
    AppointmentStatus,
    { label: string; bg: string; color: string; icon: string }
  > = {
    PENDING: { label: 'En attente', bg: '#fef3c7', color: '#d97706', icon: '⏳' },
    CONFIRMED: { label: 'Confirmé', bg: '#d1fae5', color: '#059669', icon: '✓' },
    CANCELLED: { label: 'Annulé', bg: '#fee2e2', color: '#dc2626', icon: '✕' },
    NO_SHOW: { label: 'Absent', bg: '#f3f4f6', color: '#6b7280', icon: '?' },
  };

  const status = statusConfig[a.status];

  // Modifier le statut visuel si le RDV est passé et confirmé
  const displayStatus =
    isPast && a.status === 'CONFIRMED'
      ? { label: 'Terminé', bg: '#dbeafe', color: '#2563eb', icon: '✓' }
      : status;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        opacity: a.status === 'CANCELLED' ? 0.7 : 1,
      }}
    >
      {/* Bande de couleur en haut */}
      <div
        style={{
          height: 4,
          background: isUpcoming && a.status !== 'CANCELLED' ? '#10b981' : '#e5e7eb',
        }}
      />

      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Date/Heure */}
          <div
            style={{
              minWidth: 70,
              textAlign: 'center',
              padding: '12px 8px',
              background: isUpcoming ? '#f0fdf4' : '#f9fafb',
              borderRadius: 12,
              border: `1px solid ${isUpcoming ? '#bbf7d0' : '#e5e7eb'}`,
            }}
          >
            {start ? (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isUpcoming ? '#16a34a' : '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  {start.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: isUpcoming ? '#111' : '#6b7280',
                    lineHeight: 1.2,
                  }}
                >
                  {start.getDate()}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {start.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>À définir</div>
            )}
          </div>

          {/* Infos principales */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: 0,
                    color: '#111',
                  }}
                >
                  {doctorName}
                </h3>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {a.kind?.name || a.type || 'Consultation'}
                  {start && (
                    <span>
                      {' '}
                      • {start.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Badge statut */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  background: displayStatus.bg,
                  color: displayStatus.color,
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{displayStatus.icon}</span>
                {displayStatus.label}
              </span>
            </div>

            {/* Notes */}
            {a.notes && (
              <p
                style={{
                  fontSize: 13,
                  color: '#6b7280',
                  margin: '12px 0 0 0',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: 8,
                  borderLeft: '3px solid #e5e7eb',
                }}
              >
                💬 {a.notes}
              </p>
            )}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              {a.slot?.ownerId && (
                <Link
                  href={`/doctors/${a.slot.ownerId}`}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#374151',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  👤 Voir le médecin
                </Link>
              )}

              {isUpcoming && a.status !== 'CANCELLED' && (
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isLoading ? '⏳ Annulation...' : '✕ Annuler'}
                </button>
              )}

              {isUpcoming && a.status === 'CONFIRMED' && (
                <button
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  📅 Ajouter au calendrier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer avec date de création */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid #f3f4f6',
            fontSize: 11,
            color: '#9ca3af',
          }}
        >
          Réservé le{' '}
          {new Date(a.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
}
