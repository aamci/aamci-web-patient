'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Mail, Globe, ChevronRight } from 'lucide-react';

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

const FACILITY_TYPE_LABELS: Record<string, string> = {
  CLINIC: 'Clinique',
  CHU: 'CHU',
  POLYCLINIC: 'Polyclinique',
  CENTER: 'Centre Medical',
};

export default function FacilityDetailClient({ facilityId }: { facilityId: string }) {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [facility, setFacility] = useState<Facility | null>(null);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  // Liste des spécialités disponibles
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

  // Filtrer les médecins par spécialité
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
    return <div className="card mt-6">Chargement...</div>;
  }

  if (!facility) {
    return (
      <div className="card mt-6">
        <p>Etablissement non trouve.</p>
        <Link href="/facilities" className="btn primary mt-4">
          Retour a la liste
        </Link>
      </div>
    );
  }

  const typeLabel = FACILITY_TYPE_LABELS[facility.type] || facility.type;
  let services: string[] = [];
  try {
    services = facility.services ? JSON.parse(facility.services) : [];
  } catch {
    services = [];
  }

  return (
    <div className="grid gap-6 py-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 flex items-center gap-1">
        <Link href="/facilities" className="text-sky-700 no-underline hover:underline">
          Etablissements
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span>{facility.name}</span>
      </div>

      {/* Informations de l'établissement */}
      <div className="card">
        <div className="grid gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="m-0 text-2xl font-bold">{facility.name}</h1>
              <span className="inline-block mt-2.5 px-3.5 py-1.5 rounded-md text-sm font-semibold bg-sky-100 text-sky-700">
                {typeLabel}
              </span>
            </div>
          </div>

          {facility.description && (
            <p className="m-0 text-base text-gray-700 leading-relaxed">
              {facility.description}
            </p>
          )}

          <div className="grid gap-3 text-base">
            {facility.address && (
              <div className="flex gap-2.5 items-start">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">{facility.address}</div>
                  {facility.city && <div className="text-gray-600">{facility.city}</div>}
                </div>
              </div>
            )}
            {facility.phone && (
              <div className="flex gap-2.5 items-center">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <a href={`tel:${facility.phone}`} className="text-sky-700 no-underline hover:underline">
                  {facility.phone}
                </a>
              </div>
            )}
            {facility.email && (
              <div className="flex gap-2.5 items-center">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <a href={`mailto:${facility.email}`} className="text-sky-700 no-underline hover:underline">
                  {facility.email}
                </a>
              </div>
            )}
            {facility.website && (
              <div className="flex gap-2.5 items-center">
                <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 no-underline hover:underline"
                >
                  {facility.website}
                </a>
              </div>
            )}
          </div>

          {services.length > 0 && (
            <div>
              <h3 className="mt-4 mb-2.5 text-base font-semibold">Services disponibles</h3>
              <div className="flex flex-wrap gap-2">
                {services.map((service, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full text-sm bg-sky-50 text-sky-700 border border-sky-200"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste des médecins */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0 text-xl font-bold">
            Medecins ({filteredDoctors.length})
          </h2>

          {specialties.length > 0 && (
            <select
              className="input max-w-[250px]"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">Toutes les specialites</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          )}
        </div>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {!filteredDoctors.length && (
            <div className="card">
              {selectedSpecialty
                ? `Aucun medecin trouve pour la specialite "${selectedSpecialty}".`
                : 'Aucun medecin associe a cet etablissement.'}
            </div>
          )}
          {filteredDoctors.map((doctor) => {
            const fullName = doctor.user.fullName || 'Docteur';
            const specialty = doctor.specialty || 'Medecine generale';

            return (
              <Link
                key={doctor.id}
                href={`/doctors/${doctor.user.id}`}
                className="no-underline text-inherit"
              >
                <div className="card grid gap-2.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex gap-3 items-center">
                    {doctor.user.avatarUrl ? (
                      <img
                        src={doctor.user.avatarUrl}
                        alt={fullName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-xl font-semibold text-sky-700">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="m-0 text-base font-semibold">{fullName}</h4>
                      <p className="m-0 mt-1 text-sm text-gray-600">{specialty}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
