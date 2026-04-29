/**
 * Browser print-to-PDF utility for model profiles.
 * Orchestrates image pre-fetching, card rendering, and popup window printing.
 *
 * All field names use snake_case to match FastAPI response directly.
 * Supports 4 template types: new_model_a | new_model_b | influencer | foreign_model
 */

// Re-export types so existing callers can still import from this module
export type { TemplateKey, PrintModel } from '../constants/exportTemplates';

import type { TemplateKey, PrintModel } from '../constants/exportTemplates';
import { prefetchImages } from './imagePreprocessing';
import { buildCard } from './printCards';
import { baseStyles } from './printHelpers';

/**
 * Open the print popup window synchronously.
 * MUST be called before any await/async operations to stay in the user gesture context.
 * Otherwise browsers will block the popup.
 */
export function openPrintWindow(): Window | null {
  return window.open(
    '',
    '_blank',
    'width=1000,height=720,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no',
  );
}

/**
 * Write model profiles into an already-opened popup window and trigger print.
 * Call openPrintWindow() synchronously first, then this function with the result.
 *
 * - Images are pre-fetched as base64 so they always render (no timing issues).
 * - After print/cancel the popup closes automatically (onafterprint).
 * - Focus returns to the main app window.
 */
export async function printModels(
  models: PrintModel[],
  template: TemplateKey = 'new_model_a',
  win: Window,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  // Pre-fetch all profile images as base64 (popup is open but blank while this runs)
  const resolved = await prefetchImages(models, onProgress);

  if (win.closed) return;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>모델 프로필 — ${resolved.map(m => m.name).join(', ')}</title>
  <style>${baseStyles()}</style>
</head>
<body>
  ${resolved.map((m, i) => buildCard(m, i, template)).join('\n')}
</body>
</html>`;

  win.document.write(html);
  win.document.close();

  // Auto-close popup after print dialog is dismissed
  win.onafterprint = () => win.close();
  win.focus();
  setTimeout(() => { if (!win.closed) win.print(); }, 300);
}
