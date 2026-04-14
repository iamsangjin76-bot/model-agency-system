import React, { useState } from 'react';
import {
  Search,
  Image as ImageIcon,
  Download,
  Check,
  Loader2,
  FolderOpen,
  X,
  ChevronDown,
  Grid3X3,
  LayoutGrid,
  ZoomIn,
  ExternalLink,
} from 'lucide-react';
import { Model } from '@/types/model';

// 이미지 결과 타입
interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  width: number;
  height: number;
  saved?: boolean;
}

// 더미 모델 데이터
const dummyModels: Partial<Model>[] = [
  { id: 1, name: '한서주', nameEnglish: 'Han Seoju' },
  { id: 2, name: '윤하영', nameEnglish: 'Yoon Hayoung' },
  { id: 3, name: '박제니', nameEnglish: 'Park Jenny' },
  { id: 4, name: '소지섭', nameEnglish: 'So Ji-sub' },
  { id: 5, name: '차승원', nameEnglish: 'Cha Seung-won' },
];

// 더미 이미지 데이터 생성
const generateDummyImages = (searchQuery: string): ImageResult[] => {
  const unsplashImages = [
    'photo-1534528741775-53994a69daeb',
    'photo-1517841905240-472988babdf9',
    'photo-1524504388940-b1c1722653e1',
    'photo-1529626455594-4ff0802cfb7e',
    'photo-1507003211169-0a1dd7228f2d',
    'photo-1506794778202-cad84cf45f1d',
    'photo-1531746020798-e6953c6e8e04',
    'photo-1488426862026-3ee34a7d66df',
    'photo-1494790108377-be9c29b29330',
    'photo-1531123897727-8f129e1688ce',
    'photo-1544005313-94ddf0286df2',
    'photo-1502823403499-6ccfcf4fb453',
    'photo-1519699047748-de8e457a634e',
    'photo-1524638431109-93d95c968f03',
    'photo-1515886657613-9f3515b0c78f',
    'photo-1529139574466-a303027c1d8b',
  ];

  return unsplashImages.map((img, index) => ({
    id: `img-${index + 1}`,
    url: `https://images.unsplash.com/${img}?w=800&h=1200&fit=crop`,
    thumbnailUrl: `https://images.unsplash.com/${img}?w=300&h=400&fit=crop`,
    title: `${searchQuery} 이미지 ${index + 1}`,
    source: index % 3 === 0 ? 'Instagram' : index % 3 === 1 ? 'Getty Images' : 'Pinterest',
    width: 800,
    height: 1200,
  }));
};

export default function ImageSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<Partial<Model> | null>(null);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'large'>('grid');
  const [previewImage, setPreviewImage] = useState<ImageResult | null>(null);

  // 모델 선택
  const handleModelSelect = (model: Partial<Model>) => {
    setSelectedModel(model);
    setSearchQuery(model.name || '');
    setShowModelDropdown(false);
  };

  // 검색 실행
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setImages([]);
    
    try {
      // TODO: 실제 이미지 검색 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1500));
      const results = generateDummyImages(searchQuery);
      setImages(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 이미지 선택/해제
  const toggleImageSelect = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

  // 선택한 이미지 저장
  const handleSaveImages = async () => {
    if (selectedImages.length === 0) return;
    
    setIsSaving(true);
    
    try {
      // TODO: 실제 저장 API 호출
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSavedImages(prev => [...prev, ...selectedImages]);
      setSelectedImages([]);
      
      alert(`${selectedImages.length}개의 이미지가 "${selectedModel?.name || searchQuery}" 폴더에 저장되었습니다.`);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Enter 키로 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">이미지 검색</h1>
        <p className="text-gray-500 mt-1">모델 이름으로 이미지를 검색하고 저장하세요</p>
      </div>

      {/* 검색 영역 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 모델 선택 드롭다운 */}
          <div className="relative lg:w-64">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className={selectedModel ? 'text-gray-800' : 'text-gray-400'}>
                {selectedModel ? selectedModel.name : '모델 선택 (선택사항)'}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 max-h-60 overflow-auto">
                {dummyModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{model.name}</span>
                    <span className="text-sm text-gray-400">{model.nameEnglish}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="검색할 이름을 입력하세요..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* 검색 버튼 */}
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                검색 중...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                검색
              </>
            )}
          </button>
        </div>

        {/* 선택된 모델 표시 */}
        {selectedModel && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">저장 위치:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
              <FolderOpen className="w-4 h-4" />
              data/models/{selectedModel.name}/images/
              <button
                onClick={() => setSelectedModel(null)}
                className="ml-1 hover:text-purple-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 결과 헤더 */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedImages.length === images.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-600">전체 선택</span>
              </label>
              <span className="text-sm text-gray-500">
                {images.length}개 검색결과 | {selectedImages.length}개 선택됨
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 뷰 모드 토글 */}
              <div className="flex items-center bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('large')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'large' ? 'bg-white shadow-sm' : ''}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              
              {selectedImages.length > 0 && (
                <button
                  onClick={handleSaveImages}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      선택 이미지 저장 ({selectedImages.length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 이미지 그리드 */}
          <div className={`p-4 grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
            {images.map((image) => {
              const isSelected = selectedImages.includes(image.id);
              const isSaved = savedImages.includes(image.id);
              
              return (
                <div
                  key={image.id}
                  className={`relative group rounded-xl overflow-hidden bg-gray-100 aspect-[3/4] cursor-pointer
                    ${isSelected ? 'ring-4 ring-purple-500' : ''}
                    ${isSaved ? 'opacity-60' : ''}`}
                  onClick={() => !isSaved && toggleImageSelect(image.id)}
                >
                  <img
                    src={image.thumbnailUrl}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 오버레이 */}
                  <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors ${isSelected ? 'bg-black/20' : ''}`}>
                    {/* 체크박스 */}
                    <div className="absolute top-2 left-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-white bg-black/30 group-hover:bg-white/30'}`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    
                    {/* 확대 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(image);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    
                    {/* 저장됨 표시 */}
                    {isSaved && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                          저장됨
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 출처표시 */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-xs truncate">{image.source}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 초기 상태 */}
      {!isSearching && images.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="max-w-md mx-auto">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">이미지 검색</h3>
            <p className="text-gray-500 mb-6">
              모델 이름을 입력하거나 등록된 모델을 선택하여 관련 이미지를 검색하세요.
              검색된 이미지는 해당 모델의 폴더에 저장됩니다.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {dummyModels.slice(0, 4).map(model => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="mt-4 flex items-center justify-between text-white">
              <div>
                <p className="font-medium">{previewImage.title}</p>
                <p className="text-sm text-gray-400">{previewImage.source} • {previewImage.width} x {previewImage.height}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toggleImageSelect(previewImage.id);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedImages.includes(previewImage.id)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {selectedImages.includes(previewImage.id) ? '선택됨' : '선택'}
                </button>
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  원본
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
