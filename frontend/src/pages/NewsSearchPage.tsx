import React, { useState, useEffect } from 'react';
import { Search, Newspaper, Download, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { modelsAPI, newsAPI, NewsArticle, Model } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import NewsResultCard from '@/components/search/NewsResultCard';

const DISPLAY = 10;

export default function NewsSearchPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [provider, setProvider] = useState<'naver' | 'google'>('naver');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkedArticles, setCheckedArticles] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  // Multi-match picker modal
  const [matchingModels, setMatchingModels] = useState<Model[]>([]);
  // New model name input modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    modelsAPI.list({ size: 200 }).then(res => setModels(res.items)).catch(() => {});
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
      checkedArticles.size === articles.length ? new Set() : new Set(articles.map((_, i) => i))
    );
  };

  const saveToModel = async (model: Model) => {
    setIsSaving(true);
    setMatchingModels([]);
    setShowNameModal(false);
    try {
      await newsAPI.save({ model_id: model.id, articles: [...checkedArticles].map(i => articles[i]) });
      toast.success(`${checkedArticles.size}개의 기사가 ${model.name}에 저장되었습니다`);
      setCheckedArticles(new Set());
    } catch {
      toast.error('기사 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (checkedArticles.size === 0) { toast.error('저장할 기사를 선택해주세요.'); return; }
    const matched = models.filter(m => searchQuery.includes(m.name));
    if (matched.length === 1) { saveToModel(matched[0]); return; }
    if (matched.length > 1) { setMatchingModels(matched); return; }
    // 0 matches — ask for a new model name (default: first word of query)
    setNewModelName(searchQuery.trim().split(/\s+/)[0] ?? searchQuery.trim());
    setShowNameModal(true);
  };

  const handleCreateAndSave = async () => {
    if (!newModelName.trim()) return;
    setIsCreating(true);
    try {
      const created = await modelsAPI.create({ name: newModelName.trim(), model_type: 'new_model' });
      setModels(prev => [...prev, created]);
      await newsAPI.save({ model_id: created.id, articles: [...checkedArticles].map(i => articles[i]) });
      toast.success(`'${created.name}' 모델이 생성되고 ${checkedArticles.size}개의 기사가 저장되었습니다`);
      setCheckedArticles(new Set());
      setShowNameModal(false);
    } catch {
      toast.error('모델 생성 또는 저장에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const closeModal = () => { setMatchingModels([]); setShowNameModal(false); };
  const totalPages = Math.ceil(totalResults / DISPLAY);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">뉴스 기사 검색</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">모델 이름을 검색어에 포함하면 저장 시 자동으로 해당 모델에 연결됩니다</p>
      </div>

      {/* Search area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex gap-2">
          {(['naver', 'google'] as const).map(p => (
            <button key={p} onClick={() => setProvider(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${provider === p ? (p === 'naver' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {p === 'naver' ? '네이버' : '구글'}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
              placeholder="모델 이름을 포함하여 검색하세요 (예: 한서주 광고)"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all" />
          </div>
          <button onClick={() => handleSearch(1)} disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
            {isSearching ? <><Loader2 className="w-5 h-5 animate-spin" />검색 중...</> : <><Search className="w-5 h-5" />검색</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {articles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checkedArticles.size === articles.length && articles.length > 0}
                  onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalResults.toLocaleString()}개 결과 | {checkedArticles.size}개 선택됨
              </span>
            </div>
            {checkedArticles.size > 0 && (
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />저장 중...</> : <><Download className="w-4 h-4" />선택 기사 저장 ({checkedArticles.size}개)</>}
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {articles.map((article, i) => (
              <NewsResultCard key={i} article={article} index={i} isChecked={checkedArticles.has(i)} onToggle={toggleCheck} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button onClick={() => handleSearch(currentPage - 1)} disabled={currentPage <= 1 || isSearching}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />이전
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{currentPage} / {totalPages}</span>
              <button onClick={() => handleSearch(currentPage + 1)} disabled={currentPage >= totalPages || isSearching}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                다음<ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty / initial state */}
      {articles.length === 0 && !isSearching && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          {searchQuery.trim() ? (
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다.</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">뉴스 기사 검색</h3>
              <p className="text-gray-500 dark:text-gray-400">모델 이름을 포함해서 검색하면 저장 시 자동으로 해당 모델에 연결됩니다.</p>
            </>
          )}
        </div>
      )}

      {/* Unified modal: multi-match picker OR new model name input */}
      {(matchingModels.length > 1 || showNameModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {showNameModal ? '새 모델 생성' : '저장할 모델 선택'}
              </h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {showNameModal ? (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  등록된 모델이 없습니다. 새 모델을 생성하고 기사를 저장합니다.
                </p>
                <input
                  value={newModelName} onChange={e => setNewModelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateAndSave()}
                  placeholder="모델 이름 입력" autoFocus
                  className="w-full px-4 py-2.5 mb-4 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <div className="flex gap-2">
                  <button onClick={handleCreateAndSave} disabled={isCreating || !newModelName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50">
                    {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" />생성 중...</> : '생성 후 저장'}
                  </button>
                  <button onClick={() => setShowNameModal(false)}
                    className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  검색어와 일치하는 모델이 여러 명입니다. 저장할 모델을 선택하세요.
                </p>
                <div className="space-y-2">
                  {matchingModels.map(m => (
                    <button key={m.id} onClick={() => saveToModel(m)}
                      className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors flex items-center justify-between">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{m.name}</span>
                      {m.name_english && <span className="text-sm text-gray-400 dark:text-gray-500">{m.name_english}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
