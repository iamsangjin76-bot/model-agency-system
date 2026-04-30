import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { request } from '@/services/auth-api';
import {
  Settings, User, Lock, Info, Check, Eye, EyeOff,
  Shield, Database, Globe, Bell,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Password change form
// ---------------------------------------------------------------------------
function PasswordSection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setStatus('err'); setMsg('새 비밀번호가 일치하지 않습니다.'); return;
    }
    if (form.next.length < 6) {
      setStatus('err'); setMsg('비밀번호는 6자 이상이어야 합니다.'); return;
    }
    setLoading(true);
    try {
      await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: form.current, new_password: form.next }),
      });
      setStatus('ok'); setMsg('비밀번호가 변경되었습니다.');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setStatus('err'); setMsg(err.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (f: keyof typeof show) => setShow(p => ({ ...p, [f]: !p[f] }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(['current', 'next', 'confirm'] as const).map((f) => {
        const labels = { current: '현재 비밀번호', next: '새 비밀번호', confirm: '새 비밀번호 확인' };
        return (
          <div key={f}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {labels[f]}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={show[f] ? 'text' : 'password'}
                value={form[f]}
                onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 text-sm"
                placeholder={labels[f]}
              />
              <button type="button" onClick={() => toggle(f)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show[f] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
      })}
      {msg && (
        <p className={`text-sm px-3 py-2 rounded-lg ${status === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg}
        </p>
      )}
      <button type="submit" disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50">
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
        변경하기
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function SystemSettingsPage() {
  const { user } = useAuth();

  const infoItems = [
    { icon: Globe, label: '앱 이름', value: 'Model Agency Management System' },
    { icon: Info, label: '버전', value: '1.0.0' },
    { icon: Database, label: '데이터베이스', value: 'SQLite (로컬)' },
    { icon: Shield, label: '인증 방식', value: 'JWT (액세스 15분 / 리프레시 7일)' },
    { icon: Bell, label: '알림', value: '실시간 인앱 알림 활성화' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          시스템 설정
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">계정 및 시스템 정보를 확인합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <User className="w-5 h-5 text-purple-600" />
            내 계정 정보
          </h2>
          <dl className="space-y-3">
            {[
              { label: '이름', value: user?.name },
              { label: '아이디', value: `@${user?.username}` },
              { label: '역할', value: user?.role === 'super_admin' ? '최고 관리자' : '사용자' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 dark:text-gray-100">{value ?? '-'}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Password change */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Lock className="w-5 h-5 text-purple-600" />
            비밀번호 변경
          </h2>
          <PasswordSection />
        </div>
      </div>

      {/* App info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Info className="w-5 h-5 text-purple-600" />
          시스템 정보
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {infoItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <Icon className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
