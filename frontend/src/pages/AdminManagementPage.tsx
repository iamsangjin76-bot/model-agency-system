import { useState, useEffect } from 'react';
import { authAPI, Admin, AdminCreate, AdminUpdate } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';
import { ROLES, PERMISSIONS, getRoleInfo } from '@/components/admin/AdminConstants';
import { ResetPasswordModal } from '@/components/admin/ResetPasswordModal';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import {
  Users,
  Plus,
  Edit2,
  Search,
  X,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  Lock,
} from 'lucide-react';

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

  // Fetch admin list
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

  // Search filter
  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Create or update admin
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

  // Toggle active/inactive
  const handleToggleActive = async (admin: Admin) => {
    try {
      await authAPI.updateAdmin(admin.id, { is_active: !admin.is_active });
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || '상태 변경에 실패했습니다.');
    }
  };

  // Count permissions
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
      {/* Header */}
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

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Search */}
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

      {/* Role statistics */}
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

      {/* Admin list */}
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

      {/* Permission list */}
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

      {/* Admin create/edit modal */}
      <AdminFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAdmin(null); }}
        admin={editingAdmin}
        onSave={handleSave}
      />

      {/* Password reset modal (super_admin only) */}
      <ResetPasswordModal
        isOpen={!!resetPwAdmin}
        onClose={() => setResetPwAdmin(null)}
        admin={resetPwAdmin}
      />
    </div>
  );
}
