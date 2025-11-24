'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = localStorage.getItem('login_email');
    if (s) setEmail(s);
  }, []);

  const emailInvalid = useMemo(
    () => (!email ? false : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    [email],
  );

  async function handle(action: 'login' | 'register') {
    setErr(null);
    setLoading(true);
    try {
      if (!email || !password) {
        setErr('Veuillez renseigner votre email et mot de passe.');
        return;
      }
      if (emailInvalid) {
        setErr('Adresse e-mail invalide.');
        return;
      }

      const body =
        action === 'register'
          ? { email, password, role: 'PATIENT' }
          : { email, password };

      const r = await callApi(
        action === 'register' ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!r.ok) {
        setErr(r.status === 401 ? 'Identifiants incorrects.' : `Erreur ${r.status}.`);
        return;
      }

      const d = await r.json();

      if (d?.access_token) {
        setToken(d.access_token);
        localStorage.setItem('token', d.access_token);
        remember
          ? localStorage.setItem('login_email', email)
          : localStorage.removeItem('login_email');

        // update contexte
        setAuthToken(d.access_token);

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
              aria-invalid={emailInvalid}
              placeholder="vous@exemple.com"
            />
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
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? 'Masquer' : 'Afficher'}
              </button>
            </div>
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
            <button className={styles.secondaryBtn} type="button" disabled>
              Continuer avec Google (bientôt)
            </button>
            <button className={styles.secondaryBtn} type="button" disabled>
              Continuer avec Apple (bientôt)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}