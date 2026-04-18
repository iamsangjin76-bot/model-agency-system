import React from 'react';
import { Settlement } from '@/services/domain-api';
import { Clock, CheckCircle2, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight, User, Eye, Receipt } from 'lucide-react';

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
  settlements: Settlement[];
  isLoading: boolean;
  onSelect: (s: Settlement) => void;
  onNewClick: () => void;
}

export default function SettlementTable({ settlements, isLoading, onSelect, onNewClick }: Props) {
  return (
    <>
      {/* ── Card view: below lg ───────────────────────────────────── */}
      <div className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500 dark:text-gray-400">
            <Clock className="w-5 h-5 animate-spin" /><span>불러오는 중...</span>
          </div>
        ) : settlements.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>등록된 정산 내역이 없습니다</p>
            <button onClick={onNewClick} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
              첫 정산 등록하기
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {settlements.map((s) => {
              const typeKey = getTypeKey(s.settlement_type || s.type);
              const statusKey = getStatusKey(s.status);
              const typeConfig = SETTLEMENT_TYPES[typeKey];
              const statusConfig = STATUS_CONFIG[statusKey];
              const StatusIcon = statusConfig.icon;
              const displayDate = s.due_date || s.payment_date || s.paid_date || '-';
              const displayTitle = s.title || s.description || `정산 #${s.id}`;
              return (
                <div key={s.id} onClick={() => onSelect(s)} className="flex items-start justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{displayTitle}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className={typeConfig.color}>{typeConfig.label}</span>
                      <span>·</span>
                      <span>{displayDate}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                    <span className={`font-semibold text-sm ${typeConfig.isIncome ? 'text-green-600' : 'text-gray-700 dark:text-gray-200'}`}>
                      {typeConfig.isIncome ? '+' : '-'}{formatCurrency(s.amount)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />{statusConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Table: lg and above ───────────────────────────────────── */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">정산 내역</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">유형</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">모델/광고주</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">금액</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">지급예정일</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>정산 목록을 불러오는 중...</span>
                  </div>
                </td>
              </tr>
            ) : settlements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>등록된 정산 내역이 없습니다</p>
                  <button
                    onClick={onNewClick}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    첫 정산 등록하기
                  </button>
                </td>
              </tr>
            ) : settlements.map((s) => {
              const typeKey = getTypeKey(s.settlement_type || s.type);
              const statusKey = getStatusKey(s.status);
              const typeConfig = SETTLEMENT_TYPES[typeKey];
              const statusConfig = STATUS_CONFIG[statusKey];
              const StatusIcon = statusConfig.icon;
              const displayDate = s.due_date || s.payment_date || s.paid_date || '-';
              const displayTitle = s.title || s.description || `정산 #${s.id}`;
              return (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => onSelect(s)}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{displayTitle}</p>
                      {s.contract_id && <p className="text-sm text-gray-500 dark:text-gray-400">계약 #{s.contract_id}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {typeConfig.isIncome
                        ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                        : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                      <span className={`text-sm font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {s.model_name && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />{s.model_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${typeConfig.isIncome ? 'text-green-600' : 'text-gray-800 dark:text-gray-100'}`}>
                      {typeConfig.isIncome ? '+' : '-'}{formatCurrency(s.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{displayDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />{statusConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(s); }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
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
    </>
  );
}
