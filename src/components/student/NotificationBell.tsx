import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Notification } from '../../types';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) markReadMutation.mutate(notif.id);
                    }}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.isRead ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-lg mt-0.5 ${
                        notif.type === 'SUCCES' ? 'text-green-500' :
                        notif.type === 'WARNING' ? 'text-yellow-500' :
                        notif.type === 'CERTIFICAT' ? 'text-purple-500' :
                        notif.type === 'ERROR' ? 'text-red-500' :
                        'text-primary-500'
                      }`}>
                        {notif.type === 'SUCCES' ? 'check_circle' :
                         notif.type === 'WARNING' ? 'warning' :
                         notif.type === 'CERTIFICAT' ? 'workspace_premium' :
                         notif.type === 'ERROR' ? 'error' : 'person_add'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-gray-300">notifications_off</span>
                <p className="text-xs text-gray-400 mt-2">Aucune notification</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
