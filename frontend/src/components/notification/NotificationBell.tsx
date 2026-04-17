import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { notificationsAPI } from '@/services/api';
import NotificationDropdown from './NotificationDropdown';
import { NotificationData } from './NotificationItem';

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Fetch unread count from server
  const refreshCount = useCallback(async () => {
    try {
      const data = await notificationsAPI.unreadCount();
      setUnreadCount(data?.unread_count ?? 0);
    } catch { /* ignore auth/network errors */ }
  }, []);

  // Initial load + 30-second polling
  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  // Close dropdown whenever the route changes (e.g. after navigate())
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = async () => {
    if (!open) {
      setOpen(true);
      setIsLoading(true);
      // Refresh count immediately when dropdown is opened
      refreshCount();
      try {
        const data = await notificationsAPI.list({ page: 1, page_size: 20 });
        setNotifications(data.items as NotificationData[]);
      } catch { /* ignore */ }
      finally { setIsLoading(false); }
    } else {
      setOpen(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    // Optimistic update: update UI immediately, sync with server in background
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationsAPI.markRead(id);
    } catch { /* local state already reflects change */ }
  };

  const handleMarkAllRead = async () => {
    // Optimistic update: clear all unread indicators immediately
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationsAPI.markAllRead();
    } catch { /* local state already reflects change */ }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="p-2 hover:bg-gray-100 rounded-lg relative"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
