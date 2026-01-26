'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { Search, X, Loader2, Calendar } from 'lucide-react';
import { AppointmentCard, type Appointment } from '@/components/cards';

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
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    load();
  }, [authLoading, user]);

  const filteredItems = useMemo(() => {
    const now = new Date();

    return items.filter((a) => {
      const start = a.slot?.start ? new Date(a.slot.start) : null;
      const isUpcoming = start ? start > now : false;
      const isPast = start ? start <= now : true;

      if (filter === 'upcoming' && (!isUpcoming || a.status === 'CANCELLED')) return false;
      if (filter === 'past' && (!isPast || a.status === 'CANCELLED')) return false;
      if (filter === 'cancelled' && a.status !== 'CANCELLED') return false;

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

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-900">Mes Rendez-vous</h1>
        <p className="text-gray-500 mt-1">Gérez vos consultations passées et à venir</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total"
          value={stats.total}
          color="blue"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <StatCard
          label="À venir"
          value={stats.upcoming}
          color="green"
          active={filter === 'upcoming'}
          onClick={() => setFilter('upcoming')}
        />
        <StatCard
          label="Passés"
          value={stats.past}
          color="gray"
          active={filter === 'past'}
          onClick={() => setFilter('past')}
        />
        <StatCard
          label="Annulés"
          value={stats.cancelled}
          color="red"
          active={filter === 'cancelled'}
          onClick={() => setFilter('cancelled')}
        />
      </div>

      {/* Barre de recherche */}
      <div className="mb-5">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher par médecin, type de consultation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 px-4 pl-11 text-sm border border-gray-200 rounded-xl outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Erreur */}
      {err && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-4 text-sm">
          {err}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-[120px] animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState filter={filter} searchQuery={searchQuery} />
      ) : (
        <div className="grid gap-4">
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
  color: 'blue' | 'green' | 'gray' | 'red';
  active: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    blue: {
      text: 'text-blue-600',
      activeBg: 'bg-blue-50',
      activeBorder: 'border-blue-500',
    },
    green: {
      text: 'text-green-600',
      activeBg: 'bg-green-50',
      activeBorder: 'border-green-500',
    },
    gray: {
      text: 'text-gray-500',
      activeBg: 'bg-gray-50',
      activeBorder: 'border-gray-500',
    },
    red: {
      text: 'text-red-500',
      activeBg: 'bg-red-50',
      activeBorder: 'border-red-500',
    },
  };

  const colors = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all text-center ${
        active
          ? `${colors.activeBg} ${colors.activeBorder}`
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`text-[28px] font-bold ${colors.text}`}>{value}</div>
      <div className="text-[13px] text-gray-500 mt-0.5">{label}</div>
    </button>
  );
}

function EmptyState({ filter, searchQuery }: { filter: FilterType; searchQuery: string }) {
  const messages: Record<FilterType, { icon: React.ReactNode; title: string; desc: string }> = {
    all: {
      icon: <Calendar className="w-12 h-12 text-gray-300" />,
      title: 'Aucun rendez-vous',
      desc: 'Prenez votre premier rendez-vous avec un médecin',
    },
    upcoming: {
      icon: <Calendar className="w-12 h-12 text-gray-300" />,
      title: 'Aucun rendez-vous à venir',
      desc: 'Vous n\'avez pas de consultation prévue',
    },
    past: {
      icon: <Calendar className="w-12 h-12 text-gray-300" />,
      title: 'Aucun rendez-vous passé',
      desc: 'Votre historique de consultations est vide',
    },
    cancelled: {
      icon: <X className="w-12 h-12 text-gray-300" />,
      title: 'Aucun rendez-vous annulé',
      desc: 'Vous n\'avez annulé aucune consultation',
    },
  };

  const msg = messages[filter];

  return (
    <div className="text-center py-16 px-5 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
      <div className="flex justify-center mb-4">
        {searchQuery ? <Search className="w-12 h-12 text-gray-300" /> : msg.icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {searchQuery ? 'Aucun résultat trouvé' : msg.title}
      </h3>
      <p className="text-gray-500 mb-5">
        {searchQuery
          ? `Aucun rendez-vous ne correspond à "${searchQuery}"`
          : msg.desc}
      </p>
      {filter === 'all' && !searchQuery && (
        <Link
          href="/doctors"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Trouver un médecin
        </Link>
      )}
    </div>
  );
}
