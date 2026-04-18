import React, { useState, useEffect, useCallback } from 'react';
import { clientsAPI } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import Spinner from '@/components/ui/Spinner';
import {
  Search,
  Plus,
  Filter,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Calendar,
  MoreVertical,
  X,
  Star,
  StarOff,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Briefcase,
  Tag,
} from 'lucide-react';

// 고객 등급
type ClientGrade = 'vip' | 'gold' | 'silver' | 'normal';

const GRADE_CONFIG: Record<ClientGrade, { label: string; color: string; bgColor: string }> = {
  vip: { label: 'VIP', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  gold: { label: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  silver: { label: 'Silver', color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-200 dark:bg-gray-600' },
  normal: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
};

// 업종
type Industry = 'cosmetics' | 'fashion' | 'food' | 'electronics' | 'automobile' | 'entertainment' | 'retail' | 'other';

const INDUSTRIES: Record<Industry, string> = {
  cosmetics: '화장품/뷰티',
  fashion: '패션/의류',
  food: '식품/음료',
  electronics: '전자/IT',
  automobile: '자동차',
  entertainment: '엔터테인먼트',
  retail: '유통/리테일',
  other: '기타',
};

interface ClientItem {
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

// 더미 고객 데이터 (하위 호환 - 제거 예정)
const dummyClients = [
  {
    id: 1,
    name: '삼성전자',
    industry: 'electronics' as Industry,
    grade: 'vip' as ClientGrade,
    contact: '김마케팅',
    position: '마케팅팀 부장',
    phone: '02-1234-5678',
    email: 'kim@samsung.com',
    address: '서울시 강남구 삼성동 123',
    website: 'www.samsung.com',
    totalProjects: 25,
    totalAmount: '1,250,000,000원',
    lastProject: '2025-01-15',
    memo: 'VIP 고객. 연간 계약 진행 중.',
    isFavorite: true,
    createdAt: '2022-03-15',
  },
  {
    id: 2,
    name: 'LG생활건강',
    industry: 'cosmetics' as Industry,
    grade: 'vip' as ClientGrade,
    contact: '정매니저',
    position: '브랜드팀 매니저',
    phone: '02-3333-4444',
    email: 'jung@lgcare.com',
    address: '서울시 영등포구 여의도동 456',
    website: 'www.lgcare.com',
    totalProjects: 18,
    totalAmount: '920,000,000원',
    lastProject: '2025-01-10',
    memo: '숨37, 후 브랜드 주로 진행.',
    isFavorite: true,
    createdAt: '2022-05-20',
  },
  {
    id: 3,
    name: '보그 코리아',
    industry: 'entertainment' as Industry,
    grade: 'gold' as ClientGrade,
    contact: '박에디터',
    position: '에디터',
    phone: '02-9876-5432',
    email: 'park@vogue.kr',
    address: '서울시 강남구 청담동 789',
    website: 'www.vogue.co.kr',
    totalProjects: 12,
    totalAmount: '480,000,000원',
    lastProject: '2025-01-20',
    memo: '월간 화보 촬영 협력사.',
    isFavorite: false,
    createdAt: '2023-01-10',
  },
  {
    id: 4,
    name: '현대백화점',
    industry: 'retail' as Industry,
    grade: 'gold' as ClientGrade,
    contact: '이담당',
    position: '마케팅팀 대리',
    phone: '02-5555-1234',
    email: 'lee@hyundai.com',
    address: '서울시 강남구 압구정동 101',
    website: 'www.ehyundai.com',
    totalProjects: 8,
    totalAmount: '320,000,000원',
    lastProject: '2025-01-22',
    memo: '시즌별 이벤트 모델 의뢰.',
    isFavorite: false,
    createdAt: '2023-06-15',
  },
  {
    id: 5,
    name: '나이키 코리아',
    industry: 'fashion' as Industry,
    grade: 'silver' as ClientGrade,
    contact: '최스포츠',
    position: '마케팅 담당',
    phone: '02-7777-8888',
    email: 'choi@nike.com',
    address: '서울시 용산구 한남동 200',
    website: 'www.nike.com/kr',
    totalProjects: 5,
    totalAmount: '180,000,000원',
    lastProject: '2024-12-15',
    memo: '스포츠 모델 위주 캐스팅.',
    isFavorite: false,
    createdAt: '2024-02-20',
  },
  {
    id: 6,
    name: '오뚜기',
    industry: 'food' as Industry,
    grade: 'normal' as ClientGrade,
    contact: '한식품',
    position: '광고팀 사원',
    phone: '02-2222-3333',
    email: 'han@ottogi.com',
    address: '경기도 안양시 만안구 300',
    website: 'www.ottogi.com',
    totalProjects: 3,
    totalAmount: '90,000,000원',
    lastProject: '2024-11-20',
    memo: '신규 거래처. 성장 가능성 높음.',
    isFavorite: false,
    createdAt: '2024-08-10',
  },
];

export default function ClientPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<ClientGrade | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<Industry | 'all'>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [newClient, setNewClient] = useState({ name: '', industry: 'other', grade: 'normal', contact_name: '', phone: '', email: '', memo: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page: 1, size: 100 };
      if (searchTerm) params.search = searchTerm;
      if (gradeFilter !== 'all') params.grade = gradeFilter;
      if (industryFilter !== 'all') params.industry = industryFilter;
      if (showFavorites) params.is_favorite = true;
      const result = await clientsAPI.list(params);
      setClients((result.items as unknown as ClientItem[]) || []);
      setTotal(result.total || 0);
    } catch {
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, gradeFilter, industryFilter, showFavorites]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // 클라이언트 필터링 (로컬)
  const filteredClients = clients;

  const handleToggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await clientsAPI.toggleFavorite(id);
      setClients(prev => prev.map(c => c.id === id ? { ...c, is_favorite: !c.is_favorite } : c));
    } catch { /* ignore */ }
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim() || !newClient.contact_name.trim() || !newClient.phone.trim()) {
      toast.warning('회사명, 담당자명, 연락처는 필수입니다.');
      return;
    }
    setIsSaving(true);
    try {
      await clientsAPI.create(newClient as any);
      toast.success('고객이 등록되었습니다.');
      setShowNewModal(false);
      setNewClient({ name: '', industry: 'other', grade: 'normal', contact_name: '', phone: '', email: '', memo: '' });
      fetchClients();
    } catch (err: any) {
      toast.error(err.message || '등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 통계
  const stats = {
    total,
    vip: clients.filter(c => c.grade === 'vip').length,
    totalAmount: clients.reduce((sum, c) => sum + (c.total_amount || 0), 0).toLocaleString() + '원',
    activeProjects: clients.reduce((sum, c) => sum + (c.total_projects || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* 상단 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체 고객', value: stats.total, icon: Building2, color: 'from-blue-500 to-blue-600' },
          { label: 'VIP 고객', value: stats.vip, icon: Star, color: 'from-amber-500 to-amber-600' },
          { label: '총 거래액', value: stats.totalAmount, icon: DollarSign, color: 'from-green-500 to-green-600', small: true },
          { label: '진행중 프로젝트', value: stats.activeProjects, icon: Briefcase, color: 'from-purple-500 to-purple-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`${stat.small ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* 검색 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="회사명, 담당자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* 등급 필터 */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as ClientGrade | 'all')}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">모든 등급</option>
              {Object.entries(GRADE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* 업종 필터 */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value as Industry | 'all')}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">모든 업종</option>
              {Object.entries(INDUSTRIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* 즐겨찾기 토글 */}
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                showFavorites 
                  ? 'bg-amber-100 border-amber-300 text-amber-700' 
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavorites ? 'fill-amber-500' : ''}`} />
              즐겨찾기
            </button>
          </div>

          {/* 새 고객 버튼 */}
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            고객 등록
          </button>
        </div>
      </div>

      {/* 고객 목록 */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-gray-500 dark:text-gray-400">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>등록된 고객이 없습니다.</p>
              <button onClick={() => setShowNewModal(true)} className="mt-4 px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50">새 고객 등록</button>
            </div>
          ) : filteredClients.map((client) => {
            const gradeConfig = GRADE_CONFIG[(client.grade as ClientGrade) || 'normal'];

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-lg font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 transition-colors">
                          {client.name}
                        </h3>
                        {client.is_favorite && (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${gradeConfig.bgColor} ${gradeConfig.color}`}>
                          {gradeConfig.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{INDUSTRIES[(client.industry as Industry) || 'other']}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(client.id, e)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="즐겨찾기"
                  >
                    <Star className={`w-4 h-4 ${client.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                </div>

                {/* 담당자 정보 */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {client.contact_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>{client.contact_name}{client.contact_position ? ` (${client.contact_position})` : ''}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                {/* 거래 정보 */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Briefcase className="w-4 h-4" />
                      <span>프로젝트 {client.total_projects || 0}건</span>
                    </div>
                    {client.total_amount ? (
                      <span className="font-semibold text-green-600">{client.total_amount.toLocaleString()}원</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 고객 상세 모달 */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedClient.name}</h2>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        {selectedClient.is_favorite ? (
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedClient.grade && GRADE_CONFIG[selectedClient.grade as ClientGrade] && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${GRADE_CONFIG[selectedClient.grade as ClientGrade].bgColor} ${GRADE_CONFIG[selectedClient.grade as ClientGrade].color}`}>
                          {GRADE_CONFIG[selectedClient.grade as ClientGrade].label}
                        </span>
                      )}
                      {selectedClient.industry && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">{INDUSTRIES[selectedClient.industry as Industry] || selectedClient.industry}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 모달 콘텐츠 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 연락처 정보 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" />
                    연락처 정보
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
                    {selectedClient.contact_name && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="font-medium">{selectedClient.contact_name}</p>
                          {selectedClient.contact_position && <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.contact_position}</p>}
                        </div>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span>{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm">{selectedClient.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 거래 정보 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    거래 정보
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">총 프로젝트</span>
                      <span className="font-semibold text-lg">{selectedClient.total_projects || 0}건</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">누적 거래액</span>
                      <span className="font-semibold text-lg text-green-600">{(selectedClient.total_amount || 0).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                {selectedClient.memo && (
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      메모
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                      <p className="text-gray-600 dark:text-gray-300">{selectedClient.memo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-gray-900">
              <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  캐스팅 요청
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                  수정하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새 고객 등록 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">고객 등록</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">새로운 광고주를 등록합니다</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* 회사 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  회사 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">회사명 *</label>
                    <input type="text" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))}
                      placeholder="광고주 회사명"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">업종</label>
                    <select value={newClient.industry} onChange={e => setNewClient(p => ({ ...p, industry: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100">
                      {Object.entries(INDUSTRIES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">고객 등급</label>
                    <select value={newClient.grade} onChange={e => setNewClient(p => ({ ...p, grade: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100">
                      {Object.entries(GRADE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-500" />
                  담당자 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">담당자명 *</label>
                    <input type="text" value={newClient.contact_name} onChange={e => setNewClient(p => ({ ...p, contact_name: e.target.value }))}
                      placeholder="담당자 이름"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">연락처 *</label>
                    <input type="text" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))}
                      placeholder="02-1234-5678"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">이메일</label>
                    <input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@company.com"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100" />
                  </div>
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">메모</label>
                <textarea rows={3} value={newClient.memo} onChange={e => setNewClient(p => ({ ...p, memo: e.target.value }))}
                  placeholder="고객에 대한 메모를 입력하세요"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100 resize-none" />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                취소
              </button>
              <button onClick={handleCreateClient} disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50">
                {isSaving ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
