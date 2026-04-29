/**
 * HTML-string helper functions for model profile print templates.
 * Each function returns a snippet of HTML that is embedded into the print window.
 */

import type { PrintModel } from '../constants/exportTemplates';
import { GENDER_LABELS } from '../constants/exportTemplates';

// ---------------------------------------------------------------------------
// Number / money formatters
// ---------------------------------------------------------------------------

/** Format a raw integer as a compact human-readable number (e.g. 1.2M, 3.5K). */
export function fmtNum(n?: number | null): string {
  if (n == null) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Format a KRW amount as a compact Korean currency string (억원 / 만원 / 원). */
export function fmtMoney(n?: number | null): string {
  if (!n) return '';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억원`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

// ---------------------------------------------------------------------------
// HTML snippet builders
// ---------------------------------------------------------------------------

/** Return an HTML <tr> row or empty string when value is absent. */
export function row(label: string, value?: string | number | null): string {
  if (!value && value !== 0) return '';
  return `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
}

/** Build a horizontal measurements badge string for a model. */
export function measurementsBadge(model: PrintModel, primary: string, bg: string): string {
  const parts: string[] = [];
  if (model.height)    parts.push(`키 ${model.height}cm`);
  if (model.weight)    parts.push(`몸무게 ${model.weight}kg`);
  if (model.bust)      parts.push(`가슴 ${model.bust}`);
  if (model.waist)     parts.push(`허리 ${model.waist}`);
  if (model.hip)       parts.push(`힙 ${model.hip}`);
  if (model.shoe_size) parts.push(`신발 ${model.shoe_size}`);
  if (!parts.length) return '';
  return `<div class="measurements" style="color:${primary};background:${bg}">${parts.join(' · ')}</div>`;
}

/** Build the career section HTML block, or empty string if no career entries. */
export function careerSection(model: PrintModel, primary: string): string {
  const items: [string, string][] = (
    [
      ['방송', model.career_broadcast], ['영화', model.career_movie],
      ['광고/CF', model.career_commercial], ['지면광고', model.career_print_ad],
      ['연극', model.career_theater], ['뮤지컬', model.career_musical],
      ['패션쇼', model.career_fashion_show], ['뮤직비디오', model.career_music_video],
      ['앨범', model.career_album], ['기타', model.career_other],
    ] as [string, string | undefined][]
  ).filter((p): p is [string, string] => !!p[1]);
  if (!items.length) return '';
  return `
    <div class="section">
      <div class="section-title" style="color:${primary};border-color:${primary}">경력</div>
      <table>${items.map(([l, v]) => row(l, v)).join('')}</table>
    </div>`;
}

/** Build the SNS section HTML block, or empty string if no SNS accounts. */
export function snsSection(model: PrintModel, primary: string, large = false): string {
  const items: string[] = [];
  const sz = large ? '12pt' : '9.5pt';
  if (model.instagram_id)
    items.push(`Instagram @${model.instagram_id}` +
      (model.instagram_followers ? ` <strong>(${fmtNum(model.instagram_followers)})</strong>` : ''));
  if (model.youtube_id)
    items.push(`YouTube ${model.youtube_id}` +
      (model.youtube_subscribers ? ` <strong>(${fmtNum(model.youtube_subscribers)})</strong>` : ''));
  if (model.tiktok_id)
    items.push(`TikTok @${model.tiktok_id}` +
      (model.tiktok_followers ? ` <strong>(${fmtNum(model.tiktok_followers)})</strong>` : ''));
  if (!items.length) return '';
  return `
    <div class="section">
      <div class="section-title" style="color:${primary};border-color:${primary}">SNS</div>
      ${items.map(v => `<div style="font-size:${sz};line-height:1.8;color:#1a1a1a">${v}</div>`).join('')}
    </div>`;
}

/** Return the full inline CSS string for the print window. */
export function baseStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 11pt; color: #1a1a1a; background: white; }
    .model-page { padding: 18mm 16mm; min-height: 100vh; position: relative; }
    .page-break { page-break-before: always; }

    .header { display: flex; justify-content: space-between; align-items: center;
              border-bottom: 2px solid; padding-bottom: 6px; margin-bottom: 14px; }
    .agency-name { font-size: 13pt; font-weight: 700; letter-spacing: 1px; }
    .model-type-badge { font-size: 9pt; padding: 2px 10px; border-radius: 12px; }
    .profile-grid { display: grid; grid-template-columns: 175px 1fr; gap: 18px; margin-bottom: 14px; }
    .profile-img { width: 175px; height: 235px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; }
    .no-photo { width: 175px; height: 235px; border-radius: 8px; border: 1px solid #e5e7eb;
                display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 10pt; }
    .model-name { font-size: 22pt; font-weight: 700; color: #111827; line-height: 1.1; }
    .model-name-en { font-size: 11pt; color: #6b7280; margin-top: 2px; margin-bottom: 8px; }
    .measurements { font-size: 9pt; padding: 3px 10px; border-radius: 6px; margin-bottom: 10px; display: inline-block; }

    .section { margin-bottom: 10px; }
    .section-title { font-size: 8.5pt; font-weight: 700; text-transform: uppercase;
                     letter-spacing: 0.5px; border-bottom: 1px solid; padding-bottom: 2px; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 1.5px 4px; vertical-align: top; font-size: 9pt; line-height: 1.5; }
    td.label { width: 75px; color: #6b7280; white-space: nowrap; }
    td.value { color: #1a1a1a; }
    .memo { font-size: 9pt; color: #374151; line-height: 1.6; background: #f9fafb;
            padding: 7px 10px; border-radius: 6px; border-left: 3px solid; }
    .footer { position: absolute; bottom: 8mm; left: 16mm; right: 16mm;
              text-align: center; font-size: 7pt; color: #9ca3af;
              border-top: 1px solid #e5e7eb; padding-top: 3px; }

    .bold-header { display: flex; justify-content: space-between; align-items: center;
                   padding: 8px 14px; border-radius: 8px; margin-bottom: 14px; }
    .bold-agency { font-size: 12pt; font-weight: 700; color: white; letter-spacing: 1px; }
    .bold-type { font-size: 9pt; color: rgba(255,255,255,0.8); }
    .bold-body { display: grid; grid-template-columns: 180px 1fr; gap: 18px; margin-bottom: 14px; }
    .bold-img { width: 180px; height: 240px; object-fit: cover; border-radius: 10px; }
    .bold-name { font-size: 26pt; font-weight: 900; color: #111827; line-height: 1.1; }
    .bold-name-en { font-size: 11pt; color: #6b7280; margin: 2px 0 8px; }
    .bold-lower { border-top: 1px solid #e5e7eb; padding-top: 10px; }

    .infl-header { display: flex; justify-content: space-between; align-items: center;
                   padding: 10px 16px; border-radius: 10px; margin-bottom: 14px; color: white; }
    .infl-model-name { font-size: 20pt; font-weight: 800; }
    .infl-name-en { font-size: 10pt; opacity: 0.85; }
    .infl-type { font-size: 9pt; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 12px; }
    .infl-body { display: grid; grid-template-columns: 160px 1fr; gap: 16px; margin-bottom: 12px; }
    .infl-photo { width: 160px; height: 210px; object-fit: cover; border-radius: 10px; border: 2px solid #f9a8d4; }
    .infl-stats { display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; }
    .infl-stat-card { border: 2px solid; border-radius: 10px; padding: 8px 12px; min-width: 130px; background: #fff; }
    .infl-platform { font-size: 9pt; color: #6b7280; margin-bottom: 2px; }
    .infl-handle { font-size: 9pt; font-weight: 600; color: #1a1a1a; }
    .infl-count { font-size: 18pt; font-weight: 800; line-height: 1.1; }
    .infl-count-label { font-size: 8pt; color: #9ca3af; }

    .intl-header { display: flex; justify-content: space-between; align-items: center;
                   padding: 8px 14px; border-radius: 8px; margin-bottom: 14px; color: white; }
    .intl-label { font-size: 11pt; font-weight: 700; letter-spacing: 1px; }
    .intl-type { font-size: 9pt; opacity: 0.85; }
    .intl-name-en { font-size: 22pt; font-weight: 800; color: #111827; line-height: 1.1; }
    .intl-name-ko { font-size: 12pt; color: #6b7280; margin: 3px 0 8px; }

    /* ── A4 Landscape print ───────────────────────────────────── */
    @page { size: A4 landscape; margin: 0; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }

      /* Full A4 landscape page: 297mm × 210mm */
      .model-page {
        padding: 9mm 13mm 14mm;
        width: 297mm;
        height: 210mm;
        min-height: unset;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
      }

      /* Photo column — fit within landscape height */
      .profile-grid { grid-template-columns: 54mm 1fr; gap: 14px; }
      .profile-img  { width: 54mm; height: 74mm; }
      .no-photo     { width: 54mm; height: 74mm; }

      /* Bold template */
      .bold-body { grid-template-columns: 57mm 1fr; gap: 14px; }
      .bold-img  { width: 57mm; height: 74mm; }

      /* Influencer template */
      .infl-body  { grid-template-columns: 51mm 1fr; gap: 14px; }
      .infl-photo { width: 51mm; height: 68mm; }

      /* Slightly tighten text for print */
      .model-name  { font-size: 20pt; }
      .bold-name   { font-size: 22pt; }
      .section     { margin-bottom: 7px; }
      td           { font-size: 8.5pt; padding: 1px 3px; }
    }`;
}

// Re-export GENDER_LABELS so callers that import from this module stay consistent
export { GENDER_LABELS };
