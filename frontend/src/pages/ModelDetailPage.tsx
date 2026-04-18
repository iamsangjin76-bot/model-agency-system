import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { modelsAPI } from '@/services/api';
import { ArrowLeft, Edit, Trash2, User } from 'lucide-react';
import ModelInfoSections from '@/components/model-detail/ModelInfoSections';

const MODEL_TYPE_LABELS: Record<string, string> = {
  new_model: '신인 모델',
  influencer: '인플루언서',
  foreign_model: '외국인 모델',
  celebrity: '연예인',
};

const MODEL_TYPE_COLORS: Record<string, string> = {
  new_model: 'bg-blue-500',
  influencer: 'bg-purple-500',
  foreign_model: 'bg-green-500',
  celebrity: 'bg-red-500',
};

const GENDER_LABELS: Record<string, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
};

// Calculate age from a YYYY-MM-DD birth date string
function calcAge(birthDate?: string): string {
  if (!birthDate) return '-';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return `${age}세`;
}

export default function ModelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    modelsAPI.get(Number(id))
      .then((res: unknown) => setData(res))
      .catch((err: Error) => setError(err.message || '모델 정보를 불러오는데 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('이 모델을 삭제하시겠습니까?')) return;
    try {
      await modelsAPI.delete(Number(id));
      navigate('/dashboard/models');
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error || '모델을 찾을 수 없습니다.'}</p>
        <Link to="/dashboard/models" className="mt-4 inline-block text-purple-600 underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const typeColor = MODEL_TYPE_COLORS[data.model_type] || 'bg-gray-500';
  const typeLabel = MODEL_TYPE_LABELS[data.model_type] || data.model_type;

  return (
    <div className="space-y-6">
      {/* Header: breadcrumb + action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/models"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Models &rsaquo; {data.name}</p>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{data.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/dashboard/models/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all text-sm"
          >
            <Edit className="w-4 h-4" />
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
      </div>

      {/* Hero section: profile image + core stats */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex gap-6">
          {/* Profile image */}
          <div className="flex-shrink-0 w-48">
            <div className="w-48 h-64 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden relative">
              {data.profile_image ? (
                <img src={data.profile_image} alt={data.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <User className="w-16 h-16 mb-2" />
                  <p className="text-sm">이미지 없음</p>
                </div>
              )}
            </div>
            {/* Active status badge below image */}
            <div className="mt-2 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${data.is_active ? 'bg-green-500' : 'bg-gray-400'}`}>
                {data.is_active ? '활성' : '비활성'}
              </span>
            </div>
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.name}</h2>
                {data.name_english && (
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">{data.name_english}</p>
                )}
              </div>
              <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium text-white flex-shrink-0 ${typeColor}`}>
                {typeLabel}
              </span>
            </div>

            {/* Gender, birth, age */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              {data.gender && <span>{GENDER_LABELS[data.gender] || data.gender}</span>}
              {data.birth_date && <span>{data.birth_date}</span>}
              {data.birth_date && <span>{calcAge(data.birth_date)}</span>}
            </div>

            {/* Body measurements */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {data.height && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">키</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{data.height}<span className="text-xs font-normal ml-0.5">cm</span></p>
                </div>
              )}
              {data.weight && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">체중</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{data.weight}<span className="text-xs font-normal ml-0.5">kg</span></p>
                </div>
              )}
              {data.shoe_size && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">신발</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{data.shoe_size}<span className="text-xs font-normal ml-0.5">mm</span></p>
                </div>
              )}
              {(data.bust || data.waist || data.hip) && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">쓰리사이즈</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                    {[data.bust, data.waist, data.hip].map((v) => v ?? '-').join(' / ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All detail sections */}
      <ModelInfoSections data={data} />
    </div>
  );
}
