import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Users, Instagram } from 'lucide-react';
import { ModelType, MODEL_TYPE_LABELS, MODEL_TYPE_COLORS } from '@/types/model';

export interface ModelItem {
  id: number;
  name: string;
  name_english?: string;
  model_type: string;
  gender?: string;
  height?: number;
  instagram_followers?: number;
  profile_image?: string;
  is_active: boolean;
  created_at: string;
}

function formatNumber(num?: number) {
  if (!num) return '-';
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

interface Props {
  model: ModelItem;
  selected: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const GENDER_LABELS: Record<string, string> = { male: '남성', female: '여성', other: '기타' };

export default function ModelRow({ model, selected, onToggle, onDelete }: Props) {
  const typeKey = model.model_type as ModelType;
  const typeBadge = (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${MODEL_TYPE_COLORS[typeKey] || 'bg-gray-500'}`}>
      {MODEL_TYPE_LABELS[typeKey] || model.model_type}
    </span>
  );

  const profileImg = (size: string) => (
    <div className={`${size} rounded-xl bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0`}>
      {model.profile_image ? (
        <img src={model.profile_image} alt={model.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
          <Users className="w-5 h-5" />
        </div>
      )}
    </div>
  );

  const actionButtons = (
    <>
      <Link
        to={`/dashboard/models/${model.id}`}
        className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="보기"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <Link
        to={`/dashboard/models/${model.id}/edit`}
        className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="수정"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button
        onClick={() => onDelete(model.id)}
        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="삭제"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <>
      {/* ── Card view: below lg ───────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(model.id)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 flex-shrink-0"
        />

        {profileImg('w-11 h-11')}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{model.name}</h3>
            {typeBadge}
          </div>
          {model.name_english && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{model.name_english}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
            {model.gender && <span>{GENDER_LABELS[model.gender] ?? model.gender}</span>}
            {model.height && <span>{model.height}cm</span>}
            {model.instagram_followers && (
              <span className="flex items-center gap-1">
                <Instagram className="w-3 h-3 text-pink-400" />
                {formatNumber(model.instagram_followers)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {actionButtons}
        </div>
      </div>

      {/* ── Table row: lg and above ───────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(model.id)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
          />
        </div>
        <div className="col-span-3 flex items-center gap-4">
          {profileImg('w-12 h-12')}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{model.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{model.name_english || '-'}</p>
          </div>
        </div>
        <div className="col-span-2 flex items-center">{typeBadge}</div>
        <div className="col-span-2 flex items-center">
          <p className="text-sm text-gray-800 dark:text-gray-100">{model.height ? `${model.height}cm` : '-'}</p>
        </div>
        <div className="col-span-2 flex items-center">
          {model.instagram_followers ? (
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(model.instagram_followers)} followers</p>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
          )}
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2">
          <Link
            to={`/dashboard/models/${model.id}`}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="보기"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <Link
            to={`/dashboard/models/${model.id}/edit`}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="수정"
          >
            <Edit className="w-5 h-5" />
          </Link>
          <button
            onClick={() => onDelete(model.id)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
