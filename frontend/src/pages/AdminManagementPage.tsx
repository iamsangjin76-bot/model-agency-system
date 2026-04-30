import { useState, useEffect } from 'react';
import { authAPI, Admin, AdminCreate, AdminUpdate } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';
import {
  Users,
  Plus,
  Edit2,
  Shield,
  ShieldCheck,
  Search,
  X,
  Check,
  UserPlus,
  Mail,
  Phone,
  Key,
  User,
  ToggleLeft,
  ToggleRight,
  Newspaper,
  Image,
  Download,
  BarChart3,
  Megaphone,
  Building2,
  Calendar,
  FileSignature,
  Wallet,
  Share2,
  Settings,
  Lock,
} from 'lucide-react';

// 역할 정의 (2단계)
const ROLES = [
  { value: 'super_admin', label: '최고 관리자', color: 'bg-red-100 text-red-700', icon: ShieldCheck },
  { value: 'user', label: '사용자', color: 'bg-blue-100 text-blue-700', icon: User },
];

// 권한 목록
const PERMISSIONS = [
  { key: 'model', label: '모델 관리', icon: Users, description: '모델 등록, 수정, 삭제' },
  { key: 'news', label: '뉴스 검색', icon: Newspaper, description: '뉴스 검색 및 저장' },
  { key: 'image', label: '이미지 검색', icon: Image, description: '이미지 검색 및 저장' },
  { key: 'profile', label: '프로필 다운로드', icon: Download, description: '프로필 PDF/PPT 생성' },
  { key: 'sns', label: 'SNS 분석', icon: BarChart3, description: 'SNS 통계 조회' },
  { key: 'casting', label: '캐스팅 관리', icon: Megaphone, description: '캐스팅 등록 및 관리' },
  { key: 'client', label: '고객 관리', icon: Building2, description: '고객사 등록 및 관리' },
  { key: 'schedule', label: '일정 관리', icon: Calendar, description: '일정 등록 및 조회' },
  { key: 'contract', label: '계약 관리', icon: FileSignature, description: '계약 등록 및 관리' },
  { key: 'settlement', label: '정산 관리', icon: Wallet, description: '정산 등록 및 관리' },
  { key: 'share', label: '외부 공유', icon: Share2, description: '외부 공유 링크 생성' },
  { key: 'settings', label: '시스템 설정', icon: Settings, description: '시스템 설정 변경' },
];

