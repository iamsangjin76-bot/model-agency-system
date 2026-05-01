import React from 'react';
import { Contract } from '@/services/api';
import { STATUS_CONFIG, CONTRACT_TYPES, formatCurrency, getContractTypeKey, getStatusKey } from './ContractConstants';
import { User, Building2, DollarSign, Calendar, FileText, X } from 'lucide-react';

interface Props {
  contract: Contract;
  onClose: () => void;
}

export function ContractDetailModal({ contract, onClose }: Props) {
  const statusKey = getStatusKey(contract.status);
  const typeKey = getContractTypeKey(contract.contract_type);
  const contractTitle = (contract as any).title || `계약 #${contract.contract_number || contract.id}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${CONTRACT_TYPES[typeKey].color}`}>
                  {CONTRACT_TYPES[typeKey].label}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_CONFIG[statusKey].bgColor} ${STATUS_CONFIG[statusKey].color}`}>
                  {STATUS_CONFIG[statusKey].label}
                </span>
                {contract.contract_number && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{contract.contract_number}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{contractTitle}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Contract parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-purple-500" />
                <span className="font-medium">모델</span>
              </div>
              <p className="text-lg font-semibold">{contract.model_name || '-'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-5 h-5 text-purple-500" />
                <span className="font-medium">광고주</span>
              </div>
              <p className="text-lg font-semibold">{contract.client_name || '-'}</p>
            </div>
          </div>

          {/* Contract amount */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">계약 금액</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">총 계약금</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(contract.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">에이전시 수수료</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(contract.agency_fee)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">모델 지급액</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(contract.model_fee)}</p>
              </div>
            </div>
          </div>

          {/* Contract period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />계약 시작
              </div>
              <p className="font-semibold">{contract.start_date || '-'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />계약 종료
              </div>
              <p className="font-semibold">{contract.end_date || '-'}</p>
            </div>
          </div>

          {/* Contract memo */}
          {contract.memo && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                계약 내용
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <p className="text-gray-600 dark:text-gray-300">{contract.memo}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
