'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronRight,
  Building2,
  Stethoscope,
  ArrowLeft,
  Loader2,
  Calendar,
  Hospital,
  Building,
  Home,
  Landmark,
  Filter,
  Users,
} from 'lucide-react';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

interface Doctor {
  id: string;
  specialty?: string;
  user: {
    id: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

interface Facility {
  id: string;
  name: string;
  type: 'CLINIC' | 'CHU' | 'POLYCLINIC' | 'CENTER';
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  services?: string;
  doctors?: Doctor[];
}

const FACILITY_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  CLINIC: {
    label: 'Clinique',
    icon: <Home className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  CHU: {
    label: 'CHU',
    icon: <Hospital className="w-5 h-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
  POLYCLINIC: {
    label: 'Polyclinique',
    icon: <Building className="w-5 h-5" />,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
  },
  CENTER: {
    label: 'Centre Médical',
    icon: <Landmark className="w-5 h-5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
};

export default function FacilityDetailClient({ facilityId }: { facilityId: string }) {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [facility, setFacility] = useState<Facility | null>(null);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const specialties = useMemo(() => {
    if (!facility?.doctors) return [];
    const uniqueSpecialties = new Set(
      facility.doctors.map((d) => d.specialty).filter((s): s is string => !!s)
    );
    return Array.from(uniqueSpecialties).sort();
  }, [facility]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const url = apiBase
        ? `${apiBase}/facilities/${facilityId}`
        : `/facilities/${facilityId}`;

      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Facility not found');
        }
        const data = await res.json();
        setFacility(data);
        setFilteredDoctors(data.doctors || []);
      } catch (error) {
        console.error('Error loading facility:', error);
        setFacility(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, facilityId]);

  useEffect(() => {
    if (!facility?.doctors) return;

    if (!selectedSpecialty) {
      setFilteredDoctors(facility.doctors);
    } else {
      setFilteredDoctors(
        facility.doctors.filter((d) => d.specialty === selectedSpecialty)
      );
    }
  }, [selectedSpecialty, facility]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-800 rounded-2xl">
              <Building2 className="w-12 h-12 text-slate-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Établissement non trouvé</h3>
          <p className="text-slate-400 mb-6">
            Cet établissement n'existe pas ou a été supprimé
          </p>
          <Link
            href="/facilities"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const config = FACILITY_TYPE_CONFIG[facility.type] || FACILITY_TYPE_CONFIG.CENTER;
  let services: string[] = [];
  try {
    services = facility.services ? JSON.parse(facility.services) : [];
  } catch {
    services = [];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/facilities"
          className="text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Établissements
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span className="text-slate-400 truncate">{facility.name}</span>
      </div>

      {/* Facility Info Card */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {/* Header with gradient */}
        <div className={`h-2 ${config.bgColor.replace('/20', '')}`} />

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
            {/* Icon */}
            <div className={`p-4 rounded-2xl ${config.bgColor} ${config.color} flex-shrink-0`}>
              {config.icon}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{facility.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${config.bgColor} ${config.color} ${config.borderColor}`}>
                {config.icon}
                {config.label}
              </span>
            </div>

            {/* Doctor count badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 rounded-xl border border-teal-500/30">
              <Users className="w-5 h-5 text-teal-400" />
              <div>
                <div className="text-lg font-bold text-white">{facility.doctors?.length || 0}</div>
                <div className="text-xs text-teal-400">Médecins</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {facility.description && (
            <p className="text-slate-300 leading-relaxed mb-6">
              {facility.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {facility.address && (
              <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-xl">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{facility.address}</div>
                  {facility.city && <div className="text-sm text-slate-400">{facility.city}</div>}
                </div>
              </div>
            )}
            {facility.phone && (
              <a
                href={`tel:${facility.phone}`}
                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Phone className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-sm font-medium text-teal-400">{facility.phone}</span>
              </a>
            )}
            {facility.email && (
              <a
                href={`mailto:${facility.email}`}
                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-blue-400 truncate">{facility.email}</span>
              </a>
            )}
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Globe className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-purple-400 truncate">{facility.website}</span>
              </a>
            )}
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Services disponibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {services.map((service, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-600"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doctors Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-xl">
              <Stethoscope className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Médecins ({filteredDoctors.length})
            </h2>
          </div>

          {specialties.length > 0 && (
            <div className="relative">
              <select
                className="appearance-none py-2.5 px-4 pr-10 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">Toutes les spécialités</option>
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          )}
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12 px-6 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-slate-800 rounded-xl">
                <Stethoscope className="w-8 h-8 text-slate-600" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              {selectedSpecialty
                ? `Aucun médecin en ${selectedSpecialty}`
                : 'Aucun médecin'}
            </h3>
            <p className="text-sm text-slate-400">
              {selectedSpecialty
                ? 'Essayez une autre spécialité'
                : 'Aucun médecin n\'est associé à cet établissement'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredDoctors.map((doctor, index) => {
              const fullName = doctor.user.fullName || 'Docteur';
              const specialty = doctor.specialty || 'Médecine générale';
              const initials = fullName.charAt(0).toUpperCase();

              return (
                <Link
                  key={doctor.id}
                  href={`/doctors/${doctor.user.id}`}
                  className="group block"
                >
                  <div
                    className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      {doctor.user.avatarUrl ? (
                        <img
                          src={doctor.user.avatarUrl}
                          alt={fullName}
                          className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-700 group-hover:ring-teal-500/50 transition-all"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold ring-2 ring-slate-700 group-hover:ring-teal-500/50 transition-all">
                          {initials}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
                          {fullName}
                        </h4>
                        <p className="text-sm text-teal-400 truncate">{specialty}</p>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium group-hover:bg-teal-500 transition-colors">
                          <Calendar className="w-3.5 h-3.5" />
                          RDV
                        </span>
                        <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
