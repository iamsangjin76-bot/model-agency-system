import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { modelsAPI, filesAPI } from '@/services/api';
import { ArrowLeft, Save } from 'lucide-react';
import { Model, ModelType, Gender } from '@/types/model';
import { useToast } from '@/contexts/ToastContext';
import Spinner from '@/components/ui/Spinner';
import ProfileSidebar from '@/components/model-form/ProfileSidebar';
import BasicInfoFields from '@/components/model-form/BasicInfoFields';
import AgencyContactFields from '@/components/model-form/AgencyContactFields';
import CareerFields from '@/components/model-form/CareerFields';
import SnsKeywordFields from '@/components/model-form/SnsKeywordFields';

const initialFormData: Partial<Model> = {
  name: '', nameEnglish: '', birthDate: '', gender: Gender.FEMALE,
  modelType: ModelType.NEW_MODEL, height: undefined, weight: undefined,
  bust: undefined, waist: undefined, hip: undefined, shoeSize: undefined,
  agencyName: '', agencyPhone: '', agencyFax: '', hasAgency: false, hasManager: false,
  contact1: '', contact2: '', contact3: '', contact4: '',
  personalContact: '', homePhone: '', contactNote: '',
  school: '', debut: '', hobby: '', nationality: '대한민국',
  passportNo: '', visaType: '', languages: '', careerYears: undefined,
  entryDate: '', departureDate: '',
  careerBroadcast: '', careerMovie: '', careerCommercial: '', careerPrintAd: '',
  careerTheater: '', careerAlbum: '', careerMusical: '', careerFashionShow: '',
  careerMusicVideo: '', careerOther: '',
  modelFee6month: undefined, modelFee1year: undefined, currentWorks: '', currentAds: '',
  instagramId: '', instagramFollowers: undefined,
  youtubeId: '', youtubeSubscribers: undefined,
  tiktokId: '', tiktokFollowers: undefined,
  keywords: '', memo: '', isActive: true,
};

