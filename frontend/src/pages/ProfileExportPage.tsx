import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Loader2,
  ChevronDown,
  User,
  Users,
  Globe,
  Star,
  Check,
  FileImage,
  File,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Model, ModelType, MODEL_TYPE_LABELS, MODEL_TYPE_COLORS } from '@/types/model';
import { useToast } from '@/contexts/ToastContext';

// 템플릿 타입
interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  modelType: ModelType;
  icon: React.ElementType;
  pages: number;
  preview: string;
}

// 사용 가능한 템플릿
const templates: ProfileTemplate[] = [
  {
    id: 'new-model',
    name: '신인 모델',
    description: '기본 프로필 정보와 경력을 담은 1~2페이지 템플릿',
    modelType: ModelType.NEW_MODEL,
    icon: User,
    pages: 2,
    preview: '/templates/new-model-preview.png',
  },
  {
    id: 'influencer',
    name: '인플루언서',
    description: 'SNS 정보와 팔로워 데이터가 포함된 3~4페이지 템플릿',
    modelType: ModelType.INFLUENCER,
    icon: Sparkles,
    pages: 2,
    preview: '/templates/influencer-preview.png',
  },
  {
    id: 'foreign-model',
    name: '외국인 모델',
    description: '신체 사이즈와 입출국 정보가 포함된 5~6페이지 템플릿',
    modelType: ModelType.FOREIGN_MODEL,
    icon: Globe,
    pages: 2,
    preview: '/templates/foreign-preview.png',
  },
  {
    id: 'celebrity',
    name: '연예인',
    description: '모델료, 현재 작품, 관련 기사가 포함된 7~9페이지 템플릿',
    modelType: ModelType.CELEBRITY,
    icon: Star,
    pages: 3,
    preview: '/templates/celebrity-preview.png',
  },
];

// 더미 모델 데이터
const dummyModels: Model[] = [
  {
    id: 1,
    name: '한서주',
    nameEnglish: 'Han Seoju',
    birthDate: '1998-03-15',
    modelType: ModelType.NEW_MODEL,
    height: 163,
    instagramId: '@seojujuu',
    instagramFollowers: 125000,
    profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    careerBroadcast: '2024 애기씨 부군간택뎐',
    careerCommercial: '2022 코스메틱 삐야',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
    hasAgency: true,
    hasManager: true,
  },
  {
    id: 2,
    name: '박제니',
    nameEnglish: 'Park Jenny',
    birthDate: '2006-01-10',
    modelType: ModelType.INFLUENCER,
    height: 174,
    shoeSize: 240,
    instagramId: '@jennierubyjane',
    instagramFollowers: 8500000,
    profileImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
    isActive: true,
    createdAt: '2023-08-20',
    updatedAt: '2024-12-05',
    hasAgency: true,
    hasManager: true,
  },
  {
    id: 3,
    name: '프레데리카',
    nameEnglish: 'Frederika',
    birthDate: '1995-05-18',
    modelType: ModelType.FOREIGN_MODEL,
    height: 174,
    bust: 82,
    waist: 59,
    hip: 88,
    shoeSize: 250,
    nationality: '슬로바키아',
    careerYears: 11,
    entryDate: '2024-07-26',
    departureDate: '2024-10-23',
    profileImageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200',
    isActive: true,
    createdAt: '2024-07-26',
    updatedAt: '2024-10-01',
    hasAgency: true,
    hasManager: false,
  },
  {
    id: 4,
    name: '소지섭',
    nameEnglish: 'So Ji-sub',
    birthDate: '1977-11-04',
    modelType: ModelType.CELEBRITY,
    height: 181,
    instagramId: '@soganzi_51',
    instagramFollowers: 1200000,
    modelFee6month: 400000000,
    modelFee1year: 700000000,
    careerBroadcast: '2025 광장, 2022 닥터로이어',
    careerMovie: '2024 외계+인 2부, 2022 자백',
    currentWorks: '드라마 김부장 (공개예정)',
    currentAds: '한국여행엑스포 홍보대사, 랑방블랑',
    profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    isActive: true,
    createdAt: '2020-05-01',
    updatedAt: '2024-11-30',
    hasAgency: true,
    hasManager: true,
  },
];

