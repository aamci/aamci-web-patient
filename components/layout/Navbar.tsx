'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // fermer si clic en dehors
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linksForDoctor = [
    { href: '/availability', label: 'Planning' },
    { href: '/appointments', label: 'Mes rendez-vous' },
  ];

  const linksForPatient = [
    { href: '/', label: 'Accueil' },
    { href: '/doctors', label: 'Trouver un médecin' },
    { href: '/appointments', label: 'Mes rendez-vous' },
  ];

  const links = user?.role === 'DOCTOR' ? linksForDoctor : linksForPatient;

  return (
    <header className={styles.navRoot}>
      <div className={styles.navInner}>
        {/* Brand */}
        <button
          type="button"
          className={styles.brand}
          onClick={() => router.push('/')}
        >
          <div className={styles.brandLogo}>🩺</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Plateforme Santé</span>
            {user?.role && (
              <span className={styles.brandBadge}>
                {user.role === 'DOCTOR' ? 'Espace médecin' : 'Espace patient'}
              </span>
            )}
          </div>
        </button>

        {/* Liens */}
        <nav className={styles.navLinks}>
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <button
                key={l.href}
                type="button"
                onClick={() => router.push(l.href as any)}
                className={`${styles.navLinkBtn} ${active ? styles.navLinkActive : ''}`}
              >
                {l.label}
              </button>
            );
          })}
        </nav>

        {/* À droite */}
        <div className={styles.right}>
          {!user ? (
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className={styles.primaryBtn}
            >
              Connexion
            </button>
          ) : (
            <div className={styles.userRoot} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={styles.userBtn}
              >
                <AvatarSmall name={user.email} src={user.avatarUrl || null} />
                <span className={styles.userEmail}>{user.email}</span>
                <span className={styles.caret}>▼</span>
              </button>
              {open && (
                <div className={styles.dropdown}>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className={styles.dropdownItem}
                  >
                    Mon compte
                  </Link>

                  <Link
                    href="/appointments"
                    onClick={() => setOpen(false)}
                    className={styles.dropdownItem}
                  >
                    Mes rendez-vous
                  </Link>

                  <hr className={styles.separator} />

                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AvatarSmall({ src, name }: { src: string | null; name: string }) {
  const initials = (name || '?').charAt(0).toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={styles.avatarImg + ' ' + styles.avatar} />
    );
  }
  return <div className={styles.avatar}>{initials}</div>;
}