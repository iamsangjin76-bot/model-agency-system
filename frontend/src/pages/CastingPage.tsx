import React, { useState, useEffect, useCallback } from 'react';
import { castingsAPI } from '@/services/api';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Users,
  Camera,
  DollarSign,
  FileText,
  MessageSquare,
  MoreVertical,
  X,
  ArrowRight,
  Star,
  Sparkles,
} from 'lucide-react';

// 캐스팅 상태
type CastingStatus = 'request' | 'reviewing' | 'matching' | 'proposed' | 'confirmed' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<CastingStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  request: { label: '요청접수', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: FileText },
  reviewing: { label: '검토중', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle },
  matching: { label: '모델매칭', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Users },
  proposed: { label: '제안완료', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: ArrowRight },
  confirmed: { label: '확정', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  completed: { label: '완료', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle2 },
  cancelled: { label: '취소', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

// 캐스팅 타입
type CastingType = 'cf' | 'magazine' | 'event' | 'show' | 'drama' | 'movie' | 'other';

const CASTING_TYPES: Record<CastingType, { label: string; color: string }> = {
  cf: { label: 'CF/광고', color: 'bg-red-500' },
  magazine: { label: '매거진/화보', color: 'bg-pink-500' },
  event: { label: '이벤트', color: 'bg-orange-500' },
  show: { label: '패션쇼', color: 'bg-purple-500' },
  drama: { label: '드라마', color: 'bg-blue-500' },
  movie: { label: '영화', color: 'bg-green-500' },
  other: { label: '기타', color: 'bg-gray-500' },
};

interface CastingItem {
  id: number;
  title: string;
  type: CastingType;
  status: CastingStatus;
  client_id?: number;
  budget?: number;
  shoot_date?: string;
  location?: string;
  description?: string;
  requirements?: string[];
  proposed_models?: { id: number; name?: string; status: string }[];
  created_at: string;
  deadline?: string;
}

export default function CastingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CastingStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CastingType | 'all'>('all');
  const [castings, setCastings] = useState<CastingItem[]>([]);
  const [selectedCasting, setSelectedCasting] = useState<CastingItem | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCasting, setNewCasting] = useState({ title: '', type: 'cf', budget: '', description: '', shoot_date: '', deadline: '', location: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCastings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await castingsAPI.list(params);
      setCastings((result.items as unknown as CastingItem[]) || []);
    } catch (err) {
      // 에러 시 빈 배열 유지
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCastings();
  }, [fetchCastings]);

  // 클라이언트 필터링
  const filteredCastings = castings.filter(casting => {
    const matchesSearch = casting.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || casting.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // 상태별 통계
  const statusStats = {
    total: castings.length,
    request: castings.filter(c => c.status === 'request').length,
    inProgress: castings.filter(c => ['reviewing', 'matching', 'proposed'].includes(c.status)).length,
    confirmed: castings.filter(c => c.status === 'confirmed').length,
    completed: castings.filter(c => c.status === 'completed').length,
  };

  const handleCreateCasting = async () => {
    if (!newCasting.title.trim()) { alert('제목을 입력해주세요.'); return; }
    setIsSaving(true);
    try {
      await castingsAPI.create({
        project_name: newCasting.title,
        casting_type: newCasting.type,
        budget: newCasting.budget ? Number(newCasting.budget.replace(/[^0-9]/g, '')) : undefined,
        requirements: newCasting.description,
        shooting_date: newCasting.shoot_date || undefined,
        deadline: newCasting.deadline || undefined,
        shooting_location: newCasting.location,
      } as any);
      setShowNewModal(false);
      setNewCasting({ title: '', type: 'cf', budget: '', description: '', shoot_date: '', deadline: '', location: '' });
      fetchCastings();
    } catch (err: any) {
      alert(err.message || '등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '전체', value: statusStats.total, color: 'from-gray-500 to-gray-600' },
          { label: '신규 요청', value: statusStats.request, color: 'from-blue-500 to-blue-600' },
          { label: '진행중', value: statusStats.inProgress, color: 'from-purple-500 to-purple-600' },
          { label: '확정', value: statusStats.confirmed, color: 'from-green-500 to-green-600' },
          { label: '완료', value: statusStats.completed, color: 'from-gray-400 to-gray-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
          </div>
        ))}
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
                placeholder="캐스팅 제목, 광고주 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CastingStatus | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">모든 상태</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* 타입 필터 */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CastingType | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">모든 유형</option>
              {Object.entries(CASTING_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* 새 캐스팅 버튼 */}
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            새 캐스팅
          </button>
        </div>
      </div>

      {/* 캐스팅 목록 */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCastings.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-gray-500">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>등록된 캐스팅이 없습니다.</p>
              <button onClick={() => setShowNewModal(true)} className="mt-4 px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50">새 캐스팅 등록</button>
            </div>
          ) : filteredCastings.map((casting) => {
            const statusConfig = STATUS_CONFIG[casting.status] || STATUS_CONFIG.request;
            const typeConfig = CASTING_TYPES[casting.type] || CASTING_TYPES.other;
            const StatusIcon = statusConfig.icon;
            const proposedModels = casting.proposed_models || [];

            return (
              <div
                key={casting.id}
                onClick={() => setSelectedCasting(casting)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
                      {casting.title}
                    </h3>
                  </div>
                </div>

                {/* 정보 */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {casting.shoot_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>촬영일: {casting.shoot_date}</span>
                    </div>
                  )}
                  {casting.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>{casting.budget.toLocaleString()}원</span>
                    </div>
                  )}
                  {casting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="line-clamp-1">{casting.location}</span>
                    </div>
                  )}
                </div>

                {/* 제안된 모델 */}
                {proposedModels.length > 0 && (
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">제안 모델:</span>
                    <div className="flex -space-x-2">
                      {proposedModels.slice(0, 3).map((model, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                        >
                          {String(model.id)}
                        </div>
                      ))}
                      {proposedModels.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                          +{proposedModels.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 마감일 경고 */}
                {casting.deadline && new Date(casting.deadline) < new Date() && casting.status !== 'completed' && casting.status !== 'cancelled' && (
                  <div className="mt-4 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    마감일이 지났습니다
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 캐스팅 상세 모달 */}
      {selectedCasting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${(CASTING_TYPES[selectedCasting.type] || CASTING_TYPES.other).color}`}>
                    {(CASTING_TYPES[selectedCasting.type] || CASTING_TYPES.other).label}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${(STATUS_CONFIG[selectedCasting.status] || STATUS_CONFIG.request).bgColor} ${(STATUS_CONFIG[selectedCasting.status] || STATUS_CONFIG.request).color}`}>
                    {(STATUS_CONFIG[selectedCasting.status] || STATUS_CONFIG.request).label}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">{selectedCasting.title}</h2>
              </div>
              <button onClick={() => setSelectedCasting(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
              {selectedCasting.description && (
                <div>
                  <h3 className="font-semibold mb-2">설명</h3>
                  <p className="text-gray-600 text-sm">{selectedCasting.description}</p>
                </div>
              )}
              {selectedCasting.requirements && selectedCasting.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">요구사항</h3>
                  <ul className="space-y-1">
                    {selectedCasting.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedCasting.shoot_date && <div><span className="text-gray-500">촬영일:</span> {selectedCasting.shoot_date}</div>}
                {selectedCasting.deadline && <div><span className="text-gray-500">마감일:</span> {selectedCasting.deadline}</div>}
                {selectedCasting.budget && <div><span className="text-gray-500">예산:</span> {selectedCasting.budget.toLocaleString()}원</div>}
                {selectedCasting.location && <div><span className="text-gray-500">장소:</span> {selectedCasting.location}</div>}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end bg-gray-50">
              <button onClick={() => setSelectedCasting(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 새 캐스팅 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">새 캐스팅 등록</h2>
                  <p className="text-sm text-gray-500">새로운 캐스팅 요청을 등록합니다</p>
                </div>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">캐스팅 제목 *</label>
                <input
                  type="text"
                  value={newCasting.title}
                  onChange={e => setNewCasting(p => ({ ...p, title: e.target.value }))}
                  placeholder="예: 삼성전자 갤럭시 광고 모델"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">캐스팅 유형</label>
                  <select
                    value={newCasting.type}
                    onChange={e => setNewCasting(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {Object.entries(CASTING_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">예산 (원)</label>
                  <input
                    type="number"
                    value={newCasting.budget}
                    onChange={e => setNewCasting(p => ({ ...p, budget: e.target.value }))}
                    placeholder="50000000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">촬영 예정일</label>
                  <input
                    type="date"
                    value={newCasting.shoot_date}
                    onChange={e => setNewCasting(p => ({ ...p, shoot_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                  <input
                    type="date"
                    value={newCasting.deadline}
                    onChange={e => setNewCasting(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">촬영 장소</label>
                <input
                  type="text"
                  value={newCasting.location}
                  onChange={e => setNewCasting(p => ({ ...p, location: e.target.value }))}
                  placeholder="서울 강남구 삼성동"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  rows={3}
                  value={newCasting.description}
                  onChange={e => setNewCasting(p => ({ ...p, description: e.target.value }))}
                  placeholder="캐스팅에 대한 상세 설명을 입력하세요"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                취소
              </button>
              <button
                onClick={handleCreateCasting}
                disabled={isSaving}
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
