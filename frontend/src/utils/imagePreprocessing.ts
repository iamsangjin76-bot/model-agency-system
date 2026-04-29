/**
 * Image pre-processing utilities for model profile export.
 * Converts remote URLs to base64 data URIs so images render correctly
 * in popup print windows without cross-origin or timing issues.
 */

import type { PrintModel } from '../constants/exportTemplates';

/** Build an absolute URL for a profile_image path. */
export function toAbsoluteUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const base = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL)
    || `${window.location.protocol}//${window.location.hostname}:8000`;
  return `${base}${path}`;
}

/**
 * Fetch a remote image and return it as a base64 data URI.
 * This embeds the image directly in the HTML so it renders correctly
 * inside a popup window — no timing issues, no cross-origin concerns.
 */
export async function toBase64DataUri(path: string): Promise<string> {
  if (!path) return '';
  const url = toAbsoluteUrl(path);
  try {
    const token = localStorage.getItem('access_token') || '';
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return '';
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

/**
 * Pre-fetch all model profile images as base64 data URIs.
 * Returns new model objects with profile_image replaced by data URI.
 */
export async function prefetchImages(models: PrintModel[]): Promise<PrintModel[]> {
  return Promise.all(
    models.map(async (m) => {
      if (!m.profile_image) return m;
      const dataUri = await toBase64DataUri(m.profile_image);
      return { ...m, profile_image: dataUri || m.profile_image };
    })
  );
}

/** Return an <img> tag or a placeholder div for a model's profile photo. */
export function photoOrPlaceholder(model: PrintModel, cls = 'profile-img'): string {
  const src = model.profile_image || '';
  return src
    ? `<img class="${cls}" src="${src}" alt="${model.name}" />`
    : `<div class="${cls} no-photo"><span>사진 없음</span></div>`;
}
