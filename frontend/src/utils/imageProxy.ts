// @AX:NOTE SPEC-IMAGE-PROXY-002 §3 — proxify utility for J-8a backend integration (commit c458bed5)
//
// Converts external image URLs to the backend proxy path (/api/proxy/image)
// while leaving local, relative, data, and already-proxied URLs unchanged.
//
// Backend prerequisite: GET /api/proxy/image?url=<encoded> with SSRF defense
// (see backend/app/routers/proxy.py + image_proxy_service.py, J-8a c458bed5).

import type { SyntheticEvent } from "react";

/**
 * Convert external HTTP(S) image URL to the backend proxy path.
 *
 * Bypass cases (return original):
 *   - null/undefined/empty → ""
 *   - data: / blob: scheme (inline data, no network)
 *   - /api/proxy/image?url=... (already proxied; double-proxy guard)
 *   - / (server-relative, same-origin)
 *   - unknown scheme (caller responsibility; backend returns 422)
 *
 * @see SPEC-IMAGE-PROXY-002 §3.2 변환 규칙
 */
export function proxify(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/api/proxy/image?url=")) return url;
  if (url.startsWith("/")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/proxy/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Inline SVG placeholder shown when the proxy fetch fails (4xx/5xx).
 * Network requests = 0. Dark/light mode neutral (Tailwind gray tokens).
 */
export const IMAGE_PROXY_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' " +
  "viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e5e7eb'/>" +
  "<text x='50' y='55' font-size='10' text-anchor='middle' fill='%239ca3af'>" +
  "image unavailable</text></svg>";

/**
 * onError handler: swap src to the placeholder once.
 * Uses a dataset marker to prevent infinite reload loops.
 *
 * @see SPEC-IMAGE-PROXY-002 §5.2 에러 처리 정책
 */
export function handleImgError(e: SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === "true") return;
  img.dataset.fallbackApplied = "true";
  img.src = IMAGE_PROXY_PLACEHOLDER;
}
