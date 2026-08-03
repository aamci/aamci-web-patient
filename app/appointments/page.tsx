'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  Search,
  X,
  Loader2,
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Clock,
  Stethoscope,
  Star,
  Download,
  CheckCircle,
} from 'lucide-react';
import { AppointmentCard, type Appointment } from '@/components/cards';

function downloadIcs(appt: Appointment) {
  const start = appt.slot?.start;
  const end = appt.slot?.end || appt.slot?.start;
  if (!start) return;

  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const doctorName = appt.doctor?.fullName || appt.doctor?.name || 'Médecin';
  const kindName = appt.kind?.name || 'Consultation';
  const uid = `${appt.id}@ibogha241.ga`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ibogha 241//FR',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end!)}`,
    `SUMMARY:RDV ${kindName} - Dr. ${doctorName}`,
    `DESCRIPTION:${appt.notes || `Consultation avec ${doctorName}`}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rdv-${appt.id.slice(-6)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Post-RDV rating
  const [ratingAppt, setRatingAppt] = useState<Appointment | null>(null);
  const [overallRating, setOverallRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewDone, setReviewDone] = useState<string | null>(null); // appt id reviewed
  const [reviewErr, setReviewErr] = useState('');

  const openRating = useCallback((appt: Appointment) => {
    setRatingAppt(appt);
    setOverallRating(0); setPunctualityRating(0); setCommunicationRating(0);
    setReviewComment(''); setReviewErr('');
  }, []);

  async function submitReview() {
    if (!ratingAppt || overallRating === 0) { setReviewErr('Veuillez sélectionner une note globale.'); return; }
    const doctorId = ratingAppt.slot?.ownerId || ratingAppt.doctor?.id;
    if (!doctorId) { setReviewErr('Médecin introuvable.'); return; }
    setReviewSending(true); setReviewErr('');
    try {
      await callApi('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          doctorId,
          appointmentId: ratingAppt.id,
          overallRating,
          ...(punctualityRating > 0 ? { punctualityRating } : {}),
          ...(communicationRating > 0 ? { communicationRating } : {}),
          comment: reviewComment || undefined,
          isPublic: true,
        }),
      });
      setReviewDone(ratingAppt.id);
      setRatingAppt(null);
    } catch (e: unknown) {
      setReviewErr((e as Error).message || 'Erreur lors de l\'envoi de l\'avis');
    } finally { setReviewSending(false); }
  }

  async function callApi(path: string, init?: RequestInit) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
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
    } catch (e: unknown) {
      const error = e as Error;
      if (error?.message?.includes('Non authentifié') || error?.message?.includes('401')) {
        router.replace('/auth/login');
      } else {
        setErr(error?.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }

  async function checkIn(apptId: string) {
    setCheckInId(apptId);
    try {
      await callApi(`/appointments/${apptId}/check-in`, { method: 'POST' });
      setItems((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, checkedInAt: new Date().toISOString() } : a)),
      );
    } catch (e: unknown) {
      const error = e as Error;
      setErr(error?.message || 'Échec du check-in');
    } finally {
      setCheckInId(null);
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
    } catch (e: unknown) {
      const error = e as Error;
      setErr(error?.message || 'Échec de l\'annulation');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-teal-500/10 rounded-xl">
            <CalendarDays className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mes Rendez-vous</h1>
        </div>
        <p className="text-slate-400 ml-14">Gérez vos consultations passées et à venir</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Calendar className="w-5 h-5" />}
          color="teal"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <StatCard
          label="À venir"
          value={stats.upcoming}
          icon={<Clock className="w-5 h-5" />}
          color="green"
          active={filter === 'upcoming'}
          onClick={() => setFilter('upcoming')}
        />
        <StatCard
          label="Passés"
          value={stats.past}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="slate"
          active={filter === 'past'}
          onClick={() => setFilter('past')}
        />
        <StatCard
          label="Annulés"
          value={stats.cancelled}
          icon={<CalendarX className="w-5 h-5" />}
          color="red"
          active={filter === 'cancelled'}
          onClick={() => setFilter('cancelled')}
        />
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher par médecin, type de consultation..."
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
      </div>

      {/* Erreur */}
      {err && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-4 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {err}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 rounded-2xl h-[140px] animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState filter={filter} searchQuery={searchQuery} />
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((a) => {
            const now = new Date();
            const slotStart = a.slot?.start ? new Date(a.slot.start) : null;
            const isPast = slotStart && slotStart <= now;
            const isUpcoming = slotStart && slotStart > now;
            const isConfirmed = a.status === 'CONFIRMED';
            const alreadyReviewed = reviewDone === a.id;
            return (
              <div key={a.id}>
                <AppointmentCard
                  appointment={a}
                  onCancel={() => cancel(a.id)}
                  onCheckIn={() => checkIn(a.id)}
                  isLoading={actionId === a.id}
                  checkInLoading={checkInId === a.id}
                />
                <div className="flex gap-2 mt-1.5 pl-1">
                  {/* iCal export — upcoming only */}
                  {isUpcoming && a.status !== 'CANCELLED' && (
                    <button
                      onClick={() => downloadIcs(a)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Ajouter au calendrier
                    </button>
                  )}
                  {/* Rating — past confirmed, not yet reviewed */}
                  {isPast && isConfirmed && !alreadyReviewed && (
                    <button
                      onClick={() => openRating(a)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs text-amber-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-amber-500/10"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Laisser un avis
                    </button>
                  )}
                  {alreadyReviewed && (
                    <span className="flex items-center gap-1.5 px-3 py-1 text-xs text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Avis envoyé
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Rating modal */}
      {ratingAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRatingAppt(null)}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Votre avis</h3>
              <button onClick={() => setRatingAppt(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-5">
              RDV avec {ratingAppt.doctor?.fullName || ratingAppt.doctor?.name || 'le médecin'} · {ratingAppt.kind?.name || 'Consultation'}
            </p>

            {[
              { label: 'Note globale *', value: overallRating, set: setOverallRating },
              { label: 'Ponctualité', value: punctualityRating, set: setPunctualityRating },
              { label: 'Communication', value: communicationRating, set: setCommunicationRating },
            ].map(({ label, value, set }) => (
              <div key={label} className="mb-4">
                <p className="text-xs font-medium text-slate-400 mb-2">{label}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => set(n)} className="group">
                      <Star className={`w-7 h-7 transition-colors ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-600 group-hover:text-amber-400/50'}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mb-4">
              <p className="text-xs font-medium text-slate-400 mb-2">Commentaire (optionnel)</p>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Partagez votre expérience..."
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            {reviewErr && <p className="text-red-400 text-xs mb-3">{reviewErr}</p>}

            <button
              onClick={submitReview}
              disabled={reviewSending || overallRating === 0}
              className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {reviewSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              {reviewSending ? 'Envoi...' : 'Publier l\'avis'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'teal' | 'green' | 'slate' | 'red';
  active: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    teal: {
      text: 'text-teal-400',
      iconBg: 'bg-teal-500/20',
      activeBg: 'bg-teal-500/10',
      activeBorder: 'border-teal-500/50',
    },
    green: {
      text: 'text-green-400',
      iconBg: 'bg-green-500/20',
      activeBg: 'bg-green-500/10',
      activeBorder: 'border-green-500/50',
    },
    slate: {
      text: 'text-slate-400',
      iconBg: 'bg-slate-500/20',
      activeBg: 'bg-slate-700/50',
      activeBorder: 'border-slate-500/50',
    },
    red: {
      text: 'text-red-400',
      iconBg: 'bg-red-500/20',
      activeBg: 'bg-red-500/10',
      activeBorder: 'border-red-500/50',
    },
  };

  const colors = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all text-left ${
        active
          ? `${colors.activeBg} ${colors.activeBorder}`
          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors.iconBg} ${colors.text}`}>
          {icon}
        </div>
        <div>
          <div className={`text-2xl font-bold ${active ? colors.text : 'text-white'}`}>
            {value}
          </div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ filter, searchQuery }: { filter: FilterType; searchQuery: string }) {
  const messages: Record<FilterType, { icon: React.ReactNode; title: string; desc: string }> = {
    all: {
      icon: <Calendar className="w-12 h-12 text-slate-600" />,
      title: 'Aucun rendez-vous',
      desc: 'Prenez votre premier rendez-vous avec un médecin',
    },
    upcoming: {
      icon: <Clock className="w-12 h-12 text-slate-600" />,
      title: 'Aucun rendez-vous à venir',
      desc: 'Vous n\'avez pas de consultation prévue',
    },
    past: {
      icon: <CalendarCheck className="w-12 h-12 text-slate-600" />,
      title: 'Aucun rendez-vous passé',
      desc: 'Votre historique de consultations est vide',
    },
    cancelled: {
      icon: <CalendarX className="w-12 h-12 text-slate-600" />,
      title: 'Aucun rendez-vous annulé',
      desc: 'Vous n\'avez annulé aucune consultation',
    },
  };

  const msg = messages[filter];

  return (
    <div className="text-center py-16 px-5 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-slate-800 rounded-2xl">
          {searchQuery ? <Search className="w-12 h-12 text-slate-600" /> : msg.icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {searchQuery ? 'Aucun résultat trouvé' : msg.title}
      </h3>
      <p className="text-slate-400 mb-6 max-w-sm mx-auto">
        {searchQuery
          ? `Aucun rendez-vous ne correspond à "${searchQuery}"`
          : msg.desc}
      </p>
      {filter === 'all' && !searchQuery && (
        <Link
          href="/doctors"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
        >
          <Stethoscope className="w-5 h-5" />
          Trouver un médecin
        </Link>
      )}
    </div>
  );
}
