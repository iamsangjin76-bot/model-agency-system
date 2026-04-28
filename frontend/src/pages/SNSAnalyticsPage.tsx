import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, Heart, MessageCircle,
  Instagram, RefreshCw, Loader2, ChevronDown, ExternalLink,
  AlertCircle, CheckCircle2, WifiOff,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { modelsAPI, snsAPI, FollowerSnapshot, MediaMetric, Model } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';

const formatNumber = (n: number | null | undefined) => {
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

export default function SNSAnalyticsPage() {
  const { toast } = useToast();
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [snapshots, setSnapshots] = useState<FollowerSnapshot[]>([]);
  const [media, setMedia] = useState<MediaMetric[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check API configuration status on mount
  useEffect(() => {
    snsAPI.status()
      .then(r => setApiConfigured(r.configured))
      .catch(() => setApiConfigured(false));
    modelsAPI.list({ size: 200 }).then(r => setModels(r.items)).catch(() => {});
  }, []);

  const loadModelData = useCallback(async (model: Model) => {
    setIsLoading(true);
    setSnapshots([]);
    setMedia([]);
    try {
      const [snapRes, mediaRes] = await Promise.all([
        snsAPI.snapshots(model.id, 30),
        snsAPI.media(model.id, 10),
      ]);
      setSnapshots(snapRes.items);
      setMedia(mediaRes.items);
    } catch {
      // non-fatal — model may have no data yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
    setShowDropdown(false);
    loadModelData(model);
  };

  const handleSync = async () => {
    if (!selectedModel) return;
    setIsSyncing(true);
    try {
      const result = await snsAPI.sync(selectedModel.id);
      toast.success(`동기화 완료 — 팔로워 ${formatNumber(result.followers_count)}`);
      await loadModelData(selectedModel);
      // Update model list's cached follower count
      setModels(prev =>
        prev.map(m => m.id === selectedModel.id
          ? { ...m, instagram_followers: result.followers_count } as Model
          : m)
      );
    } catch (err: any) {
      const msg = err?.message || '동기화에 실패했습니다.';
      if (msg.includes('인스타그램 계정')) toast.error(msg);
      else if (msg.includes('not configured') || msg.includes('503')) {
        toast.error('Instagram API 토큰이 설정되지 않았습니다.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Derived chart data — chronological order for area chart
  const chartData = [...snapshots]
    .reverse()
    .map(s => ({
      date: formatDate(s.snapshot_at),
      팔로워: s.followers_count,
    }));

  const latestSnap = snapshots[0] ?? null;

  // Engagement rate per post: avg (likes + comments) / followers
  const engagementRate = latestSnap && media.length > 0
    ? (media.reduce((sum, m) => sum + (m.like_count ?? 0) + (m.comment_count ?? 0), 0) / media.length / latestSnap.followers_count * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">SNS 분석</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Instagram 팔로워 추이 및 게시물 인게이지먼트
          </p>
        </div>

        {/* API status badge */}
        {apiConfigured !== null && (
          <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border ${
            apiConfigured
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
          }`}>
            {apiConfigured
              ? <><CheckCircle2 className="w-4 h-4" />Graph API 연결됨</>
              : <><WifiOff className="w-4 h-4" />Graph API 미연결</>}
          </div>
        )}
      </div>

      {/* API not configured — guide */}
      {apiConfigured === false && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">Instagram Graph API 미설정</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                아직 동기화 기능을 사용할 수 없습니다. Meta 계정 셋업 후 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code>에 아래 값을 추가하세요.
              </p>
              <pre className="mt-3 text-xs bg-amber-100 dark:bg-amber-900 rounded-lg p-3 text-amber-900 dark:text-amber-200 overflow-x-auto">
{`INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_MY_IG_USER_ID=your_ig_business_account_id`}
              </pre>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
                저장된 데이터는 아래에서 조회할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model selector + sync button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[220px]"
          >
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="font-medium text-gray-800 dark:text-gray-100 flex-1 text-left">
              {selectedModel ? selectedModel.name : '모델 선택'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[220px] max-h-64 overflow-y-auto">
              {models.length === 0
                ? <p className="px-4 py-2 text-sm text-gray-400">등록된 모델 없음</p>
                : models.map(m => (
                  <button key={m.id} onClick={() => handleSelectModel(m)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{m.name}</span>
                    <span className="text-xs text-gray-400">
                      {m.instagram ? `@${m.instagram}` : '계정 미등록'}
                    </span>
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {selectedModel && (
          <button onClick={handleSync} disabled={isSyncing || !apiConfigured}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isSyncing
              ? <><Loader2 className="w-4 h-4 animate-spin" />동기화 중...</>
              : <><RefreshCw className="w-4 h-4" />지금 갱신</>}
          </button>
        )}
      </div>

      {/* No model selected */}
      {!selectedModel && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">모델을 선택해주세요</h3>
          <p className="text-gray-500 dark:text-gray-400">
            상단에서 모델을 선택하면 Instagram 분석 데이터를 확인할 수 있습니다.
          </p>
        </div>
      )}

      {/* Model selected — data section */}
      {selectedModel && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : snapshots.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <Instagram className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 dark:text-gray-200">아직 동기화된 데이터가 없습니다</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {selectedModel.instagram
                  ? `"지금 갱신" 버튼으로 첫 번째 데이터를 가져오세요`
                  : '모델 프로필에 인스타그램 계정(@)을 먼저 등록해주세요'}
              </p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<Users className="w-5 h-5 text-pink-600" />} bg="bg-pink-100"
                  label="팔로워" value={formatNumber(latestSnap?.followers_count)}
                  sub={`갱신: ${formatDate(latestSnap?.snapshot_at)}`} />
                <KpiCard icon={<Users className="w-5 h-5 text-blue-600" />} bg="bg-blue-100"
                  label="팔로잉" value={formatNumber(latestSnap?.follows_count)}
                  sub="최근 갱신 기준" />
                <KpiCard icon={<Instagram className="w-5 h-5 text-purple-600" />} bg="bg-purple-100"
                  label="게시물 수" value={formatNumber(latestSnap?.media_count)}
                  sub="누적" />
                <KpiCard icon={<Heart className="w-5 h-5 text-red-600" />} bg="bg-red-100"
                  label="참여율" value={engagementRate != null ? `${engagementRate.toFixed(2)}%` : '-'}
                  sub="최근 게시물 평균" />
              </div>

              {/* Follower trend chart */}
              {chartData.length > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    팔로워 추이
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorFol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => formatNumber(v)} tick={{ fontSize: 11 }} width={60} />
                        <Tooltip formatter={(v: number) => [formatNumber(v), '팔로워']} />
                        <Area type="monotone" dataKey="팔로워" stroke="#8b5cf6" strokeWidth={2}
                          fillOpacity={1} fill="url(#colorFol)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent posts */}
              {media.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    최근 게시물 인게이지먼트
                  </h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={media.map((m, i) => ({
                        name: m.posted_at ? formatDate(m.posted_at) : `#${i + 1}`,
                        좋아요: m.like_count ?? 0,
                        댓글: m.comment_count ?? 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="좋아요" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="댓글" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Post list */}
                  <div className="mt-4 space-y-2">
                    {media.slice(0, 5).map((m, i) => (
                      <div key={m.id ?? i}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm">
                        <span className="text-xs text-gray-400 w-14 shrink-0">{formatDate(m.posted_at)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          m.media_type === 'VIDEO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : m.media_type === 'CAROUSEL_ALBUM' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>{m.media_type ?? '사진'}</span>
                        <span className="flex-1 truncate text-gray-600 dark:text-gray-300">
                          {m.caption_excerpt || '(캡션 없음)'}
                        </span>
                        <span className="flex items-center gap-1 text-pink-500 shrink-0">
                          <Heart className="w-3.5 h-3.5" />{formatNumber(m.like_count)}
                        </span>
                        <span className="flex items-center gap-1 text-purple-500 shrink-0">
                          <MessageCircle className="w-3.5 h-3.5" />{formatNumber(m.comment_count)}
                        </span>
                        {m.permalink && (
                          <a href={m.permalink} target="_blank" rel="noreferrer"
                            className="text-gray-400 hover:text-purple-500 shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, bg, label, value, sub }: {
  icon: React.ReactNode; bg: string;
  label: string; value: string; sub: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 ${bg} rounded-lg`}>{icon}</div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
