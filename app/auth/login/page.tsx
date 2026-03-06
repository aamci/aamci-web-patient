'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { loginSchema, registerSchema } from './validation';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Mail,
  Lock,
  User,
  ArrowRight,
  Calendar,
  Heart,
  Shield,
} from 'lucide-react';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try {
    new URL(b);
    return b;
  } catch {
    return null;
  }
}

async function callApi(p: string, i?: RequestInit) {
  const b = getApiBase();
  const u = b ? `${b}${p}` : p;
  return fetch(u, i);
}

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuthToken } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = localStorage.getItem('login_email');
    if (s) setEmail(s);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    setValidationErrors({});
    setShowResend(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      const schema = mode === 'register' ? registerSchema : loginSchema;
      const input = mode === 'register'
        ? { email, password, fullName, role: 'PATIENT' as const }
        : { email, password };

      const result = schema.safeParse(input);

      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        setValidationErrors({
          email: errors.email?.[0],
          password: errors.password?.[0],
          fullName: (errors as any).fullName?.[0],
        });
        setErr('Veuillez corriger les erreurs dans le formulaire.');
        return;
      }

      const body = result.data;

      const r = await callApi(
        mode === 'register' ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        },
      );

      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        const msg = errorData.message || (r.status === 401 ? 'Identifiants incorrects.' : `Erreur ${r.status}.`);
        if (typeof msg === 'string' && msg.toLowerCase().includes('not verified')) {
          setShowResend(true);
          setErr('Votre email n\'est pas encore vérifié. Vérifiez votre boîte mail ou renvoyez l\'email de vérification.');
        } else {
          setErr(Array.isArray(msg) ? msg.join(', ') : msg);
        }
        return;
      }

      const d = await r.json();

      if (mode === 'register' && d?.requiresVerification) {
        setSuccess(d.message || 'Compte créé ! Vérifiez votre email pour activer votre compte.');
        return;
      }

      if (d?.success && d?.token) {
        localStorage.setItem('token', d.token);
        remember
          ? localStorage.setItem('login_email', email)
          : localStorage.removeItem('login_email');
        await setAuthToken();
        router.replace('/dashboard');
      } else if (d?.success) {
        remember
          ? localStorage.setItem('login_email', email)
          : localStorage.removeItem('login_email');
        await setAuthToken();
        router.replace('/dashboard');
      } else {
        setErr('Réponse inattendue du serveur.');
      }
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) { setErr('Entrez votre email pour renvoyer la vérification.'); return; }
    setResendLoading(true);
    try {
      const r = await callApi('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (r.ok) {
        setResendSuccess(true);
        setErr(null);
      } else {
        const d = await r.json().catch(() => ({}));
        setErr(d.message || 'Erreur lors de l\'envoi.');
      }
    } catch {
      setErr('Erreur réseau.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-800 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <span className="text-white text-xl font-bold">Plateforme Santé</span>
          </Link>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-600/20 rounded-full text-teal-400 text-sm">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            Espace patient
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Prenez soin de<br />votre santé en<br />toute simplicité
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Prenez rendez-vous avec les meilleurs professionnels de santé en quelques clics.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="bg-slate-700/50 rounded-xl p-4">
              <Calendar className="w-8 h-8 text-teal-400 mb-2" />
              <div className="text-white font-semibold">Rendez-vous</div>
              <div className="text-slate-400 text-sm">Prise en ligne</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4">
              <Heart className="w-8 h-8 text-teal-400 mb-2" />
              <div className="text-white font-semibold">Favoris</div>
              <div className="text-slate-400 text-sm">Vos médecins</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4">
              <Shield className="w-8 h-8 text-teal-400 mb-2" />
              <div className="text-white font-semibold">Sécurisé</div>
              <div className="text-slate-400 text-sm">Données protégées</div>
            </div>
          </div>
        </div>

        <div className="text-slate-500 text-sm">
          © 2026 Plateforme Santé. Tous droits réservés.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-white text-lg font-bold">Plateforme Santé</span>
          </div>

          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full text-xs font-medium mb-4">
              Espace patient
            </span>
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
            </h2>
            <p className="text-slate-400 mt-2">
              {mode === 'login'
                ? 'Connectez-vous pour accéder à votre espace'
                : 'Rejoignez-nous et prenez soin de votre santé'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErr(null); setSuccess(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErr(null); setSuccess(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Success message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm mb-5 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Error message */}
          {err && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-2 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}

          {/* Resend verification email */}
          {showResend && !resendSuccess && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-teal-500/40 text-teal-400 hover:bg-teal-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {resendLoading ? 'Envoi en cours…' : 'Renvoyer l\'email de vérification'}
              </button>
            </div>
          )}
          {resendSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Email de vérification envoyé ! Vérifiez votre boîte mail.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nom complet
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className={`w-full pl-11 pr-4 py-3 text-sm bg-slate-800 border rounded-xl text-white placeholder-slate-500 outline-none transition-all ${
                      validationErrors.fullName
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                    }`}
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
                {validationErrors.fullName && (
                  <span className="text-xs text-red-400 mt-1 block">{validationErrors.fullName}</span>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className={`w-full pl-11 pr-4 py-3 text-sm bg-slate-800 border rounded-xl text-white placeholder-slate-500 outline-none transition-all ${
                    validationErrors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                  }`}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
              {validationErrors.email && (
                <span className="text-xs text-red-400 mt-1 block">{validationErrors.email}</span>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 text-sm bg-slate-800 border rounded-xl text-white placeholder-slate-500 outline-none transition-all ${
                    validationErrors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                  }`}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <span className="text-xs text-red-400 mt-1 block">{validationErrors.password}</span>
              )}
            </div>

            {/* Remember me & Forgot password (login only) */}
            {mode === 'login' && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 bg-slate-800 border-slate-600 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-slate-400">Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password' as any)}
                  className="text-teal-400 font-medium hover:text-teal-300 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 mt-6 ${
                loading
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-500'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6 gap-4">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-xs uppercase tracking-wide">ou</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Social Login */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const apiBase = getApiBase() || '';
                  window.location.href = `${apiBase}/auth/google`;
                }}
                className="flex-1 py-3 px-4 border border-slate-700 rounded-xl bg-slate-800 text-sm font-medium text-slate-200 flex items-center justify-center gap-2 transition-all hover:bg-slate-700 hover:border-slate-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  const apiBase = getApiBase() || '';
                  window.location.href = `${apiBase}/auth/facebook`;
                }}
                className="flex-1 py-3 px-4 border border-slate-700 rounded-xl bg-slate-800 text-sm font-medium text-slate-200 flex items-center justify-center gap-2 transition-all hover:bg-slate-700 hover:border-slate-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-400">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  Inscrivez-vous
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  Connectez-vous
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
