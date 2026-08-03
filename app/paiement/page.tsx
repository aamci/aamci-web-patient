'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

function authed(path: string, init?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

type AppointmentInfo = {
  id: string;
  slotStart: string;
  prepaidAmount?: number | null;
  kind?: { name: string; price?: number | null } | null;
  doctor?: { fullName?: string | null } | null;
};

function CheckoutForm({
  appointmentId,
  amount,
  onSuccess,
}: {
  appointmentId: string;
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Erreur de paiement');
      setProcessing(false);
      return;
    }

    const returnUrl = `${window.location.origin}/appointments`;
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Le paiement a échoué');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Notify backend of successful payment
      try {
        await authed(`/payments/prepay/${appointmentId}/confirm`, {
          method: 'POST',
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
      } catch { /* webhook will handle it */ }
      onSuccess();
    } else {
      setError('Statut du paiement inconnu. Vérifiez vos rendez-vous.');
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Payer {amount.toLocaleString('fr-FR')} FCFA
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        Paiement sécurisé par Stripe
      </p>
    </form>
  );
}

export default function PaiementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const router = useRouter();
  const sp = use(searchParams);

  const appointmentId = Array.isArray(sp.aid) ? sp.aid[0] : sp.aid;
  const clientSecret = Array.isArray(sp.cs) ? sp.cs[0] : sp.cs;

  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [stripePromise] = useState(() =>
    STRIPE_PK ? loadStripe(STRIPE_PK) : null
  );

  useEffect(() => {
    if (!appointmentId) { router.replace('/appointments'); return; }

    authed(`/appointments/${appointmentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAppointment(data); })
      .finally(() => setLoading(false));
  }, [appointmentId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Paiement confirmé !</h1>
          <p className="text-slate-400 mb-6">Votre rendez-vous est confirmé et votre paiement a bien été enregistré.</p>
          <Link
            href="/appointments"
            className="block w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
          >
            Voir mes rendez-vous
          </Link>
        </div>
      </div>
    );
  }

  const amount = appointment?.prepaidAmount
    ? Number(appointment.prepaidAmount)
    : appointment?.kind?.price
    ? Number(appointment.kind.price)
    : 0;

  const formattedDate = appointment?.slotStart
    ? new Date(appointment.slotStart).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (!clientSecret || !stripePromise) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center max-w-md w-full">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Paiement non disponible</h1>
          <p className="text-slate-400 mb-6 text-sm">
            La configuration du paiement est incomplète. Votre rendez-vous a été enregistré, mais le pré-paiement n&apos;a pas pu être initialisé.
          </p>
          <Link
            href="/appointments"
            className="block w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
          >
            Voir mes rendez-vous
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/appointments"
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux rendez-vous
        </Link>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-teal-700 to-teal-800 px-6 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Pré-paiement</h1>
                <p className="text-teal-200 text-sm">Sécurisez votre rendez-vous</p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/10 rounded-xl p-4 space-y-2 text-sm">
              {appointment?.kind?.name && (
                <div className="flex justify-between text-teal-100">
                  <span>Consultation</span>
                  <span className="font-medium">{appointment.kind.name}</span>
                </div>
              )}
              {appointment?.doctor?.fullName && (
                <div className="flex justify-between text-teal-100">
                  <span>Médecin</span>
                  <span className="font-medium">{appointment.doctor.fullName}</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex justify-between text-teal-100">
                  <span>Date</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-2 flex justify-between text-white font-semibold">
                <span>Total</span>
                <span>{amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="p-6">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#14b8a6',
                    colorBackground: '#1e293b',
                    colorText: '#f1f5f9',
                    colorDanger: '#f87171',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <CheckoutForm
                appointmentId={appointmentId!}
                amount={amount}
                onSuccess={() => setPaid(true)}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
}
