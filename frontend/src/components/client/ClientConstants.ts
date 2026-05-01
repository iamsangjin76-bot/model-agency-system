// Client grade and industry configuration constants.

export type ClientGrade = 'vip' | 'gold' | 'silver' | 'normal';

export const GRADE_CONFIG: Record<ClientGrade, { label: string; color: string; bgColor: string }> = {
  vip: { label: 'VIP', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  gold: { label: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  silver: { label: 'Silver', color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-200 dark:bg-gray-600' },
  normal: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
};

export type Industry = 'cosmetics' | 'fashion' | 'food' | 'electronics' | 'automobile' | 'entertainment' | 'retail' | 'other';

export const INDUSTRIES: Record<Industry, string> = {
  cosmetics: '화장품/뷰티',
  fashion: '패션/의류',
  food: '식품/음료',
  electronics: '전자/IT',
  automobile: '자동차',
  entertainment: '엔터테인먼트',
  retail: '유통/리테일',
  other: '기타',
};

export interface ClientItem {
  id: number;
  name: string;
  industry?: string;
  grade?: string;
  contact_name?: string;
  contact_position?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  total_projects?: number;
  total_amount?: number;
  memo?: string;
  is_favorite?: boolean;
  created_at?: string;
}
