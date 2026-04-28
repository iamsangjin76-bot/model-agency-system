/**
 * Domain API namespaces and their TypeScript interfaces.
 * All HTTP calls are delegated to the shared request() helper from auth-api.
 */

import { request } from './auth-api';

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Model {
  id: number; name: string; english_name?: string; gender: string;
  birth_date?: string; age?: number; height?: number; weight?: number;
  bust?: number; waist?: number; hip?: number; shoe_size?: number;
  phone?: string; email?: string; instagram?: string;
  model_type?: string; is_exclusive?: boolean; profile_image?: string;
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
  type?: string;           // backend field name
  settlement_type?: string; // alias returned by list endpoint
  status?: string;
  amount: number;
  contract_id?: number;
  model_id?: number;
  client_id?: number;
  model_name?: string;
  due_date?: string;
  paid_date?: string;
  payment_date?: string;   // compat alias (same as paid_date in list response)
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

// ---------------------------------------------------------------------------
// Helper: build query string from optional params
// ---------------------------------------------------------------------------

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.append(k, String(v));
  }
  return q.toString();
}

// ---------------------------------------------------------------------------
// API namespaces
// ---------------------------------------------------------------------------

export const modelsAPI = {
  list: (p?: { page?: number; size?: number; search?: string; gender?: string; model_type?: string; height_min?: number; height_max?: number; age_range?: string; sort_by?: string; sort_order?: string }) =>
    request<{ items: Model[]; total: number; page: number; size: number }>(
      `/models?${buildQuery({ page: p?.page, size: p?.size, search: p?.search, gender: p?.gender, model_type: p?.model_type, height_min: p?.height_min, height_max: p?.height_max, age_range: p?.age_range, sort_by: p?.sort_by, sort_order: p?.sort_order })}`),
  get: (id: number) => request<Model>(`/models/${id}`),
  create: (data: Partial<Model>) => request<Model>('/models', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Model>) => request<Model>(`/models/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request(`/models/${id}`, { method: 'DELETE' }),
  stats: () => request<{ total: number; by_gender: Record<string, number>; by_type: Record<string, number> }>('/models/stats/summary'),
  files: (id: number) => request<{ id: number; file_name: string; file_path: string; file_type: string; file_size: number; is_profile_image: boolean }[]>(`/models/${id}/files`),
};

export const clientsAPI = {
  list: (p?: { page?: number; size?: number; search?: string; grade?: string; industry?: string }) =>
    request<{ items: Client[]; total: number }>(
      `/clients?${buildQuery({ page: p?.page, size: p?.size, search: p?.search, grade: p?.grade, industry: p?.industry })}`),
  get: (id: number) => request<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Client>) => request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request(`/clients/${id}`, { method: 'DELETE' }),
  toggleFavorite: (id: number) => request(`/clients/${id}/favorite`, { method: 'PATCH' }),
};

export const castingsAPI = {
  list: (p?: { page?: number; size?: number; search?: string; status?: string; type?: string; client_id?: number; budget_min?: number; budget_max?: number; shoot_date_from?: string; shoot_date_to?: string; sort_by?: string; sort_order?: string }) =>
    request<{ items: Casting[]; total: number }>(
      `/castings?${buildQuery({ page: p?.page, size: p?.size, search: p?.search, status: p?.status, type: p?.type, client_id: p?.client_id, budget_min: p?.budget_min, budget_max: p?.budget_max, shoot_date_from: p?.shoot_date_from, shoot_date_to: p?.shoot_date_to, sort_by: p?.sort_by, sort_order: p?.sort_order })}`),
  get: (id: number) => request<Casting>(`/castings/${id}`),
  create: (data: Partial<Casting>) => request<Casting>('/castings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Casting>) => request<Casting>(`/castings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request(`/castings/${id}`, { method: 'DELETE' }),
  proposeModel: (castingId: number, modelId: number) =>
    request(`/castings/${castingId}/propose-model`, { method: 'POST', body: JSON.stringify({ model_id: modelId }) }),
  stats: () => request<{ total: number; by_status: Record<string, number> }>('/castings/stats/summary'),
};

export const contractsAPI = {
  list: (p?: { page?: number; size?: number; status?: string; model_id?: number }) =>
    request<{ items: Contract[]; total: number }>(
      `/contracts?${buildQuery({ page: p?.page, size: p?.size, status: p?.status, model_id: p?.model_id })}`),
  get: (id: number) => request<Contract>(`/contracts/${id}`),
  create: (data: Partial<Contract>) => request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Contract>) => request<Contract>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request(`/contracts/${id}`, { method: 'DELETE' }),
};

