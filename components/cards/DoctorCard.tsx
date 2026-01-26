'use client';

import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
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
  /** Show favorite button (heart icon) */
  showFavorite?: boolean;
  /** Show phone number if available */
  showPhone?: boolean;
  /** Show address if available */
  showAddress?: boolean;
  /** Show presentation text */
  showPresentation?: boolean;
  /** Max characters for presentation before truncating */
  presentationMaxLength?: number;
  /** Additional info to display (e.g., "Added on date") */
  footer?: React.ReactNode;
  /** Callback when favorite is removed (for favorites page) */
  onRemoveFavorite?: () => void;
  /** Is favorite being removed (loading state) */
  isRemovingFavorite?: boolean;
  /** Card variant */
  variant?: 'default' | 'compact';
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 relative hover:border-blue-200 hover:shadow-md transition-all">
      {/* Favorite Button */}
      {showFavorite && (
        <div className="absolute top-4 right-4">
          {onRemoveFavorite ? (
            <button
              onClick={onRemoveFavorite}
              disabled={isRemovingFavorite}
              className={`p-1.5 rounded-full hover:bg-red-50 transition-colors ${
                isRemovingFavorite ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Retirer des favoris"
            >
              <svg
                className="w-5 h-5 text-red-500 fill-red-500"
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
      <div className="flex items-center gap-3 mb-3 pr-8">
        {doctor.avatarUrl ? (
          <img
            src={doctor.avatarUrl}
            alt={fullName}
            className={`rounded-full object-cover flex-shrink-0 ${
              variant === 'compact' ? 'w-10 h-10' : 'w-12 h-12'
            }`}
          />
        ) : (
          <div
            className={`rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold flex-shrink-0 ${
              variant === 'compact' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'
            }`}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{fullName}</h3>
          <p className="text-sm text-blue-600 truncate">{specialty}</p>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {cityName}
              {hospitalType && ` • ${hospitalType}`}
            </span>
          </div>
        </div>
      </div>

      {/* Presentation */}
      {showPresentation && presentation && (
        <p className="text-[13px] text-gray-600 mb-4 line-clamp-2">
          {presentation.length > presentationMaxLength
            ? presentation.slice(0, presentationMaxLength) + '...'
            : presentation}
        </p>
      )}

      {/* Contact Info */}
      {(showPhone || showAddress) && (phone || address) && (
        <div className="text-sm text-gray-500 space-y-1 mb-4">
          {showPhone && phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{phone}</span>
            </div>
          )}
          {showAddress && address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{address}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer (e.g., date added) */}
      {footer && (
        <div className="text-xs text-gray-400 mb-4">{footer}</div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          href={`/doctors/${doctor.id}` as const}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 text-center hover:bg-gray-50 transition-colors"
        >
          Voir la fiche
        </Link>
        <Link
          href={`/doctors/${doctor.id}#slots` as any}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition-colors"
        >
          Prendre RDV
        </Link>
      </div>
    </div>
  );
}
