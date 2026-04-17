import React from 'react';
import { Bell } from 'lucide-react';
import NotificationItem, { NotificationData } from './NotificationItem';

interface Props {
  notifications: NotificationData[];
  isLoading: boolean;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export default function NotificationDropdown({ notifications, isLoading, onMarkRead, onMarkAllRead }: Props) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">알림</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
            <Bell className="w-8 h-8 text-gray-300" />
            <p className="text-sm">알림이 없습니다</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={onMarkRead} />
          ))
        )}
      </div>
    </div>
  );
}
