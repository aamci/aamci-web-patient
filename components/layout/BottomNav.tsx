'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import { Home, Search, Calendar, MessageSquare, User } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';

function getApiBase(): string {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return 'http://localhost:3000';
  try { new URL(b); return b; } catch { return 'http://localhost:3000'; }
}

const navItems = [
  { href: '/dashboard', label: 'Accueil', icon: Home },
  { href: '/doctors', label: 'Médecins', icon: Search },
  { href: '/appointments', label: 'RDV', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/account', label: 'Compte', icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const apiBase = useMemo(() => getApiBase(), []);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.count ?? 0);
      }
    } catch { /* silent */ }
  }, [user, apiBase]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  if (!user) return null;

  // Don't show on auth pages or teleconsultation (full-screen)
  const hiddenPaths = ['/auth/', '/teleconsultation'];
  if (hiddenPaths.some(p => pathname?.startsWith(p))) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/60">
      <div className="flex items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
          const showBadge = href === '/messages' && unreadMessages > 0;
          return (
            <Link
              key={href}
              href={href as any}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative ${
                isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-teal-400' : ''}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS home indicator */}
      <div className="h-safe-bottom bg-slate-900/95" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
