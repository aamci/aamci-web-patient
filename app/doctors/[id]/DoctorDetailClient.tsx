'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Phone,
  Mail,
  Clock,
  Award,
  GraduationCap,
  Briefcase,
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Check,
  Loader2,
  Building2,
  AlertTriangle,
  User,
  FileText,
  MessageSquare,
  Bell,
  Flag,
} from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';
import ReportBlockModal from '@/components/ReportBlockModal';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

type Doctor = {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  doctorProfile?: {
    specialty?: string | null;
    hospitalType?: string | null;
    address?: string | null;
    city?: string | null;
    presentation?: string | null;
    formations?: string | null;
    experiences?: string | null;
    consultationPrice?: number | null;
    languages?: string | null;
  } | null;
};

type Slot = {
  id: string;
  start: string;
  end: string;
  status?: string;
  appointments?: Array<unknown>;
};

type AppointmentKind = {
  id: string;
  label: string;
  durationMinutes: number;
  price?: number | null;
  color?: string | null;
  requiresPrePayment?: boolean;
};

const DAYS_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Generate a YYYY-MM-DD key using local timezone (not UTC) */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DoctorDetailClient({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const apiBase = useMemo(() => getApiBase(), []);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState<'info' | 'slots' | 'reviews'>('slots');

  // Booking modal - multi-step flow
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedKind, setSelectedKind] = useState<string | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingStep, setBookingStep] = useState<'pour_qui' | 'lieu' | 'type' | 'details' | 'payment' | 'confirm'>('pour_qui');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'onsite'>('card');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [bookingFor, setBookingFor] = useState<'me' | 'other'>('me');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');

  // Saved beneficiaries (proches)
  type SavedBeneficiary = { id: string; firstName: string; lastName: string; relationship: string; phone?: string | null };
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<SavedBeneficiary[]>([]);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);

  // Établissements du médecin
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; type: string; city: string | null; address: string | null }>>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  // Load doctor, slots, appointment kinds
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch doctor
        const doctorUrl = apiBase ? `${apiBase}/search/doctors` : '/search/doctors';
        const doctorRes = await fetch(doctorUrl, { cache: 'no-store' });
        const doctors = await doctorRes.json().catch(() => []);
        const found = Array.isArray(doctors) ? doctors.find((d: Doctor) => d.id === doctorId) : null;

        if (found) {
          setDoctor(found);
        } else {
          // Fallback
          setDoctor({
            id: doctorId,
            fullName: 'Dr. Médecin',
            city: 'Paris',
            doctorProfile: {
              specialty: 'Médecine générale',
              hospitalType: 'Cabinet',
              address: '123 Rue de la Santé, 75014 Paris',
              presentation: 'Médecin généraliste expérimenté, à votre écoute pour tous vos besoins de santé.',
            },
          });
        }

        // Fetch available slots (generated from doctor's AvailabilityRules)
        const slotsUrl = apiBase ? `${apiBase}/slots/available/${doctorId}` : `/slots/available/${doctorId}`;
        const slotsRes = await fetch(slotsUrl, { cache: 'no-store' });
        const slotsData = await slotsRes.json().catch(() => []);
        const slotsList: Slot[] = Array.isArray(slotsData) ? slotsData : slotsData?.data || [];
        setSlots(slotsList);

        // Fetch appointment kinds (public endpoint)
        const kindsUrl = apiBase ? `${apiBase}/appointment-kinds/doctor/${doctorId}` : `/appointment-kinds/doctor/${doctorId}`;
        const kindsRes = await fetch(kindsUrl, { cache: 'no-store' });
        const kindsData = await kindsRes.json().catch(() => []);
        const rawKinds = Array.isArray(kindsData) ? kindsData : kindsData?.data || [];
        const kindsList: AppointmentKind[] = rawKinds.map((k: any) => ({
          id: k.id,
          label: k.name || k.label || 'Consultation',
          durationMinutes: k.durationMins || k.durationMinutes || 30,
          price: k.price ?? null,
          color: k.color ?? null,
          requiresPrePayment: k.requiresPrePayment ?? false,
        }));
        setAppointmentKinds(kindsList);
        if (kindsList.length > 0) {
          setSelectedKind(kindsList[0].id);
        }

        // Fetch doctor's facilities (public endpoint)
        try {
          const facilUrl = apiBase ? `${apiBase}/doctor-profiles/${doctorId}/facilities` : `/doctor-profiles/${doctorId}/facilities`;
          const facilRes = await fetch(facilUrl, { cache: 'no-store' });
          const facilData = await facilRes.json().catch(() => []);
          const facilList = Array.isArray(facilData) ? facilData : [];
          setFacilities(facilList);
          if (facilList.length === 1) setSelectedFacilityId(facilList[0].id);
        } catch { /* facilities optionnel */ }

        // Check favorite status
        if (user) {
          const token = localStorage.getItem('token');
          if (token) {
            const favUrl = apiBase ? `${apiBase}/favorites` : '/favorites';
            const favRes = await fetch(favUrl, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            });
            const favData = await favRes.json().catch(() => []);
            const favorites = Array.isArray(favData) ? favData : favData?.data || [];
            setIsFavorite(favorites.some((f: { id: string }) => f.id === doctorId));
          }
        }
      } catch (error) {
        console.error('Error loading doctor data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [apiBase, doctorId, user]);

  // Get week dates based on offset
  const weekDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Monday

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekOffset]);

  // Earliest available slot across all weeks
  const earliestSlot = useMemo(() => {
    if (slots.length === 0) return null;
    return slots.reduce((min, s) => new Date(s.start) < new Date(min.start) ? s : min, slots[0]);
  }, [slots]);

  // Group slots by day and hour
  const slotsGrid = useMemo(() => {
    const grid: Record<string, Record<string, Slot>> = {};
    const hoursSet = new Set<string>();

    for (const slot of slots) {
      const date = new Date(slot.start);
      const dayKey = toLocalDateKey(date);
      const hourKey = date.toTimeString().substring(0, 5);

      if (!grid[dayKey]) grid[dayKey] = {};
      grid[dayKey][hourKey] = slot;
      hoursSet.add(hourKey);
    }

    const hours = Array.from(hoursSet).sort();
    return { grid, hours };
  }, [slots]);

  // Toggle favorite
  async function joinWaitlist() {
    if (!user) { router.push('/auth/login'); return; }
    setWaitlistLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
      const res = await fetch(`${apiBase}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId, date: dateStr }),
      });
      if (res.ok || res.status === 400) setWaitlistJoined(true);
    } catch { /* silent */ } finally { setWaitlistLoading(false); }
  }

  async function toggleFavorite() {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = apiBase ? `${apiBase}/favorites/${doctorId}` : `/favorites/${doctorId}`;

      if (isFavorite) {
        await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(false);
      } else {
        await fetch(apiBase ? `${apiBase}/favorites` : '/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ doctorId }),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  }

  // Book appointment
  async function confirmBooking() {
    if (!selectedSlot) return;

    setBooking(true);
    setBookingError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setBookingError('Veuillez vous connecter pour réserver.');
        return;
      }

      const url = apiBase ? `${apiBase}/appointments` : '/appointments';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          kindId: selectedKind || undefined,
          notes: bookingNotes || `RDV avec ${doctor?.fullName || 'le médecin'}`,
          doctorId: doctorId,
          facilityId: selectedFacilityId || undefined,
          beneficiaryName: bookingFor === 'other' ? beneficiaryName || undefined : undefined,
          beneficiaryPhone: bookingFor === 'other' ? beneficiaryPhone || undefined : undefined,
          ...(recurrenceEnabled ? { recurrence: { frequency: recurrenceFrequency, count: recurrenceCount } } : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Erreur ${response.status}`);
      }

      const data = await response.json();
      setBookingSuccess(true);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));

      // Check if kind requires pre-payment
      const kind = appointmentKinds.find(k => k.id === selectedKind);
      const requiresPayment = (kind as any)?.requiresPrePayment ?? false;

      if (requiresPayment && data.id) {
        // Create payment intent and redirect to Stripe payment page
        const token = localStorage.getItem('token');
        const piRes = await fetch(`${apiBase}/payments/prepay/${data.id}/create-intent`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (piRes.ok) {
          const pi = await piRes.json();
          const cs = pi.clientSecret ?? pi.client_secret ?? '';
          router.push(`/paiement?aid=${data.id}&cs=${encodeURIComponent(cs)}` as any);
          return;
        }
      }

      // Redirect after success
      setTimeout(() => {
        router.push(`/doctors/${doctorId}/success?aid=${data.id || ''}`);
      }, 1500);
    } catch (error: unknown) {
      setBookingError(error instanceof Error ? error.message : 'Erreur lors de la réservation');
    } finally {
      setBooking(false);
    }
  }

  function closeModal() {
    setSelectedSlot(null);
    setBookingError(null);
    setBookingSuccess(false);
    setBookingNotes('');
    setBookingStep('pour_qui');
    setPaymentMethod('card');
    setAcceptedTerms(false);
    setBookingFor('me');
    setBeneficiaryName('');
    setBeneficiaryPhone('');
    setRecurrenceEnabled(false);
    setRecurrenceCount(4);
    setRecurrenceFrequency('WEEKLY');
    if (facilities.length !== 1) setSelectedFacilityId(null);
  }

  function getSelectedKindDetails() {
    return appointmentKinds.find(k => k.id === selectedKind);
  }

  function getBookingPrice() {
    const kind = getSelectedKindDetails();
    if (kind?.price) return kind.price;
    return prof?.consultationPrice || 50;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'DR';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Médecin introuvable</h2>
          <p className="text-slate-400 mb-4">Ce profil n'existe pas ou a été supprimé.</p>
          <Link href="/doctors" className="text-teal-400 hover:text-teal-300">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const prof = doctor.doctorProfile;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Back button */}
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Link>

          {/* Doctor info */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {doctor.avatarUrl ? (
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.fullName || 'Médecin'}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center border-4 border-slate-700">
                  <span className="text-4xl font-bold text-white">
                    {getInitials(doctor.fullName)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {doctor.fullName || 'Dr. Médecin'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    {prof?.specialty && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full text-sm">
                        <Award className="w-4 h-4" />
                        {prof.specialty}
                      </span>
                    )}
                    {prof?.hospitalType && (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Building2 className="w-4 h-4" />
                        {prof.hospitalType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={`p-3 rounded-xl transition-colors ${
                      isFavorite
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  {user && (
                    <button
                      onClick={() => setShowReport(true)}
                      className="p-3 rounded-xl bg-slate-700 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                      title="Signaler ce médecin"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
                {(prof?.address || prof?.city || doctor.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-500" />
                    {prof?.address || prof?.city || doctor.city}
                  </div>
                )}
                {doctor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-500" />
                    {doctor.phone}
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-500" />
                    {doctor.email}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-4">
                {prof?.consultationPrice && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{prof.consultationPrice} FCFA</div>
                    <div className="text-xs text-slate-500">Consultation</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{slots.length}</div>
                  <div className="text-xs text-slate-500">Créneaux dispo.</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xl font-bold text-white">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    4.8
                  </div>
                  <div className="text-xs text-slate-500">Note moyenne</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'slots' as const, label: 'Créneaux', icon: Calendar },
              { id: 'info' as const, label: 'Informations', icon: FileText },
              { id: 'reviews' as const, label: 'Avis', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Slots Tab */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            {/* Premier créneau disponible */}
            {earliestSlot && (
              <div className="flex items-center justify-between bg-teal-600/10 border border-teal-600/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Premier créneau disponible</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(earliestSlot.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {' '}à{' '}
                      {new Date(earliestSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const slotDate = new Date(earliestSlot.start);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    setWeekOffset(Math.max(0, Math.floor(diffDays / 7)));
                    setSelectedSlot(earliestSlot);
                    setBookingStep('pour_qui');
                  }}
                  className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors shrink-0"
                >
                  Réserver
                </button>
              </div>
            )}

            {/* Week navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                disabled={weekOffset === 0}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">
                  {weekDates[0].getDate()} - {weekDates[6].getDate()} {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}
                </h3>
                <p className="text-sm text-slate-400">
                  {weekOffset === 0 ? 'Cette semaine' : weekOffset === 1 ? 'Semaine prochaine' : `Dans ${weekOffset} semaines`}
                </p>
              </div>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={weekOffset >= 4}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Appointment type selector */}
            {appointmentKinds.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Type de consultation</h4>
                <div className="flex flex-wrap gap-2">
                  {appointmentKinds.map((kind) => (
                    <button
                      key={kind.id}
                      onClick={() => setSelectedKind(kind.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedKind === kind.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {kind.label}
                      {kind.durationMinutes && (
                        <span className="ml-2 text-xs opacity-70">{kind.durationMinutes} min</span>
                      )}
                      {kind.requiresPrePayment && (
                        <span className="ml-1.5 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                          {kind.price ? `${Number(kind.price).toLocaleString('fr-FR')} FCFA` : 'Prépayé'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Slots grid */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-700/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-700/50">
                        Heure
                      </th>
                      {weekDates.map((date, idx) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                        return (
                          <th
                            key={idx}
                            className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                              isToday ? 'text-teal-400' : isPast ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            <div>{DAYS_LABELS[date.getDay()]}</div>
                            <div className={`text-lg font-bold ${isToday ? 'text-teal-400' : 'text-white'}`}>
                              {date.getDate()}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {slotsGrid.hours.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                          <p>Aucun créneau disponible cette semaine</p>
                          <div className="flex flex-col items-center gap-2 mt-3">
                            <button
                              onClick={() => setWeekOffset((w) => w + 1)}
                              className="text-teal-400 hover:text-teal-300"
                            >
                              Voir la semaine suivante
                            </button>
                            {!waitlistJoined ? (
                              <button
                                onClick={joinWaitlist}
                                disabled={waitlistLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 transition-colors text-sm"
                              >
                                <Bell className="w-4 h-4" />
                                {waitlistLoading ? 'En cours…' : 'M\'alerter si un créneau se libère'}
                              </button>
                            ) : (
                              <span className="flex items-center gap-2 text-violet-400 text-sm">
                                <Bell className="w-4 h-4" />
                                Vous serez notifié(e) si un créneau se libère
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      slotsGrid.hours.map((hour) => (
                        <tr key={hour} className="border-t border-slate-700/50">
                          <td className="px-4 py-2 text-sm font-medium text-slate-300 sticky left-0 bg-slate-800">
                            {hour}
                          </td>
                          {weekDates.map((date, idx) => {
                            const dayKey = toLocalDateKey(date);
                            const slot = slotsGrid.grid[dayKey]?.[hour];
                            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                            return (
                              <td key={idx} className="px-2 py-2 text-center">
                                {slot && !isPast ? (
                                  <button
                                    onClick={() => {
                                      setSelectedSlot(slot);
                                      // Load saved beneficiaries when modal opens
                                      const token = localStorage.getItem('token');
                                      if (token && apiBase) {
                                        fetch(`${apiBase}/beneficiaries`, { headers: { Authorization: `Bearer ${token}` } })
                                          .then(r => r.ok ? r.json() : [])
                                          .then(d => setSavedBeneficiaries(Array.isArray(d) ? d : []))
                                          .catch(() => {});
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-teal-600/20 text-teal-400 rounded-lg text-sm font-medium hover:bg-teal-600 hover:text-white transition-colors"
                                  >
                                    Réserver
                                  </button>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Presentation */}
            {prof?.presentation && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-500" />
                  Présentation
                </h3>
                <p className="text-slate-300 leading-relaxed">{prof.presentation}</p>
              </div>
            )}

            {/* Formations */}
            {prof?.formations && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-500" />
                  Formations
                </h3>
                <p className="text-slate-300 leading-relaxed">{prof.formations}</p>
              </div>
            )}

            {/* Experiences */}
            {prof?.experiences && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-500" />
                  Expériences
                </h3>
                <p className="text-slate-300 leading-relaxed">{prof.experiences}</p>
              </div>
            )}

            {/* Languages */}
            {prof?.languages && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-500" />
                  Langues parlées
                </h3>
                <p className="text-slate-300">{prof.languages}</p>
              </div>
            )}

            {/* Horaires */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" />
                Horaires d'ouverture
              </h3>
              <div className="space-y-2 text-sm">
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => (
                  <div key={day} className="flex justify-between text-slate-300">
                    <span>{day}</span>
                    <span>09:00 - 18:00</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-500">
                  <span>Samedi</span>
                  <span>09:00 - 12:00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Dimanche</span>
                  <span>Fermé</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Reviews summary */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">4.8</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Basé sur 47 avis</div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm text-slate-400 w-8">{stars}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: stars === 5 ? '70%' : stars === 4 ? '20%' : stars === 3 ? '8%' : '2%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample reviews */}
            <div className="space-y-4">
              {[
                { name: 'Marie L.', rating: 5, date: 'Il y a 2 jours', comment: 'Excellent médecin, très à l\'écoute et professionnel. Je recommande vivement.' },
                { name: 'Thomas P.', rating: 5, date: 'Il y a 1 semaine', comment: 'Consultation très agréable. Le docteur prend le temps d\'expliquer et de répondre à toutes les questions.' },
                { name: 'Sophie M.', rating: 4, date: 'Il y a 2 semaines', comment: 'Bon praticien, ponctuel et compétent. Seul bémol : le temps d\'attente pour avoir un rendez-vous.' },
              ].map((review, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{review.name}</div>
                        <div className="text-xs text-slate-400">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal - Multi-step */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Header with steps */}
            <div className="px-5 py-3 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white">
                  {bookingSuccess ? 'Confirmation' :
                   bookingStep === 'pour_qui' ? 'Pour qui ?' :
                   bookingStep === 'lieu' ? 'Choisir le lieu' :
                   bookingStep === 'type' ? 'Type de consultation' :
                   bookingStep === 'details' ? 'Détails du rendez-vous' :
                   bookingStep === 'payment' ? 'Paiement' : 'Récapitulatif'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress steps */}
              {!bookingSuccess && (
                <div className="flex items-center gap-1">
                  {(() => {
                    const STEPS = facilities.length > 1
                      ? ['pour_qui', 'lieu', 'type', 'details', 'payment', 'confirm']
                      : ['pour_qui', 'type', 'details', 'payment', 'confirm'];
                    const currentIdx = STEPS.indexOf(bookingStep);
                    return STEPS;
                  })().map((step, idx, STEPS) => {
                    const currentIdx = STEPS.indexOf(bookingStep);
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                          bookingStep === step ? 'bg-teal-600 text-white' :
                          currentIdx > idx ? 'bg-teal-600/30 text-teal-400' :
                          'bg-slate-700 text-slate-500'
                        }`}>
                          {idx + 1}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-0.5 rounded ${
                            currentIdx > idx ? 'bg-teal-600/50' : 'bg-slate-700'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {bookingSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">Rendez-vous confirmé !</h4>
                  <p className="text-slate-400">Redirection en cours...</p>
                </div>
              ) : (
                <>
                  {/* Date/time info - always visible */}
                  <div className="bg-slate-700/50 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-teal-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">
                          {DAYS_FULL[new Date(selectedSlot.start).getDay()]}{' '}
                          {new Date(selectedSlot.start).getDate()}{' '}
                          {MONTHS[new Date(selectedSlot.start).getMonth()]}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {new Date(selectedSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(selectedSlot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-bold text-teal-400">{getBookingPrice()} FCFA</div>
                        <div className="text-xs text-slate-500">Consultation</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 0: Pour qui */}
                  {/* Étape Lieu — uniquement si le médecin a plusieurs structures */}
                  {bookingStep === 'lieu' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 mb-1">Dans quel établissement souhaitez-vous consulter ?</p>
                      {facilities.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFacilityId(f.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${
                            selectedFacilityId === f.id
                              ? 'border-teal-500 bg-teal-600/10'
                              : 'border-slate-700 hover:border-slate-600 bg-slate-700/50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-teal-600/20 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-teal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">{f.name}</div>
                            {(f.address || f.city) && (
                              <div className="text-xs text-slate-400 mt-0.5">{[f.address, f.city].filter(Boolean).join(', ')}</div>
                            )}
                            <div className="text-xs text-teal-400/70 mt-0.5">{f.type}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 ${
                            selectedFacilityId === f.id ? 'border-teal-500 bg-teal-500' : 'border-slate-500'
                          }`} />
                        </button>
                      ))}
                    </div>
                  )}

                  {bookingStep === 'pour_qui' && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 mb-2">Pour qui prenez-vous rendez-vous ?</p>

                      {/* Moi-même */}
                      <button
                        onClick={() => { setBookingFor('me'); setSelectedBeneficiaryId(null); }}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                          bookingFor === 'me'
                            ? 'border-teal-500 bg-teal-600/10'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-600/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-teal-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{user?.fullName || 'Moi'}</div>
                            <div className="text-xs text-slate-400">Moi-même</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          bookingFor === 'me' ? 'border-teal-500 bg-teal-500' : 'border-slate-500'
                        }`}>
                          {bookingFor === 'me' && <Check className="w-full h-full text-white p-0.5" />}
                        </div>
                      </button>

                      {/* Saved beneficiaries */}
                      {savedBeneficiaries.map((b) => {
                        const isSelected = bookingFor === 'other' && selectedBeneficiaryId === b.id;
                        const relLabel = { enfant: 'Enfant', conjoint: 'Conjoint(e)', parent: 'Parent', autre: 'Proche' }[b.relationship] ?? b.relationship;
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              setBookingFor('other');
                              setSelectedBeneficiaryId(b.id);
                              setBeneficiaryName(`${b.firstName} ${b.lastName}`);
                              setBeneficiaryPhone(b.phone ?? '');
                            }}
                            className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                              isSelected
                                ? 'border-teal-500 bg-teal-600/10'
                                : 'border-slate-700 hover:border-slate-600 bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                                {b.firstName[0]}{b.lastName[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{b.firstName} {b.lastName}</div>
                                <div className="text-xs text-slate-400">{relLabel}</div>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                              isSelected ? 'border-teal-500 bg-teal-500' : 'border-slate-500'
                            }`}>
                              {isSelected && <Check className="w-full h-full text-white p-0.5" />}
                            </div>
                          </button>
                        );
                      })}

                      {/* Manual entry for "someone else" */}
                      <button
                        onClick={() => { setBookingFor('other'); setSelectedBeneficiaryId(null); setBeneficiaryName(''); setBeneficiaryPhone(''); }}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                          bookingFor === 'other' && !selectedBeneficiaryId
                            ? 'border-teal-500 bg-teal-600/10'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Autre personne</div>
                            <div className="text-xs text-slate-400">Saisir manuellement</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          bookingFor === 'other' && !selectedBeneficiaryId ? 'border-teal-500 bg-teal-500' : 'border-slate-500'
                        }`}>
                          {bookingFor === 'other' && !selectedBeneficiaryId && <Check className="w-full h-full text-white p-0.5" />}
                        </div>
                      </button>

                      {bookingFor === 'other' && !selectedBeneficiaryId && (
                        <div className="space-y-3 mt-3">
                          <input
                            type="text"
                            value={beneficiaryName}
                            onChange={(e) => setBeneficiaryName(e.target.value)}
                            placeholder="Nom complet du bénéficiaire"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                          />
                          <input
                            type="tel"
                            value={beneficiaryPhone}
                            onChange={(e) => setBeneficiaryPhone(e.target.value)}
                            placeholder="Téléphone du bénéficiaire (optionnel)"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 1: Type selection */}
                  {bookingStep === 'type' && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 mb-2">Sélectionnez le type de consultation</p>
                      {appointmentKinds.length > 0 ? (
                        appointmentKinds.map((kind) => (
                          <button
                            key={kind.id}
                            onClick={() => setSelectedKind(kind.id)}
                            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                              selectedKind === kind.id
                                ? 'border-teal-500 bg-teal-600/10'
                                : 'border-slate-700 hover:border-slate-600 bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white truncate">{kind.label}</div>
                                <div className="text-xs text-slate-400">{kind.durationMinutes} min</div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {kind.price && (
                                  <div className="text-sm font-bold text-white">{kind.price} FCFA</div>
                                )}
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  selectedKind === kind.id ? 'border-teal-500 bg-teal-500' : 'border-slate-500'
                                }`}>
                                  {selectedKind === kind.id && <Check className="w-full h-full text-white p-0.5" />}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 rounded-xl border-2 border-teal-500 bg-teal-600/10">
                          <div className="text-sm font-medium text-white">Consultation standard</div>
                          <div className="text-xs text-slate-400">30 min</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Details */}
                  {bookingStep === 'details' && (
                    <div className="space-y-4">
                      {/* Doctor info */}
                      <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                        {doctor.avatarUrl ? (
                          <img
                            src={doctor.avatarUrl}
                            alt={doctor.fullName || ''}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                            {getInitials(doctor.fullName)}
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium">{doctor.fullName}</div>
                          <div className="text-slate-400 text-sm">{prof?.specialty}</div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Motif de consultation
                        </label>
                        <textarea
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          placeholder="Décrivez brièvement le motif de votre visite (symptômes, questions...)..."
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-teal-500"
                          rows={4}
                        />
                      </div>

                      {/* Quick symptoms */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Suggestions rapides
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Consultation de suivi', 'Douleur', 'Fièvre', 'Fatigue', 'Bilan de santé', 'Renouvellement ordonnance'].map((symptom) => (
                            <button
                              key={symptom}
                              onClick={() => setBookingNotes(prev => prev ? `${prev}, ${symptom}` : symptom)}
                              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                            >
                              {symptom}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {bookingStep === 'payment' && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-400">Choisissez votre mode de paiement</p>

                      {/* Payment methods */}
                      <div className="space-y-3">
                        {[
                          { id: 'card' as const, label: 'Carte bancaire', desc: 'Visa, Mastercard, CB', icon: '💳' },
                          { id: 'mobile' as const, label: 'Mobile Money', desc: 'Orange Money, MTN, Airtel', icon: '📱' },
                          { id: 'onsite' as const, label: 'Sur place', desc: 'Paiement au cabinet', icon: '🏥' },
                        ].map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                              paymentMethod === method.id
                                ? 'border-teal-500 bg-teal-600/10'
                                : 'border-slate-700 hover:border-slate-600 bg-slate-700/50'
                            }`}
                          >
                            <span className="text-2xl">{method.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-white">{method.label}</div>
                              <div className="text-sm text-slate-400">{method.desc}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              paymentMethod === method.id
                                ? 'border-teal-500 bg-teal-500'
                                : 'border-slate-500'
                            }`}>
                              {paymentMethod === method.id && (
                                <Check className="w-full h-full text-white p-0.5" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Card input (if card selected) */}
                      {paymentMethod === 'card' && (
                        <div className="p-4 bg-slate-700/50 rounded-xl space-y-3">
                          <input
                            type="text"
                            placeholder="Numéro de carte"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                          />
                          <div className="flex gap-3">
                            <input
                              type="text"
                              placeholder="MM/AA"
                              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                            />
                            <input
                              type="text"
                              placeholder="CVV"
                              className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Mobile Money input */}
                      {paymentMethod === 'mobile' && (
                        <div className="p-4 bg-slate-700/50 rounded-xl">
                          <input
                            type="tel"
                            placeholder="Numéro de téléphone"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      )}

                      {paymentMethod === 'onsite' && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
                          Le paiement sera effectué directement au cabinet le jour du rendez-vous.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Confirmation */}
                  {bookingStep === 'confirm' && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-400">Vérifiez les détails de votre réservation</p>

                      {/* Summary */}
                      <div className="bg-slate-700/50 rounded-xl divide-y divide-slate-700">
                        <div className="p-4 flex items-center gap-3">
                          {doctor.avatarUrl ? (
                            <img src={doctor.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                              {getInitials(doctor.fullName)}
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium">{doctor.fullName}</div>
                            <div className="text-slate-400 text-sm">{prof?.specialty}</div>
                          </div>
                        </div>
                        {bookingFor === 'other' && beneficiaryName && (
                          <div className="p-4">
                            <div className="text-sm text-slate-400">Bénéficiaire</div>
                            <div className="text-white">{beneficiaryName}</div>
                            {beneficiaryPhone && <div className="text-slate-400 text-sm">{beneficiaryPhone}</div>}
                          </div>
                        )}
                        {selectedFacilityId && (() => {
                          const f = facilities.find(x => x.id === selectedFacilityId);
                          return f ? (
                            <div className="p-4">
                              <div className="text-sm text-slate-400">Lieu de consultation</div>
                              <div className="text-white font-medium">{f.name}</div>
                              {(f.address || f.city) && <div className="text-slate-400 text-xs mt-0.5">{[f.address, f.city].filter(Boolean).join(', ')}</div>}
                            </div>
                          ) : null;
                        })()}
                        <div className="p-4">
                          <div className="text-sm text-slate-400">Type de consultation</div>
                          <div className="text-white">{getSelectedKindDetails()?.label || 'Consultation standard'}</div>
                        </div>
                        {bookingNotes && (
                          <div className="p-4">
                            <div className="text-sm text-slate-400">Motif</div>
                            <div className="text-white">{bookingNotes}</div>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="text-sm text-slate-400">Paiement</div>
                          <div className="text-white">
                            {paymentMethod === 'card' ? '💳 Carte bancaire' :
                             paymentMethod === 'mobile' ? '📱 Mobile Money' : '🏥 Sur place'}
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <div className="text-sm text-slate-400">Total à payer</div>
                          <div className="text-xl font-bold text-teal-400">{getBookingPrice()} FCFA</div>
                        </div>
                      </div>

                      {/* Récurrence */}
                      <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={recurrenceEnabled}
                            onChange={(e) => setRecurrenceEnabled(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-white font-medium">Rendre ce RDV récurrent</span>
                        </label>
                        {recurrenceEnabled && (
                          <div className="pl-7 grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Fréquence</label>
                              <select
                                value={recurrenceFrequency}
                                onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none"
                              >
                                <option value="WEEKLY">Hebdomadaire</option>
                                <option value="BIWEEKLY">Toutes les 2 semaines</option>
                                <option value="MONTHLY">Mensuel</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Nombre de séances</label>
                              <select
                                value={recurrenceCount}
                                onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none"
                              >
                                {[2,3,4,6,8,10,12].map(n => (
                                  <option key={n} value={n}>{n} séances</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-slate-400">
                          J'accepte les <a href="#" className="text-teal-400 hover:underline">conditions générales</a> et la <a href="#" className="text-teal-400 hover:underline">politique de confidentialité</a>
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Error */}
                  {bookingError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mt-4">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {bookingError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!bookingSuccess && (
              <div className="flex gap-2 px-4 py-3 border-t border-slate-700 flex-shrink-0">
                <button
                  onClick={() => {
                    if (bookingStep === 'pour_qui') {
                      closeModal();
                    } else if (bookingStep === 'lieu') {
                      setBookingStep('pour_qui');
                    } else if (bookingStep === 'type') {
                      setBookingStep(facilities.length > 1 ? 'lieu' : 'pour_qui');
                    } else if (bookingStep === 'details') {
                      setBookingStep('type');
                    } else if (bookingStep === 'payment') {
                      setBookingStep('details');
                    } else {
                      setBookingStep('payment');
                    }
                  }}
                  disabled={booking}
                  className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  {bookingStep === 'pour_qui' ? 'Annuler' : 'Retour'}
                </button>
                <button
                  onClick={() => {
                    if (bookingStep === 'pour_qui') {
                      if (bookingFor === 'other' && !beneficiaryName.trim()) {
                        setBookingError('Veuillez renseigner le nom du bénéficiaire');
                        return;
                      }
                      setBookingError(null);
                      setBookingStep(facilities.length > 1 ? 'lieu' : 'type');
                    } else if (bookingStep === 'lieu') {
                      if (!selectedFacilityId) {
                        setBookingError('Veuillez choisir un établissement');
                        return;
                      }
                      setBookingError(null);
                      setBookingStep('type');
                    } else if (bookingStep === 'type') {
                      setBookingStep('details');
                    } else if (bookingStep === 'details') {
                      setBookingStep('payment');
                    } else if (bookingStep === 'payment') {
                      setBookingStep('confirm');
                    } else {
                      if (!acceptedTerms) {
                        setBookingError('Veuillez accepter les conditions générales');
                        return;
                      }
                      confirmBooking();
                    }
                  }}
                  disabled={booking || (bookingStep === 'confirm' && !acceptedTerms)}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Réservation...
                    </>
                  ) : bookingStep === 'confirm' ? (
                    `Payer ${getBookingPrice()} FCFA`
                  ) : (
                    'Continuer'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal signalement / blocage médecin */}
      {showReport && user && (
        <ReportBlockModal
          targetId={doctorId}
          targetName={doctor?.fullName || 'Ce médecin'}
          token={localStorage.getItem('token') || ''}
          isBlocked={isBlocked}
          onBlock={() => setIsBlocked(true)}
          onUnblock={() => setIsBlocked(false)}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
