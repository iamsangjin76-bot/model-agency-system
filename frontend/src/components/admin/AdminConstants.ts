// Role and permission definitions for admin management.

import {
  Users, Newspaper, Image, Download, BarChart3, Megaphone,
  Building2, Calendar, FileSignature, Wallet, Share2, Settings,
  ShieldCheck, User,
} from 'lucide-react';

export const ROLES = [
  { value: 'super_admin', label: '최고 관리자', color: 'bg-red-100 text-red-700', icon: ShieldCheck },
  { value: 'user', label: '사용자', color: 'bg-blue-100 text-blue-700', icon: User },
];

export const PERMISSIONS = [
  { key: 'model', label: '모델 관리', icon: Users, description: '모델 등록, 수정, 삭제' },
  { key: 'news', label: '뉴스 검색', icon: Newspaper, description: '뉴스 검색 및 저장' },
  { key: 'image', label: '이미지 검색', icon: Image, description: '이미지 검색 및 저장' },
  { key: 'profile', label: '프로필 다운로드', icon: Download, description: '프로필 PDF/PPT 생성' },
  { key: 'sns', label: 'SNS 분석', icon: BarChart3, description: 'SNS 통계 조회' },
  { key: 'casting', label: '캐스팅 관리', icon: Megaphone, description: '캐스팅 등록 및 관리' },
  { key: 'client', label: '고객 관리', icon: Building2, description: '고객사 등록 및 관리' },
  { key: 'schedule', label: '일정 관리', icon: Calendar, description: '일정 등록 및 조회' },
  { key: 'contract', label: '계약 관리', icon: FileSignature, description: '계약 등록 및 관리' },
  { key: 'settlement', label: '정산 관리', icon: Wallet, description: '정산 등록 및 관리' },
  { key: 'share', label: '외부 공유', icon: Share2, description: '외부 공유 링크 생성' },
  { key: 'settings', label: '시스템 설정', icon: Settings, description: '시스템 설정 변경' },
];

export const getRoleInfo = (role: string) => {
  return ROLES.find(r => r.value === role) || ROLES[1];
};
