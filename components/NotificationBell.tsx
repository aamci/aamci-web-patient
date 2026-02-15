'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  X,
  Check,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  CreditCard,
  MessageSquare,
  Pill,
  AlertTriangle,
  Settings,
  Trash2,
  ChevronRight,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type NotificationFilter = 'all' | 'unread' | 'appointments' | 'messages';

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setLoading(true);
    const data = await authedFetch('/notifications');

    if (data && Array.isArray(data)) {
      setNotifications(data);
    }
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await authedFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await authedFetch('/notifications/mark-all-read', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await authedFetch(`/notifications/${id}`, { method: 'DELETE' });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'APPOINTMENT_CONFIRMED':
        return <CalendarCheck className="w-4 h-4 text-green-400" />;
      case 'APPOINTMENT_CANCELLED':
        return <CalendarX className="w-4 h-4 text-red-400" />;
      case 'APPOINTMENT_RESCHEDULED':
        return <Calendar className="w-4 h-4 text-orange-400" />;
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="w-4 h-4 text-green-400" />;
      case 'PRESCRIPTION_READY':
        return <Pill className="w-4 h-4 text-purple-400" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'appointments') return n.type.includes('APPOINTMENT');
    if (filter === 'messages') return n.type === 'NEW_MESSAGE';
    return true;
  });

  const filters: { value: NotificationFilter; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'unread', label: 'Non lues' },
    { value: 'appointments', label: 'RDV' },
    { value: 'messages', label: 'Messages' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-teal-400 hover:text-teal-300"
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-1">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filter === f.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                  {f.value === 'unread' && unreadCount > 0 && (
                    <span className="ml-1">({unreadCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Chargement...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-8 text-center">
                <BellOff className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Aucune notification</p>
              </div>
            ) : (
              filteredNotifications.slice(0, 5).map(notification => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.type === 'NEW_MESSAGE') {
                      router.push('/messages');
                      setIsOpen(false);
                    } else if (notification.type.includes('APPOINTMENT')) {
                      router.push('/appointments');
                      setIsOpen(false);
                    }
                  }}
                  className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-teal-900/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      !notification.read ? 'bg-teal-600/20' : 'bg-slate-700'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-1.5 inline-block w-2 h-2 bg-teal-500 rounded-full" />
                          )}
                        </p>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {!notification.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marquer lu
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                          className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-700/30 border-t border-slate-700">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/notifications');
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-teal-400 hover:text-teal-300 font-medium"
            >
              Voir toutes les notifications
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
