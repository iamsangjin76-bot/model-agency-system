/**
 * Model selection list component for the ProfileExportPage.
 * Renders a filterable, checkable list of models with profile thumbnails.
 */

import React from 'react';
import { FileText, User, CheckSquare, Square } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { MODEL_TYPE_LABELS, MODEL_TYPE_COLORS } from './TemplatePreviewSvgs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModelListItem {
  id: number;
  name: string;
  model_type?: string;
  gender?: string;
  height?: number;
  instagram_followers?: number;
  profile_image?: string;
  is_active?: boolean;
}

interface ModelSelectListProps {
  models: ModelListItem[];
  selected: Set<number>;
  isLoading: boolean;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtNum(n?: number | null): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModelSelectList({
  models,
  selected,
  isLoading,
  onToggle,
  onToggleAll,
}: ModelSelectListProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* List header */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={models.length > 0 && selected.size === models.length}
            onChange={onToggleAll}
            className="w-4 h-4 rounded border-gray-300 text-purple-600"
          />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
        </label>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {isLoading ? '로딩 중...' : `${models.length}명 / ${selected.size}명 선택`}
        </span>
      </div>

      {/* List body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
      ) : models.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">해당 조건의 모델이 없습니다</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {models.map(model => {
            const isSel = selected.has(model.id);
            const followers = fmtNum(model.instagram_followers);
            return (
              <div
                key={model.id}
                onClick={() => onToggle(model.id)}
                className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors ${
                  isSel ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="shrink-0 text-purple-600">
                  {isSel
                    ? <CheckSquare className="w-5 h-5" />
                    : <Square className="w-5 h-5 text-gray-300 dark:text-gray-600" />}
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
                  {model.profile_image
                    ? <img src={model.profile_image} alt={model.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <User className="w-5 h-5" />
                      </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{model.name}</span>
                    {model.model_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODEL_TYPE_COLORS[model.model_type] || 'bg-gray-100 text-gray-600'}`}>
                        {MODEL_TYPE_LABELS[model.model_type] || model.model_type}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-2">
                    {model.height && <span>키 {model.height}cm</span>}
                    {model.height && followers && <span>·</span>}
                    {followers && <span>팔로워 {followers}</span>}
                  </div>
                </div>
                {model.gender && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {model.gender === 'female' ? '여성' : model.gender === 'male' ? '남성' : '기타'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
