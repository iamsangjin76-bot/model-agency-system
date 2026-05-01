/**
 * TypeScript interfaces for all domain entities used across the app.
 * Imported by domain-api.ts which re-exports them for consumers.
 */

export interface Model {
  id: number; name: string; gender: string;
  name_english?: string;
  birth_date?: string; age?: number;
  height?: number; weight?: number;
  bust?: number; waist?: number; hip?: number; shoe_size?: number;
  contact1?: string; email?: string;
  agency_name?: string; agency_phone?: string;
  model_type?: string; is_active?: boolean; profile_image?: string;
  instagram_id?: string; instagram_followers?: number;
  youtube_id?: string; youtube_subscribers?: number;
  tiktok_id?: string; tiktok_followers?: number;
  career_broadcast?: string; career_movie?: string;
  career_commercial?: string; career_print_ad?: string;
  career_theater?: string; career_musical?: string;
  career_fashion_show?: string; career_music_video?: string;
  career_other?: string;
  nationality?: string; languages?: string;
  visa_type?: string; entry_date?: string;
  school?: string; debut?: string; hobby?: string; memo?: string;
  keywords?: string;
}

export interface Client {
  id: number; company_name: string; brand_name?: string;
  business_number?: string; industry?: string; grade?: string;
  contact_name?: string; contact_phone?: string; contact_email?: string;
  address?: string; memo?: string; is_favorite?: boolean;
}

export interface Casting {
  id: number; client_id?: number; client_name?: string;
  title: string; type?: string; status?: string;
  description?: string; requirements?: string[]; budget?: number;
  shoot_date?: string; location?: string; deadline?: string;
  proposed_models?: { id: number; status: string }[];
}

export interface Contract {
  id: number; contract_number?: string;
  model_id: number; model_name?: string;
  client_id: number; client_name?: string;
  casting_id?: number; contract_type?: string; status?: string;
  start_date?: string; end_date?: string;
  total_amount?: number; agency_fee?: number; model_fee?: number;
  payment_terms?: string; memo?: string;
}

export interface Settlement {
  id: number;
  title?: string;
  type?: string;
  settlement_type?: string;
  status?: string;
  amount: number;
  contract_id?: number;
  model_id?: number;
  client_id?: number;
  model_name?: string;
  due_date?: string;
  paid_date?: string;
  payment_date?: string;
  bank_info?: string;
  description?: string;
  created_at?: string;
}

export interface Schedule {
  id: number; model_id?: number; model_name?: string;
  casting_id?: number; contract_id?: number; schedule_type?: string;
  title: string; start_datetime: string; end_datetime?: string;
  location?: string; memo?: string; status?: string;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  target_type: string | null;
  target_id: number | null;
  target_name: string | null;
  details: string | null;
  admin_id: number;
  created_at: string;
}

export interface NotificationEntry {
  id: number;
  title: string;
  message: string | null;
  notification_type: string | null;
  is_read: boolean;
  link_url: string | null;
  target_type: string | null;
  target_id: number | null;
  created_at: string;
}

export interface NewsArticle {
  title: string; link: string; description: string; pub_date: string;
  source: string; image_url: string | null; provider: 'naver' | 'google';
}

export interface NewsSearchResult {
  total: number; page: number; display: number;
  provider: 'naver' | 'google'; items: NewsArticle[];
}

export interface SavedNews {
  id: number; modelId: number; title: string; link: string;
  description: string; pubDate: string; source: string;
  imageUrl: string | null; provider: string; memo: string | null; createdAt: string;
}

export interface SearchImage {
  thumbnail_url: string; original_url: string; width: number; height: number;
  source: string; provider: 'naver' | 'google';
}

export interface ImageSearchResult {
  total: number; page: number; display: number;
  provider: 'naver' | 'google'; items: SearchImage[];
}

export interface SavedSearchImage {
  id: number; model_id: number; original_url: string; local_path: string;
  filename: string; width: number; height: number; file_size: number;
  source: string; provider: string; memo: string | null;
  is_portfolio: boolean; created_at: string;
}

export interface FollowerSnapshot {
  id: number;
  snapshot_at: string;
  followers_count: number;
  follows_count: number | null;
  media_count: number | null;
  source: string;
  duration_ms: number | null;
}

export interface MediaMetric {
  id: number;
  media_id: string | null;
  media_type: string | null;
  posted_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  caption_excerpt: string | null;
  permalink: string | null;
}

export interface SyncResult {
  ok: boolean;
  snapshot_id: number;
  followers_count: number;
  follows_count: number | null;
  media_count: number | null;
  posts_synced: number;
  duration_ms: number;
}

export interface SnsStatus {
  instagram: boolean; youtube: boolean; any_configured: boolean;
}

export type ExportTemplateKey = 'new_model_a' | 'new_model_b' | 'influencer' | 'foreign_model';
