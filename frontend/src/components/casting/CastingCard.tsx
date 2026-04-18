import React from 'react';
import { Calendar, DollarSign, MapPin, AlertCircle, FileText, ArrowRight, CheckCircle2, XCircle, Users } from 'lucide-react';

type CastingStatus = 'request' | 'reviewing' | 'matching' | 'proposed' | 'confirmed' | 'completed' | 'cancelled';
type CastingType = 'cf' | 'magazine' | 'event' | 'show' | 'drama' | 'movie' | 'other';

const STATUS_CONFIG: Record<CastingStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  request: { label: '요청접수', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: FileText },
  reviewing: { label: '검토중', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle },
  matching: { label: '모델매칭', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Users },
  proposed: { label: '제안완료', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: ArrowRight },
  confirmed: { label: '확정', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  completed: { label: '완료', color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', icon: CheckCircle2 },
  cancelled: { label: '취소', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

const CASTING_TYPES: Record<CastingType, { label: string; color: string }> = {
  cf: { label: 'CF/광고', color: 'bg-red-500' },
  magazine: { label: '매거진/화보', color: 'bg-pink-500' },
  event: { label: '이벤트', color: 'bg-orange-500' },
  show: { label: '패션쇼', color: 'bg-purple-500' },
  drama: { label: '드라마', color: 'bg-blue-500' },
  movie: { label: '영화', color: 'bg-green-500' },
  other: { label: '기타', color: 'bg-gray-500' },
};

interface CastingItem {
  id: number;
  title: string;
  type: CastingType;
  status: CastingStatus;
  budget?: number;
  shoot_date?: string;
  location?: string;
  deadline?: string;
  proposed_models?: { id: number; name?: string; status: string }[];
}

interface Props {
  casting: CastingItem;
  onClick: () => void;
}

export default function CastingCard({ casting, onClick }: Props) {
  const statusConfig = STATUS_CONFIG[casting.status] || STATUS_CONFIG.request;
  const typeConfig = CASTING_TYPES[casting.type] || CASTING_TYPES.other;
  const StatusIcon = statusConfig.icon;
  const proposed = casting.proposed_models || [];
  const isOverdue =
    !!casting.deadline &&
    new Date(casting.deadline) < new Date() &&
    casting.status !== 'completed' &&
    casting.status !== 'cancelled';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3 inline mr-1" />
              {statusConfig.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 transition-colors line-clamp-2">
            {casting.title}
          </h3>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
        {casting.shoot_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>촬영일: {casting.shoot_date}</span>
          </div>
        )}
        {casting.budget && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>{casting.budget.toLocaleString()}원</span>
          </div>
        )}
        {casting.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="line-clamp-1">{casting.location}</span>
          </div>
        )}
      </div>

      {proposed.length > 0 && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">제안 모델:</span>
          <div className="flex -space-x-2">
            {proposed.slice(0, 3).map((model, idx) => (
              <div key={idx} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                {String(model.id)}
              </div>
            ))}
            {proposed.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium">
                +{proposed.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="mt-4 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          마감일이 지났습니다
        </div>
      )}
    </div>
  );
}
