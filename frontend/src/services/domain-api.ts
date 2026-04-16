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
  id: number; client_id: number; client_name?: string;
  project_name: string; casting_type?: string; status?: string;
  requirements?: string; budget?: number; shooting_date?: string;
  shooting_location?: string; deadline?: string;
  selected_model_id?: number; selected_model_name?: string;
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
  id: number; contract_id?: number; model_id?: number; model_name?: string;
  settlement_type?: string; amount: number; payment_date?: string;
  payment_method?: string; status?: string; description?: string;
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
  list: (p?: { page?: number; size?: number; search?: string; gender?: string; model_type?: string }) =>
    request<{ items: Model[]; total: number; page: number; size: number }>(
      `/models?${buildQuery({ page: p?.page, size: p?.size, search: p?.search, gender: p?.gender, model_type: p?.model_type })}`),
  get: (id: number) => request<Model>(`/models/${id}`),
  create: (data: Partial<Model>) => request<Model>('/models', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Model>) => request<Model>(`/models/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request(`/models/${id}`, { method: 'DELETE' }),
  stats: () => request<{ total: number; by_gender: Record<string, number>; by_type: Record<string, number> }>('/models/stats/summary'),
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
  list: (p?: { page?: number; size?: number; status?: string; client_id?: number }) =>
    request<{ items: Casting[]; total: number }>(
      `/castings?${buildQuery({ page: p?.page, size: p?.size, status: p?.status, client_id: p?.client_id })}`),
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
  list: (p?: { page?: number; size?: number; status?: string; settlement_type?: string }) =>
    request<{ items: Settlement[]; total: number }>(
      `/settlements?${buildQuery({ page: p?.page, size: p?.size, status: p?.status, settlement_type: p?.settlement_type })}`),
  get: (id: number) => request<Settlement>(`/settlements/${id}`),
  create: (data: Partial<Settlement>) => request<Settlement>('/settlements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Settlement>) => request<Settlement>(`/settlements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  complete: (id: number) => request(`/settlements/${id}/complete`, { method: 'PATCH' }),
  stats: () => request<{ total_income: number; total_expense: number; pending_count: number }>('/settlements/stats/summary'),
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
};

/** Default export grouping all domain namespaces. */
const domainApi = {
  models: modelsAPI, clients: clientsAPI, castings: castingsAPI,
  contracts: contractsAPI, settlements: settlementsAPI,
  schedules: schedulesAPI, files: filesAPI, activityLogs: activityLogsAPI,
};

export default domainApi;
