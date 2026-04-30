import { useState, useEffect } from 'react';
import { request } from '@/services/auth-api';
import { Share2, Plus, Copy, Trash2, Eye, Clock, CheckCircle, X } from 'lucide-react';

interface ShareLink {
  id: number;
  token: string;
  title: string;
  model_ids: number[];
  expires_at: string | null;
  view_count: number;
  created_at: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Empty state when no links exist
// ---------------------------------------------------------------------------
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Share2 className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        공유 링크가 없습니다
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        모델 프로필을 거래처와 공유할 수 있는 링크를 만들어 보세요.
      </p>
      <button onClick={onNew}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-blue-700 mx-auto">
        <Plus className="w-4 h-4" />
        첫 번째 공유 링크 만들기
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share link card
// ---------------------------------------------------------------------------
function LinkCard({ link, onDelete }: { link: ShareLink; onDelete: (id: number) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expired = link.expires_at ? new Date(link.expires_at) < new Date() : false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{link.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            모델 {link.model_ids.length}명 · {new Date(link.created_at).toLocaleDateString('ko-KR')} 생성
          </p>
        </div>
        {expired
          ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">만료됨</span>
          : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">활성</span>
        }
      </div>

      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg mb-3">
        <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate font-mono">{link.url}</span>
        <button onClick={handleCopy}
          className="shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{link.view_count}회 조회</span>
        {link.expires_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {expired ? '만료됨' : `${new Date(link.expires_at).toLocaleDateString('ko-KR')} 까지`}
          </span>
        )}
        <button onClick={() => onDelete(link.id)}
          className="ml-auto flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />삭제
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ExternalSharePage() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await request<ShareLink[]>('/share/links');
      setLinks(data);
    } catch {
      // API not yet available — show empty state gracefully
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await request(`/share/links/${id}`, { method: 'DELETE' });
      setLinks(p => p.filter(l => l.id !== id));
    } catch (err: any) {
      setError(err.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-600" />
            외부 공유
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            거래처가 비로그인으로 열람할 수 있는 모델 프로필 링크를 생성합니다.
          </p>
        </div>
        <button
          onClick={() => {/* TODO: open create modal */}}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4" />
          새 공유 링크 생성
        </button>
      </div>

      {/* Guide */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl p-5">
        <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">외부 공유 기능 안내</h3>
        <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
          <li>로그인 없이 접근 가능한 전용 링크를 생성합니다</li>
          <li>특정 모델만 선택하여 공유할 수 있습니다</li>
          <li>만료 날짜를 설정해 기간이 지나면 자동으로 링크가 비활성화됩니다</li>
          <li>조회 횟수를 실시간으로 확인할 수 있습니다</li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Link list */}
      <div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">불러오는 중...</div>
        ) : links.length === 0 ? (
          <EmptyState onNew={() => {}} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map(link => (
              <LinkCard key={link.id} link={link} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
