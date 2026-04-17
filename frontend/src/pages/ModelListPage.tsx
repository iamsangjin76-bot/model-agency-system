import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  Instagram,
  AlertCircle,
} from 'lucide-react';
import { ModelType, MODEL_TYPE_LABELS, MODEL_TYPE_COLORS } from '@/types/model';
import { modelsAPI } from '@/services/api';
import ModelFilters from '@/components/model/ModelFilters';

interface ModelItem {
  id: number;
  name: string;
  name_english?: string;
  model_type: string;
  gender?: string;
  height?: number;
  instagram_followers?: number;
  profile_image?: string;
  is_active: boolean;
  created_at: string;
}

const formatNumber = (num?: number) => {
  if (!num) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function ModelListPage() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ModelType | 'all'>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        size: itemsPerPage,
      };
      if (searchQuery) params.search = searchQuery;
      if (filterType !== 'all') params.model_type = filterType;
      if (genderFilter !== 'all') params.gender = genderFilter;
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;

      const result = await modelsAPI.list(params);
      setModels((result.items as unknown as ModelItem[]) || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || '모델 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filterType, genderFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, genderFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(total / itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedModels.length === models.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels(models.map(m => m.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedModels(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 모델을 삭제하시겠습니까?')) return;
    try {
      await modelsAPI.delete(id);
      fetchModels();
    } catch (err: any) {
      alert(err.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">모델 관리</h1>
          <p className="text-gray-500 mt-1">총 {total}명의 모델</p>
        </div>
        <Link
          to="/dashboard/models/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          <Plus className="w-5 h-5" />
          새 모델 등록
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <ModelFilters
        searchQuery={searchQuery}
        filterType={filterType}
        genderFilter={genderFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearch={setSearchQuery}
        onTypeChange={setFilterType}
        onGenderChange={setGenderFilter}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onRefresh={fetchModels}
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={fetchModels} className="ml-auto text-sm underline">재시도</button>
        </div>
      )}

      {/* 모델 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedModels.length === models.length && models.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300"
            />
          </div>
          <div className="col-span-3">모델 정보</div>
          <div className="col-span-2">유형</div>
          <div className="col-span-2">신체 정보</div>
          <div className="col-span-2">SNS</div>
          <div className="col-span-2 text-right">액션</div>
        </div>

        {/* 로딩 */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-500">불러오는 중...</p>
          </div>
        )}

        {/* 모델 리스트 */}
        {!isLoading && (
          <div className="divide-y divide-gray-100">
            {models.map((model) => {
              const modelTypeKey = model.model_type as ModelType;
              return (
                <div
                  key={model.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* 체크박스 */}
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.id)}
                      onChange={() => toggleSelect(model.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </div>

                  {/* 모델 정보 */}
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                      {model.profile_image ? (
                        <img
                          src={model.profile_image}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{model.name}</h3>
                      <p className="text-sm text-gray-500">{model.name_english || '-'}</p>
                    </div>
                  </div>

                  {/* 유형 */}
                  <div className="col-span-2 flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${MODEL_TYPE_COLORS[modelTypeKey] || 'bg-gray-500'}`}>
                      {MODEL_TYPE_LABELS[modelTypeKey] || model.model_type}
                    </span>
                  </div>

                  {/* 신체 정보 */}
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm text-gray-800">{model.height ? `${model.height}cm` : '-'}</p>
                  </div>

                  {/* SNS */}
                  <div className="col-span-2 flex items-center">
                    {model.instagram_followers ? (
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <p className="text-xs text-gray-500">
                          {formatNumber(model.instagram_followers)} followers
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </div>

                  {/* 액션 */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      to={`/dashboard/models/${model.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="보기"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      to={`/dashboard/models/${model.id}/edit`}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && models.length === 0 && !error && (
          <div className="py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 모델이 없습니다.</p>
            <Link
              to="/dashboard/models/new"
              className="inline-flex items-center gap-2 mt-4 text-purple-600 hover:text-purple-700"
            >
              <Plus className="w-4 h-4" />
              새 모델 등록하기
            </Link>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              총 {total}명 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, total)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
