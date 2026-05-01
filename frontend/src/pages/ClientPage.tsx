import React, { useState, useEffect, useCallback } from 'react';
import { clientsAPI } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import Spinner from '@/components/ui/Spinner';
import { ClientItem, GRADE_CONFIG, INDUSTRIES, ClientGrade, Industry } from '@/components/client/ClientConstants';
import { ClientDetailModal } from '@/components/client/ClientDetailModal';
import { ClientFormModal } from '@/components/client/ClientFormModal';
import {
  Search,
  Plus,
  Building2,
  User,
  Phone,
  Mail,
  Star,
  Briefcase,
  DollarSign,
} from 'lucide-react';

export default function ClientPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<ClientGrade | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<Industry | 'all'>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [newClient, setNewClient] = useState({ name: '', industry: 'other', grade: 'normal', contact_name: '', phone: '', email: '', memo: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page: 1, size: 100 };
      if (searchTerm) params.search = searchTerm;
      if (gradeFilter !== 'all') params.grade = gradeFilter;
      if (industryFilter !== 'all') params.industry = industryFilter;
      if (showFavorites) params.is_favorite = true;
      const result = await clientsAPI.list(params);
      setClients((result.items as unknown as ClientItem[]) || []);
      setTotal(result.total || 0);
    } catch {
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, gradeFilter, industryFilter, showFavorites]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Local client filtering
  const filteredClients = clients;

  const handleToggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await clientsAPI.toggleFavorite(id);
      setClients(prev => prev.map(c => c.id === id ? { ...c, is_favorite: !c.is_favorite } : c));
    } catch { /* ignore */ }
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim() || !newClient.contact_name.trim() || !newClient.phone.trim()) {
      toast.warning('회사명, 담당자명, 연락처는 필수입니다.');
      return;
    }
    setIsSaving(true);
    try {
      await clientsAPI.create(newClient as any);
      toast.success('고객이 등록되었습니다.');
      setShowNewModal(false);
      setNewClient({ name: '', industry: 'other', grade: 'normal', contact_name: '', phone: '', email: '', memo: '' });
      fetchClients();
    } catch (err: any) {
      toast.error(err.message || '등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Statistics
  const stats = {
    total,
    vip: clients.filter(c => c.grade === 'vip').length,
    totalAmount: clients.reduce((sum, c) => sum + (c.total_amount || 0), 0).toLocaleString() + '원',
    activeProjects: clients.reduce((sum, c) => sum + (c.total_projects || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Top statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체 고객', value: stats.total, icon: Building2, color: 'from-blue-500 to-blue-600' },
          { label: 'VIP 고객', value: stats.vip, icon: Star, color: 'from-amber-500 to-amber-600' },
          { label: '총 거래액', value: stats.totalAmount, icon: DollarSign, color: 'from-green-500 to-green-600', small: true },
          { label: '진행중 프로젝트', value: stats.activeProjects, icon: Briefcase, color: 'from-purple-500 to-purple-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`${(stat as any).small ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="회사명, 담당자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Grade filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as ClientGrade | 'all')}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">모든 등급</option>
              {Object.entries(GRADE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Industry filter */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value as Industry | 'all')}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">모든 업종</option>
              {Object.entries(INDUSTRIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Favorites toggle */}
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                showFavorites
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavorites ? 'fill-amber-500' : ''}`} />
              즐겨찾기
            </button>
          </div>

          {/* New client button */}
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            고객 등록
          </button>
        </div>
      </div>

      {/* Client list */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-gray-500 dark:text-gray-400">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>등록된 고객이 없습니다.</p>
              <button onClick={() => setShowNewModal(true)} className="mt-4 px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50">새 고객 등록</button>
            </div>
          ) : filteredClients.map((client) => {
            const gradeConfig = GRADE_CONFIG[(client.grade as ClientGrade) || 'normal'];

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-lg font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 transition-colors">
                          {client.name}
                        </h3>
                        {client.is_favorite && (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${gradeConfig.bgColor} ${gradeConfig.color}`}>
                          {gradeConfig.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{INDUSTRIES[(client.industry as Industry) || 'other']}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(client.id, e)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="즐겨찾기"
                  >
                    <Star className={`w-4 h-4 ${client.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                </div>

                {/* Contact info */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {client.contact_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>{client.contact_name}{client.contact_position ? ` (${client.contact_position})` : ''}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                {/* Transaction info */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Briefcase className="w-4 h-4" />
                      <span>프로젝트 {client.total_projects || 0}건</span>
                    </div>
                    {client.total_amount ? (
                      <span className="font-semibold text-green-600">{client.total_amount.toLocaleString()}원</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client detail modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* New client registration modal */}
      {showNewModal && (
        <ClientFormModal
          newClient={newClient}
          isSaving={isSaving}
          onClose={() => setShowNewModal(false)}
          onSave={handleCreateClient}
          onChange={(field, value) => setNewClient(p => ({ ...p, [field]: value }))}
        />
      )}
    </div>
  );
}
