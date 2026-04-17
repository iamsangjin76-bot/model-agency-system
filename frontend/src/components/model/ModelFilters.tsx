import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { ModelType, MODEL_TYPE_LABELS } from '@/types/model';

interface Props {
  searchQuery: string;
  filterType: ModelType | 'all';
  genderFilter: string;
  ageRange: string;
  sortBy: string;
  sortOrder: string;
  onSearch: (v: string) => void;
  onTypeChange: (v: ModelType | 'all') => void;
  onGenderChange: (v: string) => void;
  onAgeRangeChange: (v: string) => void;
  onSortByChange: (v: string) => void;
  onSortOrderChange: (v: string) => void;
  onRefresh: () => void;
}

const selectClass =
  'px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all';

export default function ModelFilters({
  searchQuery, filterType, genderFilter, ageRange, sortBy, sortOrder,
  onSearch, onTypeChange, onGenderChange, onAgeRangeChange, onSortByChange, onSortOrderChange, onRefresh,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="이름, 영문명, 키워드, 특기로 검색..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* Model type tab buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onTypeChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            전체
          </button>
          {Object.entries(MODEL_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => onTypeChange(type as ModelType)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === type ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Gender filter */}
        <select value={genderFilter} onChange={e => onGenderChange(e.target.value)} className={selectClass}>
          <option value="all">모든 성별</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
          <option value="other">기타</option>
        </select>

        {/* Age range filter */}
        <select value={ageRange} onChange={e => onAgeRangeChange(e.target.value)} className={selectClass}>
          <option value="all">모든 나이</option>
          <option value="10대">10대</option>
          <option value="20대">20대</option>
          <option value="30대">30대</option>
          <option value="40대">40대</option>
          <option value="50대 이상">50대 이상</option>
        </select>

        {/* Sort controls */}
        <select value={sortBy} onChange={e => onSortByChange(e.target.value)} className={selectClass}>
          <option value="created_at">등록일</option>
          <option value="name">이름</option>
          <option value="height">키</option>
        </select>
        <select value={sortOrder} onChange={e => onSortOrderChange(e.target.value)} className={selectClass}>
          <option value="desc">내림차순</option>
          <option value="asc">오름차순</option>
        </select>

        {/* Refresh button */}
        <button onClick={onRefresh} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" title="새로고침">
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
