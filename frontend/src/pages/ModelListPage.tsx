import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { ModelType } from '@/types/model';
import { modelsAPI } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import Spinner from '@/components/ui/Spinner';
import ModelFilters from '@/components/model/ModelFilters';
import ModelRow, { ModelItem } from '@/components/model/ModelRow';

export default function ModelListPage() {
  const { toast } = useToast();
  const [urlParams] = useSearchParams();
  const [models, setModels] = useState<ModelItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [filterType, setFilterType] = useState<ModelType | 'all'>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageRange, setAgeRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: currentPage, size: itemsPerPage };
      if (searchQuery) params.search = searchQuery;
      if (filterType !== 'all') params.model_type = filterType;
      if (genderFilter !== 'all') params.gender = genderFilter;
      if (ageRange !== 'all') params.age_range = ageRange;
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
  }, [currentPage, searchQuery, filterType, genderFilter, ageRange, sortBy, sortOrder]);

  useEffect(() => { fetchModels(); }, [fetchModels]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, genderFilter, ageRange, sortBy, sortOrder]);

  const totalPages = Math.ceil(total / itemsPerPage);
  const toggleSelectAll = () => setSelectedModels(prev => prev.length === models.length ? [] : models.map(m => m.id));
  const toggleSelect = (id: number) => setSelectedModels(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleDelete = async (id: number) => {
    if (!confirm('이 모델을 삭제하시겠습니까?')) return;
    try { await modelsAPI.delete(id); toast.success('삭제되었습니다.'); fetchModels(); } catch (err: any) { toast.error(err.message || '삭제에 실패했습니다.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">모델 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">총 {total}명의 모델</p>
        </div>
        <Link to="/dashboard/models/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all">
          <Plus className="w-5 h-5" /> 새 모델 등록
        </Link>
      </div>

      <ModelFilters
        searchQuery={searchQuery} filterType={filterType} genderFilter={genderFilter}
        ageRange={ageRange} sortBy={sortBy} sortOrder={sortOrder}
        onSearch={setSearchQuery} onTypeChange={setFilterType} onGenderChange={setGenderFilter}
        onAgeRangeChange={setAgeRange} onSortByChange={setSortBy} onSortOrderChange={setSortOrder}
        onRefresh={fetchModels}
      />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
          <button onClick={fetchModels} className="ml-auto text-sm underline">재시도</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
          <div className="col-span-1 flex items-center">
            <input type="checkbox" checked={selectedModels.length === models.length && models.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300" />
          </div>
          <div className="col-span-3">모델 정보</div>
          <div className="col-span-2">유형</div>
          <div className="col-span-2">신체 정보</div>
          <div className="col-span-2">SNS</div>
          <div className="col-span-2 text-right">액션</div>
        </div>

        {isLoading && (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-500">불러오는 중...</p>
          </div>
        )}

        {!isLoading && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {models.map(model => (
              <ModelRow key={model.id} model={model} selected={selectedModels.includes(model.id)} onToggle={toggleSelect} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {!isLoading && models.length === 0 && !error && (
          <div className="py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 모델이 없습니다.</p>
            <Link to="/dashboard/models/new" className="inline-flex items-center gap-2 mt-4 text-purple-600 hover:text-purple-700">
              <Plus className="w-4 h-4" /> 새 모델 등록하기
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">총 {total}명 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, total)}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