export const settlementsAPI = {
  list: (p?: { page?: number; size?: number; search?: string; status?: string; settlement_type?: string; amount_min?: number; amount_max?: number; due_date_from?: string; due_date_to?: string; sort_by?: string; sort_order?: string }) =>
    request<{ items: Settlement[]; total: number }>(
      `/settlements?${buildQuery({ page: p?.page, size: p?.size, search: p?.search, status: p?.status, settlement_type: p?.settlement_type, amount_min: p?.amount_min, amount_max: p?.amount_max, due_date_from: p?.due_date_from, due_date_to: p?.due_date_to, sort_by: p?.sort_by, sort_order: p?.sort_order })}`),
  get: (id: number) => request<Settlement>(`/settlements/${id}`),
  create: (data: Partial<Settlement>) => request<Settlement>('/settlements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Settlement>) => request<Settlement>(`/settlements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  complete: (id: number) => request(`/settlements/${id}/complete`, { method: 'PATCH' }),
  stats: () => request<{ total_income: number; total_expense: number; net_profit: number; pending_count: number; pending_amount: number }>('/settlements/stats/summary'),
  delete: (id: number) => request<{ message: string }>(`/settlements/${id}`, { method: 'DELETE' }),
  monthlyStats: (months = 5) =>
    request<{ items: { month: string; label: string; income: number; expense: number }[] }>(
      `/settlements/stats/monthly?months=${months}`),
  expenseBreakdown: () =>
    request<{ items: { name: string; type: string; amount: number; percentage: number }[]; total: number }>(
      `/settlements/stats/expense-breakdown`),
};

export const schedulesAPI = {
  list: (p?: { start_date?: string; end_date?: string; model_id?: number }) =>
    request<Schedule[]>(`/schedules?${buildQuery({ start_date: p?.start_date, end_date: p?.end_date, model_id: p?.model_id })}`),
  byDate: (date: string) => request<Schedule[]>(`/schedules/date/${date}`),
  get: (id: number) => request<Schedule>(`/schedules/${id}`),
  create: (data: Partial<Schedule>) => request<Schedule>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Schedule>) => request<Schedule>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request(`/schedules/${id}`, { method: 'DELETE' }),
};

export const activityLogsAPI = {
  /** Fetch the N most recent activity log entries. */
  recent: (limit = 5) =>
    request<{ items: ActivityLogEntry[]; total: number }>(
      `/activity-logs?page=1&page_size=${limit}`),
};

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

export const notificationsAPI = {
  list: (p?: { page?: number; page_size?: number; unread_only?: boolean }) =>
    request<{ total: number; items: NotificationEntry[] }>(
      `/notifications?${new URLSearchParams(
        Object.fromEntries(Object.entries(p ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
      )}`),
  unreadCount: () =>
    request<{ unread_count: number }>('/notifications/count'),
  markRead: (id: number) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    request('/notifications/read-all', { method: 'PATCH' }),
};

// ---------------------------------------------------------------------------
// News search types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Image search types
// ---------------------------------------------------------------------------

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

