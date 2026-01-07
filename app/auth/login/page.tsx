'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import { loginSchema, registerSchema } from './validation';
import styles from './LoginPage.module.css';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = localStorage.getItem('login_email');
    if (s) setEmail(s);
  }, []);

  async function handle(action: 'login' | 'register') {
    setErr(null);
    setValidationErrors({});
    setLoading(true);
    try {
      // Validate input with Zod
      const schema = action === 'register' ? registerSchema : loginSchema;
      const input = action === 'register'
        ? { email, password, role: 'PATIENT' as const }
        : { email, password };

      const result = schema.safeParse(input);

      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        setValidationErrors({
          email: errors.email?.[0],
          password: errors.password?.[0],
        });
        setErr('Veuillez corriger les erreurs dans le formulaire.');
        return;
      }

      const body = result.data;

      const r = await callApi(
        action === 'register' ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Send and receive cookies
          body: JSON.stringify(body),
        },
      );

      if (!r.ok) {
        setErr(r.status === 401 ? 'Identifiants incorrects.' : `Erreur ${r.status}.`);
        return;
      }

      const d = await r.json();

      // Gestion spéciale pour l'inscription avec vérification d'email requise
      if (action === 'register' && d?.requiresVerification) {
        setToken(null);
        setErr(null);
        // Afficher le message de vérification dans un banner au lieu d'une alert
        setErr(`✅ ${d.message} Veuillez vérifier votre boîte email et cliquer sur le lien de vérification. Le lien est valable pendant 1 heure.`);
        // Ne pas rediriger, rester sur la page de connexion
        return;
      }

      // Cookie is set automatically by backend, no need to store token
      if (d?.success) {
        setToken('authenticated'); // Just for UI feedback
        remember
          ? localStorage.setItem('login_email', email)
          : localStorage.removeItem('login_email');

        // Fetch user data from /auth/me endpoint
        await setAuthToken();

        router.replace('/');
      } else {
        setErr('Réponse inattendue du serveur.');
      }
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.badge}>🙂</div>
          <div>
            <h1 className={styles.title}>Connexion</h1>
            <p className={styles.subtitle}>
              Accédez à votre espace patient et gérez vos rendez-vous.
            </p>
          </div>
        </header>

        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!validationErrors.email}
              placeholder="vous@exemple.com"
            />
            {validationErrors.email && (
              <span className={styles.errorText}>{validationErrors.email}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="pwd" className={styles.label}>
              Mot de passe
            </label>
            <div className={styles.inputRow}>
              <input
                id="pwd"
                className={styles.input}
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={!!validationErrors.password}
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            {validationErrors.password && (
              <span className={styles.errorText}>{validationErrors.password}</span>
            )}
          </div>

          <div className={styles.rowBetween}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Se souvenir de moi</span>
            </label>
            <a className={styles.link} href="#">
              Mot de passe oublié ?
            </a>
          </div>

          {err && <div className={styles.bannerError}>{err}</div>}
          {token && <div className={styles.bannerSuccess}>Connecté ✔</div>}

          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={loading}
              onClick={() => handle('login')}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={loading}
              onClick={() => handle('register')}
            >
              Créer un compte
            </button>
          </div>

          <div className={styles.divider}>— ou —</div>

          <div className={styles.socialRow}>
            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={() => {
                const apiBase = getApiBase() || '';
                window.location.href = `${apiBase}/auth/google`;
              }}
            >
              🔵 Continuer avec Google
            </button>
            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={() => {
                const apiBase = getApiBase() || '';
                window.location.href = `${apiBase}/auth/facebook`;
              }}
            >
              📘 Continuer avec Facebook
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}