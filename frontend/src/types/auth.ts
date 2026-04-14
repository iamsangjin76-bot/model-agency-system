// 관리자 권한 타입 정의
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',   // 최고 관리자
  USER = 'user',                 // 사용자
}

export interface Admin {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: string;
  permissions: string[] | Record<string, any>;  // 권한 리스트 또는 객체
}

export interface LoginRequest {
  username: string;
  password: string;
  serverIp?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  admin?: Admin;
  message?: string;
}

// 권한별 라벨
export const ROLE_LABELS: Record<AdminRole, string> = {
  [AdminRole.SUPER_ADMIN]: '최고 관리자',
  [AdminRole.USER]: '사용자',
};

// 권한별 색상
export const ROLE_COLORS: Record<AdminRole, string> = {
  [AdminRole.SUPER_ADMIN]: 'bg-red-500',
  [AdminRole.USER]: 'bg-blue-500',
};

// 사용 가능한 모든 권한
export const ALL_PERMISSIONS = {
  model: '모델 관리',
  news: '뉴스 검색',
  image: '이미지 검색',
  profile: '프로필 다운로드',
  sns: 'SNS 분석',
  casting: '캐스팅 관리',
  client: '고객 관리',
  schedule: '일정 관리',
  contract: '계약 관리',
  settlement: '정산 관리',
  share: '외부 공유',
  settings: '시스템 설정',
};
