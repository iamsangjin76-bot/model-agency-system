import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Newspaper,
  ExternalLink,
  Download,
  Check,
  Loader2,
  Calendar,
  Globe,
  FolderOpen,
  X,
  ChevronDown,
  Filter,
  Clock,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { Model, MODEL_TYPE_LABELS } from '@/types/model';
import { useToast } from '@/contexts/ToastContext';

// 뉴스 기사 타입
interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  saved?: boolean;
}

// 더미 모델 데이터 (실제로는 API에서 가져옴)
const dummyModels: Partial<Model>[] = [
  { id: 1, name: '한서주', nameEnglish: 'Han Seoju' },
  { id: 2, name: '윤하영', nameEnglish: 'Yoon Hayoung' },
  { id: 3, name: '박제니', nameEnglish: 'Park Jenny' },
  { id: 4, name: '소지섭', nameEnglish: 'So Ji-sub' },
  { id: 5, name: '차승원', nameEnglish: 'Cha Seung-won' },
];

// 더미 뉴스 데이터 생성
const generateDummyNews = (searchQuery: string): NewsArticle[] => {
  const articles: NewsArticle[] = [
    {
      id: '1',
      title: `${searchQuery}, 새 드라마 주연 발탁..."기대되는 연기"`,
      description: `배우 ${searchQuery}이(가) 새로운 드라마의 주연으로 발탁되어 화제다. 해당 드라마는 내년 상반기 방영 예정이며...`,
      source: '연예뉴스',
      url: 'https://example.com/news/1',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
      publishedAt: '2026-02-06T10:30:00Z',
    },
    {
      id: '2',
      title: `${searchQuery} 화보 공개..."완벽한 비주얼"`,
      description: `${searchQuery}의 새로운 화보가 공개되어 팬들의 뜨거운 반응을 얻고 있다. 이번 화보에서는...`,
      source: '패션매거진',
      url: 'https://example.com/news/2',
      imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
      publishedAt: '2026-02-05T14:20:00Z',
    },
    {
      id: '3',
      title: `${searchQuery}, 브랜드 앰버서더로 선정`,
      description: `글로벌 브랜드가 ${searchQuery}을(를) 새로운 앰버서더로 선정했다. 브랜드 측은 "${searchQuery}의 이미지가..."`,
      source: '경제일보',
      url: 'https://example.com/news/3',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      publishedAt: '2026-02-04T09:15:00Z',
    },
    {
      id: '4',
      title: `${searchQuery} 인스타그램 팔로워 1000만 돌파`,
      description: `${searchQuery}의 인스타그램 팔로워가 1000만을 돌파했다. 이로써 ${searchQuery}은(는) 국내 연예인 중에서도...`,
      source: 'IT뉴스',
      url: 'https://example.com/news/4',
      publishedAt: '2026-02-03T16:45:00Z',
    },
    {
      id: '5',
      title: `${searchQuery} 팬미팅 성황리 마무리`,
      description: `${searchQuery}의 팬미팅이 성황리에 마무리됐다. 이번 팬미팅에는 약 5000명의 팬들이 참석하여...`,
      source: '연예뉴스',
      url: 'https://example.com/news/5',
      imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400',
      publishedAt: '2026-02-02T11:00:00Z',
    },
    {
      id: '6',
      title: `[인터뷰] ${searchQuery} "연기는 항상 새로운 도전"`,
      description: `배우 ${searchQuery}이(가) 최근 인터뷰에서 자신의 연기 철학에 대해 이야기했다. "항상 새로운 캐릭터를 만나는 것이..."`,
      source: '스포츠동아',
      url: 'https://example.com/news/6',
      imageUrl: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400',
      publishedAt: '2026-02-01T08:30:00Z',
    },
  ];
  return articles;
};

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function NewsSearchPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<Partial<Model> | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

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
    setArticles([]);
    
    try {
      // TODO: 실제 뉴스 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1500));
      const results = generateDummyNews(searchQuery);
      setArticles(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 기사 선택/해제
  const toggleArticleSelect = (articleId: string) => {
    setSelectedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(a => a.id));
    }
  };

  // 선택한 기사 저장
  const handleSaveArticles = async () => {
    if (selectedArticles.length === 0) return;
    
    setIsSaving(true);
    
    try {
      // TODO: 실제 저장 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 저장된 기사 표시
      setSavedArticles(prev => [...prev, ...selectedArticles]);
      setSelectedArticles([]);
      
      toast.success(`${selectedArticles.length}개의 기사가 "${selectedModel?.name || searchQuery}" 폴더에 저장되었습니다.`);
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('기사 저장에 실패했습니다.');
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">뉴스 기사 검색</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">모델 이름으로 뉴스를 검색하고 저장하세요</p>
      </div>

      {/* 검색 영역 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 모델 선택 드롭다운 */}
          <div className="relative lg:w-64">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className={selectedModel ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}>
                {selectedModel ? selectedModel.name : '모델 선택 (선택사항)'}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 max-h-60 overflow-auto">
                {dummyModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                  >
                    <span>{model.name}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{model.nameEnglish}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="검색할 이름을 입력하세요..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
            <span className="text-sm text-gray-500 dark:text-gray-400">저장 위치:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
              <FolderOpen className="w-4 h-4" />
              data/models/{selectedModel.name}/news/
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
      {articles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* 결과 헤더 */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedArticles.length === articles.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {articles.length}개 검색결과 | {selectedArticles.length}개 선택됨
              </span>
            </div>
            
            {selectedArticles.length > 0 && (
              <button
                onClick={handleSaveArticles}
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
                    선택 기사 저장 ({selectedArticles.length})
                  </>
                )}
              </button>
)}
          </div>

          {/* 기사 목록 */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {articles.map((article) => {
              const isSelected = selectedArticles.includes(article.id);
              const isSaved = savedArticles.includes(article.id);
              
              return (
                <div
                  key={article.id}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-purple-50' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* 체크박스 */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleArticleSelect(article.id)}
                        disabled={isSaved}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 disabled:opacity-50"
                      />
                    </div>

                    {/* 썸네일 */}
                    {article.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-32 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* 기사 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 hover:text-purple-600">
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              {article.title}
                            </a>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {article.description}
                          </p>
                        </div>
                        
                        {isSaved && (
                          <span className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                            <BookmarkCheck className="w-3 h-3" />
                            저장됨
                          </span>
                        )}
                      </div>

                      {/* 메타 정보 */}
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {article.source}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          원문 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isSearching && searchQuery && articles.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">검색 버튼을 클릭하여 뉴스를 검색하세요.</p>
        </div>
      )}

      {/* 초기 상태 */}
      {!searchQuery && articles.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="max-w-md mx-auto">
            <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">뉴스 기사 검색</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              모델 이름을 입력하거나 등록된 모델을 선택하여 관련 뉴스를 검색하세요.
              검색된 기사는 해당 모델의 폴더에 저장됩니다.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {dummyModels.slice(0, 4).map(model => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
