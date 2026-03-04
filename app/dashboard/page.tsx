'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  Calendar,
  Clock,
  Stethoscope,
  Activity,
  MessageSquare,
  FileText,
  Heart,
  Bell,
  ArrowRight,
  Loader2,
  Building2,
  CheckCircle,
  AlertCircle,
  Pill,
  Search,
  Star,
} from 'lucide-react';

interface Appointment {
  id: string;
  status: string;
  notes?: string;
  slot?: { start: string; end: string };
  doctor?: { id: string; fullName?: string; avatarUrl?: string };
  kind?: { name: string };
}

function getApiBase(): string {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return 'http://localhost:3000';
  try { new URL(b); return b; } catch { return 'http://localhost:3000'; }
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const authedFetch = useCallback(async (path: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  }, [apiBase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }

    (async () => {
      setLoading(true);
      const [appts, msgs, notifs] = await Promise.all([
        authedFetch('/appointments'),
        authedFetch('/messages/unread-count').catch(() => null),
        authedFetch('/notifications').catch(() => null),
      ]);

      if (appts) {
        const list: Appointment[] = Array.isArray(appts) ? appts : appts?.data ?? [];
        list.sort((a, b) => {
          const tA = a.slot?.start ? new Date(a.slot.start).getTime() : 0;
          const tB = b.slot?.start ? new Date(b.slot.start).getTime() : 0;
          return tA - tB;
        });
        setAppointments(list);
      }
      if (msgs) setUnreadMessages(msgs.count ?? 0);
      if (notifs && Array.isArray(notifs)) {
        setUnreadNotifications(notifs.filter((n: any) => !n.read).length);
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.slot?.start && new Date(a.slot.start) > now && a.status !== 'CANCELLED'
  );
  const nextAppt = upcoming[0] ?? null;
  const todayAppts = upcoming.filter((a) => {
    if (!a.slot?.start) return false;
    const d = new Date(a.slot.start);
    return d.toDateString() === now.toDateString();
  });

  const stats = [
    {
      label: 'À venir',
      value: upcoming.length,
      icon: Calendar,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      href: '/appointments',
    },
    {
      label: 'Messages',
      value: unreadMessages,
      icon: MessageSquare,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/messages',
      badge: unreadMessages > 0,
    },
    {
      label: 'Notifications',
      value: unreadNotifications,
      icon: Bell,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      href: '/notifications',
      badge: unreadNotifications > 0,
    },
    {
      label: "Aujourd'hui",
      value: todayAppts.length,
      icon: Clock,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      href: '/appointments',
    },
  ];

  const quickActions = [
    { label: 'Trouver un médecin', icon: Search, href: '/doctors', color: 'from-teal-600 to-teal-700' },
    { label: 'Dossier médical', icon: Activity, href: '/health-records', color: 'from-blue-600 to-blue-700' },
    { label: 'Mes documents', icon: FileText, href: '/medical-documents', color: 'from-violet-600 to-violet-700' },
    { label: 'Mes favoris', icon: Heart, href: '/favorites', color: 'from-rose-600 to-rose-700' },
    { label: 'Établissements', icon: Building2, href: '/facilities', color: 'from-amber-600 to-amber-700' },
    { label: 'Mes avis', icon: Star, href: '/reviews', color: 'from-emerald-600 to-emerald-700' },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'vous';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm mb-1">{getGreeting()},</p>
          <h1 className="text-3xl font-bold text-white capitalize">{firstName}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/doctors"
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors text-sm shrink-0"
        >
          <Stethoscope className="w-4 h-4" />
          Prendre RDV
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, href, badge }) => (
          <Link
            key={label}
            href={href as any}
            className="relative bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors group"
          >
            {badge && value > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-2xl font-bold ${value > 0 && badge ? 'text-white' : 'text-white'}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Next appointment */}
      {nextAppt ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Prochain rendez-vous</h2>
            <Link href="/appointments" className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1">
              Voir tous <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-gradient-to-r from-teal-900/40 to-slate-800 rounded-2xl border border-teal-500/20 p-5">
            <div className="flex items-start gap-4">
              {/* Date block */}
              <div className="shrink-0 bg-teal-600/20 border border-teal-500/30 rounded-xl p-3 text-center min-w-[60px]">
                <div className="text-teal-400 font-bold text-lg leading-none">
                  {new Date(nextAppt.slot!.start).getDate()}
                </div>
                <div className="text-teal-400/70 text-xs mt-0.5 capitalize">
                  {new Date(nextAppt.slot!.start).toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 bg-teal-500/10 rounded-full px-2.5 py-0.5">
                    <Clock className="w-3 h-3" />
                    {fmtTime(nextAppt.slot!.start)}
                  </span>
                  {nextAppt.status === 'CONFIRMED' && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                      <CheckCircle className="w-3 h-3" /> Confirmé
                    </span>
                  )}
                  {nextAppt.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5">
                      <AlertCircle className="w-3 h-3" /> En attente
                    </span>
                  )}
                </div>
                <p className="font-semibold text-white capitalize">{fmtDate(nextAppt.slot!.start)}</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  {nextAppt.doctor?.fullName ?? 'Médecin'}{nextAppt.kind?.name ? ` • ${nextAppt.kind.name}` : ''}
                </p>
              </div>

              <Link
                href="/appointments"
                className="shrink-0 p-2 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Upcoming list (next 2 after first) */}
            {upcoming.length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                {upcoming.slice(1, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-300 capitalize">{fmtDate(a.slot!.start)}</span>
                    <span className="text-slate-500">{fmtTime(a.slot!.start)}</span>
                    <span className="text-slate-500 ml-auto">{a.doctor?.fullName ?? 'Médecin'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 p-8 text-center">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Aucun rendez-vous à venir</h3>
          <p className="text-sm text-slate-400 mb-5">Prenez rendez-vous avec un médecin en quelques clics</p>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-500 transition-colors"
          >
            <Stethoscope className="w-4 h-4" />
            Trouver un médecin
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map(({ label, icon: Icon, href, color }) => (
            <Link
              key={label}
              href={href as any}
              className="group flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all hover:-translate-y-0.5"
            >
              <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Health tips */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Pill className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="font-semibold text-white">Santé au quotidien</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '💧', label: '8 verres d\'eau / jour', color: 'text-blue-400' },
            { icon: '🏃', label: '30 min d\'activité / jour', color: 'text-green-400' },
            { icon: '😴', label: '7-8h de sommeil / nuit', color: 'text-violet-400' },
          ].map(({ icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 bg-slate-700/30 rounded-xl p-3">
              <span className="text-xl">{icon}</span>
              <span className={`text-xs font-medium ${color}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
