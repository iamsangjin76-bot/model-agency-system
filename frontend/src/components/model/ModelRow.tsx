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

export default function ModelRow({ model, selected, onToggle, onDelete }: Props) {
  const typeKey = model.model_type as ModelType;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="col-span-1 flex items-center">
        <input type="checkbox" checked={selected} onChange={() => onToggle(model.id)} className="w-4 h-4 rounded border-gray-300" />
      </div>
      <div className="col-span-3 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
          {model.profile_image ? (
            <img src={model.profile_image} alt={model.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400"><Users className="w-6 h-6" /></div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{model.name}</h3>
          <p className="text-sm text-gray-500">{model.name_english || '-'}</p>
        </div>
      </div>
      <div className="col-span-2 flex items-center">
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${MODEL_TYPE_COLORS[typeKey] || 'bg-gray-500'}`}>
          {MODEL_TYPE_LABELS[typeKey] || model.model_type}
        </span>
      </div>
      <div className="col-span-2 flex items-center">
        <p className="text-sm text-gray-800">{model.height ? `${model.height}cm` : '-'}</p>
      </div>
      <div className="col-span-2 flex items-center">
        {model.instagram_followers ? (
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            <p className="text-xs text-gray-500">{formatNumber(model.instagram_followers)} followers</p>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </div>
      <div className="col-span-2 flex items-center justify-end gap-2">
        <Link to={`/dashboard/models/${model.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="보기">
          <Eye className="w-5 h-5" />
        </Link>
        <Link to={`/dashboard/models/${model.id}/edit`} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="수정">
          <Edit className="w-5 h-5" />
        </Link>
        <button onClick={() => onDelete(model.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="삭제">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
