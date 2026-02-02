'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  CreditCard,
  MessageSquare,
  Pill,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  X,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type NotificationFilter = 'all' | 'unread' | 'appointments' | 'health' | 'payments';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const authedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const res = await fetch(`${apiBaseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }, [apiBaseUrl]);

  const fetchNotifications = useCallback(async () => {
    const data = await authedFetch('/notifications');

    if (data && Array.isArray(data)) {
      setNotifications(data);
    } else {
      // Mock data for development
      setNotifications([
        {
          id: '1',
          type: 'APPOINTMENT_REMINDER',
          title: 'Rappel de rendez-vous',
          message: 'Votre rendez-vous avec Dr. Martin est demain à 10h00',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Rendez-vous confirmé',
          message: 'Votre rendez-vous du 15 janvier a été confirmé par Dr. Dubois',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          type: 'PRESCRIPTION_READY',
          title: 'Ordonnance disponible',
          message: 'Votre ordonnance du 10 janvier est prête à être téléchargée',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: '4',
          type: 'PAYMENT_CONFIRMED',
          title: 'Paiement confirmé',
          message: 'Votre paiement de 50€ pour la consultation du 8 janvier a été validé',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          id: '5',
          type: 'APPOINTMENT_CANCELLED',
          title: 'Rendez-vous annulé',
          message: 'Votre rendez-vous du 5 janvier a été annulé. Vous pouvez en reprogrammer un nouveau.',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        },
        {
          id: '6',
          type: 'LAB_RESULTS',
          title: 'Résultats d\'analyse disponibles',
          message: 'Vos résultats d\'analyse sanguine sont disponibles dans votre dossier médical',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        },
        {
          id: '7',
          type: 'APPOINTMENT_REMINDER',
          title: 'N\'oubliez pas votre rendez-vous',
          message: 'Rappel : consultation avec Dr. Lambert le 20 janvier à 14h30',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        },
      ]);
    }
  }, [authedFetch]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    loadData();
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    await authedFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAsUnread = async (id: string) => {
    await authedFetch(`/notifications/${id}/unread`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
  };

  const deleteNotification = async (id: string) => {
    await authedFetch(`/notifications/${id}`, { method: 'DELETE' });
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const markAllAsRead = async () => {
    await authedFetch('/notifications/read-all', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteSelected = async () => {
    for (const id of selectedIds) {
      await deleteNotification(id);
    }
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'APPOINTMENT_CONFIRMED':
        return <CalendarCheck className="w-5 h-5 text-green-400" />;
      case 'APPOINTMENT_CANCELLED':
        return <CalendarX className="w-5 h-5 text-red-400" />;
      case 'APPOINTMENT_RESCHEDULED':
        return <Calendar className="w-5 h-5 text-orange-400" />;
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="w-5 h-5 text-green-400" />;
      case 'PRESCRIPTION_READY':
        return <Pill className="w-5 h-5 text-purple-400" />;
      case 'LAB_RESULTS':
        return <Pill className="w-5 h-5 text-teal-400" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getFilterCategory = (type: string): NotificationFilter => {
    if (type.includes('APPOINTMENT')) return 'appointments';
    if (type.includes('PAYMENT')) return 'payments';
    if (type.includes('PRESCRIPTION') || type.includes('LAB')) return 'health';
    return 'all';
  };

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    if (filter === 'unread') {
      result = result.filter(n => !n.read);
    } else if (filter !== 'all') {
      result = result.filter(n => getFilterCategory(n.type) === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, filter, searchQuery]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters: { value: NotificationFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Toutes', icon: <Bell className="w-4 h-4" /> },
    { value: 'unread', label: 'Non lues', icon: <BellOff className="w-4 h-4" /> },
    { value: 'appointments', label: 'Rendez-vous', icon: <Calendar className="w-4 h-4" /> },
    { value: 'health', label: 'Santé', icon: <Pill className="w-4 h-4" /> },
    { value: 'payments', label: 'Paiements', icon: <CreditCard className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-slate-400">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4">
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
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-slate-400 text-sm">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Tout marquer lu</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6">
          <div className="p-4 border-b border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bulk actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
                  <button
                    onClick={deleteSelected}
                    className="px-3 py-1.5 text-sm text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1.5 text-sm text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 overflow-x-auto">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {f.icon}
                {f.label}
                {f.value === 'unread' && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {/* Select All */}
          {filteredNotifications.length > 0 && (
            <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-700 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={e => e.target.checked ? selectAll() : deselectAll()}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-400">
                  Sélectionner tout ({filteredNotifications.length})
                </span>
              </label>
              <span className="text-sm text-slate-500">
                Page {currentPage} sur {totalPages || 1}
              </span>
            </div>
          )}

          {/* List */}
          {paginatedNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchQuery ? 'Aucune notification trouvée' : 'Aucune notification'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-teal-400 hover:text-teal-300 text-sm"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {paginatedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-700/30 transition-colors ${
                    !notification.read ? 'bg-teal-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-600 focus:ring-teal-500"
                    />

                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      !notification.read ? 'bg-teal-600/20' : 'bg-slate-700'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-medium ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-teal-500 rounded-full" />
                            )}
                          </h3>
                          <p className="text-sm text-slate-400 mt-0.5">{notification.message}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-2">
                        {!notification.read ? (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marquer comme lu
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsUnread(notification.id)}
                            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
                          >
                            <BellOff className="w-3 h-3" />
                            Marquer non lu
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-700/30 border-t border-slate-700 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Settings link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/account')}
            className="text-sm text-slate-500 hover:text-teal-400 flex items-center gap-2 mx-auto"
          >
            <Settings className="w-4 h-4" />
            Gérer les préférences de notification
          </button>
        </div>
      </div>
    </div>
  );
}
