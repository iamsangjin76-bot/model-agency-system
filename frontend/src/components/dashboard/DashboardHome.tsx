import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { modelsAPI, castingsAPI, settlementsAPI, activityLogsAPI, ActivityLogEntry } from '@/services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Camera, Newspaper, Share2, Search, Image, FileText } from 'lucide-react';
import { ROLE_LABELS, AdminRole } from '@/types/auth';

// Map raw action + target_type to a Korean display string
function formatAction(action: string, targetType: string | null): string {
  const typeLabel: Record<string, string> = {
    model: '모델', client: '고객사', casting: '캐스팅',
    contract: '계약', settlement: '정산', schedule: '일정',
  };
  const actionLabel: Record<string, string> = {
    create: '등록', update: '수정', delete: '삭제',
    login: '로그인', logout: '로그아웃',
  };
  const t = targetType ? (typeLabel[targetType] ?? targetType) : '';
  const a = actionLabel[action] ?? action;
  return t ? `${t} ${a}` : a;
}

// Convert ISO timestamp to relative Korean string
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export function DashboardHome() {
  const { admin } = useAuth();
  const [modelCount, setModelCount] = useState<string>('-');
  const [castingCount, setCastingCount] = useState<string>('-');
  const [modelChartData, setModelChartData] = useState<{name:string;value:number}[]>([]);
  const [castingChartData, setCastingChartData] = useState<{name:string;value:number}[]>([]);
  const [settlementData, setSettlementData] = useState<{income:number;expense:number}>({income:0,expense:0});
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    modelsAPI.stats()
      .then((data: any) => {
        setModelCount(data.total?.toLocaleString() || '0');
        // Transform gender breakdown into chart data with Korean labels
        const genderLabels: Record<string, string> = { male: '남성', female: '여성', other: '기타' };
        const genderData = Object.entries(data.by_gender || {})
          .map(([key, val]) => ({ name: genderLabels[key] || key, value: val as number }))
          .filter(entry => entry.value > 0);
        setModelChartData(genderData);
      })
      .catch(() => setModelCount('0'));

    castingsAPI.stats()
      .then((data: any) => {
        const total = Object.values(data.by_status || {}).reduce((a: any, b: any) => a + b, 0);
        setCastingCount(String(total));
        // Transform status breakdown into chart data with Korean labels
        const statusLabels: Record<string, string> = {
          request: '의뢰', reviewing: '검토중', matching: '매칭중',
          proposed: '제안완료', confirmed: '확정', completed: '완료', cancelled: '취소'
        };
        const castingData = Object.entries(data.by_status || {})
          .map(([key, val]) => ({ name: statusLabels[key] || key, value: val as number }))
          .filter(entry => entry.value > 0);
        setCastingChartData(castingData);
      })
      .catch(() => setCastingCount('0'));

    settlementsAPI.stats()
      .then((data: any) => {
        setSettlementData({ income: data.total_income || 0, expense: data.total_expense || 0 });
      })
      .catch(() => {});

    activityLogsAPI.recent(5)
      .then((data) => setRecentActivity(data.items))
      .catch(() => {});
  }, []);

  const stats = [
    { label: '등록 모델', value: modelCount, icon: Users, color: 'from-blue-500 to-blue-600', path: '/dashboard/models' },
    { label: '이번 달 캐스팅', value: castingCount, icon: Camera, color: 'from-purple-500 to-purple-600', path: '/dashboard/casting' },
    { label: '저장된 기사', value: '-', icon: Newspaper, color: 'from-green-500 to-green-600', path: '/dashboard/news-search' },
    { label: '공유 링크', value: '-', icon: Share2, color: 'from-orange-500 to-orange-600', path: '/dashboard/share' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          안녕하세요, {admin?.name}님! 👋
        </h1>
        <p className="text-white/80">
          오늘도 좋은 하루 되세요. 모델 에이전시 관리 시스템에 오신 것을 환영합니다.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
            {ROLE_LABELS[admin?.role as AdminRole] || '사용자'}
          </span>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Link
            key={index}
            to={stat.path}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 dark:text-gray-100">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">빠른 작업</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/dashboard/models/new"
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
            >
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-medium dark:text-gray-100">모델 등록</span>
            </Link>
            <Link
              to="/dashboard/news-search"
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-green-500" />
              <span className="font-medium dark:text-gray-100">뉴스 검색</span>
            </Link>
            <Link
              to="/dashboard/image-search"
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
            >
              <Image className="w-5 h-5 text-purple-500" />
              <span className="font-medium dark:text-gray-100">이미지 검색</span>
            </Link>
            <Link
              to="/dashboard/profile-export"
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
            >
              <FileText className="w-5 h-5 text-orange-500" />
              <span className="font-medium dark:text-gray-100">프로필 내보내기</span>
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">최근 활동</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">최근 활동이 없습니다.</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{formatAction(log.action, log.target_type)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{log.target_name ?? '-'}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelativeTime(log.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Statistics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">모델 성별 분포</h3>
          {modelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={modelChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name} ${value}`}>{modelChartData.map((_,i) => (<Cell key={i} fill={['#6366f1','#ec4899','#a3e635'][i%3]} />))}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          ) : (<div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>)}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">캐스팅 현황</h3>
          {castingChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={castingChartData} barSize={28}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis allowDecimals={false} tick={{fontSize:12}} /><Tooltip /><Bar dataKey="value" name="건수" fill="#818cf8" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          ) : (<div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>)}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">정산 요약</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{name:'수입',value:settlementData.income},{name:'지출',value:settlementData.expense}]} barSize={40}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:13}} /><YAxis tickFormatter={(v)=>`${(v/10000).toFixed(0)}만`} tick={{fontSize:11}} /><Tooltip formatter={(v:any)=>`${Number(v).toLocaleString()}원`} /><Bar dataKey="value" name="금액" radius={[4,4,0,0]}><Cell fill="#34d399" /><Cell fill="#f87171" /></Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
