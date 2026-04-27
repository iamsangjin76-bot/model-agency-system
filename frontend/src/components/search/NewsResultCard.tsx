import React from 'react';
import { Globe, Clock, ExternalLink } from 'lucide-react';
import { NewsArticle } from '@/services/domain-api';

interface Props {
  article: NewsArticle;
  index: number;
  isChecked: boolean;
  onToggle: (index: number) => void;
}

/** Strip HTML tags returned by Naver API highlight markup. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function NewsResultCard({ article, index, isChecked, onToggle }: Props) {
  const title = stripHtml(article.title);
  const description = stripHtml(article.description);

  return (
    <div
      className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        isChecked ? 'bg-purple-50 dark:bg-purple-900/20' : ''
      }`}
    >
      <div className="flex gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggle(index)}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 cursor-pointer"
          />
        </div>

        {/* Thumbnail */}
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="flex-shrink-0 w-32 h-24 object-cover rounded-lg"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Article info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 hover:text-purple-600">
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {description}
          </p>

          {/* Meta */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {article.source}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(article.pub_date)}
            </span>
            <a
              href={article.link}
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
}
