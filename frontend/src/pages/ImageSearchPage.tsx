// @AX:NOTE SPEC-IMAGE-SEARCH-001 §3 — auto-match parity with NewsSearchPage
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Image as ImageIcon, Download, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { modelsAPI, imageSearchAPI, SearchImage, Model } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import ImageResultCard from '@/components/search/ImageResultCard';
import ImagePreviewModal from '@/components/search/ImagePreviewModal';

const DISPLAY = 12;

export default function ImageSearchPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [provider, setProvider] = useState<'naver' | 'google'>('naver');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [images, setImages] = useState<SearchImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // selectedImages persists across pages — keyed by thumbnail_url for uniqueness
  const [selectedImages, setSelectedImages] = useState<Map<string, SearchImage>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [matchingModels, setMatchingModels] = useState<Model[]>([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [previewImage, setPreviewImage] = useState<SearchImage | null>(null);

  useEffect(() => {
    modelsAPI.list({ size: 200 }).then(res => setModels(res.items)).catch(() => {});
  }, []);

  const handleSearch = async (page = 1, resetSelection = false) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    // Only clear selection on a brand-new search, not on page navigation
    if (resetSelection) setSelectedImages(new Map());
    try {
      const res = await imageSearchAPI.search({ query: searchQuery, page, display: DISPLAY, provider });
      setImages(res.items);
      setTotalResults(res.total);
      setCurrentPage(page);
    } catch {
      toast.error('이미지 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const imageKey = (img: SearchImage) => img.thumbnail_url || img.original_url;

  const toggleCheck = (index: number) => {
    const img = images[index];
    if (!img) return;
    const key = imageKey(img);
    setSelectedImages(prev => {
      const next = new Map(prev);
      next.has(key) ? next.delete(key) : next.set(key, img);
      return next;
    });
  };

  const toggleAll = () => {
    const allOnPageSelected = images.every(img => selectedImages.has(imageKey(img)));
    setSelectedImages(prev => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        // Deselect all images on current page
        images.forEach(img => next.delete(imageKey(img)));
      } else {
        // Select all images on current page
        images.forEach(img => next.set(imageKey(img), img));
      }
      return next;
    });
  };

  const saveToModel = async (model: Model) => {
    setIsSaving(true);
    setMatchingModels([]);
    setShowNameModal(false);
    try {
      const selected = [...selectedImages.values()];
      const result = await imageSearchAPI.save({ model_id: model.id, images: selected }) as unknown as { saved?: number; failed?: number } | void;
      if (result && typeof result === 'object' && 'failed' in result && (result.failed ?? 0) > 0) {
        toast.warning?.(`${result.saved ?? 0}개 저장, ${result.failed}개 실패`);
      } else {
        toast.success(`${selectedImages.size}개의 이미지가 ${model.name}에 저장되었습니다`);
      }
      setSelectedImages(new Map());
    } catch {
      toast.error('이미지 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (selectedImages.size === 0) { toast.error('저장할 이미지를 선택해주세요.'); return; }
    const matched = models.filter(m => searchQuery.includes(m.name));
    if (matched.length === 1) { saveToModel(matched[0]); return; }
    if (matched.length > 1) { setMatchingModels(matched); return; }
    setNewModelName(searchQuery.trim().split(/\s+/)[0] ?? searchQuery.trim());
    setShowNameModal(true);
  };

  const handleCreateAndSave = async () => {
    if (!newModelName.trim()) return;
    setIsCreating(true);
    try {
      const created = await modelsAPI.create({ name: newModelName.trim(), model_type: 'new_model' });
      setModels(prev => [...prev, created]);
      const selected = [...selectedImages.values()];
      await imageSearchAPI.save({ model_id: created.id, images: selected });
      // Navigate to model edit page so user can complete the profile
      // (first saved image is auto-set as profile photo by the backend)
      navigate(`/dashboard/models/${created.id}/edit`);
    } catch {
      toast.error('모델 생성 또는 저장에 실패했습니다.');
      setIsCreating(false);
    }
  };

  const closeModal = () => { setMatchingModels([]); setShowNameModal(false); };
  const totalPages = Math.ceil(totalResults / DISPLAY);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">이미지 검색</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">모델 이름을 검색어에 포함하면 저장 시 자동으로 해당 모델에 연결됩니다</p>
      </div>

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
              onKeyDown={e => e.key === 'Enter' && handleSearch(1, true)}
              placeholder="모델 이름을 포함하여 검색하세요 (예: 한서주 광고)"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all" />
          </div>
          <button onClick={() => handleSearch(1, true)} disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
            {isSearching ? <><Loader2 className="w-5 h-5 animate-spin" />검색 중...</> : <><Search className="w-5 h-5" />검색</>}
          </button>
        </div>
      </div>

      {images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={images.length > 0 && images.every(img => selectedImages.has(imageKey(img)))}
                  onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalResults.toLocaleString()}개 결과 | {selectedImages.size}개 선택됨 (전체 페이지)
              </span>
            </div>
            {selectedImages.size > 0 && (
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />저장 중...</> : <><Download className="w-4 h-4" />선택 이미지 저장 ({selectedImages.size}개)</>}
              </button>
            )}
          </div>

          <div className="p-4 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image, i) => (
              <ImageResultCard key={i} image={image} index={i} isChecked={selectedImages.has(imageKey(image))}
                onToggle={toggleCheck} onPreview={setPreviewImage} />
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

      {!isSearching && images.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          {searchQuery.trim() ? (
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다.</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">이미지 검색</h3>
              <p className="text-gray-500 dark:text-gray-400">모델 이름을 포함해서 검색하면 저장 시 자동으로 해당 모델에 연결됩니다.</p>
            </>
          )}
        </div>
      )}

      {previewImage && (
        <ImagePreviewModal image={previewImage}
          isChecked={selectedImages.has(imageKey(previewImage))}
          onClose={() => setPreviewImage(null)}
          onToggleCheck={() => { const idx = images.indexOf(previewImage); if (idx !== -1) toggleCheck(idx); }} />
      )}

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
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">등록된 모델이 없습니다. 이름을 확인하고 등록하면 선택한 이미지와 함께 모델 프로필 페이지로 이동합니다.</p>
                <input value={newModelName} onChange={e => setNewModelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateAndSave()}
                  placeholder="모델 이름 입력" autoFocus
                  className="w-full px-4 py-2.5 mb-4 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all" />
                <div className="flex gap-2">
                  <button onClick={handleCreateAndSave} disabled={isCreating || !newModelName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50">
                    {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" />생성 중...</> : '생성 후 프로필로 이동'}
                  </button>
                  <button onClick={() => setShowNameModal(false)}
                    className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">취소</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">검색어와 일치하는 모델이 여러 명입니다. 저장할 모델을 선택하세요.</p>
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
