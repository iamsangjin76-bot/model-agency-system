/**
 * Shared constants and types for model profile export templates.
 * Used by print utilities and export UI components.
 */

export type TemplateKey = 'new_model_a' | 'new_model_b' | 'influencer' | 'foreign_model';

/** Mirrors the FastAPI ModelDetailResponse schema (snake_case). */
export interface PrintModel {
  name: string;
  name_english?: string;
  model_type?: string;
  gender?: string;
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  shoe_size?: number;
  birth_date?: string;
  nationality?: string;
  school?: string;
  debut?: string;
  hobby?: string;
  languages?: string;
  agency_name?: string;
  agency_phone?: string;
  contact1?: string;
  instagram_id?: string;
  instagram_followers?: number;
  youtube_id?: string;
  youtube_subscribers?: number;
  tiktok_id?: string;
  tiktok_followers?: number;
  career_broadcast?: string;
  career_movie?: string;
  career_commercial?: string;
  career_print_ad?: string;
  career_theater?: string;
  career_album?: string;
  career_musical?: string;
  career_fashion_show?: string;
  career_music_video?: string;
  career_other?: string;
  model_fee_6month?: number;
  model_fee_1year?: number;
  current_works?: string;
  current_ads?: string;
  keywords?: string;
  memo?: string;
  profile_image?: string;
  visa_type?: string;
  entry_date?: string;
  [key: string]: any;
}

export const MODEL_TYPE_LABELS: Record<string, string> = {
  new_model: '신인 모델', influencer: '인플루언서',
  foreign_model: '외국인 모델', celebrity: '연예인',
};

export const GENDER_LABELS: Record<string, string> = {
  male: '남성', female: '여성', other: '기타',
};

/** Template color palettes */
export const PALETTE: Record<TemplateKey, { primary: string; bg: string }> = {
  new_model_a:   { primary: '#7c3aed', bg: '#f3f0ff' },
  new_model_b:   { primary: '#1f2937', bg: '#f9fafb' },
  influencer:    { primary: '#db2777', bg: '#fff0f9' },
  foreign_model: { primary: '#1d4ed8', bg: '#eff6ff' },
};
