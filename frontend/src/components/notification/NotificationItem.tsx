import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Camera, DollarSign, Users } from 'lucide-react';

export interface NotificationData {
  id: number;
  title: string;
  message?: string | null;
  notification_type?: string | null;
  is_read: boolean;
  link_url?: string | null;
  target_type?: string | null;
  target_id?: number | null;
  created_at: string;
}

interface Props {
  notification: NotificationData;
  onRead: (id: number) => void;
  onClose: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function TypeIcon({ type }: { type?: string | null }) {
  const cls = 'w-4 h-4 flex-shrink-0';
  if (type === 'casting') return <Camera className={`${cls} text-purple-500`} />;
  if (type === 'settlement') return <DollarSign className={`${cls} text-green-500`} />;
  if (type === 'model') return <Users className={`${cls} text-blue-500`} />;
  return <Bell className={`${cls} text-gray-400`} />;
}

export default function NotificationItem({ notification: n, onRead, onClose }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Mark as read if currently unread
    if (!n.is_read) onRead(n.id);
    // Always close the dropdown
    onClose();
    // Navigate if a target URL is set
    if (n.link_url) navigate(n.link_url);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
    >
      <div className="mt-0.5">
        <TypeIcon type={n.notification_type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{relativeTime(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      )}
    </div>
  );
}
