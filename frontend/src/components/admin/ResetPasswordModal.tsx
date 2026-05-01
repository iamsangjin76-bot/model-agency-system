import React, { useState, useEffect } from 'react';
import { Admin } from '../../services/api';
import { Lock, X, Check } from 'lucide-react';

export function ResetPasswordModal({
  isOpen, onClose, admin,
}: { isOpen: boolean; onClose: () => void; admin: Admin | null }) {
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => { if (isOpen) { setNewPw(''); setConfirm(''); setMsg(''); } }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { setIsError(true); setMsg('비밀번호가 일치하지 않습니다.'); return; }
    if (newPw.length < 6) { setIsError(true); setMsg('6자 이상 입력해주세요.'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/auth/admins/${admin?.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: newPw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      setIsError(false); setMsg('비밀번호가 변경되었습니다.');
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setIsError(true); setMsg(err.message || '변경에 실패했습니다.');
    } finally { setLoading(false); }
  };

  if (!isOpen || !admin) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            {admin.name} 비밀번호 변경
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">새 비밀번호</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="새 비밀번호 (6자 이상)" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="비밀번호 확인" required />
          </div>
          {msg && <p className={`text-sm px-3 py-2 rounded-lg ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">취소</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              변경
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
