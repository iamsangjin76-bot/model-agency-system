/**
 * Domain API namespaces and their TypeScript interfaces.
 * All HTTP calls are delegated to the shared request() helper from auth-api.
 */

import { request } from './auth-api';

// Import types for use within this file, then re-export for consumers.
import type {
  Model, Client, Casting, Contract, Settlement, Schedule, ActivityLogEntry,
  NotificationEntry, NewsArticle, NewsSearchResult, SavedNews,
  SearchImage, ImageSearchResult, SavedSearchImage,
  FollowerSnapshot, MediaMetric, SyncResult, SnsStatus, ExportTemplateKey,
} from './domain-api-types';

export type {
  Model, Client, Casting, Contract, Settlement, Schedule, ActivityLogEntry,
  NotificationEntry, NewsArticle, NewsSearchResult, SavedNews,
  SearchImage, ImageSearchResult, SavedSearchImage,
  FollowerSnapshot, MediaMetric, SyncResult, SnsStatus, ExportTemplateKey,
};

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

export const exportAPI = {
  /**
   * Download a PPTX file for the given model IDs.
   * Returns a Blob for the caller to trigger a browser download.
   */
  pptx: async (modelIds: number[], template: ExportTemplateKey): Promise<Blob> => {
    const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE}/export/pptx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ model_ids: modelIds, template }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'PPTX 생성 실패' }));
      throw new Error(err.detail || 'PPTX 생성 실패');
    }
    return res.blob();
  },
};

/** Default export grouping all domain namespaces. */
const domainApi = {
  models: modelsAPI, clients: clientsAPI, castings: castingsAPI,
  contracts: contractsAPI, settlements: settlementsAPI,
  schedules: schedulesAPI, files: filesAPI, activityLogs: activityLogsAPI,
  notifications: notificationsAPI,
  news: newsAPI, imageSearch: imageSearchAPI, sns: snsAPI, export: exportAPI,
};

export default domainApi;