export const newsAPI = {
  search: (params: { query: string; page?: number; display?: number; provider?: string }) =>
    request<NewsSearchResult>(`/news/search?${buildQuery(params as Record<string, string | number | undefined>)}`),
  save: (body: { model_id: number; articles: NewsArticle[] }) =>
    request<SavedNews[]>('/news/save', { method: 'POST', body: JSON.stringify(body) }),
  getByModel: (modelId: number, page?: number, size?: number) =>
    request<{ items: SavedNews[]; total: number }>(`/news/model/${modelId}?${buildQuery({ page, size })}`),
  delete: (newsId: number) => request(`/news/${newsId}`, { method: 'DELETE' }),
};

export const imageSearchAPI = {
  search: (params: { query: string; page?: number; display?: number; provider?: string }) =>
    request<ImageSearchResult>(`/image-search/search?${buildQuery(params as Record<string, string | number | undefined>)}`),
  save: (body: { model_id: number; images: SearchImage[] }) =>
    request<SavedSearchImage[]>('/image-search/save', { method: 'POST', body: JSON.stringify(body) }),
  getByModel: (modelId: number, page?: number, size?: number) =>
    request<{ items: SavedSearchImage[]; total: number }>(`/image-search/model/${modelId}?${buildQuery({ page, size })}`),
  delete: (imageId: number) => request(`/image-search/${imageId}`, { method: 'DELETE' }),
  toPortfolio: (imageId: number) =>
    request(`/image-search/${imageId}/to-portfolio`, { method: 'POST' }),
};

/** Direct localStorage read needed for multipart upload (bypasses request helper). */
const getStoredToken = (): string | null => localStorage.getItem('access_token');

export const filesAPI = {
  uploadModelFile: async (modelId: number, file: File, fileType = 'portfolio') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    const token = getStoredToken();
    const res = await fetch(`/api/files/model/${modelId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('파일 업로드 실패');
    return res.json();
  },
  getModelFiles: (modelId: number) =>
    request<{ id: number; file_name: string; file_type: string; file_size: number }[]>(`/files/model/${modelId}`),
  downloadUrl: (fileId: number) => `/api/files/download/${fileId}`,
  deleteFile: (fileId: number) => request(`/files/${fileId}`, { method: 'DELETE' }),
  setProfileImage: (modelId: number, fileId: number) =>
    request<{ ok: boolean; profile_image: string }>(`/models/${modelId}/files/${fileId}/set-profile`, { method: 'PATCH' }),
};

// ---------------------------------------------------------------------------
// SNS Analytics types
// ---------------------------------------------------------------------------

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

export const snsAPI = {
  status: () =>
    request<SnsStatus>('/sns/status'),
  sync: (modelId: number) =>
    request<{ ok: boolean; instagram: any; youtube: any }>(`/sns/sync/${modelId}`, { method: 'POST' }),
  syncBatch: (modelType?: string) =>
    request<{ job_id: string; profile_count: number; status: string }>(
      `/sns/sync/batch${modelType ? `?model_type=${modelType}` : ''}`,
      { method: 'POST' }
    ),
  job: (jobId: string) =>
    request<{ id: string; status: string; profile_count: number; completed_count: number; failed_count: number }>(
      `/sns/jobs/${jobId}`
    ),
  snapshots: (modelId: number, platform = 'instagram', limit = 30) =>
    request<{ model_id: number; platform: string; items: FollowerSnapshot[] }>(
      `/sns/snapshots/${modelId}?platform=${platform}&limit=${limit}`
    ),
  media: (modelId: number, limit = 10) =>
    request<{ model_id: number; items: MediaMetric[] }>(
      `/sns/media/${modelId}?limit=${limit}`
    ),
};

/** Default export grouping all domain namespaces. */
const domainApi = {
  models: modelsAPI, clients: clientsAPI, castings: castingsAPI,
  contracts: contractsAPI, settlements: settlementsAPI,
  schedules: schedulesAPI, files: filesAPI, activityLogs: activityLogsAPI,
  notifications: notificationsAPI,
  news: newsAPI, imageSearch: imageSearchAPI, sns: snsAPI,
};

export default domainApi;
