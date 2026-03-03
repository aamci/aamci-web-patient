'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  Menu,
  X,
  Home,
  Search,
  Calendar,
  Heart,
  Building2,
  User,
  LogOut,
  ChevronDown,
  Activity,
  Star,
  MessageSquare,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const navLinks = [
  { href: '/' as const, label: 'Accueil', icon: Home },
  { href: '/doctors' as const, label: 'Médecins', icon: Search },
  { href: '/appointments' as const, label: 'Rendez-vous', icon: Calendar },
  { href: '/health-records' as const, label: 'Dossier médical', icon: Activity },
  { href: '/messages' as const, label: 'Messages', icon: MessageSquare },
  { href: '/favorites' as const, label: 'Favoris', icon: Heart },
  { href: '/facilities' as const, label: 'Établissements', icon: Building2 },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.count || 0);
      }
    } catch { /* silent */ }
  }, [user, apiBaseUrl]);

  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadMessages]);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-md group-hover:bg-teal-500 transition-colors">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-semibold text-white">Plateforme Santé</span>
              {user && (
                <span className="text-xs text-teal-400 font-medium">
                  Espace patient
                </span>
              )}
            </div>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const showBadge = link.href === '/messages' && unreadMessages > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions droite */}
          <div className="flex items-center gap-3">
            {/* Notification Bell - only for logged in users */}
            {user && <NotificationBell />}

            {!user ? (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-500 transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                    {getInitials(user.fullName || user.email)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white truncate max-w-[120px]">
                      {user.fullName || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-800 rounded-xl shadow-2xl border border-slate-700/60 py-1 z-50">
                    {/* En-tête du menu */}
                    <div className="px-4 py-3 border-b border-slate-700/60">
                      <p className="text-sm font-semibold text-white truncate">{user.fullName || 'Utilisateur'}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
                    </div>

                    {/* Liens du menu */}
                    <div className="py-1">
                      {[
                        { href: '/account',      Icon: User,      label: 'Mon profil'      },
                        { href: '/appointments', Icon: Calendar,  label: 'Mes rendez-vous' },
                        { href: '/favorites',    Icon: Heart,     label: 'Mes favoris'     },
                        { href: '/reviews',      Icon: Star,      label: 'Mes avis'        },
                      ].map(({ href, Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors"
                        >
                          <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Déconnexion */}
                    <div className="border-t border-slate-700/60 py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bouton menu mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-900/98 backdrop-blur-sm">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const showBadge = link.href === '/messages' && unreadMessages > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }
                  `}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                  {showBadge && (
                    <span className="ml-auto min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {!user && (
            <div className="px-4 py-4 border-t border-slate-700 space-y-2">
              <Link
                href="/auth/login"
                className="block w-full px-4 py-3 text-center text-sm font-medium text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/login"
                className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-500 transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
