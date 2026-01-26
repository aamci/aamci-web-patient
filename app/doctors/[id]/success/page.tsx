import Link from 'next/link';
import { CheckCircle, Calendar, ArrowRight, Home } from 'lucide-react';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const appointmentId = Array.isArray(sp.aid) ? sp.aid[0] : sp.aid;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {/* Header with animation */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-12 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Rendez-vous confirmé !
            </h1>
            <p className="text-teal-100">
              Votre réservation a été enregistrée avec succès
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Appointment ID */}
            {appointmentId && (
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Numéro de réservation</div>
                <div className="font-mono text-white text-lg">
                  #{appointmentId.slice(0, 8).toUpperCase()}
                </div>
              </div>
            )}

            {/* Info message */}
            <div className="flex items-start gap-3 text-sm text-slate-400">
              <Calendar className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
              <p>
                Un email de confirmation vous a été envoyé. Vous pouvez retrouver ce rendez-vous dans votre espace personnel.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Link
                href="/appointments"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Voir mes rendez-vous
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/doctors"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-colors"
              >
                Prendre un autre rendez-vous
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-slate-400 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Une question ?{' '}
            <Link href="/account" className="text-teal-400 hover:text-teal-300">
              Consultez votre espace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
