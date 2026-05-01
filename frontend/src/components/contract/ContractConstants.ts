// Contract status and type configuration constants.
import React from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export type ContractStatus = 'draft' | 'pending' | 'active' | 'expired' | 'terminated';

export const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft: { label: '초안', color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', icon: FileText },
  pending: { label: '검토중', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  active: { label: '진행중', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  expired: { label: '만료', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
  terminated: { label: '해지', color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-200 dark:bg-gray-600', icon: XCircle },
};

export type ContractType = 'exclusive' | 'project' | 'annual' | 'event';

export const CONTRACT_TYPES: Record<ContractType, { label: string; color: string }> = {
  exclusive: { label: '전속계약', color: 'bg-purple-500' },
  project: { label: '프로젝트', color: 'bg-blue-500' },
  annual: { label: '연간계약', color: 'bg-green-500' },
  event: { label: '단발성', color: 'bg-orange-500' },
};

export const formatCurrency = (amount?: number | null) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

export const getContractTypeKey = (type?: string): ContractType => {
  if (type && type in CONTRACT_TYPES) return type as ContractType;
  return 'project';
};

export const getStatusKey = (status?: string): ContractStatus => {
  if (status && status in STATUS_CONFIG) return status as ContractStatus;
  return 'draft';
};

export interface NewContractForm {
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
