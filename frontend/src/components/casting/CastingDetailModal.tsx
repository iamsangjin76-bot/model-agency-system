import React from 'react';
import { castingsAPI } from '@/services/api';
import { X, CheckCircle2, AlertCircle, Users, FileText, ArrowRight, XCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

// Status and type definitions (self-contained — no shared module import)
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
  client_id?: number;
  budget?: number;
  shoot_date?: string;
  location?: string;
  description?: string;
  requirements?: string[];
  proposed_models?: { id: number; name?: string; status: string }[];
  created_at: string;
  deadline?: string;
}

interface Props {
  casting: CastingItem;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CastingDetailModal({ casting, onClose, onEdit, onDelete }: Props) {
  const { toast } = useToast();
  const typeConfig = CASTING_TYPES[casting.type] || CASTING_TYPES.other;
  const statusConfig = STATUS_CONFIG[casting.status] || STATUS_CONFIG.request;
  const StatusIcon = statusConfig.icon;

  const handleDelete = async () => {
    const confirmed = window.confirm('이 캐스팅을 삭제하시겠습니까?');
    if (!confirmed) return;
    try {
      await castingsAPI.delete(casting.id);
      onDelete();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3 inline mr-1" />
                {statusConfig.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{casting.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
          {casting.description && (
            <div>
              <h3 className="font-semibold mb-2 dark:text-gray-100">설명</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{casting.description}</p>
            </div>
          )}
          {casting.requirements && casting.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 dark:text-gray-100">요구사항</h3>
              <ul className="space-y-1">
                {casting.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {casting.shoot_date && (
              <div><span className="text-gray-500 dark:text-gray-400">촬영일:</span> {casting.shoot_date}</div>
            )}
            {casting.deadline && (
              <div><span className="text-gray-500 dark:text-gray-400">마감일:</span> {casting.deadline}</div>
            )}
            {casting.budget && (
              <div><span className="text-gray-500 dark:text-gray-400">예산:</span> {casting.budget.toLocaleString()}원</div>
            )}
            {casting.location && (
              <div><span className="text-gray-500 dark:text-gray-400">장소:</span> {casting.location}</div>
            )}
          </div>
          {casting.proposed_models && casting.proposed_models.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 dark:text-gray-100">제안 모델 ({casting.proposed_models.length}명)</h3>
              <div className="flex -space-x-2">
                {casting.proposed_models.slice(0, 5).map((model, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                  >
                    {String(model.id)}
                  </div>
                ))}
                {casting.proposed_models.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium">
                    +{casting.proposed_models.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: close (left) | edit (middle, purple) | delete (right, red outline) */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            닫기
          </button>
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
