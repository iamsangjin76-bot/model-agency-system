import React, { useState, useEffect } from 'react';
import { Newspaper, Trash2, ExternalLink } from 'lucide-react';
import { newsAPI, SavedNews } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import DetailSection from './DetailSection';

interface Props {
  modelId: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ModelNewsList({ modelId }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<SavedNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsAPI.getByModel(modelId)
      .then(res => setItems(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [modelId]);

  const handleDelete = async (newsId: number, title: string) => {
    if (!window.confirm(`"${title}" 기사를 삭제하시겠습니까?`)) return;
    try {
      await newsAPI.delete(newsId);
      setItems(prev => prev.filter(n => n.id !== newsId));
      toast.success('기사가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <DetailSection title="관련 뉴스" icon={Newspaper}>
      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <Newspaper className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            저장된 뉴스가 없습니다.<br />
            뉴스 검색 페이지에서 기사를 검색하고 저장해보세요.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map(item => (
            <div key={item.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    item.provider === 'naver'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {item.provider === 'naver' ? '네이버' : '구글'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.source}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.pubDate)}</span>
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 line-clamp-2 flex items-start gap-1"
                >
                  {item.title}
                  <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-60" />
                </a>
              </div>
              <button
                onClick={() => handleDelete(item.id, item.title)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </DetailSection>
  );
}
