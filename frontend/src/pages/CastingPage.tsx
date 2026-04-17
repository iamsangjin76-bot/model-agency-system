import React, { useState, useEffect, useCallback } from 'react';
import { castingsAPI } from '@/services/api';
import { Search, Plus, Camera, FileText, AlertCircle, Users, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import CastingFormModal from '@/components/casting/CastingFormModal';
import CastingDetailModal from '@/components/casting/CastingDetailModal';
import CastingCard from '@/components/casting/CastingCard';

// Status and type definitions (self-contained)
type CastingStatus = 'request' | 'reviewing' | 'matching' | 'proposed' | 'confirmed' | 'completed' | 'cancelled';
type CastingType = 'cf' | 'magazine' | 'event' | 'show' | 'drama' | 'movie' | 'other';

const STATUS_CONFIG: Record<CastingStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  request: { label: '요청접수', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: FileText },
  reviewing: { label: '검토중', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle },
  matching: { label: '모델매칭', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Users },
  proposed: { label: '제안완료', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: ArrowRight },
  confirmed: { label: '확정', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  completed: { label: '완료', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle2 },
  cancelled: { label: '취소', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCastings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await castingsAPI.list(params);
      setCastings((result.items as unknown as CastingItem[]) || []);
    } catch {
      // Keep empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchCastings(); }, [fetchCastings]);

  const filteredCastings = castings.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const statusStats = {
    total: castings.length,
    request: castings.filter(c => c.status === 'request').length,
    inProgress: castings.filter(c => ['reviewing', 'matching', 'proposed'].includes(c.status)).length,
    confirmed: castings.filter(c => c.status === 'confirmed').length,
    completed: castings.filter(c => c.status === 'completed').length,
  };

  const statCards = [
    { label: '전체', value: statusStats.total, color: 'from-gray-500 to-gray-600' },
    { label: '신규 요청', value: statusStats.request, color: 'from-blue-500 to-blue-600' },
    { label: '진행중', value: statusStats.inProgress, color: 'from-purple-500 to-purple-600' },
    { label: '확정', value: statusStats.confirmed, color: 'from-green-500 to-green-600' },
    { label: '완료', value: statusStats.completed, color: 'from-gray-400 to-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Status stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and filter bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="캐스팅 제목, 광고주 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as CastingStatus | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">모든 상태</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as CastingType | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">모든 유형</option>
              {Object.entries(CASTING_TYPES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            새 캐스팅
          </button>
        </div>
      </div>

      {/* Casting card grid */}
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
              <button onClick={() => setShowNewModal(true)} className="mt-4 px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50">
                새 캐스팅 등록
              </button>
            </div>
          ) : filteredCastings.map(casting => (
            <CastingCard
              key={casting.id}
              casting={casting}
              onClick={() => setSelectedCasting(casting)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedCasting && !showEditModal && (
        <CastingDetailModal
          casting={selectedCasting}
          onClose={() => setSelectedCasting(null)}
          onEdit={() => setShowEditModal(true)}
          onDelete={() => { setSelectedCasting(null); fetchCastings(); }}
        />
      )}

      {/* Edit modal */}
      {selectedCasting && showEditModal && (
        <CastingFormModal
          mode="edit"
          initial={selectedCasting}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); fetchCastings(); }}
        />
      )}

      {/* Create modal */}
      {showNewModal && (
        <CastingFormModal
          mode="create"
          onClose={() => setShowNewModal(false)}
          onSuccess={() => { setShowNewModal(false); fetchCastings(); }}
        />
      )}
    </div>
  );
}
