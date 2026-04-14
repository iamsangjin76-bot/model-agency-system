import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { modelsAPI, filesAPI } from '@/services/api';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Building2,
  Briefcase,
  Globe,
  Instagram,
  Youtube,
  Camera,
  Upload,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { Model, ModelType, Gender, MODEL_TYPE_LABELS, GENDER_LABELS } from '@/types/model';

// 초기 폼 데이터
const initialFormData: Partial<Model> = {
  name: '',
  nameEnglish: '',
  birthDate: '',
  gender: Gender.FEMALE,
  modelType: ModelType.NEW_MODEL,
  height: undefined,
  weight: undefined,
  bust: undefined,
  waist: undefined,
  hip: undefined,
  shoeSize: undefined,
  agencyName: '',
  agencyPhone: '',
  agencyFax: '',
  hasAgency: false,
  hasManager: false,
  contact1: '',
  contact2: '',
  contact3: '',
  contact4: '',
  personalContact: '',
  homePhone: '',
  contactNote: '',
  school: '',
  debut: '',
  hobby: '',
  nationality: '대한민국',
  passportNo: '',
  visaType: '',
  languages: '',
  careerYears: undefined,
  entryDate: '',
  departureDate: '',
  careerBroadcast: '',
  careerMovie: '',
  careerCommercial: '',
  careerPrintAd: '',
  careerTheater: '',
  careerAlbum: '',
  careerMusical: '',
  careerFashionShow: '',
  careerMusicVideo: '',
  careerOther: '',
  modelFee6month: undefined,
  modelFee1year: undefined,
  currentWorks: '',
  currentAds: '',
  instagramId: '',
  instagramFollowers: undefined,
  youtubeId: '',
  youtubeSubscribers: undefined,
  tiktokId: '',
  tiktokFollowers: undefined,
  keywords: '',
  memo: '',
  isActive: true,
};

