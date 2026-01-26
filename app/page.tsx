'use client';

import Link from 'next/link';
import { useAuth } from './_providers/AuthProvider';
import {
  Search,
  Calendar,
  Clock,
  Shield,
  Star,
  MapPin,
  Video,
  Heart,
  ChevronRight,
  CheckCircle,
  Users,
  Building2,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6">
              <Shield className="w-4 h-4" />
              <span>Plateforme sécurisée et certifiée</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Prenez rendez-vous avec<br />
              <span className="text-blue-200">votre médecin en ligne</span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
              Trouvez le spécialiste qu'il vous faut et réservez votre consultation
              en quelques clics, 24h/24 et 7j/7.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Médecin, spécialité, symptôme..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 outline-none"
                  />
                </div>
                <div className="flex-1 relative sm:border-l border-gray-200">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ville ou code postal"
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 outline-none"
                  />
                </div>
                <Link
                  href="/doctors"
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Rechercher
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/doctors?q=generaliste"
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/20 transition-colors"
              >
                Médecin généraliste
              </Link>
              <Link
                href="/doctors?q=dentiste"
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/20 transition-colors"
              >
                Dentiste
              </Link>
              <Link
                href="/doctors?q=dermatologue"
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/20 transition-colors"
              >
                Dermatologue
              </Link>
              <Link
                href="/doctors?q=ophtalmologue"
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/20 transition-colors"
              >
                Ophtalmologue
              </Link>
              <Link
                href="/doctors?q=pediatre"
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/20 transition-colors"
              >
                Pédiatre
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Médecins disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">50k+</div>
              <div className="text-gray-600">Patients satisfaits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Service disponible</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">4.9</div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Note moyenne
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir notre plateforme ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une solution complète pour gérer votre santé en toute simplicité
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Réservation instantanée
              </h3>
              <p className="text-gray-600">
                Prenez rendez-vous en temps réel avec les créneaux disponibles de vos médecins.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Video className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Téléconsultation
              </h3>
              <p className="text-gray-600">
                Consultez votre médecin depuis chez vous par vidéo sécurisée.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Rappels automatiques
              </h3>
              <p className="text-gray-600">
                Recevez des rappels par SMS et email pour ne jamais manquer un rendez-vous.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Médecins favoris
              </h3>
              <p className="text-gray-600">
                Sauvegardez vos médecins préférés pour les retrouver facilement.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Données sécurisées
              </h3>
              <p className="text-gray-600">
                Vos informations médicales sont protégées et conformes au RGPD.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-établissements
              </h3>
              <p className="text-gray-600">
                Accédez à un réseau de cliniques et hôpitaux partenaires.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Prenez rendez-vous en 3 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Recherchez
              </h3>
              <p className="text-gray-600">
                Trouvez le médecin ou le spécialiste qui correspond à vos besoins par nom, spécialité ou localisation.
              </p>
              {/* Arrow */}
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%]">
                <ArrowRight className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Choisissez
              </h3>
              <p className="text-gray-600">
                Sélectionnez le créneau qui vous convient parmi les disponibilités en temps réel.
              </p>
              {/* Arrow */}
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%]">
                <ArrowRight className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Confirmez
              </h3>
              <p className="text-gray-600">
                Validez votre rendez-vous et recevez une confirmation instantanée par email et SMS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Toutes les spécialités médicales
            </h2>
            <p className="text-lg text-gray-600">
              Accédez à un large réseau de professionnels de santé
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Médecin généraliste', icon: Stethoscope },
              { name: 'Dentiste', icon: Stethoscope },
              { name: 'Dermatologue', icon: Stethoscope },
              { name: 'Ophtalmologue', icon: Stethoscope },
              { name: 'Gynécologue', icon: Stethoscope },
              { name: 'Pédiatre', icon: Stethoscope },
              { name: 'Cardiologue', icon: Heart },
              { name: 'Kinésithérapeute', icon: Stethoscope },
            ].map((specialty, i) => (
              <Link
                key={i}
                href={`/doctors?q=${encodeURIComponent(specialty.name)}`}
                className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md hover:border-blue-200 border border-gray-200 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <specialty.icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {specialty.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
            >
              Voir toutes les spécialités
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à prendre soin de votre santé ?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de patients qui font confiance à notre plateforme pour gérer leur santé au quotidien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/doctors"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Trouver un médecin
            </Link>
            {!user && (
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-colors border-2 border-white/20"
              >
                Créer un compte gratuit
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Médecins vérifiés</h3>
              <p className="text-sm text-gray-600">
                Tous les praticiens sont inscrits à l'Ordre des Médecins
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Paiement sécurisé</h3>
              <p className="text-sm text-gray-600">
                Transactions cryptées et sécurisées par Stripe
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Support 24/7</h3>
              <p className="text-sm text-gray-600">
                Notre équipe est disponible pour vous aider à tout moment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Plateforme Santé</h4>
              <p className="text-sm">
                Votre santé, notre priorité. Prenez rendez-vous facilement avec les meilleurs professionnels.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/doctors" className="hover:text-white transition-colors">Trouver un médecin</Link></li>
                <li><Link href="/facilities" className="hover:text-white transition-colors">Établissements</Link></li>
                <li><Link href="/appointments" className="hover:text-white transition-colors">Mes rendez-vous</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Informations</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Plateforme Santé. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
