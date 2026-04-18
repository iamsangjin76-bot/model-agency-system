import React, { useState, useEffect } from 'react';
import { Settlement } from '@/services/domain-api';
import { settlementsAPI } from '@/services/api';
import { X, Wallet } from 'lucide-react';

type SettlementType = 'model_payment' | 'agency_fee' | 'expense' | 'refund';
type SettlementStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

const SETTLEMENT_TYPE_LABELS: Record<SettlementType, string> = {
  model_payment: '모델 지급',
  agency_fee: '에이전시 수익',
  expense: '비용',
  refund: '환불',
};

const STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: '대기중',
  processing: '처리중',
  completed: '완료',
  cancelled: '취소',
};

interface FormState {
  title: string;
  settlement_type: SettlementType;
  amount: string;
  payment_date: string;
  status: SettlementStatus;
  description: string;
  bank_info: string;
}

const DEFAULT_FORM: FormState = {
  title: '',
  settlement_type: 'model_payment',
  amount: '',
  payment_date: '',
  status: 'pending',
  description: '',
  bank_info: '',
};

interface Props {
  mode: 'create' | 'edit';
  initial?: Settlement;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SettlementFormModal({ mode, initial, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        title: initial.title || initial.description || '',
        settlement_type: (initial.settlement_type || initial.type || 'model_payment') as SettlementType,
        amount: String(initial.amount || ''),
        payment_date: initial.due_date || initial.payment_date || initial.paid_date || '',
        status: (initial.status || 'pending') as SettlementStatus,
        description: initial.description || '',
        bank_info: initial.bank_info || '',
      });
    }
  }, [mode, initial]);

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount) return;
    setIsSaving(true);
    try {
      const payload = {
        title: form.title,
        settlement_type: form.settlement_type,
        amount: Number(form.amount),
        payment_date: form.payment_date || undefined,
        status: form.status,
        description: form.description || undefined,
        bank_info: form.bank_info || undefined,
      };
      if (mode === 'edit' && initial) {
        await settlementsAPI.update(initial.id, payload);
      } else {
        await settlementsAPI.create(payload);
      }
      onSuccess();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{mode === 'edit' ? '정산 수정' : '정산 등록'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{mode === 'edit' ? '정산 내역을 수정합니다' : '새로운 정산 내역을 등록합니다'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">제목 *</label>
            <input type="text" placeholder="정산 제목을 입력하세요" value={form.title}
              onChange={e => set('title', e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">정산 유형 *</label>
              <select value={form.settlement_type} onChange={e => set('settlement_type', e.target.value)} className={inputClass}>
                {(Object.entries(SETTLEMENT_TYPE_LABELS) as [SettlementType, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">금액 *</label>
              <input type="number" placeholder="35000000" value={form.amount}
                onChange={e => set('amount', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">상태</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                {(Object.entries(STATUS_LABELS) as [SettlementStatus, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">지급일</label>
              <input type="date" value={form.payment_date}
                onChange={e => set('payment_date', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">계좌 정보</label>
            <input type="text" placeholder="은행명 / 계좌번호" value={form.bank_info}
              onChange={e => set('bank_info', e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">설명</label>
            <input type="text" placeholder="추가 설명을 입력하세요" value={form.description}
              onChange={e => set('description', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !form.title.trim() || !form.amount}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : mode === 'edit' ? '저장하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
