import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Loader2, Search, User, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { modelsAPI } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import Spinner from '@/components/ui/Spinner';
import { printModels } from '@/utils/printProfile';

const MODEL_TYPE_LABELS: Record<string, string> = {
  new_model: '신인 모델', influencer: '인플루언서',
  foreign_model: '외국인 모델', celebrity: '연예인',
};
const MODEL_TYPE_COLORS: Record<string, string> = {
  new_model: 'bg-blue-100 text-blue-700',
  influencer: 'bg-pink-100 text-pink-700',
  foreign_model: 'bg-green-100 text-green-700',
  celebrity: 'bg-purple-100 text-purple-700',
};

interface ModelListItem {
  id: number; name: string; model_type?: string; gender?: string;
  height?: number; instagram_followers?: number; profile_image?: string;
  is_active?: boolean;
}

export default function ProfileExportPage() {
  const { toast } = useToast();
  const [models, setModels] = useState<ModelListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await modelsAPI.list({ size: 200, search: search || undefined,
                                         model_type: typeFilter !== 'all' ? typeFilter : undefined });
      setModels(res.items as ModelListItem[]);
    } catch { toast.error('모델 목록을 불러오지 못했습니다.'); }
    finally { setIsLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (selected.size === models.length) setSelected(new Set());
    else setSelected(new Set(models.map(m => m.id)));
  };

  const handleExport = async () => {
    if (selected.size === 0) { toast.warning('모델을 선택해주세요.'); return; }
    if (selected.size > 10) { toast.warning('한 번에 최대 10개까지 내보낼 수 있습니다.'); return; }
    setIsExporting(true);
    try {
      // Fetch full detail for each selected model
      const details = await Promise.all(
        [...selected].map(id => modelsAPI.get(id))
      );
      printModels(details as any[]);
      toast.success(`${details.length}명의 프로필 PDF를 준비했습니다. 인쇄 창이 열립니다.`);
    } catch { toast.error('프로필 생성에 실패했습니다.'); }
    finally { setIsExporting(false); }
  };

  const fmtNum = (n?: number | null) => {
    if (!n) return null;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">프로필 다운로드</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">모델을 선택하고 PDF로 내보내세요</p>
        </div>
        <button onClick={handleExport} disabled={isExporting || selected.size === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {isExporting
            ? <><Loader2 className="w-5 h-5 animate-spin" />생성 중...</>
            : <><Download className="w-5 h-5" />PDF 내보내기 {selected.size > 0 ? `(${selected.size}명)` : ''}</>}
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchModels()}
              placeholder="모델 이름 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-gray-100" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[['all', '전체'], ...Object.entries(MODEL_TYPE_LABELS)].map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === val
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>{label}</button>
            ))}
          </div>
          <button onClick={fetchModels}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Model list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* List header */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox"
              checked={models.length > 0 && selected.size === models.length}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-purple-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
          </label>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {isLoading ? '로딩 중...' : `${models.length}명 / ${selected.size}명 선택`}
          </span>
        </div>

        {/* List body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : models.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">해당 조건의 모델이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {models.map(model => {
              const isSelected = selected.has(model.id);
              return (
                <div key={model.id} onClick={() => toggle(model.id)}
                  className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}>
                  {/* Checkbox */}
                  <div className="shrink-0 text-purple-600">
                    {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300 dark:text-gray-600" />}
                  </div>

                  {/* Profile image */}
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
                    {model.profile_image
                      ? <img src={model.profile_image} alt={model.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"><User className="w-5 h-5" /></div>}
                  </div>

                  {/* Name + type */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{model.name}</span>
                      {model.model_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODEL_TYPE_COLORS[model.model_type] || 'bg-gray-100 text-gray-600'}`}>
                          {MODEL_TYPE_LABELS[model.model_type] || model.model_type}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-2">
                      {model.height && <span>키 {model.height}cm</span>}
                      {model.height && model.instagram_followers && <span>·</span>}
                      {model.instagram_followers && <span>팔로워 {fmtNum(model.instagram_followers)}</span>}
                    </div>
                  </div>

                  {/* Gender badge */}
                  {model.gender && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      {model.gender === 'female' ? '여성' : model.gender === 'male' ? '남성' : '기타'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usage guide */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">PDF 내보내기 사용법</p>
        <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-0.5 list-decimal list-inside">
          <li>원하는 모델을 체크박스로 선택하세요 (최대 10명)</li>
          <li>"PDF 내보내기" 버튼을 클릭하면 새 창이 열립니다</li>
          <li>자동으로 인쇄 대화상자가 열립니다 → "PDF로 저장" 선택</li>
        </ol>
      </div>
    </div>
  );
}
