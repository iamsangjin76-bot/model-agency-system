import React, { useState, useEffect, useCallback } from 'react';
import { contractsAPI, Contract } from '@/services/api';
import { STATUS_CONFIG, CONTRACT_TYPES, formatCurrency, getContractTypeKey, getStatusKey, NewContractForm, ContractStatus, ContractType } from '@/components/contract/ContractConstants';
import { ContractDetailModal } from '@/components/contract/ContractDetailModal';
import { ContractFormModal } from '@/components/contract/ContractFormModal';
import { Search, Plus, FileText, CheckCircle2, Clock, DollarSign, User, Building2, Eye, AlertTriangle, RefreshCw } from 'lucide-react';

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

  // Filtered contract list
  const q = searchTerm.toLowerCase();
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = [(c as any).title, c.model_name, c.client_name].some(v => (v || '').toLowerCase().includes(q));
    return matchesSearch && (statusFilter === 'all' || c.status === statusFilter) && (typeFilter === 'all' || c.contract_type === typeFilter);
  });

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    pending: contracts.filter(c => c.status === 'pending' || c.status === 'draft').length,
    totalAmount: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0),
  };
  const today = new Date();
  const expiringContracts = contracts.filter(c => {
    if (c.status !== 'active' || !c.end_date) return false;
    const days = Math.ceil((new Date(c.end_date).getTime() - today.getTime()) / 86400000);
    return days <= 30 && days > 0;
  });

  const toNum = (s: string) => s ? Number(s.replace(/,/g, '')) : undefined;
  const handleCreateContract = async () => {
    if (!newContract.title.trim()) return;
    setIsSaving(true);
    try {
      await contractsAPI.create({ contract_type: newContract.contract_type, status: newContract.status,
        model_name: newContract.model_name || undefined, client_name: newContract.client_name || undefined,
        total_amount: toNum(newContract.total_amount), agency_fee: toNum(newContract.agency_fee),
        model_fee: toNum(newContract.model_fee), start_date: newContract.start_date || undefined,
        end_date: newContract.end_date || undefined, memo: newContract.memo || undefined } as any);
      setShowNewModal(false);
      setNewContract({ title: '', contract_type: 'project', status: 'draft', model_name: '', client_name: '', total_amount: '', agency_fee: '', model_fee: '', start_date: '', end_date: '', memo: '' });
      fetchContracts();
    } catch (err) { console.error('계약 등록 실패:', err); } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Top statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체 계약', value: stats.total, icon: FileText, color: 'from-gray-500 to-gray-600', small: false },
          { label: '진행중', value: stats.active, icon: CheckCircle2, color: 'from-green-500 to-green-600', small: false },
          { label: '검토/초안', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600', small: false },
          { label: '총 계약금액', value: formatCurrency(stats.totalAmount), icon: DollarSign, color: 'from-blue-500 to-blue-600', small: true },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
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

      {/* Expiry warning */}
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

      {/* Search and filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="계약명, 모델, 광고주 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            {/* Refresh */}
            <button
              onClick={fetchContracts}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">모든 상태</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ContractType | 'all')}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">모든 유형</option>
              {Object.entries(CONTRACT_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* New contract button */}
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            계약 등록
          </button>
        </div>
      </div>

      {/* Contract list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>{['계약번호','계약명','유형','모델','광고주','계약금액','기간','상태'].map(h=>(
                <th key={h} className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{h}</th>
              ))}<th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">관리</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>계약 목록을 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{contract.contract_number || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{contractTitle}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span className="text-sm">{contract.model_name || '-'}</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span className="text-sm">{contract.client_name || '-'}</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-600">{formatCurrency(contract.total_amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
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
                      <button onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract detail modal */}
      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}

      {/* New contract modal */}
      {showNewModal && (
        <ContractFormModal
          newContract={newContract}
          isSaving={isSaving}
          onClose={() => setShowNewModal(false)}
          onSave={handleCreateContract}
          onChange={updates => setNewContract(p => ({ ...p, ...updates }))}
        />
      )}
    </div>
  );
}
