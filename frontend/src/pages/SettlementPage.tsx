import React, { useState, useEffect, useCallback } from 'react';
import { settlementsAPI, Settlement } from '@/services/api';
import {
  Search,
  Plus,
  Filter,
  DollarSign,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  MoreVertical,
  X,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Send,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// 정산 상태
type SettlementStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<SettlementStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: '대기중', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  processing: { label: '처리중', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: AlertCircle },
  completed: { label: '완료', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  cancelled: { label: '취소', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

// 정산 유형
type SettlementType = 'model_payment' | 'agency_fee' | 'expense' | 'refund';

const SETTLEMENT_TYPES: Record<SettlementType, { label: string; color: string; isIncome: boolean }> = {
  model_payment: { label: '모델 지급', color: 'text-purple-600', isIncome: false },
  agency_fee: { label: '에이전시 수익', color: 'text-green-600', isIncome: true },
  expense: { label: '비용', color: 'text-orange-600', isIncome: false },
  refund: { label: '환불', color: 'text-red-600', isIncome: false },
};

const getSettlementTypeKey = (type?: string): SettlementType => {
  if (type && type in SETTLEMENT_TYPES) return type as SettlementType;
  return 'expense';
};

const getSettlementStatusKey = (status?: string): SettlementStatus => {
  if (status && status in STATUS_CONFIG) return status as SettlementStatus;
  return 'pending';
};

// 월별 정산 데이터 (차트용)
const monthlyData = [
  { month: '9월', income: 45000000, expense: 32000000 },
  { month: '10월', income: 62000000, expense: 41000000 },
  { month: '11월', income: 58000000, expense: 38000000 },
  { month: '12월', income: 85000000, expense: 55000000 },
  { month: '1월', income: 72000000, expense: 48000000 },
];

// 지출 카테고리 데이터 (파이차트용)
const expenseCategories = [
  { name: '모델료 지급', value: 70, color: '#8B5CF6' },
  { name: '촬영 비용', value: 15, color: '#3B82F6' },
  { name: '마케팅', value: 8, color: '#10B981' },
  { name: '운영비', value: 7, color: '#F59E0B' },
];

// 새 정산 폼 상태
interface NewSettlementForm {
  description: string;
  settlement_type: SettlementType;
  amount: string;
  payment_date: string;
  status: SettlementStatus;
}

export default function SettlementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<SettlementType | 'all'>('all');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [newSettlement, setNewSettlement] = useState<NewSettlementForm>({
    description: '',
    settlement_type: 'model_payment',
    amount: '',
    payment_date: '',
    status: 'pending',
  });

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page: 1, size: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.settlement_type = typeFilter;
      const result = await settlementsAPI.list(params);
      setSettlements(result.items || []);
    } catch (err) {
      console.error('정산 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // 필터링된 정산 목록 (검색어 기반)
  const filteredSettlements = settlements.filter(s => {
    const desc = s.description || '';
    const modelName = s.model_name || '';
    return (
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modelName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // 통계 계산 (API 데이터 기반)
  const totalIncome = settlements
    .filter(s => SETTLEMENT_TYPES[getSettlementTypeKey(s.settlement_type)].isIncome && s.status === 'completed')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const totalExpense = settlements
    .filter(s => !SETTLEMENT_TYPES[getSettlementTypeKey(s.settlement_type)].isIncome && s.status === 'completed')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const pendingAmount = settlements
    .filter(s => s.status === 'pending' || s.status === 'processing')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const handleCreateSettlement = async () => {
    if (!newSettlement.description.trim() || !newSettlement.amount) return;
    setIsSaving(true);
    try {
      await settlementsAPI.create({
        settlement_type: newSettlement.settlement_type,
        amount: Number(newSettlement.amount),
        payment_date: newSettlement.payment_date || undefined,
        status: newSettlement.status,
        description: newSettlement.description,
      });
      setShowNewModal(false);
      setNewSettlement({ description: '', settlement_type: 'model_payment', amount: '', payment_date: '', status: 'pending' });
      fetchSettlements();
    } catch (err) {
      console.error('정산 등록 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await settlementsAPI.complete(id);
      fetchSettlements();
      setSelectedSettlement(null);
    } catch (err) {
      console.error('완료처리 실패:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm bg-white/20 px-2 py-1 rounded-lg">이번 달</span>
          </div>
          <p className="text-sm text-white/80">총 수입</p>
          <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-sm bg-white/20 px-2 py-1 rounded-lg">이번 달</span>
          </div>
          <p className="text-sm text-white/80">총 지출</p>
          <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-white/80">순이익</p>
          <p className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpense)}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-white/80">미처리 금액</p>
          <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 월별 수입/지출 차트 */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800">월별 수입/지출</h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
            >
              <option value="month">최근 5개월</option>
              <option value="quarter">분기</option>
              <option value="year">연간</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000)}M`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="income" name="수입" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 지출 카테고리 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-6">지출 구성</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {expenseCategories.map((category, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-gray-600">{category.name}</span>
                </div>
                <span className="font-medium">{category.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* 검색 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="제목, 모델, 광고주 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SettlementStatus | 'all')}
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
              onChange={(e) => setTypeFilter(e.target.value as SettlementType | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">모든 유형</option>
              {Object.entries(SETTLEMENT_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* 새 정산 버튼 */}
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            정산 등록
          </button>
        </div>
      </div>

      {/* 정산 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">정산 내역</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">유형</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">모델/광고주</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">금액</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">지급예정일</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Clock className="w-5 h-5 animate-spin" />
                      <span>정산 목록을 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>등록된 정산 내역이 없습니다</p>
                    <button
                      onClick={() => setShowNewModal(true)}
                      className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                    >
                      첫 정산 등록하기
                    </button>
                  </td>
                </tr>
              ) : filteredSettlements.map((settlement) => {
                const typeKey = getSettlementTypeKey(settlement.settlement_type);
                const statusKey = getSettlementStatusKey(settlement.status);
                const typeConfig = SETTLEMENT_TYPES[typeKey];
                const statusConfig = STATUS_CONFIG[statusKey];
                const StatusIcon = statusConfig.icon;

                return (
                  <tr
                    key={settlement.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedSettlement(settlement)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{settlement.description || `정산 #${settlement.id}`}</p>
                        {settlement.contract_id && (
                          <p className="text-sm text-gray-500">계약 #{settlement.contract_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {typeConfig.isIncome ? (
                          <ArrowUpRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {settlement.model_name && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {settlement.model_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${typeConfig.isIncome ? 'text-green-600' : 'text-gray-800'}`}>
                        {typeConfig.isIncome ? '+' : '-'}{formatCurrency(settlement.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{settlement.payment_date || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedSettlement(settlement); }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 정산 상세 모달 */}
      {selectedSettlement && (() => {
        const typeKey = getSettlementTypeKey(selectedSettlement.settlement_type);
        const statusKey = getSettlementStatusKey(selectedSettlement.status);
        const typeConfig = SETTLEMENT_TYPES[typeKey];
        const statusConfig = STATUS_CONFIG[statusKey];
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
              <div className={`p-6 ${typeConfig.isIncome ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}>
                <div className="flex items-start justify-between">
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-2">
                      {typeConfig.isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded">{typeConfig.label}</span>
                    </div>
                    <h2 className="text-xl font-bold">{selectedSettlement.description || `정산 #${selectedSettlement.id}`}</h2>
                    <p className="text-3xl font-bold mt-2">
                      {typeConfig.isIncome ? '+' : '-'}{formatCurrency(selectedSettlement.amount)}
                    </p>
                  </div>
                  <button onClick={() => setSelectedSettlement(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">상태</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {React.createElement(statusConfig.icon, { className: 'w-4 h-4' })}
                    {statusConfig.label}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">지급일</p>
                  <p className="font-medium">{selectedSettlement.payment_date || '-'}</p>
                </div>

                {selectedSettlement.model_name && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <User className="w-4 h-4" />모델
                    </div>
                    <p className="font-medium">{selectedSettlement.model_name}</p>
                  </div>
                )}

                {selectedSettlement.payment_method && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <CreditCard className="w-4 h-4" />지급 방법
                    </div>
                    <p className="font-medium">{selectedSettlement.payment_method}</p>
                  </div>
                )}

                {selectedSettlement.description && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <FileText className="w-4 h-4" />설명
                    </div>
                    <p className="text-gray-700">{selectedSettlement.description}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-between bg-gray-50">
                <button onClick={() => setSelectedSettlement(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                  닫기
                </button>
                <div className="flex gap-3">
                  {(selectedSettlement.status === 'pending' || selectedSettlement.status === 'processing') && (
                    <button
                      onClick={(e) => handleComplete(selectedSettlement.id, e)}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      완료처리
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 새 정산 등록 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">정산 등록</h2>
                  <p className="text-sm text-gray-500">새로운 정산 내역을 등록합니다</p>
                </div>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정산 설명 *</label>
                <input
                  type="text"
                  placeholder="정산 내역을 입력하세요"
                  value={newSettlement.description}
                  onChange={e => setNewSettlement(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정산 유형 *</label>
                  <select
                    value={newSettlement.settlement_type}
                    onChange={e => setNewSettlement(p => ({ ...p, settlement_type: e.target.value as SettlementType }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {Object.entries(SETTLEMENT_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">금액 *</label>
                  <input
                    type="number"
                    placeholder="35000000"
                    value={newSettlement.amount}
                    onChange={e => setNewSettlement(p => ({ ...p, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={newSettlement.status}
                    onChange={e => setNewSettlement(p => ({ ...p, status: e.target.value as SettlementStatus }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지급일</label>
                  <input
                    type="date"
                    value={newSettlement.payment_date}
                    onChange={e => setNewSettlement(p => ({ ...p, payment_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                취소
              </button>
              <button
                onClick={handleCreateSettlement}
                disabled={isSaving || !newSettlement.description.trim() || !newSettlement.amount}
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
