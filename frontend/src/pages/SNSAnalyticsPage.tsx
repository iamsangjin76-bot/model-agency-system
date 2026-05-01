import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Users, Heart, MessageCircle, Instagram, Youtube, RefreshCw, Loader2, ChevronDown, ExternalLink, AlertCircle, Eye } from 'lucide-react';
import { StatusBadge, KpiCard, SyncResultCard } from '@/components/sns/SnsSubComponents';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { modelsAPI, snsAPI, SnsStatus, FollowerSnapshot, MediaMetric, Model } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';

type Platform = 'instagram' | 'youtube';

const fmt = (n: number | null | undefined) => {
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};
const fmtDate = (s: string | null | undefined) => {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

export default function SNSAnalyticsPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<SnsStatus | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<Model | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [igSnaps, setIgSnaps] = useState<FollowerSnapshot[]>([]);
  const [ytSnaps, setYtSnaps] = useState<FollowerSnapshot[]>([]);
  const [media, setMedia] = useState<MediaMetric[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<{ instagram: any; youtube: any } | null>(null);

  useEffect(() => {
    snsAPI.status().then(setStatus).catch(() => {});
    modelsAPI.list({ size: 200 }).then(r => setModels(r.items)).catch(() => {});
  }, []);

  const loadData = useCallback(async (m: Model) => {
    setIsLoading(true);
    setIgSnaps([]); setYtSnaps([]); setMedia([]);
    try {
      const [ig, yt, med] = await Promise.all([
        snsAPI.snapshots(m.id, 'instagram', 30),
        snsAPI.snapshots(m.id, 'youtube', 30),
        snsAPI.media(m.id, 10),
      ]);
      setIgSnaps(ig.items);
      setYtSnaps(yt.items);
      setMedia(med.items);
    } catch { /* non-fatal */ }
    finally { setIsLoading(false); }
  }, []);

  const handleSelect = (m: Model) => {
    setSelected(m); setShowDropdown(false); setLastSync(null); loadData(m);
  };

  const handleSync = async () => {
    if (!selected) return;
    setIsSyncing(true);
    try {
      const res = await snsAPI.sync(selected.id);
      setLastSync({ instagram: res.instagram, youtube: res.youtube });
      const parts = [res.instagram?.ok && `인스타 ${fmt(res.instagram.followers_count)}`, res.youtube?.ok && `유튜브 ${fmt(res.youtube.subscriber_count)}`].filter(Boolean);
      if (parts.length) toast.success(`동기화 완료 — ${parts.join(' / ')}`);
      else toast.warning('동기화됐지만 가져온 데이터가 없습니다');
      await loadData(selected);
    } catch (err: any) { toast.error(err?.message || '동기화에 실패했습니다.'); }
    finally { setIsSyncing(false); }
  };

  const snaps = platform === 'instagram' ? igSnaps : ytSnaps;
  const chartData = [...snaps].reverse().map(s => ({ date: fmtDate(s.snapshot_at), 수: s.followers_count }));
  const igLatest = igSnaps[0] ?? null;
  const ytLatest = ytSnaps[0] ?? null;
  const engRate = igLatest && media.length > 0
    ? media.reduce((s, m) => s + (m.like_count ?? 0) + (m.comment_count ?? 0), 0) / media.length / igLatest.followers_count * 100
    : null;
  const igOk = status?.instagram;
  const ytOk = status?.youtube;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">SNS 분석</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Instagram · YouTube 팔로워 추이 및 인게이지먼트</p>
        </div>
        {/* API status badges */}
        {status && (
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge icon={<Instagram className="w-3.5 h-3.5" />} label="Instagram" ok={!!igOk} />
            <StatusBadge icon={<Youtube className="w-3.5 h-3.5" />} label="YouTube" ok={!!ytOk} />
          </div>
        )}
      </div>

      {/* Not configured guide */}
      {status && !status.any_configured && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">API 미설정 — .env에 추가하세요</p>
              <pre className="text-xs bg-amber-100 dark:bg-amber-900 rounded-lg p-3 text-amber-900 dark:text-amber-200 overflow-x-auto">
{`# Instagram (Meta 개발자 계정 필요)
INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_MY_IG_USER_ID=your_ig_user_id

# YouTube (Google Cloud Console — YouTube Data API v3 활성화)
YOUTUBE_API_KEY=your_key  # GOOGLE_API_KEY도 가능`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Partial config notice */}
      {status && status.any_configured && (!igOk || !ytOk) && (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          {!igOk && 'Instagram API 미설정 — '}
          {!ytOk && 'YouTube API 미설정 — '}
          해당 플랫폼은 갱신되지 않습니다
        </div>
      )}

      {/* Model selector + sync button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[220px]">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-gray-800 dark:text-gray-100 flex-1 text-left">
              {selected ? selected.name : '모델 선택'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[240px] max-h-64 overflow-y-auto">
              {models.length === 0
                ? <p className="px-4 py-2 text-sm text-gray-400">등록된 모델 없음</p>
                : models.map(m => (
                  <button key={m.id} onClick={() => handleSelect(m)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{m.name}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      {m.instagram_id && <Instagram className="w-3 h-3 text-pink-400" />}
                      {(m as any).youtube_id && <Youtube className="w-3 h-3 text-red-400" />}
                    </span>
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {selected && (
          <button onClick={handleSync} disabled={isSyncing || !status?.any_configured}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isSyncing ? <><Loader2 className="w-4 h-4 animate-spin" />동기화 중...</> : <><RefreshCw className="w-4 h-4" />지금 갱신</>}
          </button>
        )}
      </div>

      {/* No model selected */}
      {!selected && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">모델을 선택해주세요</h3>
          <p className="text-gray-500 dark:text-gray-400">상단에서 모델을 선택하면 SNS 분석 데이터를 확인할 수 있습니다.</p>
        </div>
      )}

      {selected && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              {/* KPI grid — both platforms */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<Instagram className="w-5 h-5 text-pink-600" />} bg="bg-pink-100 dark:bg-pink-900/30"
                  label="인스타 팔로워" value={fmt(igLatest?.followers_count ?? (selected as any).instagram_followers)}
                  sub={igLatest ? `갱신: ${fmtDate(igLatest.snapshot_at)}` : '미동기화'} />
                <KpiCard icon={<Heart className="w-5 h-5 text-red-500" />} bg="bg-red-100 dark:bg-red-900/30"
                  label="인스타 참여율" value={engRate != null ? `${engRate.toFixed(2)}%` : '-'}
                  sub="최근 게시물 평균" />
                <KpiCard icon={<Youtube className="w-5 h-5 text-red-600" />} bg="bg-red-50 dark:bg-red-900/20"
                  label="유튜브 구독자" value={fmt(ytLatest?.followers_count ?? (selected as any).youtube_subscribers)}
                  sub={ytLatest ? `갱신: ${fmtDate(ytLatest.snapshot_at)}` : '미동기화'} />
                <KpiCard icon={<Eye className="w-5 h-5 text-blue-600" />} bg="bg-blue-100 dark:bg-blue-900/30"
                  label="유튜브 영상 수" value={fmt(ytLatest?.media_count ?? null)}
                  sub="누적" />
              </div>

              {/* Last sync result */}
              {lastSync && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SyncResultCard platform="instagram" result={lastSync.instagram} />
                  <SyncResultCard platform="youtube" result={lastSync.youtube} />
                </div>
              )}

              {/* Platform tab + trend chart */}
              {(igSnaps.length > 0 || ytSnaps.length > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />팔로워 / 구독자 추이</h3>
                    <div className="flex gap-1">
                      {([['instagram', <Instagram className="w-3.5 h-3.5" />, igSnaps.length > 0], ['youtube', <Youtube className="w-3.5 h-3.5" />, ytSnaps.length > 0]] as const).map(([p, icon, hasData]) => (
                        <button key={p} onClick={() => setPlatform(p as Platform)} disabled={!hasData}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${platform === p ? (p === 'instagram' ? 'bg-pink-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                          {icon}{p === 'instagram' ? '인스타' : '유튜브'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {chartData.length > 1 ? (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={platform === 'youtube' ? '#ef4444' : '#ec4899'} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={platform === 'youtube' ? '#ef4444' : '#ec4899'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11 }} width={60} />
                          <Tooltip formatter={(v: number) => [fmt(v), platform === 'youtube' ? '구독자' : '팔로워']} />
                          <Area type="monotone" dataKey="수"
                            stroke={platform === 'youtube' ? '#ef4444' : '#ec4899'}
                            strokeWidth={2} fillOpacity={1} fill="url(#cg)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-gray-400 py-8">
                      데이터가 1개입니다. 더 갱신하면 추이 그래프가 표시됩니다.
                    </p>
                  )}
                </div>
              )}

              {/* No data at all */}
              {igSnaps.length === 0 && ytSnaps.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                  <Instagram className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700 dark:text-gray-200">아직 동기화된 데이터가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-1">"지금 갱신" 버튼으로 첫 번째 데이터를 가져오세요</p>
                </div>
              )}

              {/* Instagram post engagement */}
              {media.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />Instagram 최근 게시물 인게이지먼트
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={media.map((m, i) => ({ name: m.posted_at ? fmtDate(m.posted_at) : `#${i + 1}`, 좋아요: m.like_count ?? 0, 댓글: m.comment_count ?? 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                        <Tooltip /><Legend />
                        <Bar dataKey="좋아요" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="댓글" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {media.slice(0, 5).map((m, i) => (
                      <div key={m.id ?? i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm">
                        <span className="text-xs text-gray-400 w-12 shrink-0">{fmtDate(m.posted_at)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${m.media_type === 'VIDEO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{m.media_type ?? '사진'}</span>
                        <span className="flex-1 truncate text-gray-600 dark:text-gray-300">{m.caption_excerpt || '(캡션 없음)'}</span>
                        <span className="flex items-center gap-1 text-pink-500 shrink-0"><Heart className="w-3 h-3" />{fmt(m.like_count)}</span>
                        <span className="flex items-center gap-1 text-purple-500 shrink-0"><MessageCircle className="w-3 h-3" />{fmt(m.comment_count)}</span>
                        {m.permalink && <a href={m.permalink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-500 shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>}
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
