import React, { useState, useEffect } from 'react';
import { Admin, AdminCreate, AdminUpdate } from '../../services/api';
import { PERMISSIONS, ROLES } from './AdminConstants';
import { X, Check, Key, User, Mail, Phone, ShieldCheck } from 'lucide-react';

const INPUT_CLS = 'w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100';

function FormField({ label, required, icon, children }: { label: string; required?: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export function AdminFormModal({ isOpen, onClose, admin, onSave }: {
  isOpen: boolean; onClose: () => void; admin: Admin | null;
  onSave: (data: AdminCreate | AdminUpdate) => Promise<void>;
}) {
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '', phone: '', role: 'user', permissions: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (admin) {
      let perms: string[] = [];
      if (Array.isArray(admin.permissions)) {
        perms = admin.permissions as string[];
      } else if (typeof admin.permissions === 'object') {
        perms = Object.keys(admin.permissions).filter(k => {
          const v = (admin.permissions as Record<string, any>)[k];
          return Array.isArray(v) ? v.length > 0 : Boolean(v);
        });
      }
      setFormData({ username: admin.username, password: '', name: admin.name, email: admin.email || '', phone: admin.phone || '', role: admin.role, permissions: perms });
    } else {
      setFormData({ username: '', password: '', name: '', email: '', phone: '', role: 'user', permissions: [] });
    }
    setError('');
  }, [admin, isOpen]);

  const togglePermission = (key: string) =>
    setFormData(prev => ({ ...prev, permissions: prev.permissions.includes(key) ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (admin) {
        await onSave({ name: formData.name, email: formData.email || undefined, phone: formData.phone || undefined, role: formData.role, permissions: formData.role === 'super_admin' ? undefined : formData.permissions } as AdminUpdate);
      } else {
        if (!formData.username || !formData.password || !formData.name) { setError('아이디, 비밀번호, 이름은 필수 입력 항목입니다.'); setLoading(false); return; }
        await onSave({ username: formData.username, password: formData.password, name: formData.name, email: formData.email || undefined, phone: formData.phone || undefined, role: formData.role, permissions: formData.role === 'super_admin' ? undefined : formData.permissions } as AdminCreate);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">{admin ? '관리자 수정' : '새 관리자 등록'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="아이디" required icon={<Key className="w-5 h-5" />}>
              <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                disabled={!!admin} placeholder="아이디"
                className={`${INPUT_CLS} ${admin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`} />
            </FormField>
            {!admin && (
              <FormField label="비밀번호" required icon={<Key className="w-5 h-5" />}>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="비밀번호" className={INPUT_CLS} />
              </FormField>
            )}
            <FormField label="이름" required icon={<User className="w-5 h-5" />}>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="이름" className={INPUT_CLS} />
            </FormField>
            <FormField label="이메일" icon={<Mail className="w-5 h-5" />}>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="이메일" className={INPUT_CLS} />
            </FormField>
            <FormField label="연락처" icon={<Phone className="w-5 h-5" />}>
              <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="연락처" className={INPUT_CLS} />
            </FormField>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">역할 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <button key={role.value} type="button" onClick={() => setFormData({ ...formData, role: role.value })}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.role === role.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <role.icon className={`w-6 h-6 ${formData.role === role.value ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`} />
                  <div className="text-left">
                    <span className={`font-medium block ${formData.role === role.value ? 'text-purple-700' : 'text-gray-600 dark:text-gray-300'}`}>{role.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{role.value === 'super_admin' ? '모든 권한' : '선택된 권한만'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permission settings (user role only) */}
          {formData.role === 'user' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">권한 설정</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, permissions: PERMISSIONS.map(p => p.key) }))}
                    className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">전체 선택</button>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, permissions: [] }))}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">전체 해제</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PERMISSIONS.map((perm) => (
                  <label key={perm.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.permissions.includes(perm.key) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={formData.permissions.includes(perm.key)} onChange={() => togglePermission(perm.key)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                    <perm.icon className={`w-4 h-4 ${formData.permissions.includes(perm.key) ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-sm ${formData.permissions.includes(perm.key) ? 'text-purple-700 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.role === 'super_admin' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700"><ShieldCheck className="w-4 h-4 inline mr-2" />최고 관리자는 모든 기능에 접근할 수 있으며, 다른 사용자의 권한을 관리할 수 있습니다.</p>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">취소</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-5 h-5" />{admin ? '수정' : '등록'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
