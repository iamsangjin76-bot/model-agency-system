import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS, AdminRole } from '@/types/auth';
import { modelsAPI, castingsAPI, settlementsAPI } from '@/services/api';
import ModelListPage from './ModelListPage';
import ModelFormPage from './ModelFormPage';
import NewsSearchPage from './NewsSearchPage';
import ImageSearchPage from './ImageSearchPage';
import ProfileExportPage from './ProfileExportPage';
import SNSAnalyticsPage from './SNSAnalyticsPage';
import CastingPage from './CastingPage';
import ClientPage from './ClientPage';
import SchedulePage from './SchedulePage';
import ContractPage from './ContractPage';
import SettlementPage from './SettlementPage';
import AdminManagementPage from './AdminManagementPage';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Search,
  Image,
  FileText,
  Share2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Camera,
  Newspaper,
  Download,
  UserCircle,
  Shield,
  Megaphone,
  Building2,
  Calendar,
  FileSignature,
  Wallet,
} from 'lucide-react';

// 사이드바 메뉴 아이템
const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '대시보드', permission: null },
  { path: '/dashboard/models', icon: Users, label: '모델 관리', permission: 'model' },
  { path: '/dashboard/news-search', icon: Newspaper, label: '뉴스 검색', permission: 'news' },
  { path: '/dashboard/image-search', icon: Image, label: '이미지 검색', permission: 'image' },
  { path: '/dashboard/profile-export', icon: Download, label: '프로필 다운로드', permission: 'profile' },
  { path: '/dashboard/sns-analytics', icon: BarChart3, label: 'SNS 분석', permission: 'sns' },
  { path: '/dashboard/casting', icon: Megaphone, label: '캐스팅 관리', permission: 'model' },
  { path: '/dashboard/clients', icon: Building2, label: '고객 관리', permission: 'model' },
  { path: '/dashboard/schedule', icon: Calendar, label: '일정 관리', permission: 'model' },
  { path: '/dashboard/contracts', icon: FileSignature, label: '계약 관리', permission: 'model' },
  { path: '/dashboard/settlements', icon: Wallet, label: '정산 관리', permission: 'model' },
  { path: '/dashboard/share', icon: Share2, label: '외부 공유', permission: 'profile' },
  { path: '/dashboard/admins', icon: Shield, label: '관리자 설정', permission: 'admin' },
  { path: '/dashboard/settings', icon: Settings, label: '시스템 설정', permission: 'settings' },
];

// 대시보드 홈 컴포넌트
function DashboardHome() {
  const { admin } = useAuth();
  const [modelCount, setModelCount] = useState<string>('-');
  const [castingCount, setCastingCount] = useState<string>('-');
  const [modelChartData, setModelChartData] = useState<{name:string;value:number}[]>([]);
  const [castingChartData, setCastingChartData] = useState<{name:string;value:number}[]>([]);
  const [settlementData, setSettlementData] = useState<{income:number;expense:number}>({income:0,expense:0});

  useEffect(() => {
    modelsAPI.stats()
      .then((data: any) => setModelCount(data.total?.toLocaleString() || '0'))
      .catch(() => setModelCount('0'));

    castingsAPI.stats()
      .then((data: any) => {
        const total = Object.values(data.by_status || {}).reduce((a: any, b: any) => a + b, 0);
        setCastingCount(String(total));
      })
      .catch(() => setCastingCount('0'));
  }, []);

  const stats = [
    { label: '등록 모델', value: modelCount, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: '이번 달 캐스팅', value: castingCount, icon: Camera, color: 'from-purple-500 to-purple-600' },
    { label: '저장된 기사', value: '-', icon: Newspaper, color: 'from-green-500 to-green-600' },
    { label: '공유 링크', value: '-', icon: Share2, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
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

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 퀵 액션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">빠른 작업</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/dashboard/models"
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-medium">모델 등록</span>
            </Link>
            <Link
              to="/dashboard/news-search"
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-green-500" />
              <span className="font-medium">뉴스 검색</span>
            </Link>
            <Link
              to="/dashboard/image-search"
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <Image className="w-5 h-5 text-purple-500" />
              <span className="font-medium">이미지 검색</span>
            </Link>
            <Link
              to="/dashboard/profile-export"
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <FileText className="w-5 h-5 text-orange-500" />
              <span className="font-medium">프로필 내보내기</span>
            </Link>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
          <div className="space-y-4">
            {[
              { action: '모델 프로필 수정', target: '김모델', time: '5분 전' },
              { action: '뉴스 기사 저장', target: '홍길동 관련', time: '15분 전' },
              { action: '이미지 다운로드', target: '박지민', time: '1시간 전' },
              { action: 'PPT 생성', target: '이수진', time: '2시간 전' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.target}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 통계 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">모델 성별 분포</h3>
          {modelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={modelChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name} ${value}`}>{modelChartData.map((_,i) => (<Cell key={i} fill={['#6366f1','#ec4899','#a3e635'][i%3]} />))}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          ) : (<div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>)}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">캐스팅 현황</h3>
          {castingChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={castingChartData} barSize={28}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis allowDecimals={false} tick={{fontSize:12}} /><Tooltip /><Bar dataKey="value" name="건수" fill="#818cf8" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          ) : (<div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>)}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">정산 요약</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{name:'수입',value:settlementData.income},{name:'지출',value:settlementData.expense}]} barSize={40}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:13}} /><YAxis tickFormatter={(v)=>`${(v/10000).toFixed(0)}만`} tick={{fontSize:11}} /><Tooltip formatter={(v:any)=>`${Number(v).toLocaleString()}원`} /><Bar dataKey="value" name="금액" radius={[4,4,0,0]}><Cell fill="#34d399" /><Cell fill="#f87171" /></Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// 플레이스홀더 페이지
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-gray-500">이 페이지는 개발 중입니다.</p>
    </div>
  );
}

export default function DashboardPage() {
  const { admin, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 권한에 따른 메뉴 필터링
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission, 'read');
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* 로고 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800">MODEL AGENCY</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 메뉴 */}
        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 사이드바 토글 (데스크톱) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* 헤더 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredMenuItems.find(item => item.path === location.pathname)?.label || '대시보드'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* 알림 */}
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{admin?.name}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[admin?.role as AdminRole]}</p>
              </div>
              <div className="relative group">
                <button className="p-2 bg-gray-100 rounded-full">
                  <UserCircle className="w-6 h-6 text-gray-600" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="p-4 lg:p-8">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="models" element={<ModelListPage />} />
            <Route path="models/new" element={<ModelFormPage />} />
            <Route path="models/:id" element={<ModelFormPage />} />
            <Route path="models/:id/edit" element={<ModelFormPage />} />
            <Route path="news-search" element={<NewsSearchPage />} />
            <Route path="image-search" element={<ImageSearchPage />} />
            <Route path="profile-export" element={<ProfileExportPage />} />
            <Route path="sns-analytics" element={<SNSAnalyticsPage />} />
            <Route path="casting" element={<CastingPage />} />
            <Route path="clients" element={<ClientPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="contracts" element={<ContractPage />} />
            <Route path="settlements" element={<SettlementPage />} />
            <Route path="share" element={<PlaceholderPage title="외부 공유" />} />
            <Route path="admins" element={<AdminManagementPage />} />
            <Route path="settings" element={<PlaceholderPage title="시스템 설정" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