// 금액 포맷
const formatMoney = (amount?: number) => {
  if (!amount) return '-';
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(0)}억`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
};

// 숫자 포맷
const formatNumber = (num?: number) => {
  if (!num) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function ProfileExportPage() {
  const { toast } = useToast();
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProfileTemplate | null>(null);
  const [exportFormat, setExportFormat] = useState<'ppt' | 'pdf'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filterType, setFilterType] = useState<ModelType | 'all'>('all');

  // 필터링된 모델 목록
  const filteredModels = dummyModels.filter(model => 
    filterType === 'all' || model.modelType === filterType
  );

  // 모델 선택/해제
  const toggleModelSelect = (modelId: number) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedModels.length === filteredModels.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels(filteredModels.map(m => m.id));
    }
  };

  // 프로필 생성
  const handleGenerate = async () => {
    if (selectedModels.length === 0) {
      toast.warning('모델을 선택해주세요.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // TODO: 실제 PPT/PDF 생성 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 다운로드 시뮬레이션
      const selectedModelNames = dummyModels
        .filter(m => selectedModels.includes(m.id))
        .map(m => m.name)
        .join(', ');
      
      toast.success(`${selectedModelNames} 프로필이 ${exportFormat.toUpperCase()} 형식으로 생성되었습니다.`);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('프로필 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 선택된 모델 가져오기
  const getSelectedModelData = () => {
    return dummyModels.filter(m => selectedModels.includes(m.id));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">프로필 다운로드</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">모델 프로필을 PPT 또는 PDF로 내보내기</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 모델 선택 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 필터 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">유형:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                전체
              </button>
              {Object.entries(MODEL_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as ModelType)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
</div>
          </div>

          {/* 모델 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedModels.length === filteredModels.length && filteredModels.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedModels.length}개 선택됨
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredModels.map((model) => {
                const isSelected = selectedModels.includes(model.id);
                const template = templates.find(t => t.modelType === model.modelType);
                
                return (
                  <div
                    key={model.id}
                    onClick={() => toggleModelSelect(model.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleModelSelect(model.id)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600"
                        onClick={e => e.stopPropagation()}
                      />
                      
                      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                        {model.profileImageUrl ? (
                          <img
                            src={model.profileImageUrl}
                            alt={model.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{model.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${MODEL_TYPE_COLORS[model.modelType]}`}>
                            {MODEL_TYPE_LABELS[model.modelType]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {model.height}cm
                          {model.modelType === ModelType.CELEBRITY && model.modelFee1year && 
                            ` • 연 ${formatMoney(model.modelFee1year)}`
                          }
                          {model.instagramFollowers && 
                            ` • ${formatNumber(model.instagramFollowers)} followers`
                          }
                        </p>
                      </div>
                      
                      <div className="text-right text-sm text-gray-400 dark:text-gray-500">
                        <p>템플릿: {template?.name}</p>
                        <p>{template?.pages}페이지</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 오른쪽: 설정 및 미리보기 */}
        <div className="space-y-6">
          {/* 내보내기 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              내보내기 설정
            </h3>
            
            {/* 형식 선택 */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">파일 형식</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    exportFormat === 'pdf'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className={`w-8 h-8 ${exportFormat === 'pdf' ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className={`font-medium ${exportFormat === 'pdf' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-300'}`}>PDF</span>
                </button>
                <button
                  onClick={() => setExportFormat('ppt')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    exportFormat === 'ppt'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileImage className={`w-8 h-8 ${exportFormat === 'ppt' ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className={`font-medium ${exportFormat === 'ppt' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-300'}`}>PPT</span>
                </button>
              </div>
            </div>

            {/* 선택된 모델 요약 */}
            {selectedModels.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">선택된 모델</p>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {getSelectedModelData().map(model => (
                    <div key={model.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 overflow-hidden">
                        {model.profileImageUrl && (
                          <img src={model.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-gray-800 dark:text-gray-100">{model.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">({MODEL_TYPE_LABELS[model.modelType]})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 다운로드 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedModels.length === 0}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  {exportFormat.toUpperCase()} 다운로드 ({selectedModels.length})
                </>
              )}
            </button>
          </div>

          {/* 템플릿 안내 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">템플릿 안내</h3>
            <div className="space-y-4">
              {templates.map(template => {
                const Icon = template.icon;
                return (
                  <div key={template.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${MODEL_TYPE_COLORS[template.modelType]} bg-opacity-20`}>
                      <Icon className={`w-4 h-4 ${MODEL_TYPE_COLORS[template.modelType].replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 선택 안내 */}
      {selectedModels.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">모델을 선택해주세요</p>
            <p className="text-sm text-blue-600 mt-1">
              프로필을 내보낼 모델을 선택하면 각 모델 유형에 맞는 템플릿으로 자동 생성됩니다.
              여러 모델을 선택하면 한 번에 모든 프로필이 포함된 파일이 생성됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