export default function ModelFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Model>>(initialFormData);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [profileFileInfo, setProfileFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [additionalImages, setAdditionalImages] = useState<{ id: number; file_path: string; file_name: string; file_size: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingProfileFile, setPendingProfileFile] = useState<File | null>(null);

  const loadModelFiles = async (modelId: number) => {
    try {
      const files = await modelsAPI.files(modelId);
      const profileFile = files.find(f => f.is_profile_image);
      if (profileFile) setProfileFileInfo({ name: profileFile.file_name, size: profileFile.file_size });
      setAdditionalImages(files.filter(f => !f.is_profile_image));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isEdit && id) {
      setIsLoadingModel(true);
      setLoadError(null);
      modelsAPI.get(Number(id))
        .then((data: any) => {
          setFormData(mapApiToForm(data));
          if (data.profile_image) setProfileImages([data.profile_image]);
          loadModelFiles(Number(id));
        })
        .catch((err: any) => setLoadError(err.message || '모델 정보를 불러오는데 실패했습니다.'))
        .finally(() => setIsLoadingModel(false));
    }
  }, [id, isEdit]);

  const handleChange = (field: keyof Model, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!id) {
      // New mode: store locally and show preview until model is saved
      setPendingProfileFile(file);
      setProfileImages([URL.createObjectURL(file)]);
      setProfileFileInfo({ name: file.name, size: file.size });
      e.target.value = '';
      return;
    }
    // Edit mode: upload immediately
    setUploadingImage(true);
    try {
      await filesAPI.uploadModelFile(Number(id), file, 'profile');
      setProfileFileInfo({ name: file.name, size: file.size });
      const data: any = await modelsAPI.get(Number(id));
      if (data.profile_image) setProfileImages([data.profile_image]);
    } catch (err: any) {
      toast.error(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingAdditional(true);
    try {
      await filesAPI.uploadModelFile(Number(id), file, 'additional');
      await loadModelFiles(Number(id));
    } catch (err: any) {
      toast.error(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingAdditional(false);
      e.target.value = '';
    }
  };

  const handleDeleteAdditional = async (e: React.MouseEvent, fileId: number) => {
    e.stopPropagation();
    try {
      const toDelete = additionalImages.find(f => f.id === fileId);
      if (toDelete && previewImage === toDelete.file_path) setPreviewImage(null);
      await filesAPI.deleteFile(fileId);
      setAdditionalImages(prev => prev.filter(f => f.id !== fileId));
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) { toast.warning('이름을 입력해주세요.'); return; }
    setIsSaving(true);
    const payload = buildPayload(formData);
    try {
      if (isEdit && id) {
        await modelsAPI.update(Number(id), payload);
        toast.success('저장되었습니다.');
        navigate('/dashboard/models');
      } else {
        const created: any = await modelsAPI.create(payload);
        if (pendingProfileFile) {
          try {
            await filesAPI.uploadModelFile(created.id, pendingProfileFile, 'profile');
          } catch { /* Upload failure is non-fatal; user can retry in edit mode */ }
        }
        toast.success('저장되었습니다.');
        navigate(`/dashboard/models/${created.id}/edit`);
      }
    } catch (err: any) {
      toast.error(err.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Derived display values for image preview
  const previewAdditional = previewImage
    ? additionalImages.find(f => f.file_path === previewImage) ?? null
    : null;
  const currentFileInfo = previewAdditional
    ? { name: previewAdditional.file_name, size: previewAdditional.file_size }
    : profileFileInfo;

  if (isLoadingModel) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{loadError}</p>
        <Link to="/dashboard/models" className="mt-4 inline-block text-purple-600 underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/models" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isEdit ? '모델 정보 수정' : '새 모델 등록'}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{isEdit ? '모델 프로필 정보를 수정합니다.' : '새로운 모델을 등록합니다.'}</p>
          </div>
        </div>
        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50">
          <Save className="w-5 h-5" />
          <span className="hidden sm:inline">{isSaving ? '저장 중...' : '저장'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ProfileSidebar
          isEdit={isEdit} formData={formData}
          profileImages={profileImages} additionalImages={additionalImages}
          uploadingImage={uploadingImage} uploadingAdditional={uploadingAdditional}
          previewImage={previewImage} currentFileInfo={currentFileInfo}
          onImageUpload={handleImageUpload} onAdditionalUpload={handleAdditionalUpload}
          onDeleteAdditional={handleDeleteAdditional} onPreviewChange={setPreviewImage}
          onFieldChange={handleChange}
        />
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <BasicInfoFields formData={formData} onChange={handleChange} />
          <AgencyContactFields formData={formData} onChange={handleChange} />
          <CareerFields formData={formData} onChange={handleChange} />
          <SnsKeywordFields formData={formData} onChange={handleChange} />
        </div>
      </div>

      {/* Footer save */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link to="/dashboard/models" className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">취소</Link>
        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50">
          <Save className="w-5 h-5" />
          <span className="hidden sm:inline">{isSaving ? '저장 중...' : '저장'}</span>
        </button>
      </div>
    </form>
  );
}

// Map API snake_case response to camelCase form data
function mapApiToForm(data: any): Partial<Model> {
  return {
    name: data.name || '', nameEnglish: data.name_english || '',
    birthDate: data.birth_date || '', gender: data.gender as Gender,
    modelType: (data.model_type as ModelType) || ModelType.NEW_MODEL,
    height: data.height, weight: data.weight, bust: data.bust,
    waist: data.waist, hip: data.hip, shoeSize: data.shoe_size,
    agencyName: data.agency_name || '', agencyPhone: data.agency_phone || '',
    agencyFax: data.agency_fax || '', hasAgency: data.has_agency || false,
    hasManager: data.has_manager || false,
    contact1: data.contact1 || '', contact2: data.contact2 || '',
    contact3: data.contact3 || '', contact4: data.contact4 || '',
    personalContact: data.personal_contact || '', homePhone: data.home_phone || '',
    contactNote: data.contact_note || '',
    school: data.school || '', debut: data.debut || '', hobby: data.hobby || '',
    nationality: data.nationality || '대한민국', passportNo: data.passport_no || '',
    visaType: data.visa_type || '', languages: data.languages || '',
    careerYears: data.career_years, entryDate: data.entry_date || '',
    departureDate: data.departure_date || '',
    careerBroadcast: data.career_broadcast || '', careerMovie: data.career_movie || '',
    careerCommercial: data.career_commercial || '', careerPrintAd: data.career_print_ad || '',
    careerTheater: data.career_theater || '', careerAlbum: data.career_album || '',
    careerMusical: data.career_musical || '', careerFashionShow: data.career_fashion_show || '',
    careerMusicVideo: data.career_music_video || '', careerOther: data.career_other || '',
    modelFee6month: data.model_fee_6month, modelFee1year: data.model_fee_1year,
    currentWorks: data.current_works || '', currentAds: data.current_ads || '',
    instagramId: data.instagram_id || '', instagramFollowers: data.instagram_followers,
    youtubeId: data.youtube_id || '', youtubeSubscribers: data.youtube_subscribers,
    tiktokId: data.tiktok_id || '', tiktokFollowers: data.tiktok_followers,
    keywords: data.keywords || '', memo: data.memo || '',
    isActive: data.is_active !== false,
  };
}

// Build snake_case API payload from camelCase form data
function buildPayload(f: Partial<Model>): Record<string, any> {
  return {
    name: f.name, name_english: f.nameEnglish,
    birth_date: f.birthDate || null, gender: f.gender, model_type: f.modelType,
    height: f.height || null, weight: f.weight || null,
    bust: f.bust || null, waist: f.waist || null, hip: f.hip || null,
    shoe_size: f.shoeSize || null,
    agency_name: f.agencyName, agency_phone: f.agencyPhone, agency_fax: f.agencyFax,
    has_agency: f.hasAgency, has_manager: f.hasManager,
    contact1: f.contact1, contact2: f.contact2, contact3: f.contact3, contact4: f.contact4,
    personal_contact: f.personalContact, home_phone: f.homePhone, contact_note: f.contactNote,
    school: f.school, debut: f.debut, hobby: f.hobby,
    nationality: f.nationality, passport_no: f.passportNo, visa_type: f.visaType,
    languages: f.languages, career_years: f.careerYears || null,
    entry_date: f.entryDate || null, departure_date: f.departureDate || null,
    career_broadcast: f.careerBroadcast, career_movie: f.careerMovie,
    career_commercial: f.careerCommercial, career_print_ad: f.careerPrintAd,
    career_theater: f.careerTheater, career_album: f.careerAlbum,
    career_musical: f.careerMusical, career_fashion_show: f.careerFashionShow,
    career_music_video: f.careerMusicVideo, career_other: f.careerOther,
    model_fee_6month: f.modelFee6month || null, model_fee_1year: f.modelFee1year || null,
    current_works: f.currentWorks, current_ads: f.currentAds,
    instagram_id: f.instagramId, instagram_followers: f.instagramFollowers || null,
    youtube_id: f.youtubeId, youtube_subscribers: f.youtubeSubscribers || null,
    tiktok_id: f.tiktokId, tiktok_followers: f.tiktokFollowers || null,
    keywords: f.keywords, memo: f.memo, is_active: f.isActive,
  };
}
