'use client';

import Link from 'next/link';
import { MapPin, Phone, Calendar, ChevronRight, Building2 } from 'lucide-react';
import FavoriteButton from '@/app/_components/FavoriteButton';

export interface Doctor {
  id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  doctorProfile?: {
    specialty?: string | null;
    city?: string | null;
    address?: string | null;
    presentation?: string | null;
    hospitalType?: string | null;
  } | null;
}

export interface DoctorCardProps {
  doctor: Doctor;
  showFavorite?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
  showPresentation?: boolean;
  presentationMaxLength?: number;
  footer?: React.ReactNode;
  onRemoveFavorite?: () => void;
  isRemovingFavorite?: boolean;
  variant?: 'default' | 'compact';
  animationDelay?: number;
}

export default function DoctorCard({
  doctor,
  showFavorite = true,
  showPhone = false,
  showAddress = false,
  showPresentation = true,
  presentationMaxLength = 150,
  footer,
  onRemoveFavorite,
  isRemovingFavorite,
  variant = 'default',
  animationDelay = 0,
}: DoctorCardProps) {
  const prof = doctor.doctorProfile || {};
  const fullName = doctor.fullName || doctor.email || 'Docteur';
  const specialty = prof.specialty || 'Médecine générale';
  const cityName = prof.city || doctor.city || '—';
  const hospitalType = prof.hospitalType || '';
  const presentation = prof.presentation || '';
  const address = prof.address || '';
  const phone = doctor.phone || '';

  const initials = fullName.charAt(0).toUpperCase();

  return (
    <div
      className="group bg-slate-800 rounded-2xl border border-slate-700 p-5 relative hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'backwards' }}
    >
      {/* Gradient accent on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 to-teal-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Favorite Button */}
      {showFavorite && (
        <div className="absolute top-4 right-4 z-10">
          {onRemoveFavorite ? (
            <button
              onClick={onRemoveFavorite}
              disabled={isRemovingFavorite}
              className={`p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all ${
                isRemovingFavorite ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Retirer des favoris"
            >
              <svg
                className="w-4 h-4 text-red-400 fill-red-400"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          ) : (
            <FavoriteButton doctorId={doctor.id} size="sm" />
          )}
        </div>
      )}

      {/* Doctor Info Header */}
      <div className="flex items-start gap-4 mb-4 pr-10">
        {doctor.avatarUrl ? (
          <img
            src={doctor.avatarUrl}
            alt={fullName}
            className={`rounded-xl object-cover flex-shrink-0 ring-2 ring-slate-700 group-hover:ring-teal-500/50 transition-all ${
              variant === 'compact' ? 'w-12 h-12' : 'w-14 h-14'
            }`}
          />
        ) : (
          <div
            className={`rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-slate-700 group-hover:ring-teal-500/50 transition-all ${
              variant === 'compact' ? 'w-12 h-12 text-lg' : 'w-14 h-14 text-xl'
            }`}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
            {fullName}
          </h3>
          <p className="text-sm text-teal-400 truncate font-medium">{specialty}</p>
          <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
            <span className="truncate">{cityName}</span>
            {hospitalType && (
              <>
                <span className="text-slate-600">•</span>
                <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <span className="truncate">{hospitalType}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Presentation */}
      {showPresentation && presentation && (
        <p className="text-[13px] text-slate-400 mb-4 line-clamp-2 leading-relaxed">
          {presentation.length > presentationMaxLength
            ? presentation.slice(0, presentationMaxLength) + '...'
            : presentation}
        </p>
      )}

      {/* Contact Info */}
      {(showPhone || showAddress) && (phone || address) && (
        <div className="text-sm text-slate-400 space-y-2 mb-4 p-3 bg-slate-900/50 rounded-xl">
          {showPhone && phone && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500/10 rounded-lg">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <span>{phone}</span>
            </div>
          )}
          {showAddress && address && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500/10 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <span className="truncate">{address}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer (e.g., date added) */}
      {footer && (
        <div className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {footer}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          href={`/doctors/${doctor.id}` as const}
          className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm font-medium text-slate-300 text-center hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          Voir la fiche
          <ChevronRight className="w-4 h-4 opacity-50" />
        </Link>
        <Link
          href={`/doctors/${doctor.id}#slots` as any}
          className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium text-center hover:bg-teal-500 transition-colors flex items-center justify-center gap-1"
        >
          <Calendar className="w-4 h-4" />
          Prendre RDV
        </Link>
      </div>
    </div>
  );
}
