'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import { required, minLen, maxLen, email as emailVal, phone as phoneVal, hasErrors, type FormErrors } from '@/lib/validation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  Check,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Heart,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  Monitor,
  Send,
  Plus,
  Download,
  Trash2,
  Database,
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

type TabId = 'profile' | 'security' | 'notifications' | 'billing' | 'support' | 'data';

const tabs: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'data', label: 'Mes données', icon: Database },
];

export default function AccountPage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  useEffect(() => {
    const saved = (localStorage.getItem('patient-theme') as 'dark' | 'light' | 'system') || 'dark';
    setTheme(saved);
  }, []);
  const handleThemeChange = (t: 'dark' | 'light' | 'system') => {
    setTheme(t);
    localStorage.setItem('patient-theme', t);
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark'); root.classList.remove('light');
    } else if (t === 'light') {
      root.classList.remove('dark'); root.classList.add('light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark); root.classList.toggle('light', !prefersDark);
    }
  };
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [birthdate, setBirthdate] = useState('');
  const [city, setCity] = useState('');

  // Password fields
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Email verification status
  const [emailVerified, setEmailVerified] = useState(false);

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [reminderNotifs, setReminderNotifs] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Field errors
  const [profileErrors, setProfileErrors] = useState<FormErrors<'fullName' | 'email' | 'phone' | 'birthdate'>>({});
  const [pwdErrors, setPwdErrors] = useState<FormErrors<'currentPwd' | 'newPwd' | 'confirmPwd'>>({});
  const [ticketFieldErrors, setTicketFieldErrors] = useState<FormErrors<'ticketTitle' | 'ticketDescription'>>({});

  // Support tickets
  type Ticket = {
    id: string; title: string; description: string; status: string;
    priority: string; category?: string; response?: string; createdAt: string;
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketErr, setTicketErr] = useState('');

  // Data & privacy tab
  const [dataLoading, setDataLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleExportData() {
    setDataLoading(true);
    try {
      const token = localStorage.getItem('token');
      const base = apiBase ?? '/api-proxy';
      const r = await fetch(`${base}/me/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Export échoué');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Export impossible');
    } finally {
      setDataLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    try {
      await authedFetch('/me', { method: 'DELETE' });
      logout();
      router.replace('/auth/login');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Suppression impossible');
      setDeleteLoading(false);
    }
  }

  // Invoices (billing tab)
  type Invoice = {
    id: string; number?: string; status: string; totalAmount?: number; amount?: number;
    currency?: string; createdAt: string; dueDate?: string;
    appointment?: { slot?: { start?: string } }; doctor?: { fullName?: string };
  };
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  function buildUrl(path: string) {
    return apiBase ? `${apiBase}${path}` : `/api-proxy${path}`;
  }

  async function authedFetch(path: string, init?: RequestInit) {
    const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
    if (init?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const r = await fetch(buildUrl(path), {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
    }
    return r;
  }

  async function loadTickets() {
    setTicketsLoading(true);
    try {
      const r = await authedFetch('/tickets/my');
      setTickets(await r.json());
    } catch {
      // silently fail
    } finally {
      setTicketsLoading(false);
    }
  }

  async function loadInvoices() {
    setInvoicesLoading(true);
    try {
      const r = await authedFetch('/invoices');
      const data = await r.json();
      setInvoices(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      // silently fail
    } finally {
      setInvoicesLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setTicketErr('');
    const tfErrors: typeof ticketFieldErrors = {
      ticketTitle: required(ticketTitle, 'Sujet') ?? minLen(ticketTitle, 3, 'Sujet') ?? maxLen(ticketTitle, 200, 'Sujet'),
      ticketDescription: required(ticketDescription, 'Description') ?? minLen(ticketDescription, 20, 'Description') ?? maxLen(ticketDescription, 2000, 'Description'),
    };
    setTicketFieldErrors(tfErrors);
    if (hasErrors(tfErrors)) return;
    setTicketSaving(true);
    try {
      await authedFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDescription,
          category: ticketCategory || undefined,
          priority: ticketPriority,
        }),
      });
      setTicketTitle('');
      setTicketCategory('');
      setTicketDescription('');
      setTicketPriority('MEDIUM');
      setShowTicketForm(false);
      loadTickets();
    } catch (e: unknown) {
      setTicketErr(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
    } finally {
      setTicketSaving(false);
    }
  }

  // Load profile on mount
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await authedFetch('/me', { method: 'GET' });
        const data = await r.json();
        setEmail(data.email ?? '');
        setFullName(data.fullName ?? '');
        setAvatarUrl(data.avatarUrl ?? '');
        setPhone(data.phone ?? '');
        setSex(data.sex ?? '');
        setCity(data.city ?? '');
        setEmailVerified(data.emailVerified ?? false);
        if (data.birthdate) {
          setBirthdate(String(data.birthdate).substring(0, 10));
        }

        // Restore notification preferences from localStorage
        try {
          const saved = localStorage.getItem('notif_prefs');
          if (saved) {
            const prefs = JSON.parse(saved);
            setEmailNotifs(prefs.emailNotifs ?? true);
            setSmsNotifs(prefs.smsNotifs ?? false);
            setReminderNotifs(prefs.reminderNotifs ?? true);
            setMarketingNotifs(prefs.marketingNotifs ?? false);
          }
        } catch { /* ignore */ }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Impossible de charger le compte');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    const errors: typeof profileErrors = {
      fullName: required(fullName, 'Nom complet') ?? minLen(fullName, 2, 'Nom complet') ?? maxLen(fullName, 100, 'Nom complet'),
      email: required(email, 'Email') ?? emailVal(email),
      phone: phoneVal(phone),
      birthdate: birthdate && new Date(birthdate) > new Date() ? 'La date de naissance ne peut pas être dans le futur' : null,
    };
    setProfileErrors(errors);
    if (hasErrors(errors)) return;
    setSaving(true);
    try {
      const r = await authedFetch('/me', {
        method: 'PUT',
        body: JSON.stringify({
          email,
          fullName,
          avatarUrl: avatarUrl || null,
          phone,
          sex: sex || null,
          birthdate: birthdate ? new Date(birthdate).toISOString() : null,
          city,
        }),
      });
      const updated = await r.json();
      updateUser({
        email: updated.email,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
      });
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    const errors: typeof pwdErrors = {
      currentPwd: required(currentPwd, 'Mot de passe actuel'),
      newPwd: required(newPwd, 'Nouveau mot de passe') ?? minLen(newPwd, 6, 'Nouveau mot de passe'),
      confirmPwd: newPwd !== confirmPwd ? 'Les deux mots de passe ne correspondent pas' : null,
    };
    setPwdErrors(errors);
    if (hasErrors(errors)) return;
    setSaving(true);
    try {
      const r = await authedFetch('/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });
      await r.json();
      setSuccess('Mot de passe mis à jour avec succès');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Impossible de changer le mot de passe');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'security') return;
    authedFetch('/2fa/status').then(r => r.json()).then(d => setTwoFactorEnabled(d.isEnabled)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'support') loadTickets();
    if (activeTab === 'billing') loadInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function handleSetup2FA() {
    setTwoFactorLoading(true);
    setErr(null);
    try {
      const r = await authedFetch('/2fa/generate', { method: 'POST' });
      const d = await r.json();
      setOtpauthUrl(d.otpauthUrl);
      setTwoFactorSecret(d.secret);
      setTwoFactorBackupCodes(d.backupCodes ?? []);
      setTwoFactorStep('setup');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur lors de la génération 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleEnable2FA() {
    setTwoFactorLoading(true);
    setErr(null);
    try {
      await authedFetch('/2fa/enable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode }) });
      setTwoFactorEnabled(true);
      setTwoFactorStep('idle');
      setTwoFactorCode('');
      setSuccess('Authentification à deux facteurs activée avec succès');
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Code invalide ou expiré');
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleDisable2FA() {
    setTwoFactorLoading(true);
    setErr(null);
    try {
      await authedFetch('/2fa/disable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode }) });
      setTwoFactorEnabled(false);
      setTwoFactorStep('idle');
      setTwoFactorCode('');
      setSuccess('Authentification à deux facteurs désactivée');
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Code invalide');
    } finally {
      setTwoFactorLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  function handleSaveNotifPrefs() {
    try {
      localStorage.setItem('notif_prefs', JSON.stringify({ emailNotifs, smsNotifs, reminderNotifs, marketingNotifs }));
    } catch { /* ignore */ }
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de votre compte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Mon compte</h1>
          <p className="text-slate-400">Gérez vos informations personnelles et vos préférences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* Profile card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'Avatar'}
                      className="w-20 h-20 rounded-full object-cover border-4 border-slate-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center border-4 border-slate-700">
                      <span className="text-2xl font-bold text-white">
                        {getInitials(fullName || email)}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="absolute bottom-0 right-0 p-1.5 bg-teal-600 rounded-full text-white hover:bg-teal-500 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2 className="text-lg font-semibold text-white">{fullName || 'Utilisateur'}</h2>
                <p className="text-sm text-slate-400">{email}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setErr(null);
                    setSuccess(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-teal-600/20 text-teal-400 border-l-2 border-teal-500'
                      : 'text-slate-300 hover:bg-slate-700 border-l-2 border-transparent'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
              <div className="border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </nav>

            {/* Quick links */}
            <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Accès rapide</h3>
              <div className="space-y-2">
                <a
                  href="/appointments"
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-teal-400 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Mes rendez-vous
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </a>
                <a
                  href="/favorites"
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-teal-400 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Mes favoris
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </a>
                <a
                  href="/medical-documents"
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-teal-400 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Mes documents
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {/* Alerts */}
            {err && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{err}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">Informations personnelles</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Ces informations sont utilisées pour vos rendez-vous et documents médicaux.
                  </p>

                  <div className="space-y-4">
                    {/* Avatar URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Photo de profil (URL)
                      </label>
                      <div className="flex items-center gap-4">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar preview"
                            className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                            <Camera className="w-6 h-6" />
                          </div>
                        )}
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://exemple.com/photo.jpg"
                          className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nom complet
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => { setFullName(e.target.value); setProfileErrors(fe => ({ ...fe, fullName: null })); }}
                          placeholder="Jean Dupont"
                          maxLength={100}
                          className={`w-full pl-12 pr-4 py-3 bg-slate-700 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 ${profileErrors.fullName ? 'border-red-500' : 'border-slate-600'}`}
                        />
                      </div>
                      {profileErrors.fullName && <p className="mt-1 text-xs text-red-400">{profileErrors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Adresse email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setProfileErrors(fe => ({ ...fe, email: null })); }}
                          placeholder="vous@exemple.com"
                          className={`w-full pl-12 pr-4 py-3 bg-slate-700 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 ${profileErrors.email ? 'border-red-500' : 'border-slate-600'}`}
                        />
                      </div>
                      {profileErrors.email && <p className="mt-1 text-xs text-red-400">{profileErrors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); setProfileErrors(fe => ({ ...fe, phone: null })); }}
                          placeholder="+33 6 12 34 56 78"
                          className={`w-full pl-12 pr-4 py-3 bg-slate-700 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 ${profileErrors.phone ? 'border-red-500' : 'border-slate-600'}`}
                        />
                      </div>
                      {profileErrors.phone && <p className="mt-1 text-xs text-red-400">{profileErrors.phone}</p>}
                    </div>

                    {/* Sex and Birthdate */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Sexe
                        </label>
                        <select
                          value={sex}
                          onChange={(e) => setSex(e.target.value as typeof sex)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                        >
                          <option value="">Non précisé</option>
                          <option value="MALE">Homme</option>
                          <option value="FEMALE">Femme</option>
                          <option value="OTHER">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Date de naissance
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="date"
                            value={birthdate}
                            onChange={(e) => { setBirthdate(e.target.value); setProfileErrors(fe => ({ ...fe, birthdate: null })); }}
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full pl-12 pr-4 py-3 bg-slate-700 border rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 ${profileErrors.birthdate ? 'border-red-500' : 'border-slate-600'}`}
                          />
                        </div>
                        {profileErrors.birthdate && <p className="mt-1 text-xs text-red-400">{profileErrors.birthdate}</p>}
                      </div>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ville
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Paris, Lyon, Marseille..."
                          className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">Apparence</h2>
                  <p className="text-sm text-slate-400 mb-5">Choisissez votre thème d&apos;affichage.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'dark', label: 'Sombre', Icon: Moon },
                      { value: 'light', label: 'Clair', Icon: Sun },
                      { value: 'system', label: 'Système', Icon: Monitor },
                    ] as const).map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleThemeChange(value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === value
                            ? 'border-teal-500 bg-teal-600/10 text-teal-400'
                            : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{label}</span>
                        {theme === value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">Changer le mot de passe</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Choisissez un mot de passe fort pour sécuriser votre compte.
                  </p>

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Mot de passe actuel
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type={showCurrentPwd ? 'text' : 'password'}
                          value={currentPwd}
                          onChange={(e) => { setCurrentPwd(e.target.value); setPwdErrors(fe => ({ ...fe, currentPwd: null })); }}
                          placeholder="••••••••"
                          className={`w-full pl-12 pr-12 py-3 bg-slate-700 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 ${pwdErrors.currentPwd ? 'border-red-500' : 'border-slate-600'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCurrentPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {pwdErrors.currentPwd && <p className="mt-1 text-xs text-red-400">{pwdErrors.currentPwd}</p>}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPwd}
                          onChange={(e) => { setNewPwd(e.target.value); setPwdErrors(fe => ({ ...fe, newPwd: null })); }}
                          placeholder="••••••••"
                          className={`w-full pl-12 pr-12 py-3 bg-slate-700 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 ${pwdErrors.newPwd ? 'border-red-500' : 'border-slate-600'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showNewPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {pwdErrors.newPwd ? <p className="mt-1 text-xs text-red-400">{pwdErrors.newPwd}</p> : <p className="mt-1 text-xs text-slate-500">Minimum 6 caractères</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmPwd}
                          onChange={(e) => { setConfirmPwd(e.target.value); setPwdErrors(fe => ({ ...fe, confirmPwd: null })); }}
                          placeholder="••••••••"
                          className={`w-full pl-12 pr-12 py-3 bg-slate-700 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 ${pwdErrors.confirmPwd ? 'border-red-500' : 'border-slate-600'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {pwdErrors.confirmPwd && <p className="mt-1 text-xs text-red-400">{pwdErrors.confirmPwd}</p>}
                    </div>
                  </div>
                </div>

                {/* Security info */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Sécurité du compte</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${emailVerified ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                          <Shield className={`w-5 h-5 ${emailVerified ? 'text-green-400' : 'text-amber-400'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Email vérifié</div>
                          <div className="text-xs text-slate-400">{email}</div>
                        </div>
                      </div>
                      {emailVerified ? (
                        <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">Vérifié</span>
                      ) : (
                        <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded-full">Non vérifié</span>
                      )}
                    </div>
                    <div className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${twoFactorEnabled ? 'bg-teal-500/20' : 'bg-slate-700'}`}>
                            <Shield className={`w-5 h-5 ${twoFactorEnabled ? 'text-teal-400' : 'text-slate-400'}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Authentification à deux facteurs</div>
                            <div className="text-xs text-slate-400">Application TOTP (Google Authenticator, Authy…)</div>
                          </div>
                        </div>
                        {twoFactorEnabled ? (
                          <button
                            type="button"
                            onClick={() => setTwoFactorStep('disable')}
                            className="text-xs text-red-400 border border-red-400/30 px-3 py-1 rounded-full hover:bg-red-400/10 transition-colors"
                          >
                            Désactiver
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSetup2FA}
                            disabled={twoFactorLoading}
                            className="text-xs text-teal-400 border border-teal-400/30 px-3 py-1 rounded-full hover:bg-teal-400/10 transition-colors disabled:opacity-50"
                          >
                            {twoFactorLoading ? 'Chargement…' : 'Activer'}
                          </button>
                        )}
                      </div>

                      {/* 2FA setup panel */}
                      {twoFactorStep === 'setup' && (
                        <div className="mt-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600 space-y-4">
                          <p className="text-sm font-medium text-slate-200">Configuration de l&apos;authenticator</p>
                          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                            <li>Téléchargez Google Authenticator ou Authy</li>
                            <li>Scannez le QR code ou entrez la clé manuellement</li>
                            <li>Saisissez le code à 6 chiffres généré</li>
                          </ol>
                          <div className="flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=160x160&color=2dd4bf&bgcolor=1e293b`}
                              alt="QR Code 2FA"
                              className="rounded-lg"
                              width={160}
                              height={160}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Ou entrez la clé manuellement :</p>
                            <code className="text-xs text-teal-400 font-mono break-all select-all">{twoFactorSecret}</code>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Code à 6 chiffres"
                            className="w-full text-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-xl font-mono tracking-widest focus:outline-none focus:border-teal-500"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setTwoFactorStep('idle'); setTwoFactorCode(''); }}
                              className="flex-1 py-2 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={handleEnable2FA}
                              disabled={twoFactorCode.length !== 6 || twoFactorLoading}
                              className="flex-1 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-500 disabled:opacity-50"
                            >
                              {twoFactorLoading ? 'Vérification…' : 'Activer'}
                            </button>
                          </div>
                          {twoFactorBackupCodes.length > 0 && (
                            <div className="border-t border-slate-600 pt-3">
                              <p className="text-xs text-yellow-400 mb-2">⚠ Codes de secours — sauvegardez-les dans un endroit sûr :</p>
                              <div className="grid grid-cols-2 gap-1">
                                {twoFactorBackupCodes.map((c) => (
                                  <code key={c} className="text-xs font-mono text-slate-300 bg-slate-700 px-2 py-1 rounded text-center">{c}</code>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2FA disable panel */}
                      {twoFactorStep === 'disable' && (
                        <div className="mt-4 p-4 bg-red-900/20 rounded-xl border border-red-500/30 space-y-3">
                          <p className="text-sm font-medium text-red-300">Désactiver l&apos;authentification à deux facteurs</p>
                          <p className="text-xs text-red-400">Entrez le code de votre application authenticator pour confirmer.</p>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Code à 6 chiffres"
                            className="w-full text-center px-4 py-3 bg-slate-700 border border-red-500/40 rounded-xl text-white placeholder-slate-500 text-xl font-mono tracking-widest focus:outline-none focus:border-red-500"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setTwoFactorStep('idle'); setTwoFactorCode(''); }}
                              className="flex-1 py-2 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={handleDisable2FA}
                              disabled={twoFactorCode.length !== 6 || twoFactorLoading}
                              className="flex-1 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50"
                            >
                              {twoFactorLoading ? 'Vérification…' : 'Confirmer'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !currentPwd || !newPwd || !confirmPwd}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Mettre à jour le mot de passe
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">Préférences de notification</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Choisissez comment vous souhaitez être informé.
                  </p>

                  <div className="space-y-4">
                    {/* Email notifications */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <div className="text-sm font-medium text-white">Notifications par email</div>
                        <div className="text-xs text-slate-400">Recevez des mises à jour par email</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifs}
                          onChange={(e) => setEmailNotifs(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {/* SMS notifications */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <div className="text-sm font-medium text-white">Notifications par SMS</div>
                        <div className="text-xs text-slate-400">Recevez des rappels par SMS</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsNotifs}
                          onChange={(e) => setSmsNotifs(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {/* Reminder notifications */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <div className="text-sm font-medium text-white">Rappels de rendez-vous</div>
                        <div className="text-xs text-slate-400">Rappels 24h et 1h avant vos rendez-vous</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reminderNotifs}
                          onChange={(e) => setReminderNotifs(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {/* Marketing */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium text-white">Communications marketing</div>
                        <div className="text-xs text-slate-400">Nouveautés, offres et conseils santé</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marketingNotifs}
                          onChange={(e) => setMarketingNotifs(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                  {notifSaved && (
                    <span className="text-sm text-green-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Préférences enregistrées
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNotifPrefs}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Enregistrer les préférences
                  </button>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">Historique des factures</h2>
                  <p className="text-sm text-slate-400 mb-4">Consultez vos factures et reçus de consultation.</p>

                  {invoicesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Aucune facture pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invoices.map((inv) => {
                        const amount = inv.totalAmount ?? inv.amount ?? 0;
                        const currency = inv.currency ?? 'XAF';
                        const statusColors: Record<string, string> = {
                          PAID: 'bg-green-500/20 text-green-400',
                          PENDING: 'bg-amber-500/20 text-amber-400',
                          CANCELLED: 'bg-red-500/20 text-red-400',
                          OVERDUE: 'bg-red-500/20 text-red-400',
                        };
                        const statusLabels: Record<string, string> = {
                          PAID: 'Payée', PENDING: 'En attente', CANCELLED: 'Annulée', OVERDUE: 'En retard',
                        };
                        return (
                          <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-700/40 rounded-xl border border-slate-600">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-teal-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{inv.number ?? `Facture #${inv.id.slice(-6)}`}</p>
                                <p className="text-xs text-slate-400">
                                  {inv.doctor?.fullName ? `Dr. ${inv.doctor.fullName} • ` : ''}
                                  {new Date(inv.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[inv.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                                {statusLabels[inv.status] ?? inv.status}
                              </span>
                              <span className="text-sm font-semibold text-white">
                                {amount.toLocaleString('fr-FR')} {currency}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Support</h2>
                      <p className="text-sm text-slate-400 mt-0.5">Signalez un problème ou posez une question</p>
                    </div>
                    <button
                      onClick={() => { setShowTicketForm(!showTicketForm); setTicketErr(''); }}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nouveau ticket
                    </button>
                  </div>

                  {showTicketForm && (
                    <form onSubmit={handleCreateTicket} className="mb-6 bg-slate-700/50 rounded-xl border border-slate-600 p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">Nouveau ticket</h3>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Sujet *</label>
                        <input
                          type="text"
                          value={ticketTitle}
                          onChange={(e) => { setTicketTitle(e.target.value); setTicketFieldErrors(fe => ({ ...fe, ticketTitle: null })); }}
                          placeholder="Décrivez brièvement votre problème"
                          maxLength={200}
                          className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 ${ticketFieldErrors.ticketTitle ? 'border-red-500' : 'border-slate-600'}`}
                        />
                        {ticketFieldErrors.ticketTitle && <p className="mt-1 text-xs text-red-400">{ticketFieldErrors.ticketTitle}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Catégorie</label>
                          <select
                            value={ticketCategory}
                            onChange={(e) => setTicketCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                          >
                            <option value="">Générale</option>
                            <option value="APPOINTMENT">Rendez-vous</option>
                            <option value="PAYMENT">Paiement</option>
                            <option value="ACCOUNT">Compte</option>
                            <option value="TECHNICAL">Technique</option>
                            <option value="OTHER">Autre</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Priorité</label>
                          <select
                            value={ticketPriority}
                            onChange={(e) => setTicketPriority(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                          >
                            <option value="LOW">Faible</option>
                            <option value="MEDIUM">Normale</option>
                            <option value="HIGH">Haute</option>
                            <option value="URGENT">Urgente</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Description *</label>
                        <textarea
                          rows={4}
                          value={ticketDescription}
                          onChange={(e) => { setTicketDescription(e.target.value); setTicketFieldErrors(fe => ({ ...fe, ticketDescription: null })); }}
                          placeholder="Décrivez votre problème en détail..."
                          maxLength={2000}
                          className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none ${ticketFieldErrors.ticketDescription ? 'border-red-500' : 'border-slate-600'}`}
                        />
                        {ticketFieldErrors.ticketDescription && <p className="mt-1 text-xs text-red-400">{ticketFieldErrors.ticketDescription}</p>}
                      </div>
                      {ticketErr && <p className="text-sm text-red-400">{ticketErr}</p>}
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowTicketForm(false)}
                          className="px-4 py-2 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={ticketSaving}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {ticketSaving ? 'Envoi…' : 'Envoyer'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tickets list */}
                  {ticketsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                      <p className="text-sm">Aucun ticket pour le moment</p>
                      <p className="text-xs text-slate-500 mt-1">Créez votre premier ticket si vous avez besoin d&apos;aide</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((t) => {
                        const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
                          OPEN: { label: 'Ouvert', icon: <Clock className="w-3 h-3" />, color: 'text-blue-400 bg-blue-400/10' },
                          IN_PROGRESS: { label: 'En cours', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-yellow-400 bg-yellow-400/10' },
                          RESOLVED: { label: 'Résolu', icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-400 bg-emerald-400/10' },
                          CLOSED: { label: 'Fermé', icon: <XCircle className="w-3 h-3" />, color: 'text-slate-400 bg-slate-400/10' },
                        };
                        const s = statusConfig[t.status] ?? statusConfig.OPEN;
                        return (
                          <div key={t.id} className="rounded-xl border border-slate-600 bg-slate-700/40 p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="text-sm font-medium text-white">{t.title}</p>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${s.color}`}>
                                {s.icon} {s.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mb-2">{t.description}</p>
                            {t.response && (
                              <div className="mt-3 p-3 bg-teal-900/20 border border-teal-500/20 rounded-lg">
                                <p className="text-xs font-medium text-teal-400 mb-1">Réponse de l&apos;équipe support :</p>
                                <p className="text-xs text-slate-300">{t.response}</p>
                              </div>
                            )}
                            <p className="text-xs text-slate-500 mt-2">{new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Data & Privacy Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">Mes données personnelles</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Conformément à la Loi 025/2023 sur la protection des données personnelles (Gabon),
                    vous disposez d&apos;un droit d&apos;accès, de rectification et d&apos;effacement de vos données.
                  </p>

                  {/* Export */}
                  <div className="border border-slate-600 rounded-xl p-5 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                        <Download className="w-5 h-5 text-teal-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">Exporter mes données</h3>
                        <p className="text-sm text-slate-400 mb-4">
                          Téléchargez une copie de toutes vos données personnelles (profil, rendez-vous,
                          dossiers médicaux, factures) au format JSON.
                        </p>
                        <button
                          type="button"
                          onClick={handleExportData}
                          disabled={dataLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {dataLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          {dataLoading ? 'Préparation...' : 'Télécharger mes données'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <div className="border border-red-500/30 rounded-xl p-5 bg-red-500/5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-red-400 mb-1">Supprimer mon compte</h3>
                        <p className="text-sm text-slate-400 mb-4">
                          Cette action est irréversible. Vos données personnelles seront anonymisées
                          (nom, email, téléphone). Les données médicales sont conservées à des fins légales.
                        </p>
                        <p className="text-xs text-slate-500 mb-3">
                          Tapez <span className="font-mono text-red-400 font-bold">SUPPRIMER</span> pour confirmer :
                        </p>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="SUPPRIMER"
                            className="flex-1 max-w-[200px] bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirm !== 'SUPPRIMER' || deleteLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Supprimer mon compte
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legal links */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                      Pour toute question relative à vos données,{' '}
                      <a href="/politique-confidentialite" className="text-teal-400 hover:underline">
                        consultez notre politique de confidentialité
                      </a>.
                      Autorité de contrôle : APDPVP (Gabon).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
