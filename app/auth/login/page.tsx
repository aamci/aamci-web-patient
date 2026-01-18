'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { loginSchema, registerSchema } from './validation';

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
        setErr(
          errorData.message ||
          (r.status === 401 ? 'Identifiants incorrects.' : `Erreur ${r.status}.`)
        );
        return;
      }

      const d = await r.json();

      if (mode === 'register' && d?.requiresVerification) {
        setSuccess(d.message || 'Compte cr\u00e9\u00e9 ! V\u00e9rifiez votre email pour activer votre compte.');
        return;
      }

      if (d?.success && d?.token) {
        // Store the JWT token in localStorage
        localStorage.setItem('token', d.token);

        remember
          ? localStorage.setItem('login_email', email)
          : localStorage.removeItem('login_email');

        await setAuthToken();
        router.replace('/');
      } else if (d?.success) {
        // Fallback si token non présent mais success
        remember
          ? localStorage.setItem('login_email', email)
          : localStorage.removeItem('login_email');

        await setAuthToken();
        router.replace('/');
      } else {
        setErr('Réponse inattendue du serveur.');
      }
    } catch (e: any) {
      setErr(e?.message || 'Erreur r\u00e9seau');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#f9fafb',
  };

  const inputFocusStyle = {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    backgroundColor: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32,
            }}
          >
            {mode === 'login' ? '\u{1F44B}' : '\u{1F31F}'}
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>
            {mode === 'login' ? 'Bon retour !' : 'Cr\u00e9er un compte'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8 }}>
            {mode === 'login'
              ? 'Connectez-vous pour g\u00e9rer vos rendez-vous'
              : 'Rejoignez-nous et prenez soin de votre sant\u00e9'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f3f4f6',
              borderRadius: 12,
              padding: 4,
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => { setMode('login'); setErr(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === 'login' ? '#fff' : 'transparent',
                color: mode === 'login' ? '#3b82f6' : '#6b7280',
                boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErr(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === 'register' ? '#fff' : 'transparent',
                color: mode === 'register' ? '#3b82f6' : '#6b7280',
                boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Inscription
            </button>
          </div>

          {/* Success message */}
          {success && (
            <div
              style={{
                padding: '14px 16px',
                background: '#d1fae5',
                border: '1px solid #6ee7b7',
                borderRadius: 12,
                color: '#065f46',
                fontSize: 14,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>\u2705</span>
              <span>{success}</span>
            </div>
          )}

          {/* Error message */}
          {err && (
            <div
              style={{
                padding: '14px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                color: '#dc2626',
                fontSize: 14,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>\u26A0\uFE0F</span>
              <span>{err}</span>
            </div>
          )}

          {/* Full Name (register only) */}
          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                style={{
                  ...inputStyle,
                  borderColor: validationErrors.fullName ? '#ef4444' : '#e5e7eb',
                }}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = validationErrors.fullName ? '#ef4444' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#f9fafb';
                }}
              />
              {validationErrors.fullName && (
                <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                  {validationErrors.fullName}
                </span>
              )}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              style={{
                ...inputStyle,
                borderColor: validationErrors.email ? '#ef4444' : '#e5e7eb',
              }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = validationErrors.email ? '#ef4444' : '#e5e7eb';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#f9fafb';
              }}
            />
            {validationErrors.email && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                {validationErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                style={{
                  ...inputStyle,
                  paddingRight: 50,
                  borderColor: validationErrors.password ? '#ef4444' : '#e5e7eb',
                }}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = validationErrors.password ? '#ef4444' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#f9fafb';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#6b7280',
                }}
              >
                {showPwd ? '\u{1F441}' : '\u{1F441}\u200D\u{1F5E8}'}
              </button>
            </div>
            {validationErrors.password && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                {validationErrors.password}
              </span>
            )}
          </div>

          {/* Remember me & Forgot password (login only) */}
          {mode === 'login' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                />
                <span style={{ color: '#374151' }}>Se souvenir de moi</span>
              </label>
              <Link
                href="#"
                style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
              >
                Mot de passe oubli\u00e9 ?
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: loading
                ? '#9ca3af'
                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Chargement...
              </>
            ) : mode === 'login' ? (
              'Se connecter'
            ) : (
              'Cr\u00e9er mon compte'
            )}
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '24px 0',
              gap: 16,
            }}
          >
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: 13 }}>ou continuer avec</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {/* Social Login */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                const apiBase = getApiBase() || '';
                window.location.href = `${apiBase}/auth/google`;
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
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
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1877f2';
                e.currentTarget.style.background = '#f0f7ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>
        </form>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f9fafb',
            textAlign: 'center',
            fontSize: 13,
            color: '#6b7280',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Inscrivez-vous
              </button>
            </>
          ) : (
            <>
              D\u00e9j\u00e0 un compte ?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Connectez-vous
              </button>
            </>
          )}
        </div>
      </div>

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
