import React from 'react';
import { CheckCircle2, WifiOff, Instagram, Youtube } from 'lucide-react';

export function StatusBadge({ icon, label, ok }: { icon: React.ReactNode; label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
      ok ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
         : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700'
    }`}>
      {icon}
      {label}
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
    </div>
  );
}

export function KpiCard({ icon, bg, label, value, sub }: {
  icon: React.ReactNode; bg: string; label: string; value: string; sub: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 ${bg} rounded-lg`}>{icon}</div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

export function SyncResultCard({ platform, result }: { platform: string; result: any }) {
  if (!result) return null;
  const isIG = platform === 'instagram';
  const icon = isIG ? <Instagram className="w-4 h-4 text-pink-500" /> : <Youtube className="w-4 h-4 text-red-500" />;
  const name = isIG ? 'Instagram' : 'YouTube';
  if (result.ok) {
    const val = isIG ? result.followers_count : result.subscriber_count;
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm">
        {icon}
        <span className="font-medium text-green-800 dark:text-green-300">{name} 동기화 완료</span>
        <span className="ml-auto text-green-700 dark:text-green-400 font-bold">
          {isIG ? '팔로워' : '구독자'} {val != null ? `${val.toLocaleString()}명` : '-'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
      {icon}
      <span className="text-gray-500 dark:text-gray-400">{name}: {result.message}</span>
    </div>
  );
}
