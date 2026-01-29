'use client';

import Link from 'next/link';
import {
  X,
  Loader2,
  User,
  CalendarPlus,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
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
  doctor?: {
    id: string;
    name?: string;
    fullName?: string;
    avatarUrl?: string;
  } | null;
  hospital?: {
    id: string;
    name: string;
  } | null;
  kind?: {
    name: string;
  } | null;
}

export interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: () => void;
  isLoading?: boolean;
  showAddToCalendar?: boolean;
  showDoctorLink?: boolean;
  variant?: 'default' | 'compact';
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; icon: React.ReactNode; bgClass: string; textClass: string; borderClass: string }
> = {
  PENDING: {
    label: 'En attente',
    icon: <Clock className="w-3.5 h-3.5" />,
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  CONFIRMED: {
    label: 'Confirmé',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
  },
  CANCELLED: {
    label: 'Annulé',
    icon: <XCircle className="w-3.5 h-3.5" />,
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
  },
  NO_SHOW: {
    label: 'Absent',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    bgClass: 'bg-slate-500/20',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
  },
};

export default function AppointmentCard({
  appointment,
  onCancel,
  isLoading = false,
  showAddToCalendar = true,
  showDoctorLink = true,
  variant = 'default',
}: AppointmentCardProps) {
  const start = appointment.slot?.start ? new Date(appointment.slot.start) : null;
  const now = new Date();
  const isUpcoming = start ? start > now : false;
  const isPast = start ? start <= now : false;

  const doctorName =
    appointment.doctor?.fullName ||
    appointment.doctor?.name ||
    (appointment.slot?.ownerType === 'HOSPITAL' ? appointment.hospital?.name : 'Médecin');

  const statusConfig = STATUS_CONFIG[appointment.status];

  // Show "Terminé" for past confirmed appointments
  const displayStatus =
    isPast && appointment.status === 'CONFIRMED'
      ? {
          label: 'Terminé',
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          bgClass: 'bg-teal-500/20',
          textClass: 'text-teal-400',
          borderClass: 'border-teal-500/30',
        }
      : statusConfig;

  const consultationType = appointment.kind?.name || appointment.type || 'Consultation';

  return (
    <div
      className={`bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden transition-all hover:border-slate-600 ${
        appointment.status === 'CANCELLED' ? 'opacity-60' : ''
      }`}
    >
      {/* Top color bar */}
      {variant === 'default' && (
        <div
          className={`h-1 ${
            isUpcoming && appointment.status !== 'CANCELLED'
              ? 'bg-gradient-to-r from-teal-500 to-teal-400'
              : 'bg-slate-700'
          }`}
        />
      )}

      <div className={variant === 'compact' ? 'p-4' : 'p-5'}>
        <div className="flex gap-4 items-start">
          {/* Date/Time Box */}
          <div
            className={`min-w-[72px] text-center py-3 px-3 rounded-xl border ${
              isUpcoming && appointment.status !== 'CANCELLED'
                ? 'bg-teal-500/10 border-teal-500/30'
                : 'bg-slate-700/50 border-slate-600'
            }`}
          >
            {start ? (
              <>
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    isUpcoming && appointment.status !== 'CANCELLED'
                      ? 'text-teal-400'
                      : 'text-slate-500'
                  }`}
                >
                  {start.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
                <div
                  className={`text-2xl font-bold leading-tight ${
                    isUpcoming && appointment.status !== 'CANCELLED'
                      ? 'text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {start.getDate()}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {start.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500 py-2">À définir</div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white truncate">{doctorName}</h3>
                <div className="text-[13px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{consultationType}</span>
                  {start && (
                    <span className="hidden sm:inline text-slate-500">
                      • {start.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </span>
                  )}
                </div>
                {appointment.hospital?.name && (
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {appointment.hospital.name}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${displayStatus.bgClass} ${displayStatus.textClass} ${displayStatus.borderClass}`}
              >
                {displayStatus.icon}
                {displayStatus.label}
              </span>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border-l-2 border-teal-500/50 text-[13px] text-slate-300 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{appointment.notes}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {showDoctorLink && appointment.slot?.ownerId && (
                <Link
                  href={`/doctors/${appointment.slot.ownerId}` as const}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-slate-600 hover:text-white transition-colors border border-slate-600"
                >
                  <User className="w-4 h-4" />
                  Voir le médecin
                </Link>
              )}

              {onCancel && isUpcoming && appointment.status !== 'CANCELLED' && (
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className={`px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-red-500/20 transition-colors border border-red-500/30 ${
                    isLoading ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Annulation...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Annuler
                    </>
                  )}
                </button>
              )}

              {showAddToCalendar && isUpcoming && appointment.status === 'CONFIRMED' && (
                <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-teal-500 transition-colors">
                  <CalendarPlus className="w-4 h-4" />
                  Ajouter au calendrier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer with creation date */}
        {variant === 'default' && (
          <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-slate-500">
            Réservé le{' '}
            {new Date(appointment.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
