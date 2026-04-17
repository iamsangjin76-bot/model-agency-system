import React, { useState, useEffect, useCallback } from 'react';
import { settlementsAPI } from '@/services/api';
import { Settlement } from '@/services/domain-api';
import { Search, Plus } from 'lucide-react';
import SettlementStatsCards from '@/components/settlement/SettlementStatsCards';
import SettlementCharts from '@/components/settlement/SettlementCharts';
import SettlementTable from '@/components/settlement/SettlementTable';
import SettlementDetailModal from '@/components/settlement/SettlementDetailModal';
import SettlementFormModal from '@/components/settlement/SettlementFormModal';

type SettlementStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
type SettlementType = 'model_payment' | 'agency_fee' | 'expense' | 'refund';

const STATUS_OPTIONS = [
  { value: 'all', label: '모든 상태' },
  { value: 'pending', label: '대기중' },
  { value: 'processing', label: '처리중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: '모든 유형' },
  { value: 'model_payment', label: '모델 지급' },
  { value: 'agency_fee', label: '에이전시 수익' },
  { value: 'expense', label: '비용' },
  { value: 'refund', label: '환불' },
];

export default function SettlementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<SettlementType | 'all'>('all');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total_income: 0, total_expense: 0, net_profit: 0, pending_amount: 0 });
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page: 1, size: 100 };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.settlement_type = typeFilter;
      if (amountMin) params.amount_min = Number(amountMin);
      if (amountMax) params.amount_max = Number(amountMax);
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      const result = await settlementsAPI.list(params);
      setSettlements(result.items || []);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  }, [searchTerm, statusFilter, typeFilter, amountMin, amountMax, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await settlementsAPI.stats();
      setStats({
        total_income: s.total_income,
        total_expense: s.total_expense,
        net_profit: s.net_profit ?? (s.total_income - s.total_expense),
        pending_amount: s.pending_amount ?? 0,
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSettlements(); fetchStats(); }, [fetchSettlements, fetchStats]);

  const handleComplete = async () => {
    if (!selectedSettlement) return;
    try {
      await settlementsAPI.complete(selectedSettlement.id);
      setSelectedSettlement(null);
      fetchSettlements();
      fetchStats();
    } catch { /* ignore */ }
  };

  const selectClass = 'px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500';

  return (
    <div className="space-y-6">
      <SettlementStatsCards
        totalIncome={stats.total_income}
        totalExpense={stats.total_expense}
        netProfit={stats.net_profit}
        pendingAmount={stats.pending_amount}
      />

      <SettlementCharts />

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="제목, 모델 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as SettlementStatus | 'all')} className={selectClass}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as SettlementType | 'all')} className={selectClass}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              type="number"
              placeholder="최소 금액"
              value={amountMin}
              onChange={e => setAmountMin(e.target.value)}
              className={selectClass}
            />
            <input
              type="number"
              placeholder="최대 금액"
              value={amountMax}
              onChange={e => setAmountMax(e.target.value)}
              className={selectClass}
            />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClass}>
              <option value="created_at">등록일</option>
              <option value="due_date">정산기한</option>
              <option value="paid_date">지급일</option>
              <option value="amount">금액</option>
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={selectClass}>
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />정산 등록
          </button>
        </div>
      </div>

      <SettlementTable
        settlements={settlements}
        isLoading={isLoading}
        onSelect={setSelectedSettlement}
        onNewClick={() => setShowNewModal(true)}
      />

      {selectedSettlement && !showEditModal && (
        <SettlementDetailModal
          settlement={selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
          onComplete={handleComplete}
          onEdit={() => setShowEditModal(true)}
          onDelete={() => { setSelectedSettlement(null); fetchSettlements(); fetchStats(); }}
        />
      )}

      {selectedSettlement && showEditModal && (
        <SettlementFormModal
          mode="edit"
          initial={selectedSettlement}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); setSelectedSettlement(null); fetchSettlements(); fetchStats(); }}
        />
      )}

      {showNewModal && (
        <SettlementFormModal
          mode="create"
          onClose={() => setShowNewModal(false)}
          onSuccess={() => { setShowNewModal(false); fetchSettlements(); fetchStats(); }}
        />
      )}
    </div>
  );
}
