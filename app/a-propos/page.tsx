import { Calendar, FileText, MessageCircle, Video, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Ibogha241 — Votre santé, simplifiée',
  description: 'Plateforme de santé numérique au Gabon. Prenez rendez-vous, consultez vos médecins et gérez votre dossier médical en ligne.',
};

const features = [
  {
    icon: Calendar,
    title: 'Rendez-vous en ligne',
    desc: 'Trouvez un médecin disponible et réservez votre créneau en quelques secondes, 24h/24.',
  },
  {
    icon: FileText,
    title: 'Dossier médical',
    desc: 'Accédez à vos ordonnances, comptes rendus et historique de consultations à tout moment.',
  },
  {
    icon: MessageCircle,
    title: 'Messagerie sécurisée',
    desc: 'Communiquez directement avec votre médecin entre les consultations, en toute confidentialité.',
  },
  {
    icon: Video,
    title: 'Téléconsultation',
    desc: 'Consultez votre médecin en vidéo depuis chez vous, sans déplacement.',
  },
  {
    icon: Shield,
    title: 'Données protégées',
    desc: 'Vos informations médicales sont chiffrées et sécurisées selon les standards internationaux.',
  },
  {
    icon: Smartphone,
    title: 'Application mobile',
    desc: 'Disponible sur iOS et Android pour gérer votre santé où que vous soyez.',
  },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-block text-teal-400 text-xs font-semibold tracking-widest uppercase">
            IBOGHA241 · SANTÉ NUMÉRIQUE
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Votre santé,{' '}
            <span className="text-teal-400">simplifiée.</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            La première plateforme de santé numérique au Gabon. Médecins, rendez-vous et dossiers médicaux — au bout des doigts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-colors"
            >
              Créer un compte gratuit
            </Link>
            <Link
              href="/doctors"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Trouver un médecin
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Tout ce dont vous avez besoin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-lg bg-teal-900/50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center bg-teal-900/20 border border-teal-500/30 rounded-2xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">Commencez dès aujourd&apos;hui</h2>
          <p className="text-slate-400">Rejoignez des milliers de patients qui gèrent leur santé avec Ibogha241.</p>
          <Link
            href="/auth/register"
            className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-colors"
          >
            S&apos;inscrire gratuitement
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Ibogha241 — Gabon</p>
          <div className="flex gap-5">
            <Link href="/politique-confidentialite" className="hover:text-slate-300 transition-colors">Confidentialité</Link>
            <Link href="/conditions-utilisation" className="hover:text-slate-300 transition-colors">CGU</Link>
            <Link href="/support" className="hover:text-slate-300 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