// 섹션 컴포넌트
function FormSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// 입력 필드 컴포넌트
function FormField({ 
  label, 
  children, 
  required = false,
  className = ''
}: { 
  label: string; 
  children: React.ReactNode; 
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ModelFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState<Partial<Model>>(initialFormData);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      setIsLoadingModel(true);
      setLoadError(null);
      modelsAPI.get(Number(id))
        .then((data: any) => {
          // API 응답(snake_case)을 폼 데이터(camelCase)로 변환
          setFormData({
            name: data.name || '',
            nameEnglish: data.name_english || '',
            birthDate: data.birth_date || '',
            gender: data.gender as Gender,
            modelType: (data.model_type as ModelType) || ModelType.NEW_MODEL,
            height: data.height,
            weight: data.weight,
            bust: data.bust,
            waist: data.waist,
            hip: data.hip,
            shoeSize: data.shoe_size,
            agencyName: data.agency_name || '',
            agencyPhone: data.agency_phone || '',
            agencyFax: data.agency_fax || '',
            hasAgency: data.has_agency || false,
            hasManager: data.has_manager || false,
            contact1: data.contact1 || '',
            contact2: data.contact2 || '',
            contact3: data.contact3 || '',
            contact4: data.contact4 || '',
            personalContact: data.personal_contact || '',
            homePhone: data.home_phone || '',
            contactNote: data.contact_note || '',
            school: data.school || '',
            debut: data.debut || '',
            hobby: data.hobby || '',
            nationality: data.nationality || '대한민국',
            passportNo: data.passport_no || '',
            visaType: data.visa_type || '',
            languages: data.languages || '',
            careerYears: data.career_years,
            entryDate: data.entry_date || '',
            departureDate: data.departure_date || '',
            careerBroadcast: data.career_broadcast || '',
            careerMovie: data.career_movie || '',
            careerCommercial: data.career_commercial || '',
            careerPrintAd: data.career_print_ad || '',
            careerTheater: data.career_theater || '',
            careerAlbum: data.career_album || '',
            careerMusical: data.career_musical || '',
            careerFashionShow: data.career_fashion_show || '',
            careerMusicVideo: data.career_music_video || '',
            careerOther: data.career_other || '',
            modelFee6month: data.model_fee_6month,
            modelFee1year: data.model_fee_1year,
            currentWorks: data.current_works || '',
            currentAds: data.current_ads || '',
            instagramId: data.instagram_id || '',
            instagramFollowers: data.instagram_followers,
            youtubeId: data.youtube_id || '',
            youtubeSubscribers: data.youtube_subscribers,
            tiktokId: data.tiktok_id || '',
            tiktokFollowers: data.tiktok_followers,
            keywords: data.keywords || '',
            memo: data.memo || '',
            isActive: data.is_active !== false,
          });
          if (data.profile_image) {
            setProfileImages([data.profile_image]);
          }
        })
        .catch((err: any) => {
          setLoadError(err.message || '모델 정보를 불러오는데 실패했습니다.');
        })
        .finally(() => {
          setIsLoadingModel(false);
        });
    }
  }, [id, isEdit]);

  const handleChange = (field: keyof Model, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingImage(true);
    try {
      await filesAPI.uploadModelFile(Number(id), file, 'profile');
      // 업로드 후 모델 재조회로 이미지 갱신
      const data: any = await modelsAPI.get(Number(id));
      if (data.profile_image) setProfileImages([data.profile_image]);
    } catch (err: any) {
      alert(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    setIsSaving(true);

    // camelCase → snake_case 변환
    const payload: Record<string, any> = {
      name: formData.name,
      name_english: formData.nameEnglish,
      birth_date: formData.birthDate || null,
      gender: formData.gender,
      model_type: formData.modelType,
      height: formData.height || null,
      weight: formData.weight || null,
      bust: formData.bust || null,
      waist: formData.waist || null,
      hip: formData.hip || null,
      shoe_size: formData.shoeSize || null,
      agency_name: formData.agencyName,
      agency_phone: formData.agencyPhone,
      agency_fax: formData.agencyFax,
      has_agency: formData.hasAgency,
      has_manager: formData.hasManager,
      contact1: formData.contact1,
      contact2: formData.contact2,
      contact3: formData.contact3,
      contact4: formData.contact4,
      personal_contact: formData.personalContact,
      home_phone: formData.homePhone,
      contact_note: formData.contactNote,
      school: formData.school,
      debut: formData.debut,
      hobby: formData.hobby,
      nationality: formData.nationality,
      passport_no: formData.passportNo,
      visa_type: formData.visaType,
      languages: formData.languages,
      career_years: formData.careerYears || null,
      entry_date: formData.entryDate || null,
      departure_date: formData.departureDate || null,
      career_broadcast: formData.careerBroadcast,
      career_movie: formData.careerMovie,
      career_commercial: formData.careerCommercial,
      career_print_ad: formData.careerPrintAd,
      career_theater: formData.careerTheater,
      career_album: formData.careerAlbum,
      career_musical: formData.careerMusical,
      career_fashion_show: formData.careerFashionShow,
      career_music_video: formData.careerMusicVideo,
      career_other: formData.careerOther,
      model_fee_6month: formData.modelFee6month || null,
      model_fee_1year: formData.modelFee1year || null,
      current_works: formData.currentWorks,
      current_ads: formData.currentAds,
      instagram_id: formData.instagramId,
      instagram_followers: formData.instagramFollowers || null,
      youtube_id: formData.youtubeId,
      youtube_subscribers: formData.youtubeSubscribers || null,
      tiktok_id: formData.tiktokId,
      tiktok_followers: formData.tiktokFollowers || null,
      keywords: formData.keywords,
      memo: formData.memo,
      is_active: formData.isActive,
    };

    try {
      if (isEdit && id) {
        await modelsAPI.update(Number(id), payload);
      } else {
        await modelsAPI.create(payload);
      }
      navigate('/dashboard/models');
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all";
  const textareaClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none";
  const selectClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all";

  if (isLoadingModel) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{loadError}</p>
        <Link to="/dashboard/models" className="mt-4 inline-block text-purple-600 underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/models"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? '모델 정보 수정' : '새 모델 등록'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEdit ? '모델 프로필 정보를 수정합니다.' : '새로운 모델을 등록합니다.'}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 컬럼 - 프로필 이미지 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              프로필 이미지
            </h3>
            
            {/* 메인 프로필 이미지 */}
            <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-4 relative group">
              {profileImages[0] ? (
                <img src={profileImages[0]} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <User className="w-16 h-16 mb-2" />
                  <p className="text-sm">이미지 없음</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="px-4 py-2 bg-white rounded-lg font-medium text-gray-800 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? '업로드 중...' : '업로드'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={!isEdit || uploadingImage}
                  />
                </label>
              </div>
              {!isEdit && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs text-center py-1 rounded">
                  저장 후 이미지 업로드 가능
                </div>
              )}
            </div>

            {/* 추가 이미지 썸네일 */}
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-purple-500"
                >
                  {profileImages[i + 1] ? (
                    <>
                      <img src={profileImages[i + 1]} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 모델 유형 선택 */}
            <div className="mt-6">
              <FormField label="모델 유형" required>
                <select
                  value={formData.modelType}
                  onChange={(e) => handleChange('modelType', e.target.value)}
                  className={selectClass}
                >
                  {Object.entries(MODEL_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* 활성 상태 */}
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-medium text-gray-700">활성 상태</span>
              </label>
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼 - 상세 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <FormSection title="기본 정보" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="이름" required>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={inputClass}
                  placeholder="홍길동"
                />
              </FormField>
              <FormField label="영문 이름">
                <input
                  type="text"
                  value={formData.nameEnglish}
                  onChange={(e) => handleChange('nameEnglish', e.target.value)}
                  className={inputClass}
                  placeholder="Hong Gildong"
                />
              </FormField>
              <FormField label="생년월일">
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="성별">
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className={selectClass}
                >
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* 신체 정보 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-700 mb-4">신체 정보</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField label="키 (cm)">
<input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => handleChange('height', parseInt(e.target.value) || undefined)}
                    className={inputClass}
                    placeholder="170"
                  />
                </FormField>
                <FormField label="체중 (kg)">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) => handleChange('weight', parseFloat(e.target.value) || undefined)}
                    className={inputClass}
                    placeholder="55"
                  />
                </FormField>
                <FormField label="신발 사이즈">
                  <input
                    type="number"
                    value={formData.shoeSize || ''}
                    onChange={(e) => handleChange('shoeSize', parseInt(e.target.value) || undefined)}
                    className={inputClass}
                    placeholder="250"
                  />
                </FormField>
              </div>
              
              {/* 외국인 모델 전용 - 쓰리사이즈 */}
              {formData.modelType === ModelType.FOREIGN_MODEL && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <FormField label="바스트 (cm)">
                    <input
                      type="number"
                      value={formData.bust || ''}
                      onChange={(e) => handleChange('bust', parseInt(e.target.value) || undefined)}
                      className={inputClass}
                      placeholder="82"
                    />
                  </FormField>
                  <FormField label="허리 (cm)">
                    <input
                      type="number"
                      value={formData.waist || ''}
                      onChange={(e) => handleChange('waist', parseInt(e.target.value) || undefined)}
                      className={inputClass}
                      placeholder="59"
                    />
                  </FormField>
                  <FormField label="힙 (cm)">
                    <input
                      type="number"
                      value={formData.hip || ''}
                      onChange={(e) => handleChange('hip', parseInt(e.target.value) || undefined)}
                      className={inputClass}
                      placeholder="88"
                    />
                  </FormField>
                </div>
              )}
            </div>
          </FormSection>

          {/* 소속사 정보 */}
          <FormSection title="소속사 정보" icon={Building2}>
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasAgency}
                  onChange={(e) => handleChange('hasAgency', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600"
                />
                <span className="text-gray-700">소속사 있음</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasManager}
                  onChange={(e) => handleChange('hasManager', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600"
                />
                <span className="text-gray-700">매니저 있음</span>
              </label>
            </div>
            
            {formData.hasAgency && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="소속사명">
                  <input
                    type="text"
                    value={formData.agencyName}
                    onChange={(e) => handleChange('agencyName', e.target.value)}
                    className={inputClass}
                    placeholder="ABC엔터테인먼트"
                  />
                </FormField>
                <FormField label="소속사 전화">
                  <input
                    type="tel"
                    value={formData.agencyPhone}
                    onChange={(e) => handleChange('agencyPhone', e.target.value)}
                    className={inputClass}
                    placeholder="02-1234-5678"
                  />
                </FormField>
                <FormField label="소속사 팩스">
                  <input
                    type="tel"
                    value={formData.agencyFax}
                    onChange={(e) => handleChange('agencyFax', e.target.value)}
                    className={inputClass}
                    placeholder="02-1234-5679"
                  />
                </FormField>
              </div>
            )}
          </FormSection>

          {/* 연락처 정보 */}
          <FormSection title="연락처 정보" icon={Phone}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="연락처 1">
                <input
                  type="tel"
                  value={formData.contact1}
                  onChange={(e) => handleChange('contact1', e.target.value)}
                  className={inputClass}
                  placeholder="010-1234-5678"
                />
              </FormField>
              <FormField label="연락처 2">
                <input
                  type="tel"
                  value={formData.contact2}
                  onChange={(e) => handleChange('contact2', e.target.value)}
                  className={inputClass}
                  placeholder="010-1234-5678"
                />
              </FormField>
              <FormField label="연락처 3">
                <input
                  type="tel"
                  value={formData.contact3}
                  onChange={(e) => handleChange('contact3', e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="연락처 4">
                <input
                  type="tel"
                  value={formData.contact4}
                  onChange={(e) => handleChange('contact4', e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="개인 연락처">
                <input
                  type="tel"
                  value={formData.personalContact}
                  onChange={(e) => handleChange('personalContact', e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="집 전화">
                <input
                  type="tel"
                  value={formData.homePhone}
                  onChange={(e) => handleChange('homePhone', e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
            <FormField label="연락시 유의점" className="mt-4">
              <textarea
                value={formData.contactNote}
                onChange={(e) => handleChange('contactNote', e.target.value)}
                className={textareaClass}
                rows={3}
                placeholder="연락 시 참고할 사항을 입력하세요..."
              />
            </FormField>
          </FormSection>

          {/* 개인 정보 (외국인 모델) */}
          {formData.modelType === ModelType.FOREIGN_MODEL && (
            <FormSection title="외국인 정보" icon={Globe}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="국적">
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    className={inputClass}
                    placeholder="슬로바키아"
                  />
                </FormField>
                <FormField label="여권번호">
                  <input
                    type="text"
                    value={formData.passportNo}
                    onChange={(e) => handleChange('passportNo', e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="비자 종류">
                  <input
                    type="text"
                    value={formData.visaType}
                    onChange={(e) => handleChange('visaType', e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="경력 (년)">
                  <input
                    type="number"
                    value={formData.careerYears || ''}
                    onChange={(e) => handleChange('careerYears', parseInt(e.target.value) || undefined)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="입국일">
                  <input
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => handleChange('entryDate', e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="출국일">
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleChange('departureDate', e.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>
              <FormField label="외국어 능력" className="mt-4">
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => handleChange('languages', e.target.value)}
                  className={inputClass}
                  placeholder="영어, 러시아어, 한국어 기초"
                />
              </FormField>
            </FormSection>
          )}

          {/* 개인 정보 (일반) */}
          {formData.modelType !== ModelType.FOREIGN_MODEL && (
            <FormSection title="개인 정보" icon={User}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="출신학교">
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => handleChange('school', e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="데뷔">
                  <input
                    type="text"
                    value={formData.debut}
                    onChange={(e) => handleChange('debut', e.target.value)}
                    className={inputClass}
                    placeholder="2020년 OO 드라마"
                  />
                </FormField>
              </div>
              <FormField label="취미/특기" className="mt-4">
                <input
                  type="text"
                  value={formData.hobby}
                  onChange={(e) => handleChange('hobby', e.target.value)}
                  className={inputClass}
                  placeholder="요가, 수영, 피아노"
                />
              </FormField>
            </FormSection>
          )}

          {/* 경력 정보 */}
          <FormSection title="경력 정보" icon={Briefcase}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="방송">
                <textarea
                  value={formData.careerBroadcast}
                  onChange={(e) => handleChange('careerBroadcast', e.target.value)}
                  className={textareaClass}
                  rows={3}
                  placeholder="2024 OO드라마&#10;2023 OO예능"
                />
              </FormField>
              <FormField label="영화">
                <textarea
                  value={formData.careerMovie}
                  onChange={(e) => handleChange('careerMovie', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="광고">
                <textarea
                  value={formData.careerCommercial}
                  onChange={(e) => handleChange('careerCommercial', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="지면광고">
                <textarea
                  value={formData.careerPrintAd}
                  onChange={(e) => handleChange('careerPrintAd', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="연극">
                <textarea
                  value={formData.careerTheater}
                  onChange={(e) => handleChange('careerTheater', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="뮤지컬">
                <textarea
                  value={formData.careerMusical}
                  onChange={(e) => handleChange('careerMusical', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="패션쇼">
                <textarea
                  value={formData.careerFashionShow}
                  onChange={(e) => handleChange('careerFashionShow', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="뮤직비디오">
                <textarea
                  value={formData.careerMusicVideo}
                  onChange={(e) => handleChange('careerMusicVideo', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="앨범" className="md:col-span-1">
                <textarea
                  value={formData.careerAlbum}
                  onChange={(e) => handleChange('careerAlbum', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
              <FormField label="기타" className="md:col-span-1">
                <textarea
                  value={formData.careerOther}
                  onChange={(e) => handleChange('careerOther', e.target.value)}
                  className={textareaClass}
                  rows={3}
                />
              </FormField>
            </div>
          </FormSection>

          {/* 연예인 전용 - 모델료 */}
          {formData.modelType === ModelType.CELEBRITY && (
            <FormSection title="모델료 정보" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="6개월 모델료 (원)">
                  <input
                    type="number"
                    value={formData.modelFee6month || ''}
                    onChange={(e) => handleChange('modelFee6month', parseInt(e.target.value) || undefined)}
                    className={inputClass}
                    placeholder="400000000"
                  />
                </FormField>
                <FormField label="1년 모델료 (원)">
                  <input
                    type="number"
                    value={formData.modelFee1year || ''}
                    onChange={(e) => handleChange('modelFee1year', parseInt(e.target.value) || undefined)}
                    className={inputClass}
                    placeholder="700000000"
                  />
                </FormField>
                <FormField label="현재 진행 작품">
                  <textarea
                    value={formData.currentWorks}
                    onChange={(e) => handleChange('currentWorks', e.target.value)}
                    className={textareaClass}
                    rows={2}
                  />
                </FormField>
                <FormField label="현재 광고">
                  <textarea
                    value={formData.currentAds}
                    onChange={(e) => handleChange('currentAds', e.target.value)}
                    className={textareaClass}
                    rows={2}
                  />
                </FormField>
              </div>
            </FormSection>
          )}

          {/* SNS 정보 */}
          <FormSection title="SNS 정보" icon={Instagram}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="인스타그램 ID">
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
                  <input
                    type="text"
                    value={formData.instagramId}
                    onChange={(e) => handleChange('instagramId', e.target.value)}
                    className={`${inputClass} pl-12`}
                    placeholder="@username"
                  />
                </div>
              </FormField>
              <FormField label="인스타그램 팔로워">
                <input
                  type="number"
                  value={formData.instagramFollowers || ''}
                  onChange={(e) => handleChange('instagramFollowers', parseInt(e.target.value) || undefined)}
                  className={inputClass}
                  placeholder="125000"
                />
              </FormField>
              <FormField label="유튜브 채널">
                <div className="relative">
                  <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  <input
                    type="text"
                    value={formData.youtubeId}
                    onChange={(e) => handleChange('youtubeId', e.target.value)}
                    className={`${inputClass} pl-12`}
                    placeholder="@channel"
                  />
                </div>
              </FormField>
              <FormField label="유튜브 구독자">
                <input
                  type="number"
                  value={formData.youtubeSubscribers || ''}
                  onChange={(e) => handleChange('youtubeSubscribers', parseInt(e.target.value) || undefined)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="틱톡 ID">
                <input
                  type="text"
                  value={formData.tiktokId}
                  onChange={(e) => handleChange('tiktokId', e.target.value)}
                  className={inputClass}
                  placeholder="@username"
                />
              </FormField>
              <FormField label="틱톡 팔로워">
                <input
                  type="number"
                  value={formData.tiktokFollowers || ''}
                  onChange={(e) => handleChange('tiktokFollowers', parseInt(e.target.value) || undefined)}
                  className={inputClass}
                />
              </FormField>
            </div>
          </FormSection>

          {/* 키워드 및 메모 */}
          <FormSection title="키워드 및 메모" icon={User}>
            <FormField label="키워드">
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                className={inputClass}
                placeholder="청순, 시크, 개성있는 (쉼표로 구분)"
              />
            </FormField>
            <FormField label="메모" className="mt-4">
              <textarea
                value={formData.memo}
                onChange={(e) => handleChange('memo', e.target.value)}
                className={textareaClass}
                rows={4}
                placeholder="추가 메모 사항..."
              />
            </FormField>
          </FormSection>
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <Link
          to="/dashboard/models"
          className="px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
