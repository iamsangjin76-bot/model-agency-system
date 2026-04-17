import React, { useState } from 'react';
import { castingsAPI } from '@/services/api';
import { X, Sparkles } from 'lucide-react';

// Casting type definitions (self-contained — no shared module import)
type CastingType = 'cf' | 'magazine' | 'event' | 'show' | 'drama' | 'movie' | 'other';

const CASTING_TYPES: Record<CastingType, { label: string; color: string }> = {
  cf: { label: 'CF/광고', color: 'bg-red-500' },
  magazine: { label: '매거진/화보', color: 'bg-pink-500' },
  event: { label: '이벤트', color: 'bg-orange-500' },
  show: { label: '패션쇼', color: 'bg-purple-500' },
  drama: { label: '드라마', color: 'bg-blue-500' },
  movie: { label: '영화', color: 'bg-green-500' },
  other: { label: '기타', color: 'bg-gray-500' },
};

interface Props {
  mode: 'create' | 'edit';
  initial?: {
    id?: number;
    title?: string;
    type?: string;
    budget?: number;
    description?: string;
    shoot_date?: string;
    deadline?: string;
    location?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CastingFormModal({ mode, initial, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    type: initial?.type ?? 'cf',
    budget: initial?.budget != null ? String(initial.budget) : '',
    description: initial?.description ?? '',
    shoot_date: initial?.shoot_date ?? '',
    deadline: initial?.deadline ?? '',
    location: initial?.location ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        budget: form.budget ? Number(form.budget) : undefined,
        description: form.description || undefined,
        shoot_date: form.shoot_date || undefined,
        deadline: form.deadline || undefined,
        location: form.location || undefined,
      };

      if (mode === 'edit' && initial?.id != null) {
        await castingsAPI.update(initial.id, payload);
      } else {
        await castingsAPI.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || (mode === 'edit' ? '수정에 실패했습니다.' : '등록에 실패했습니다.'));
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {mode === 'edit' ? '캐스팅 수정' : '새 캐스팅 등록'}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'edit' ? '캐스팅 정보를 수정합니다' : '새로운 캐스팅 요청을 등록합니다'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">캐스팅 제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="예: 삼성전자 갤럭시 광고 모델"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">캐스팅 유형</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className={inputCls}
              >
                {Object.entries(CASTING_TYPES).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예산 (원)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                placeholder="50000000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">촬영 예정일</label>
              <input
                type="date"
                value={form.shoot_date}
                onChange={e => setForm(p => ({ ...p, shoot_date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">촬영 장소</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="서울 강남구 삼성동"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="캐스팅에 대한 상세 설명을 입력하세요"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSaving ? (mode === 'edit' ? '수정 중...' : '등록 중...') : (mode === 'edit' ? '수정하기' : '등록하기')}
          </button>
        </div>
      </div>
    </div>
  );
}
