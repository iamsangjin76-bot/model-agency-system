import React from 'react';
import { Settlement } from '@/services/domain-api';
import { settlementsAPI } from '@/services/api';
import {
  X, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle,
  AlertCircle, User, FileText, CreditCard,
} from 'lucide-react';

type SettlementStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
type SettlementType = 'model_payment' | 'agency_fee' | 'expense' | 'refund';

const STATUS_CONFIG: Record<SettlementStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: '대기중', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  processing: { label: '처리중', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: AlertCircle },
  completed: { label: '완료', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  cancelled: { label: '취소', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

const SETTLEMENT_TYPES: Record<SettlementType, { label: string; color: string; isIncome: boolean }> = {
  model_payment: { label: '모델 지급', color: 'text-purple-600', isIncome: false },
  agency_fee: { label: '에이전시 수익', color: 'text-green-600', isIncome: true },
  expense: { label: '비용', color: 'text-orange-600', isIncome: false },
  refund: { label: '환불', color: 'text-red-600', isIncome: false },
};

function getTypeKey(type?: string): SettlementType {
  const t = type as SettlementType;
  return t && t in SETTLEMENT_TYPES ? t : 'expense';
}

function getStatusKey(status?: string): SettlementStatus {
  const s = status as SettlementStatus;
  return s && s in STATUS_CONFIG ? s : 'pending';
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

interface Props {
  settlement: Settlement;
  onClose: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SettlementDetailModal({ settlement, onClose, onComplete, onEdit, onDelete }: Props) {
  const typeKey = getTypeKey(settlement.settlement_type || settlement.type);
  const statusKey = getStatusKey(settlement.status);
  const typeConfig = SETTLEMENT_TYPES[typeKey];
  const statusConfig = STATUS_CONFIG[statusKey];
  const displayTitle = settlement.title || settlement.description || `정산 #${settlement.id}`;
  const displayDate = settlement.paid_date || settlement.payment_date || settlement.due_date || '-';
  const isPending = settlement.status === 'pending' || settlement.status === 'processing';

  const handleDelete = async () => {
    if (!window.confirm('이 정산을 삭제하시겠습니까?')) return;
    try {
      await settlementsAPI.delete(settlement.id);
      onDelete();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden">
        <div className={`p-6 ${typeConfig.isIncome ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}>
          <div className="flex items-start justify-between">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                {typeConfig.isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                <span className="text-sm font-medium bg-white dark:bg-gray-800/20 px-2 py-0.5 rounded">{typeConfig.label}</span>
              </div>
              <h2 className="text-xl font-bold">{displayTitle}</h2>
              <p className="text-3xl font-bold mt-2">
                {typeConfig.isIncome ? '+' : '-'}{formatCurrency(settlement.amount)}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white dark:bg-gray-800/20 rounded-lg transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <span className="text-gray-500 dark:text-gray-400">상태</span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
              {React.createElement(statusConfig.icon, { className: 'w-4 h-4' })}
              {statusConfig.label}
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">지급일</p>
            <p className="font-medium">{displayDate}</p>
          </div>

          {settlement.model_name && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <User className="w-4 h-4" />모델
              </div>
              <p className="font-medium">{settlement.model_name}</p>
            </div>
          )}

          {settlement.bank_info && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <CreditCard className="w-4 h-4" />계좌 정보
              </div>
              <p className="font-medium">{settlement.bank_info}</p>
            </div>
          )}

          {settlement.description && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <FileText className="w-4 h-4" />설명
              </div>
              <p className="text-gray-700 dark:text-gray-200">{settlement.description}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              닫기
            </button>
            <button onClick={handleDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              삭제
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onEdit} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              수정
            </button>
            {isPending && (
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />완료처리
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
