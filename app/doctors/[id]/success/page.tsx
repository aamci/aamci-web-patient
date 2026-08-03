'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { CheckCircle, Calendar, ArrowRight, Home, FileQuestion, ChevronRight, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type Question = {
  id: string;
  text: string;
  type: 'TEXT' | 'TEXTAREA' | 'YES_NO' | 'SCALE' | 'MULTIPLE_CHOICE';
  options?: string | null;
  required: boolean;
  order: number;
};

type Questionnaire = {
  id: string;
  title: string;
  description?: string | null;
  questions: Question[];
};

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

function QuestionnaireForm({
  questionnaire,
  appointmentId,
  onDone,
}: {
  questionnaire: Questionnaire;
  appointmentId: string;
  onDone: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function submit() {
    setSubmitting(true);
    try {
      await authed(`/questionnaires/responses/${appointmentId}`, {
        method: 'POST',
        body: JSON.stringify({ questionnaireId: questionnaire.id, answers }),
      });
      setDone(true);
      setTimeout(onDone, 1200);
    } catch { onDone(); } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <p className="text-white font-medium">Questionnaire envoyé !</p>
      </div>
    );
  }

  return (
    <div>
      {questionnaire.description && (
        <p className="text-slate-400 text-sm mb-5">{questionnaire.description}</p>
      )}
      <div className="space-y-5">
        {questionnaire.questions.map((q, i) => {
          const options = q.options ? JSON.parse(q.options) as string[] : [];

          return (
            <div key={q.id}>
              <label className="block text-sm font-medium text-white mb-2">
                {i + 1}. {q.text}
                {q.required && <span className="text-rose-400 ml-1">*</span>}
              </label>

              {q.type === 'TEXT' && (
                <input
                  value={(answers[q.id] as string) ?? ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Votre réponse…"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              )}

              {q.type === 'TEXTAREA' && (
                <textarea
                  value={(answers[q.id] as string) ?? ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Votre réponse…"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />
              )}

              {q.type === 'YES_NO' && (
                <div className="flex gap-3">
                  {['Oui', 'Non'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(q.id, opt)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        answers[q.id] === opt
                          ? 'bg-teal-600 border-teal-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'SCALE' && (
                <div className="flex gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(n => (
                    <button
                      key={n}
                      onClick={() => setAnswer(q.id, n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        answers[q.id] === n
                          ? 'bg-teal-600 border-teal-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2">
                  {options.map(opt => {
                    const selected = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          const current = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                          setAnswer(q.id, selected
                            ? current.filter(x => x !== opt)
                            : [...current, opt]);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                          selected
                            ? 'bg-teal-600/10 border-teal-500 text-teal-400'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onDone}
          className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
        >
          Passer
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="flex-1 py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Envoyer
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = use(searchParams);
  const appointmentId = Array.isArray(sp.aid) ? sp.aid[0] : sp.aid;

  const [phase, setPhase] = useState<'loading' | 'questionnaire' | 'success'>('loading');
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);

  useEffect(() => {
    if (!appointmentId) { setPhase('success'); return; }

    async function checkQuestionnaire() {
      try {
        // Fetch appointment to get kindId
        const apptRes = await authed(`/appointments/${appointmentId}`);
        if (!apptRes.ok) { setPhase('success'); return; }
        const appt = await apptRes.json();
        const kindId = appt.kindId;
        if (!kindId) { setPhase('success'); return; }

        // Check if kind has a questionnaire
        const qRes = await fetch(`${API_BASE}/questionnaires/for-kind/${kindId}`);
        if (!qRes.ok) { setPhase('success'); return; }
        const q = await qRes.json();
        if (!q) { setPhase('success'); return; }

        // Check if patient already responded
        const respRes = await authed(`/questionnaires/responses/${appointmentId}`);
        const resp = respRes.ok ? await respRes.json() : null;
        if (resp) { setPhase('success'); return; }

        setQuestionnaire(q);
        setPhase('questionnaire');
      } catch {
        setPhase('success');
      }
    }

    checkQuestionnaire();
  }, [appointmentId]);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (phase === 'questionnaire' && questionnaire) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileQuestion className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1">{questionnaire.title}</h1>
              <p className="text-purple-200 text-sm">Votre médecin a besoin de quelques informations avant votre rendez-vous</p>
            </div>
            <div className="p-6">
              <QuestionnaireForm
                questionnaire={questionnaire}
                appointmentId={appointmentId!}
                onDone={() => setPhase('success')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-12 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Rendez-vous confirmé !</h1>
            <p className="text-teal-100">Votre réservation a été enregistrée avec succès</p>
          </div>

          <div className="p-6 space-y-4">
            {appointmentId && (
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Numéro de réservation</div>
                <div className="font-mono text-white text-lg">
                  #{appointmentId.slice(0, 8).toUpperCase()}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 text-sm text-slate-400">
              <Calendar className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
              <p>
                Un email de confirmation vous a été envoyé. Vous pouvez retrouver ce rendez-vous dans votre espace personnel.
              </p>
            </div>

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
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>

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
