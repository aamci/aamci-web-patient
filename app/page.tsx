'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './_providers/AuthProvider';
import {
  Search, Calendar, Clock, Shield, Star, MapPin, Video,
  Heart, ChevronRight, CheckCircle, Users, Building2,
  Stethoscope, ArrowRight, FileText, Bell, MessageCircle,
  Smartphone, Lock, CreditCard,
} from 'lucide-react';

const SPECIALTIES = [
  'Médecin généraliste', 'Dentiste', 'Dermatologue', 'Ophtalmologue',
  'Gynécologue', 'Pédiatre', 'Cardiologue', 'Kinésithérapeute',
  'Psychiatre', 'Neurologue', 'Endocrinologue', 'Rhumatologue',
];

const FEATURES = [
  {
    icon: Calendar, color: 'blue',
    title: 'Prise de rendez-vous instantanée',
    desc: 'Réservez en temps réel parmi les créneaux disponibles de vos médecins, 24h/24 et 7j/7.',
  },
  {
    icon: Video, color: 'green',
    title: 'Téléconsultation vidéo',
    desc: 'Consultez votre médecin depuis chez vous via notre interface vidéo sécurisée et chiffrée.',
  },
  {
    icon: FileText, color: 'purple',
    title: 'Dossier médical numérique',
    desc: 'Accédez à vos ordonnances, résultats d\'analyses et historique de consultations à tout moment.',
  },
  {
    icon: Bell, color: 'orange',
    title: 'Rappels automatiques',
    desc: 'Recevez des notifications pour ne jamais manquer un rendez-vous ou un renouvellement d\'ordonnance.',
  },
  {
    icon: MessageCircle, color: 'teal',
    title: 'Messagerie sécurisée',
    desc: 'Échangez directement avec vos médecins via une messagerie médicale confidentielle.',
  },
  {
    icon: Shield, color: 'red',
    title: 'Données protégées',
    desc: 'Vos informations médicales sont chiffrées AES-256 et conformes au RGPD et aux normes HDS.',
  },
  {
    icon: Heart, color: 'pink',
    title: 'Médecins favoris',
    desc: 'Retrouvez facilement vos praticiens habituels et suivez leur agenda en temps réel.',
  },
  {
    icon: CreditCard, color: 'indigo',
    title: 'Paiement en ligne',
    desc: 'Réglez vos consultations en ligne de façon sécurisée. Accédez à toutes vos factures.',
  },
  {
    icon: Smartphone, color: 'cyan',
    title: 'Application mobile',
    desc: 'Disponible sur iOS et Android pour gérer votre santé où que vous soyez.',
  },
];

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500' },
  teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-500' },
  pink:   { bg: 'bg-pink-50',   icon: 'text-pink-500' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
  cyan:   { bg: 'bg-cyan-50',   icon: 'text-cyan-600' },
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (!loading && user) return null;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Ibogha</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/doctors" className="hover:text-teal-600 transition-colors">Médecins</Link>
            <Link href="/facilities" className="hover:text-teal-600 transition-colors">Établissements</Link>
            <a href="#features" className="hover:text-teal-600 transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-teal-600 transition-colors">Comment ça marche</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-700 hover:text-teal-600 font-medium transition-colors">
              Connexion
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-white/90 text-sm mb-8">
              <Shield className="w-4 h-4" />
              <span>Plateforme médicale sécurisée — données chiffrées & RGPD</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Votre santé,<br />
              <span className="text-cyan-200">simplifiée et sécurisée</span>
            </h1>

            <p className="text-lg sm:text-xl text-teal-100 max-w-2xl mx-auto mb-10">
              Trouvez un médecin, réservez une consultation en ligne ou rejoignez votre médecin en vidéo —
              tout depuis une seule application.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Médecin, spécialité, symptôme..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 outline-none text-sm"
                  />
                </div>
                <div className="flex-1 relative sm:border-l border-gray-100">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ville ou code postal"
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 outline-none text-sm"
                  />
                </div>
                <Link
                  href="/doctors"
                  className="px-6 py-4 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  Rechercher
                </Link>
              </div>
            </div>

            {/* Quick specialties */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Généraliste', 'Dentiste', 'Dermatologue', 'Pédiatre', 'Cardiologue'].map(s => (
                <Link
                  key={s}
                  href={`/doctors?q=${s}`}
                  className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/25 transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L60 72C120 64 240 48 360 44C480 40 600 48 720 52C840 56 960 56 1080 52C1200 48 1320 40 1380 36L1440 32V80H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Médecins disponibles' },
              { value: '50k+', label: 'Patients satisfaits' },
              { value: '24/7', label: 'Service disponible' },
              { value: '4.9', label: 'Note moyenne', extra: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 inline" /> },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold text-teal-600 mb-1">{s.value}</div>
                <div className="text-gray-500 text-sm flex items-center justify-center gap-1">{s.extra}{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Ibogha centralise toute votre vie médicale dans une application simple et sécurisée.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <div key={i} className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-5`}>
                    <f.icon className={`w-6 h-6 ${c.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Prenez rendez-vous en 3 étapes
            </h2>
            <p className="text-gray-500 text-lg">Simple, rapide, sans attente</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />

            {[
              {
                n: '1', title: 'Créez votre compte',
                desc: 'Inscription gratuite en 2 minutes. Renseignez vos informations médicales de base.',
                icon: Users,
              },
              {
                n: '2', title: 'Trouvez votre médecin',
                desc: 'Recherchez par spécialité, nom ou localisation. Consultez les avis et disponibilités.',
                icon: Search,
              },
              {
                n: '3', title: 'Confirmez votre RDV',
                desc: 'Choisissez le créneau qui vous convient. Recevez une confirmation instantanée.',
                icon: CheckCircle,
              },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-200 relative z-10">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-0 right-6 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-xs font-bold">{step.n}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teleconsultation highlight ─────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 rounded-full text-teal-700 text-sm font-medium mb-6">
                <Video className="w-4 h-4" />
                Téléconsultation
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Consultez votre médecin sans vous déplacer
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Avec Ibogha, rejoignez votre médecin en vidéo HD depuis votre domicile.
                Idéal pour les suivis, renouvellements d'ordonnances et consultations de routine.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Vidéo HD sécurisée et chiffrée de bout en bout',
                  'Chat intégré pendant la consultation',
                  'Ordonnance envoyée directement après la séance',
                  'Compatible PC, tablette et smartphone',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/doctors?type=visio"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                <Video className="w-5 h-5" />
                Trouver un médecin en visio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mock video UI */}
            <div className="relative">
              <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="w-12 h-12 text-teal-400" />
                  </div>
                  <p className="text-white/60 text-sm">Dr. Martin — En ligne</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs">Consultation en cours</span>
                  </div>
                </div>
                {/* Floating controls */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                  {['Micro', 'Caméra', 'Raccrocher'].map((b, i) => (
                    <div key={i} className={`px-3 py-2 rounded-xl text-xs font-medium ${i === 2 ? 'bg-red-500 text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`}>{b}</div>
                  ))}
                </div>
              </div>
              {/* Floating patient card */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Sophie M.</div>
                  <div className="text-xs text-gray-500">15 min restantes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Specialties ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Toutes les spécialités médicales</h2>
            <p className="text-gray-500">Accédez à un réseau de professionnels de santé qualifiés</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {SPECIALTIES.map((name, i) => (
              <Link
                key={i}
                href={`/doctors?q=${encodeURIComponent(name)}`}
                className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md hover:border-teal-200 border border-gray-200 transition-all group"
              >
                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-sm font-medium text-gray-800 group-hover:text-teal-600 transition-colors">{name}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/doctors" className="inline-flex items-center gap-1 text-teal-600 font-medium hover:text-teal-700">
              Voir tous les médecins <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: CheckCircle, color: 'text-green-500', title: 'Médecins vérifiés', desc: 'Tous les praticiens sont inscrits à l\'Ordre des Médecins et vérifiés par notre équipe.' },
              { icon: Lock, color: 'text-teal-500', title: 'Données chiffrées', desc: 'Chiffrement AES-256. Vos données médicales ne sont jamais partagées sans votre accord.' },
              { icon: Users, color: 'text-purple-500', title: 'Support 7j/7', desc: 'Notre équipe est disponible pour vous accompagner à tout moment.' },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center">
                <t.icon className={`w-12 h-12 ${t.color} mb-4`} />
                <h3 className="font-semibold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Commencez dès aujourd'hui
          </h2>
          <p className="text-teal-100 text-lg mb-8">
            Inscription gratuite. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
              Créer un compte gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/doctors" className="px-8 py-4 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-400 transition-colors border-2 border-white/20 flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Trouver un médecin
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-lg font-bold">Ibogha</span>
              </div>
              <p className="text-sm leading-relaxed">
                Votre plateforme de santé numérique. Prenez soin de vous simplement.
              </p>
              <div className="mt-4">
                <Link href="https://pro.ibogha.elowe.fr" className="text-teal-400 text-sm hover:text-teal-300">
                  Vous êtes médecin ? →
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/doctors" className="hover:text-white transition-colors">Trouver un médecin</Link></li>
                <li><Link href="/facilities" className="hover:text-white transition-colors">Établissements</Link></li>
                <li><Link href="/appointments" className="hover:text-white transition-colors">Mes rendez-vous</Link></li>
                <li><Link href="/health-records" className="hover:text-white transition-colors">Dossier médical</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Informations</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">À propos d'Ibogha</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog santé</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>&copy; 2026 Ibogha. Tous droits réservés.</p>
            <p className="text-gray-600">Fait avec ❤️ pour la santé numérique</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
