'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
  Pill,
  FlaskConical,
  Save,
  RefreshCw,
  Check,
  ArrowLeft,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';

interface ReminderPreferences {
  appointmentReminders: {
    enabled: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    timing: number[]; // hours before
  };
  prescriptionReminders: {
    enabled: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    dailyTime: string;
  };
  labResultsNotifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
  };
  marketingEmails: boolean;
}

interface UpcomingReminder {
  id: string;
  type: 'appointment' | 'prescription' | 'vaccination';
  title: string;
  description: string;
  scheduledFor: string;
  channels: ('email' | 'sms' | 'push')[];
}

const defaultPreferences: ReminderPreferences = {
  appointmentReminders: {
    enabled: true,
    email: true,
    sms: true,
    push: true,
    timing: [24, 2], // 24h and 2h before
  },
  prescriptionReminders: {
    enabled: true,
    email: false,
    sms: false,
    push: true,
    dailyTime: '08:00',
  },
  labResultsNotifications: {
    enabled: true,
    email: true,
    push: true,
  },
  marketingEmails: false,
};

const TIMING_OPTIONS = [
  { value: 168, label: '1 semaine avant' },
  { value: 72, label: '3 jours avant' },
  { value: 48, label: '2 jours avant' },
  { value: 24, label: '1 jour avant' },
  { value: 12, label: '12 heures avant' },
  { value: 2, label: '2 heures avant' },
  { value: 1, label: '1 heure avant' },
];

