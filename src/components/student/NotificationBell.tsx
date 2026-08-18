import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Notification } from '../../types';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffJ = Math.floor(diffH / 24);

  if (diffSec < 30) return "à l'instant";
  if (diffMin < 1) return `il y a ${diffSec}s`;
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffJ < 7) return `il y a ${diffJ}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const basePath = isAdmin ? '/admin' : '/apprenant';

  const { data: notifResponse } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications', user?.role],
    queryFn: async () => {
      const res = await api.get(`${basePath}/notifications`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const notifications = notifResponse?.notifications || [];
  const unreadCount = notifResponse?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => api.patch(`${basePath}/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.patch(`${basePath}/notifications/read-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCES': return 'check_circle';
      case 'WARNING': return 'warning';
      case 'CERTIFICAT': return 'workspace_premium';
      case 'ERROR': return 'error';
      case 'ANNONCE': return 'campaign';
      default: return 'person_add';
    }
  };

  const isAnnouncement = (type: string) => type === 'ANNONCE';

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); setExpandedId(null); }}
        className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="material-symbols-outlined text-gray-500">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-96 bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/40 z-50 max-h-[32rem] overflow-hidden flex flex-col animate-slide-down">
            {/* Header */}
            <div className="p-4 border-b border-white/30 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                <div className="divide-y divide-white/30">
                  {notifications.map((notif) => {
                    const expanded = expandedId === notif.id;
                    const hasLongMessage = notif.message.length > 120;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead) markReadMutation.mutate(notif.id);
                          if (hasLongMessage) setExpandedId(expanded ? null : notif.id);
                        }}
                        className={`p-4 cursor-pointer transition-colors ${
                          !notif.isRead
                            ? isAnnouncement(notif.type)
                              ? 'bg-red-50 hover:bg-red-100/70'
                              : 'bg-blue-50/60 hover:bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icone */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAnnouncement(notif.type)
                              ? 'bg-red-100'
                              : notif.type === 'SUCCES' ? 'bg-green-100'
                              : notif.type === 'WARNING' ? 'bg-yellow-100'
                              : notif.type === 'CERTIFICAT' ? 'bg-purple-100'
                              : notif.type === 'ERROR' ? 'bg-red-100'
                              : 'bg-blue-100'
                          }`}>
                            <span className={`material-symbols-outlined text-xl ${
                              isAnnouncement(notif.type) ? 'text-red-600' :
                              notif.type === 'SUCCES' ? 'text-green-600' :
                              notif.type === 'WARNING' ? 'text-yellow-600' :
                              notif.type === 'CERTIFICAT' ? 'text-purple-600' :
                              notif.type === 'ERROR' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {getIcon(notif.type)}
                            </span>
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{notif.title}</p>
                              {isAnnouncement(notif.type) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 flex-shrink-0">
                                  ANNONCE
                                </span>
                              )}
                            </div>
                            <p className={`text-sm text-gray-600 leading-relaxed whitespace-pre-wrap ${
                              !expanded && hasLongMessage ? 'line-clamp-3' : ''
                            }`}>
                              {notif.message}
                            </p>
                            {hasLongMessage && (
                              <button className="text-xs text-primary-500 hover:text-primary-600 font-medium mt-1">
                                {expanded ? 'Voir moins' : 'Voir plus'}
                              </button>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {timeAgo(notif.createdAt)}
                            </p>
                          </div>

                          {/* Point non-lu */}
                          {!notif.isRead && (
                            <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                              isAnnouncement(notif.type) ? 'bg-red-500' : 'bg-primary-500'
                            }`} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300">notifications_off</span>
                  <p className="text-sm text-gray-400 mt-3">Aucune notification</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
