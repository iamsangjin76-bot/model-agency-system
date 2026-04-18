import React, { useState, useEffect } from 'react';
import {
  Search, Newspaper, Download, Loader2, ChevronDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { modelsAPI, newsAPI, NewsArticle, Model } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import NewsResultCard from '@/components/search/NewsResultCard';

const DISPLAY = 10;

export default function NewsSearchPage() {
  const { toast } = useToast();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [provider, setProvider] = useState<'naver' | 'google'>('naver');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selection & save state
  const [checkedArticles, setCheckedArticles] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Model state
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Load model list on mount
  useEffect(() => {
    modelsAPI.list({ size: 200 })
      .then(res => setModels(res.items))
      .catch(() => {});
  }, []);

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setCheckedArticles(new Set());
    try {
      const res = await newsAPI.search({ query: searchQuery, page, display: DISPLAY, provider });
      setArticles(res.items);
      setTotalResults(res.total);
      setCurrentPage(page);
    } catch {
      toast.error('뉴스 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleCheck = (index: number) => {
    setCheckedArticles(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    setCheckedArticles(
      checkedArticles.size === articles.length
        ? new Set()
        : new Set(articles.map((_, i) => i))
    );
  };

  const handleSave = async () => {
    if (checkedArticles.size === 0) { toast.error('저장할 기사를 선택해주세요.'); return; }
    if (!selectedModelId) { toast.error('저장할 모델을 선택해주세요.'); return; }

    setIsSaving(true);
    try {
      const selected = [...checkedArticles].map(i => articles[i]);
      await newsAPI.save({ model_id: selectedModelId, articles: selected });
      const modelName = models.find(m => m.id === selectedModelId)?.name ?? '';
      toast.success(`${checkedArticles.size}개의 기사가 ${modelName}에 저장되었습니다`);
      setCheckedArticles(new Set());
    } catch {
      toast.error('기사 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);
  const totalPages = Math.ceil(totalResults / DISPLAY);
  const hasSearched = !isSearching && searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">뉴스 기사 검색</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">모델 이름으로 뉴스를 검색하고 저장하세요</p>
      </div>

      {/* Search area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Provider toggle */}
        <div className="flex gap-2 mb-4">
          {(['naver', 'google'] as const).map(p => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                provider === p
                  ? p === 'naver' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {p === 'naver' ? '네이버' : '구글'}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Model dropdown */}
          <div className="relative lg:w-64">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className={selectedModel ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
                {selectedModel ? selectedModel.name : '모델 선택 (선택사항)'}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 max-h-60 overflow-auto">
                <button
                  onClick={() => { setSelectedModelId(null); setShowModelDropdown(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  선택 안함
                </button>
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModelId(m.id); setShowModelDropdown(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                  >
                    <span className="dark:text-gray-100">{m.name}</span>
                    {m.english_name && <span className="text-sm text-gray-400 dark:text-gray-500">{m.english_name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
              placeholder="검색할 이름을 입력하세요..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* Search button */}
          <button
            onClick={() => handleSearch(1)}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching
              ? <><Loader2 className="w-5 h-5 animate-spin" />검색 중...</>
              : <><Search className="w-5 h-5" />검색</>
            }
          </button>
        </div>
      </div>

      {/* Search results */}
      {articles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Results header */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedArticles.size === articles.length && articles.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalResults.toLocaleString()}개 결과 | {checkedArticles.size}개 선택됨
              </span>
            </div>

            {checkedArticles.size > 0 && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />저장 중...</>
                  : <><Download className="w-4 h-4" />선택 기사 저장 ({checkedArticles.size}개)</>
                }
              </button>
            )}
          </div>

          {/* Article list */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {articles.map((article, i) => (
              <NewsResultCard
                key={i}
                article={article}
                index={i}
                isChecked={checkedArticles.has(i)}
                onToggle={toggleCheck}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage <= 1 || isSearching}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />이전
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage >= totalPages || isSearching}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                다음<ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty / initial state */}
      {hasSearched && articles.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}

      {!searchQuery && articles.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">뉴스 기사 검색</h3>
          <p className="text-gray-500 dark:text-gray-400">
            모델 이름을 입력하여 관련 뉴스를 검색하고 해당 모델에 저장하세요.
          </p>
        </div>
      )}
    </div>
  );
}