// 비밀번호 재설정 모달 (super_admin 전용)
function ResetPasswordModal({
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

const getRoleInfo = (role: string) => {
  return ROLES.find(r => r.value === role) || ROLES[1];
};

// 관리자 등록/수정 모달
function AdminModal({
  isOpen,
  onClose,
  admin,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin | null;
  onSave: (data: AdminCreate | AdminUpdate) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'user',
    permissions: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (admin) {
      // 권한 데이터 처리
      let perms: string[] = [];
      if (Array.isArray(admin.permissions)) {
        perms = admin.permissions as string[];
      } else if (typeof admin.permissions === 'object') {
        perms = Object.keys(admin.permissions).filter(k => {
          const v = (admin.permissions as Record<string, any>)[k];
          return Array.isArray(v) ? v.length > 0 : Boolean(v);
        });
      }
      
      setFormData({
        username: admin.username,
        password: '',
        name: admin.name,
        email: admin.email || '',
        phone: admin.phone || '',
        role: admin.role,
        permissions: perms,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        role: 'user',
        permissions: [],
      });
    }
    setError('');
  }, [admin, isOpen]);

  const handlePermissionToggle = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      permissions: PERMISSIONS.map(p => p.key)
    }));
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (admin) {
        // 수정
        const updateData: AdminUpdate = {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          role: formData.role,
          permissions: formData.role === 'super_admin' ? undefined : formData.permissions,
        };
        await onSave(updateData);
      } else {
        // 등록
        if (!formData.username || !formData.password || !formData.name) {
          setError('아이디, 비밀번호, 이름은 필수 입력 항목입니다.');
          setLoading(false);
          return;
        }
        const createData: AdminCreate = {
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          role: formData.role,
          permissions: formData.role === 'super_admin' ? undefined : formData.permissions,
        };
        await onSave(createData);
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
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">
            {admin ? '관리자 수정' : '새 관리자 등록'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 아이디 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                아이디 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!admin}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                    admin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                  }`}
                  placeholder="아이디"
                />
              </div>
            </div>

            {/* 비밀번호 (등록 시에만) */}
            {!admin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="비밀번호"
                  />
                </div>
              </div>
            )}

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="이름"
                />
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="이메일"
                />
              </div>
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">연락처</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="연락처"
                />
              </div>
            </div>
          </div>

          {/* 역할 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              역할 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    formData.role === role.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <role.icon className={`w-6 h-6 ${formData.role === role.value ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`} />
                  <div className="text-left">
                    <span className={`font-medium block ${formData.role === role.value ? 'text-purple-700' : 'text-gray-600 dark:text-gray-300'}`}>
                      {role.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {role.value === 'super_admin' ? '모든 권한' : '선택된 권한만'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 권한 설정 (사용자일 때만) */}
          {formData.role === 'user' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  권한 설정
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                  >
                    전체 선택
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    전체 해제
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PERMISSIONS.map((perm) => (
                  <label
                    key={perm.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.permissions.includes(perm.key)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.key)}
                      onChange={() => handlePermissionToggle(perm.key)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <perm.icon className={`w-4 h-4 ${formData.permissions.includes(perm.key) ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-sm ${formData.permissions.includes(perm.key) ? 'text-purple-700 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                      {perm.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 최고관리자 안내 */}
          {formData.role === 'super_admin' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">
                <ShieldCheck className="w-4 h-4 inline mr-2" />
                최고 관리자는 모든 기능에 접근할 수 있으며, 다른 사용자의 권한을 관리할 수 있습니다.
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {admin ? '수정' : '등록'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminManagementPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [resetPwAdmin, setResetPwAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState('');
  const isSuperAdmin = user?.role === 'super_admin';

  // 관리자 목록 조회
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await authAPI.listAdmins();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message || '관리자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 검색 필터링
  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 관리자 등록/수정
  const handleSave = async (data: AdminCreate | AdminUpdate) => {
    if (editingAdmin) {
      await authAPI.updateAdmin(editingAdmin.id, data as AdminUpdate);
    } else {
      await authAPI.registerAdmin(data as AdminCreate);
    }
    setModalOpen(false);
    setEditingAdmin(null);
    fetchAdmins();
  };

  // 활성화/비활성화 토글
  const handleToggleActive = async (admin: Admin) => {
    try {
      await authAPI.updateAdmin(admin.id, { is_active: !admin.is_active });
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || '상태 변경에 실패했습니다.');
    }
  };

  // 권한 개수 계산
  const getPermissionCount = (admin: Admin) => {
    if (admin.role === 'super_admin') return '모든 권한';
    if (Array.isArray(admin.permissions)) return `${admin.permissions.length}개`;
    if (typeof admin.permissions === 'object') {
      const count = Object.keys(admin.permissions).filter(k => {
        const v = (admin.permissions as Record<string, any>)[k];
        return Array.isArray(v) ? v.length > 0 : Boolean(v);
      }).length;
      return `${count}개`;
    }
    return '0개';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">관리자 설정</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">시스템 사용자를 관리하고 권한을 설정합니다.</p>
        </div>
        <button
          onClick={() => { setEditingAdmin(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-colors shadow-lg shadow-purple-500/25"
        >
          <UserPlus className="w-5 h-5" />
          새 관리자 등록
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름, 아이디, 이메일로 검색..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      {/* 역할별 통계 */}
      <div className="grid grid-cols-2 gap-4">
        {ROLES.map((role) => {
          const count = admins.filter((a) => a.role === role.value).length;
          return (
            <div key={role.value} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${role.color}`}>
                  <role.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{role.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 관리자 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>등록된 관리자가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">사용자</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">역할</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">권한</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">마지막 로그인</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAdmins.map((admin) => {
                  const roleInfo = getRoleInfo(admin.role);
                  const isCurrentUser = user?.id === admin.id;
                  return (
                    <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                              {admin.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">나</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{admin.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
                          <roleInfo.icon className="w-4 h-4" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{getPermissionCount(admin)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => !isCurrentUser && handleToggleActive(admin)}
                          disabled={isCurrentUser}
                          className={`flex items-center gap-2 ${isCurrentUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {admin.is_active ? (
                            <>
                              <ToggleRight className="w-6 h-6 text-green-500" />
                              <span className="text-sm text-green-600">활성</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">비활성</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {admin.last_login ? new Date(admin.last_login).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isSuperAdmin && (
                            <button
                              onClick={() => setResetPwAdmin(admin)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:text-orange-500"
                              title="비밀번호 변경"
                            >
                              <Lock className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingAdmin(admin); setModalOpen(true); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:text-purple-600"
                            title="수정"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 권한 설명 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">사용 가능한 권한 목록</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {PERMISSIONS.map((perm) => (
            <div key={perm.key} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <perm.icon className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-800 dark:text-gray-100">{perm.label}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{perm.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 관리자 등록/수정 모달 */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAdmin(null); }}
        admin={editingAdmin}
        onSave={handleSave}
      />

      {/* 비밀번호 재설정 모달 (super_admin 전용) */}
      <ResetPasswordModal
        isOpen={!!resetPwAdmin}
        onClose={() => setResetPwAdmin(null)}
        admin={resetPwAdmin}
      />
    </div>
  );
}
