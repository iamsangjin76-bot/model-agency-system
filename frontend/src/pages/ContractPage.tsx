import React, { useState, useEffect, useCallback } from 'react';
import { contractsAPI, Contract } from '@/services/api';
import {
  Search,
  Plus,
  Filter,
  FileText,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  X,
  DollarSign,
  FileSignature,
  Shield,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// 계약 상태
type ContractStatus = 'draft' | 'pending' | 'active' | 'expired' | 'terminated';

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft: { label: '초안', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileText },
  pending: { label: '검토중', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  active: { label: '진행중', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  expired: { label: '만료', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
  terminated: { label: '해지', color: 'text-gray-500', bgColor: 'bg-gray-200', icon: XCircle },
};

// 계약 유형
type ContractType = 'exclusive' | 'project' | 'annual' | 'event';

const CONTRACT_TYPES: Record<ContractType, { label: string; color: string }> = {
  exclusive: { label: '전속계약', color: 'bg-purple-500' },
  project: { label: '프로젝트', color: 'bg-blue-500' },
  annual: { label: '연간계약', color: 'bg-green-500' },
  event: { label: '단발성', color: 'bg-orange-500' },
};

const formatCurrency = (amount?: number | null) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

const getContractTypeKey = (type?: string): ContractType => {
  if (type && type in CONTRACT_TYPES) return type as ContractType;
  return 'project';
};

const getStatusKey = (status?: string): ContractStatus => {
  if (status && status in STATUS_CONFIG) return status as ContractStatus;
  return 'draft';
};

// 새 계약 폼 상태
interface NewContractForm {
  title: string;
  contract_type: ContractType;
  status: ContractStatus;
  model_name: string;
  client_name: string;
  total_amount: string;
  agency_fee: string;
  model_fee: string;
  start_date: string;
  end_date: string;
  memo: string;
}

export default function ContractPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContractType | 'all'>('all');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newContract, setNewContract] = useState<NewContractForm>({
    title: '',
    contract_type: 'project',
    status: 'draft',
    model_name: '',
    client_name: '',
    total_amount: '',
    agency_fee: '',
    model_fee: '',
    start_date: '',
    end_date: '',
    memo: '',
  });

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await contractsAPI.list({ page: 1, size: 100 });
      setContracts(result.items || []);
    } catch (err) {
      console.error('계약 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // 필터링된 계약 목록
  const filteredContracts = contracts.filter(contract => {
    const title = (contract as any).title || '';
    const modelName = contract.model_name || '';
    const clientName = contract.client_name || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.contract_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // 통계 (API 데이터 기반)
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    pending: contracts.filter(c => c.status === 'pending' || c.status === 'draft').length,
    totalAmount: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0),
  };

  // 만료 임박 계약 (30일 이내)
  const today = new Date();
  const expiringContracts = contracts.filter(c => {
    if (c.status !== 'active' || !c.end_date) return false;
    const endDate = new Date(c.end_date);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const handleCreateContract = async () => {
    if (!newContract.title.trim()) return;
    setIsSaving(true);
    try {
      await contractsAPI.create({
        contract_type: newContract.contract_type,
        status: newContract.status,
        model_name: newContract.model_name || undefined,
        client_name: newContract.client_name || undefined,
        total_amount: newContract.total_amount ? Number(newContract.total_amount.replace(/,/g, '')) : undefined,
        agency_fee: newContract.agency_fee ? Number(newContract.agency_fee.replace(/,/g, '')) : undefined,
        model_fee: newContract.model_fee ? Number(newContract.model_fee.replace(/,/g, '')) : undefined,
        start_date: newContract.start_date || undefined,
        end_date: newContract.end_date || undefined,
        memo: newContract.memo || undefined,
      } as any);
      setShowNewModal(false);
      setNewContract({
        title: '', contract_type: 'project', status: 'draft',
        model_name: '', client_name: '', total_amount: '', agency_fee: '',
        model_fee: '', start_date: '', end_date: '', memo: '',
      });
      fetchContracts();
    } catch (err) {
      console.error('계약 등록 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체 계약', value: stats.total, icon: FileText, color: 'from-gray-500 to-gray-600', small: false },
          { label: '진행중', value: stats.active, icon: CheckCircle2, color: 'from-green-500 to-green-600', small: false },
          { label: '검토/초안', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600', small: false },
          { label: '총 계약금액', value: formatCurrency(stats.totalAmount), icon: DollarSign, color: 'from-blue-500 to-blue-600', small: true },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`${stat.small ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
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

      {/* 만료 임박 경고 */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">만료 임박 계약 {expiringContracts.length}건</p>
              <p className="text-sm text-amber-600">30일 이내 만료 예정인 계약을 확인하세요.</p>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* 검색 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="계약명, 모델, 광고주 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            {/* 새로고침 */}
            <button
              onClick={fetchContracts}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">모든 상태</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* 유형 필터 */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ContractType | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">모든 유형</option>
              {Object.entries(CONTRACT_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* 새 계약 버튼 */}
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            계약 등록
          </button>
        </div>
      </div>

      {/* 계약 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">계약번호</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">계약명</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">유형</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">모델</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">광고주</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">계약금액</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">기간</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>계약 목록을 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>등록된 계약이 없습니다</p>
                    <button
                      onClick={() => setShowNewModal(true)}
                      className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                    >
                      첫 계약 등록하기
                    </button>
                  </td>
                </tr>
              ) : filteredContracts.map((contract) => {
                const statusKey = getStatusKey(contract.status);
                const typeKey = getContractTypeKey(contract.contract_type);
                const statusConfig = STATUS_CONFIG[statusKey];
                const typeConfig = CONTRACT_TYPES[typeKey];
                const StatusIcon = statusConfig.icon;
                const contractTitle = (contract as any).title || `계약 #${contract.contract_number || contract.id}`;

                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 font-mono">{contract.contract_number || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">{contractTitle}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{contract.model_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{contract.client_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-600">{formatCurrency(contract.total_amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {contract.start_date || '-'} ~ {contract.end_date || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 계약 상세 모달 */}
      {selectedContract && (() => {
        const statusKey = getStatusKey(selectedContract.status);
        const typeKey = getContractTypeKey(selectedContract.contract_type);
        const contractTitle = (selectedContract as any).title || `계약 #${selectedContract.contract_number || selectedContract.id}`;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${CONTRACT_TYPES[typeKey].color}`}>
                        {CONTRACT_TYPES[typeKey].label}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_CONFIG[statusKey].bgColor} ${STATUS_CONFIG[statusKey].color}`}>
                        {STATUS_CONFIG[statusKey].label}
                      </span>
                      {selectedContract.contract_number && (
                        <span className="text-sm text-gray-500 font-mono">{selectedContract.contract_number}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{contractTitle}</h2>
                  </div>
                  <button onClick={() => setSelectedContract(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                {/* 계약 당사자 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">모델</span>
                    </div>
                    <p className="text-lg font-semibold">{selectedContract.model_name || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">광고주</span>
                    </div>
                    <p className="text-lg font-semibold">{selectedContract.client_name || '-'}</p>
                  </div>
                </div>

                {/* 계약 금액 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">계약 금액</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-500">총 계약금</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(selectedContract.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">에이전시 수수료</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedContract.agency_fee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">모델 지급액</p>
                      <p className="text-xl font-bold text-purple-600">{formatCurrency(selectedContract.model_fee)}</p>
                    </div>
                  </div>
                </div>

                {/* 계약 기간 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="w-4 h-4" />계약 시작
                    </div>
                    <p className="font-semibold">{selectedContract.start_date || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="w-4 h-4" />계약 종료
                    </div>
                    <p className="font-semibold">{selectedContract.end_date || '-'}</p>
                  </div>
                </div>

                {/* 계약 내용 (메모) */}
                {selectedContract.memo && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      계약 내용
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-600">{selectedContract.memo}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end bg-gray-50">
                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 새 계약 등록 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <FileSignature className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">계약 등록</h2>
                  <p className="text-sm text-gray-500">새로운 계약을 등록합니다</p>
                </div>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">계약명 *</label>
                    <input
                      type="text"
                      placeholder="계약 제목을 입력하세요"
                      value={newContract.title}
                      onChange={e => setNewContract(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계약 유형 *</label>
                    <select
                      value={newContract.contract_type}
                      onChange={e => setNewContract(p => ({ ...p, contract_type: e.target.value as ContractType }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      {Object.entries(CONTRACT_TYPES).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계약 상태</label>
                    <select
                      value={newContract.status}
                      onChange={e => setNewContract(p => ({ ...p, status: e.target.value as ContractStatus }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 계약 당사자 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-500" />계약 당사자
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">모델명</label>
                    <input
                      type="text"
                      placeholder="모델 이름"
                      value={newContract.model_name}
                      onChange={e => setNewContract(p => ({ ...p, model_name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">광고주명</label>
                    <input
                      type="text"
                      placeholder="광고주 이름"
                      value={newContract.client_name}
                      onChange={e => setNewContract(p => ({ ...p, client_name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 계약 금액 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-500" />계약 금액
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">총 계약금</label>
                    <input
                      type="number"
                      placeholder="50000000"
                      value={newContract.total_amount}
                      onChange={e => setNewContract(p => ({ ...p, total_amount: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">에이전시 수수료</label>
                    <input
                      type="number"
                      placeholder="15000000"
                      value={newContract.agency_fee}
                      onChange={e => setNewContract(p => ({ ...p, agency_fee: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">모델 지급액</label>
                    <input
                      type="number"
                      placeholder="35000000"
                      value={newContract.model_fee}
                      onChange={e => setNewContract(p => ({ ...p, model_fee: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 계약 기간 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />계약 기간
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계약 시작일</label>
                    <input
                      type="date"
                      value={newContract.start_date}
                      onChange={e => setNewContract(p => ({ ...p, start_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계약 종료일</label>
                    <input
                      type="date"
                      value={newContract.end_date}
                      onChange={e => setNewContract(p => ({ ...p, end_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 계약 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계약 내용</label>
                <textarea
                  rows={3}
                  placeholder="계약에 대한 상세 내용을 입력하세요"
                  value={newContract.memo}
                  onChange={e => setNewContract(p => ({ ...p, memo: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateContract}
                disabled={isSaving || !newContract.title.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSaving ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
