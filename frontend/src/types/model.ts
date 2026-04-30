// 모델 관련 타입 정의

export enum ModelType {
  NEW_MODEL = 'new_model',         // 신인 모델
  INFLUENCER = 'influencer',       // 인플루언서
  FOREIGN_MODEL = 'foreign_model', // 외국인 모델
  CELEBRITY = 'celebrity',         // 연예인
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export const MODEL_TYPE_LABELS: Record<string, string> = {
  [ModelType.NEW_MODEL]: '신인 모델',
  [ModelType.INFLUENCER]: '인플루언서',
  [ModelType.FOREIGN_MODEL]: '외국인 모델',
  [ModelType.CELEBRITY]: '연예인',
};

export const MODEL_TYPE_COLORS: Record<string, string> = {
  [ModelType.NEW_MODEL]: 'bg-blue-500',
  [ModelType.INFLUENCER]: 'bg-purple-500',
  [ModelType.FOREIGN_MODEL]: 'bg-green-500',
  [ModelType.CELEBRITY]: 'bg-red-500',
};

export const GENDER_LABELS: Record<string, string> = {
  [Gender.MALE]: '남성',
  [Gender.FEMALE]: '여성',
  [Gender.OTHER]: '기타',
};

export interface Model {
  id: number;
  
  // 기본 정보
  name: string;
  nameEnglish?: string;
  birthDate?: string;
  gender?: Gender;
  modelType: ModelType;
  
  // 신체 정보
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  shoeSize?: number;
  
  // 소속사 정보
  agencyName?: string;
  agencyPhone?: string;
  agencyFax?: string;
  hasAgency: boolean;
  hasManager: boolean;
  
  // 연락처
  contact1?: string;
  contact2?: string;
  contact3?: string;
  contact4?: string;
  personalContact?: string;
  homePhone?: string;
  contactNote?: string;
  
  // 개인 정보
  school?: string;
  debut?: string;
  hobby?: string;
  nationality?: string;
  passportNo?: string;
  visaType?: string;
  languages?: string;
  
  // 외국인 모델 전용
  careerYears?: number;
  entryDate?: string;
  departureDate?: string;
  
  // 경력 정보
  careerBroadcast?: string;
  careerMovie?: string;
  careerCommercial?: string;
  careerPrintAd?: string;
  careerTheater?: string;
  careerAlbum?: string;
  careerMusical?: string;
  careerFashionShow?: string;
  careerMusicVideo?: string;
  careerOther?: string;
  
  // 연예인 전용 - 모델료
  modelFee6month?: number;
  modelFee1year?: number;
  currentWorks?: string;
  currentAds?: string;
  
  // SNS 정보
  instagramId?: string;
  instagramFollowers?: number;
  youtubeId?: string;
  youtubeSubscribers?: number;
  tiktokId?: string;
  tiktokFollowers?: number;
  
  // 키워드 및 메모
  keywords?: string;
  memo?: string;
  
  // 폴더 경로
  folderPath?: string;
  
  // 프로필 이미지
  profileImageUrl?: string;
  
  // 메타 정보
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelFile {
  id: number;
  modelId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  isProfileImage: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ModelFilter {
  search?: string;
  modelType?: ModelType;
  gender?: Gender;
  hasAgency?: boolean;
  isActive?: boolean;
}
