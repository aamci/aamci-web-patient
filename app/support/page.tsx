import { Mail, Phone, MessageCircle, Clock, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'Support — Ibogha241',
  description: 'Aide et assistance pour les patients Ibogha241',
};

const faqs = [
  {
    q: 'Comment prendre un rendez-vous ?',
    a: "Accédez à la section « Médecins », sélectionnez un praticien, choisissez un créneau disponible et confirmez votre réservation. Vous recevrez une confirmation par e-mail.",
  },
  {
    q: 'Comment annuler ou modifier un rendez-vous ?',
    a: "Rendez-vous dans « Mes rendez-vous », sélectionnez le rendez-vous concerné et utilisez le bouton « Annuler » ou « Reprogrammer ». L'annulation est possible jusqu'à 24h avant la consultation.",
  },
  {
    q: 'Je n\'arrive pas à me connecter à mon compte.',
    a: "Vérifiez que votre adresse e-mail est correcte et que votre compte a bien été vérifié (consultez vos e-mails). Si vous avez oublié votre mot de passe, utilisez « Mot de passe oublié » sur la page de connexion.",
  },
  {
    q: 'Comment accéder à mes ordonnances ?',
    a: "Vos ordonnances sont disponibles dans « Dossier médical » → « Documents ». Elles sont accessibles après chaque consultation avec votre médecin.",
  },
  {
    q: 'La téléconsultation ne fonctionne pas.',
    a: "Assurez-vous d'autoriser l'accès à la caméra et au microphone dans votre navigateur. Utilisez un navigateur récent (Chrome, Firefox, Safari). Si le problème persiste, contactez notre support.",
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: "Accédez à « Mon compte » → « Sécurité » → « Supprimer mon compte ». La suppression est définitive après un délai de 30 jours.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Centre d&apos;aide</h1>
          <p className="text-slate-400">Nous sommes là pour vous aider. Consultez la FAQ ou contactez-nous directement.</p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="mailto:support@ibogha241.ga"
            className="flex flex-col items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-500/50 transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-full bg-teal-900/40 flex items-center justify-center">
              <Mail className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">E-mail</p>
              <p className="text-slate-400 text-xs mt-0.5">support@ibogha241.ga</p>
            </div>
          </a>

          <a
            href="https://wa.me/24100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-500/50 transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-full bg-teal-900/40 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">WhatsApp</p>
              <p className="text-slate-400 text-xs mt-0.5">Réponse rapide</p>
            </div>
          </a>

          <div className="flex flex-col items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-teal-900/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Horaires</p>
              <p className="text-slate-400 text-xs mt-0.5">Lun–Sam · 8h–18h</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Questions fréquentes</h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                  <span className="font-medium text-white text-sm">{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-4 text-slate-300 text-sm leading-relaxed border-t border-slate-700 pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Ticket form link */}
        <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-5">
          <p className="text-teal-300 text-sm">
            Vous avez un problème non résolu ?{' '}
            <a href="/account?tab=support" className="underline font-medium hover:text-teal-200">
              Ouvrez un ticket de support
            </a>{' '}
            depuis votre compte et notre équipe vous répondra sous 24h.
          </p>
        </div>

        <p className="text-slate-600 text-xs text-center">
          © {new Date().getFullYear()} Ibogha241 — Gabon
        </p>
      </div>
    </div>
  );
}