export default function RemindersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState<ReminderPreferences>(defaultPreferences);
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'upcoming'>('settings');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Load preferences from localStorage or API
    const savedPrefs = localStorage.getItem('reminder_preferences');
    if (savedPrefs) {
      setPreferences({ ...defaultPreferences, ...JSON.parse(savedPrefs) });
    }

    // Mock upcoming reminders
    setUpcomingReminders([
      {
        id: '1',
        type: 'appointment',
        title: 'Rappel RDV - Dr. Martin',
        description: 'Consultation générale demain à 10h00',
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
        channels: ['email', 'sms', 'push'],
      },
      {
        id: '2',
        type: 'prescription',
        title: 'Rappel médicament',
        description: 'Paracétamol 1000mg - 3x/jour',
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
        channels: ['push'],
      },
      {
        id: '3',
        type: 'appointment',
        title: 'Rappel RDV - Dr. Dubois',
        description: 'Suivi cardiologique dans 3 jours',
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        channels: ['email', 'push'],
      },
    ]);

    setLoading(false);
  }, [router]);

  const savePreferences = async () => {
    setSaving(true);

    // Save to localStorage
    localStorage.setItem('reminder_preferences', JSON.stringify(preferences));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleTiming = (hours: number) => {
    setPreferences(prev => ({
      ...prev,
      appointmentReminders: {
        ...prev.appointmentReminders,
        timing: prev.appointmentReminders.timing.includes(hours)
          ? prev.appointmentReminders.timing.filter(t => t !== hours)
          : [...prev.appointmentReminders.timing, hours].sort((a, b) => b - a),
      },
    }));
    setSaved(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'prescription':
        return <Pill className="w-5 h-5 text-green-400" />;
      case 'vaccination':
        return <FlaskConical className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-slate-400">Chargement des préférences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Bell className="w-7 h-7 text-teal-500" />
                Rappels & Notifications
              </h1>
              <p className="text-slate-400 text-sm">Configurez vos préférences de rappel</p>
            </div>
          </div>
          <button
            onClick={savePreferences}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-teal-600 text-white hover:bg-teal-500'
            } disabled:opacity-50`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Enregistrement...' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Rappels à venir
            {upcomingReminders.length > 0 && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {upcomingReminders.length}
              </span>
            )}
          </button>
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Appointment Reminders */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-5 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Rappels de rendez-vous</h3>
                      <p className="text-sm text-slate-400">Recevez des rappels avant vos consultations</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.appointmentReminders.enabled}
                      onChange={e => setPreferences(prev => ({
                        ...prev,
                        appointmentReminders: { ...prev.appointmentReminders, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {preferences.appointmentReminders.enabled && (
                <div className="p-5 space-y-4">
                  {/* Channels */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-3">Canaux de notification</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'email' as const, label: 'Email', icon: Mail },
                        { key: 'sms' as const, label: 'SMS', icon: Smartphone },
                        { key: 'push' as const, label: 'Notification', icon: Bell },
                      ].map(channel => (
                        <label
                          key={channel.key}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                            preferences.appointmentReminders[channel.key]
                              ? 'bg-teal-600/20 border-teal-500 text-teal-400'
                              : 'bg-slate-700 border-slate-600 text-slate-400'
                          } border`}
                        >
                          <input
                            type="checkbox"
                            checked={preferences.appointmentReminders[channel.key]}
                            onChange={e => setPreferences(prev => ({
                              ...prev,
                              appointmentReminders: { ...prev.appointmentReminders, [channel.key]: e.target.checked }
                            }))}
                            className="sr-only"
                          />
                          <channel.icon className="w-4 h-4" />
                          {channel.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Timing */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-3">Quand recevoir les rappels</label>
                    <div className="flex flex-wrap gap-2">
                      {TIMING_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => toggleTiming(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            preferences.appointmentReminders.timing.includes(opt.value)
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prescription Reminders */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-5 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Pill className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Rappels de médicaments</h3>
                      <p className="text-sm text-slate-400">Rappels quotidiens pour vos traitements</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.prescriptionReminders.enabled}
                      onChange={e => setPreferences(prev => ({
                        ...prev,
                        prescriptionReminders: { ...prev.prescriptionReminders, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {preferences.prescriptionReminders.enabled && (
                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: 'push' as const, label: 'Notification', icon: Bell },
                      { key: 'sms' as const, label: 'SMS', icon: Smartphone },
                    ].map(channel => (
                      <label
                        key={channel.key}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                          preferences.prescriptionReminders[channel.key]
                            ? 'bg-teal-600/20 border-teal-500 text-teal-400'
                            : 'bg-slate-700 border-slate-600 text-slate-400'
                        } border`}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.prescriptionReminders[channel.key]}
                          onChange={e => setPreferences(prev => ({
                            ...prev,
                            prescriptionReminders: { ...prev.prescriptionReminders, [channel.key]: e.target.checked }
                          }))}
                          className="sr-only"
                        />
                        <channel.icon className="w-4 h-4" />
                        {channel.label}
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Heure des rappels quotidiens</label>
                    <input
                      type="time"
                      value={preferences.prescriptionReminders.dailyTime}
                      onChange={e => setPreferences(prev => ({
                        ...prev,
                        prescriptionReminders: { ...prev.prescriptionReminders, dailyTime: e.target.value }
                      }))}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lab Results Notifications */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <FlaskConical className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Résultats d'analyses</h3>
                      <p className="text-sm text-slate-400">Soyez notifié quand vos résultats sont disponibles</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.labResultsNotifications.enabled}
                      onChange={e => setPreferences(prev => ({
                        ...prev,
                        labResultsNotifications: { ...prev.labResultsNotifications, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Emails promotionnels</h3>
                    <p className="text-sm text-slate-400">Actualités et offres de la plateforme</p>
                  </div>
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.marketingEmails}
                    onChange={e => setPreferences(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Upcoming Tab */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingReminders.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucun rappel programmé</h3>
                <p className="text-slate-400 text-sm">
                  Vos prochains rappels apparaîtront ici
                </p>
              </div>
            ) : (
              upcomingReminders.map(reminder => (
                <div
                  key={reminder.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {getReminderIcon(reminder.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{reminder.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{reminder.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(reminder.scheduledFor)}
                        </span>
                        <div className="flex items-center gap-1">
                          {reminder.channels.includes('email') && (
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          {reminder.channels.includes('sms') && (
                            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          {reminder.channels.includes('push') && (
                            <Bell className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
