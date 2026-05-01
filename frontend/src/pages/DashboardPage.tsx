import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { ROLE_LABELS, ROLE_COLORS, AdminRole } from '@/types/auth';
import NotificationBell from '@/components/notification/NotificationBell';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import ModelListPage from './ModelListPage';
import ModelFormPage from './ModelFormPage';
import ModelDetailPage from './ModelDetailPage';
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
import SystemSettingsPage from './SystemSettingsPage';
import ExternalSharePage from './ExternalSharePage';
import NotFoundPage from './NotFoundPage';
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

// Sidebar menu items
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

// Placeholder page for unimplemented routes
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400">이 페이지는 개발 중입니다.</p>
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

  // Filter menu based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission, 'read');
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300
          ${sidebarOpen ? 'w-64 xl:w-72' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-700 ${sidebarOpen ? 'justify-between px-4' : 'justify-center'}`}>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800 dark:text-gray-100">MODEL AGENCY</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Management System</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 dark:text-gray-300" />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center rounded-xl transition-all
                  ${sidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center py-3'}
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar toggle (desktop) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-4 top-20 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-shadow"
        >
          <ChevronDown className={`w-4 h-4 dark:text-gray-300 transition-transform ${sidebarOpen ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64 xl:ml-72' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu className="w-5 h-5 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {filteredMenuItems.find(item => item.path === location.pathname)?.label || '대시보드'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{admin?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[admin?.role as AdminRole]}</p>
              </div>
              <div className="relative group">
                <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <UserCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="models" element={<ModelListPage />} />
            <Route path="models/new" element={<ModelFormPage />} />
            <Route path="models/:id" element={<ModelDetailPage />} />
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
            <Route path="share" element={<ExternalSharePage />} />
            <Route path="admins" element={<AdminManagementPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
