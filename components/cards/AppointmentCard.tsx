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
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** Is the cancel action loading */
  isLoading?: boolean;
  /** Show "Add to calendar" button */
  showAddToCalendar?: boolean;
  /** Show doctor profile link */
  showDoctorLink?: boolean;
  /** Compact variant without some decorations */
  variant?: 'default' | 'compact';
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; icon: React.ReactNode; bgClass: string; textClass: string }
> = {
  PENDING: {
    label: 'En attente',
    icon: <Clock className="w-3.5 h-3.5" />,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-600',
  },
  CONFIRMED: {
    label: 'Confirmé',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    bgClass: 'bg-green-100',
    textClass: 'text-green-600',
  },
  CANCELLED: {
    label: 'Annulé',
    icon: <XCircle className="w-3.5 h-3.5" />,
    bgClass: 'bg-red-100',
    textClass: 'text-red-600',
  },
  NO_SHOW: {
    label: 'Absent',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-500',
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
          bgClass: 'bg-blue-100',
          textClass: 'text-blue-600',
        }
      : statusConfig;

  const consultationType = appointment.kind?.name || appointment.type || 'Consultation';

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm ${
        appointment.status === 'CANCELLED' ? 'opacity-70' : ''
      }`}
    >
      {/* Top color bar */}
      {variant === 'default' && (
        <div
          className={`h-1 ${
            isUpcoming && appointment.status !== 'CANCELLED' ? 'bg-green-500' : 'bg-gray-200'
          }`}
        />
      )}

      <div className={variant === 'compact' ? 'p-4' : 'p-5'}>
        <div className="flex gap-4 items-start">
          {/* Date/Time Box */}
          <div
            className={`min-w-[70px] text-center py-3 px-2 rounded-xl border ${
              isUpcoming && appointment.status !== 'CANCELLED'
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {start ? (
              <>
                <div
                  className={`text-[11px] font-semibold uppercase ${
                    isUpcoming && appointment.status !== 'CANCELLED'
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {start.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
                <div
                  className={`text-2xl font-bold leading-tight ${
                    isUpcoming && appointment.status !== 'CANCELLED'
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  {start.getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {start.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400 py-2">À définir</div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{doctorName}</h3>
                <div className="text-[13px] text-gray-500 mt-0.5">
                  {consultationType}
                  {start && (
                    <span className="hidden sm:inline">
                      {' '}• {start.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${displayStatus.bgClass} ${displayStatus.textClass}`}
              >
                {displayStatus.icon}
                {displayStatus.label}
              </span>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border-l-[3px] border-gray-200 text-[13px] text-gray-600 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{appointment.notes}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {showDoctorLink && appointment.slot?.ownerId && (
                <Link
                  href={`/doctors/${appointment.slot.ownerId}` as const}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Voir le médecin
                </Link>
              )}

              {onCancel && isUpcoming && appointment.status !== 'CANCELLED' && (
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className={`px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-red-100 transition-colors ${
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
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
                  <CalendarPlus className="w-4 h-4" />
                  Ajouter au calendrier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer with creation date */}
        {variant === 'default' && (
          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
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
