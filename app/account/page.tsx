'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
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

type TabId = 'profile' | 'security' | 'notifications' | 'billing';

const tabs: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
];

export default function AccountPage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);
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

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [reminderNotifs, setReminderNotifs] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);

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
        if (data.birthdate) {
          setBirthdate(String(data.birthdate).substring(0, 10));
        }
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

    if (!newPwd || newPwd.length < 6) {
      setErr('Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setErr('Les deux mots de passe ne correspondent pas.');
      return;
    }

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
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
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
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vous@exemple.com"
                          className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
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
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
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
                            onChange={(e) => setBirthdate(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
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
                          onChange={(e) => setCurrentPwd(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCurrentPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
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
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showNewPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Minimum 6 caractères</p>
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
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security info */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Sécurité du compte</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Email vérifié</div>
                          <div className="text-xs text-slate-400">{email}</div>
                        </div>
                      </div>
                      <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">Actif</span>
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

                <div className="flex justify-end">
                  <button
                    type="button"
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
                  <h2 className="text-lg font-semibold text-white mb-1">Facturation</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Gérez vos moyens de paiement et consultez votre historique.
                  </p>

                  <div className="bg-slate-700/50 rounded-xl p-8 text-center">
                    <CreditCard className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Aucun moyen de paiement</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Vous n'avez pas encore ajouté de moyen de paiement.
                    </p>
                    <button
                      type="button"
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors"
                    >
                      Ajouter une carte
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Historique des paiements</h2>
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                    <p className="text-sm">Aucun paiement pour le moment</p>
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
