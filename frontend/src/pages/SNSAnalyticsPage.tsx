import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Instagram,
  Youtube,
  Globe,
  ChevronDown,
  RefreshCw,
  Loader2,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import { Model, ModelType, MODEL_TYPE_LABELS } from '@/types/model';

// 더미 모델 데이터
const dummyModels: Partial<Model>[] = [
  { id: 1, name: '한서주', modelType: ModelType.NEW_MODEL, instagramId: '@seojujuu', instagramFollowers: 125000 },
  { id: 2, name: '박제니', modelType: ModelType.INFLUENCER, instagramId: '@jennierubyjane', instagramFollowers: 8500000 },
  { id: 3, name: '소지섭', modelType: ModelType.CELEBRITY, instagramId: '@soganzi_51', instagramFollowers: 1200000 },
  { id: 4, name: '윤하영', modelType: ModelType.NEW_MODEL, instagramId: '@xayyoon', instagramFollowers: 89000 },
];

// 국가별 팔로워 데이터
const followersByCountry = [
  { country: '한국', value: 59.3, color: '#8b5cf6' },
  { country: '미국', value: 16.5, color: '#3b82f6' },
  { country: '인도네시아', value: 4.5, color: '#10b981' },
  { country: '캐나다', value: 1.8, color: '#f59e0b' },
  { country: '태국', value: 1.6, color: '#ef4444' },
  { country: '기타', value: 16.3, color: '#6b7280' },
];

// 연령별 팔로워 데이터
const followersByAge = [
  { age: '13-17', male: 8.2, female: 12.5 },
  { age: '18-24', male: 15.3, female: 20.9 },
  { age: '25-34', male: 12.1, female: 17.6 },
  { age: '35-44', male: 5.2, female: 8.2 },
];

// 관심도 트렌드 데이터
const trendData = [
  { date: '12월 1주', value: 45 },
  { date: '12월 2주', value: 52 },
  { date: '12월 3주', value: 78 },
  { date: '12월 4주', value: 65 },
  { date: '1월 1주', value: 89 },
  { date: '1월 2주', value: 95 },
  { date: '1월 3주', value: 72 },
  { date: '1월 4주', value: 85 },
  { date: '2월 1주', value: 100 },
];

// 국가별 검색량 데이터
const searchByCountry = [
  { country: '한국', value: 100 },
  { country: '인도네시아', value: 45 },
  { country: '미얀마', value: 38 },
  { country: '대만', value: 32 },
  { country: '홍콩', value: 28 },
  { country: '베트남', value: 22 },
];

// 숫자 포맷
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SNSAnalyticsPage() {
  const [selectedModel, setSelectedModel] = useState<Partial<Model> | null>(dummyModels[1]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 데이터 새로고침
  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  // 모델 선택
  const handleModelSelect = (model: Partial<Model>) => {
    setSelectedModel(model);
    setShowModelDropdown(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SNS 분석</h1>
          <p className="text-gray-500 mt-1">모델의 SNS 데이터와 인기도를 분석합니다</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 모델 선택 */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-colors min-w-[200px]"
            >
              <span className="font-medium text-gray-800">{selectedModel?.name || '모델 선택'}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                {dummyModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{model.name}</span>
                    <span className="text-sm text-gray-400">{formatNumber(model.instagramFollowers || 0)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 새로고침 */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {selectedModel ? (
        <>
          {/* 상단 KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Instagram className="w-5 h-5 text-pink-600" />
                </div>
                <span className="text-sm text-gray-500">팔로워</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(selectedModel.instagramFollowers || 0)}</p>
              <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                <ArrowUp className="w-4 h-4" />
                <span>12.5% 이번 달</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">평균 조회수</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">991.9K</p>
              <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                <ArrowUp className="w-4 h-4" />
                <span>8.3% 이번 달</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm text-gray-500">평균 좋아요</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">245.3K</p>
              <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                <ArrowDown className="w-4 h-4" />
                <span>2.1% 이번 달</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">참여율</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">3.2%</p>
              <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                <ArrowUp className="w-4 h-4" />
                <span>0.5% 이번 달</span>
              </div>
            </div>
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 국가별 팔로워 분포 - 도넛 차트 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                국가별 팔로워 분포
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={followersByCountry}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {followersByCountry.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {followersByCountry.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.country}</span>
                    <span className="text-gray-800 font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 국가별 검색량 - 막대 차트 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                국가별 검색량 (최근 90일)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={searchByCountry} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="country" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 연령/성별 분포 - 막대 차트 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                팔로워 연령 및 성별 분포
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={followersByAge}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="female" name="여성" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="male" name="남성" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-gray-600">여성 65.4%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600">남성 34.6%</span>
                </div>
              </div>
            </div>

            {/* 최근 관심도 추이 - 영역 차트 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                최근 관심도 추이
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 상업적 가치 카드 */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">예상 광고 모델료</h3>
                <p className="text-white/80 text-sm">SNS 영향력 기반 추정 가치</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-sm text-white/80">6개월</p>
                  <p className="text-3xl font-bold">4억</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/80">1년</p>
                  <p className="text-3xl font-bold">7억</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">모델을 선택해주세요</h3>
          <p className="text-gray-500">
            상단에서 모델을 선택하면 해당 모델의 SNS 데이터와 분석 결과를 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
