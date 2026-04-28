/**
 * Browser print-to-PDF utility for model profiles.
 * All field names use snake_case to match FastAPI response directly.
 * Supports 4 template types: new_model_a | new_model_b | influencer | foreign_model
 */

export type TemplateKey = 'new_model_a' | 'new_model_b' | 'influencer' | 'foreign_model';

/** Mirrors the FastAPI ModelDetailResponse schema (snake_case). */
interface PrintModel {
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

const MODEL_TYPE_LABELS: Record<string, string> = {
  new_model: '신인 모델', influencer: '인플루언서',
  foreign_model: '외국인 모델', celebrity: '연예인',
};
const GENDER_LABELS: Record<string, string> = {
  male: '남성', female: '여성', other: '기타',
};

/** Template color palettes */
const PALETTE: Record<TemplateKey, { primary: string; bg: string }> = {
  new_model_a:   { primary: '#7c3aed', bg: '#f3f0ff' },
  new_model_b:   { primary: '#1f2937', bg: '#f9fafb' },
  influencer:    { primary: '#db2777', bg: '#fff0f9' },
  foreign_model: { primary: '#1d4ed8', bg: '#eff6ff' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtNum(n?: number | null): string {
  if (n == null) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtMoney(n?: number | null): string {
  if (!n) return '';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억원`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

function row(label: string, value?: string | number | null): string {
  if (!value && value !== 0) return '';
  return `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
}

/** Build an absolute URL for a profile_image path. */
function toAbsoluteUrl(path: string): string {
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
async function toBase64DataUri(path: string): Promise<string> {
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
async function prefetchImages(models: PrintModel[]): Promise<PrintModel[]> {
  return Promise.all(
    models.map(async (m) => {
      if (!m.profile_image) return m;
      const dataUri = await toBase64DataUri(m.profile_image);
      return { ...m, profile_image: dataUri || m.profile_image };
    })
  );
}

function photoOrPlaceholder(model: PrintModel, cls = 'profile-img'): string {
  const src = model.profile_image || '';
  return src
    ? `<img class="${cls}" src="${src}" alt="${model.name}" />`
    : `<div class="${cls} no-photo"><span>사진 없음</span></div>`;
}

function measurementsBadge(model: PrintModel, primary: string, bg: string): string {
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

function careerSection(model: PrintModel, primary: string): string {
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

function snsSection(model: PrintModel, primary: string, large = false): string {
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

// ---------------------------------------------------------------------------
// Template A — Classic (purple/primary, photo-left)
// ---------------------------------------------------------------------------
function cardClassic(model: PrintModel, idx: number, key: TemplateKey): string {
  const { primary, bg } = PALETTE[key];
  return `
  <div class="model-page${idx > 0 ? ' page-break' : ''}">
    <div class="header" style="border-color:${primary}">
      <div class="agency-name" style="color:${primary}">MODEL AGENCY</div>
      <div class="model-type-badge" style="color:${primary};background:${bg}">
        ${MODEL_TYPE_LABELS[model.model_type || ''] || ''}
      </div>
    </div>
    <div class="profile-grid">
      <div class="photo-col">${photoOrPlaceholder(model)}</div>
      <div class="info-col">
        <div class="model-name">${model.name}</div>
        ${model.name_english ? `<div class="model-name-en">${model.name_english}</div>` : ''}
        ${measurementsBadge(model, primary, bg)}
        <div class="section">
          <div class="section-title" style="color:${primary};border-color:${primary}">기본 정보</div>
          <table>
            ${row('성별', model.gender ? GENDER_LABELS[model.gender] : '')}
            ${row('생년월일', model.birth_date)}
            ${row('국적', model.nationality)}
            ${row('출신학교', model.school)}
            ${row('데뷔', model.debut)}
            ${row('취미/특기', model.hobby)}
            ${row('언어', model.languages)}
          </table>
        </div>
        ${model.agency_name || model.contact1 ? `
        <div class="section">
          <div class="section-title" style="color:${primary};border-color:${primary}">연락처</div>
          <table>
            ${row('소속사', model.agency_name)}
            ${row('소속사 전화', model.agency_phone)}
            ${row('연락처', model.contact1)}
          </table>
        </div>` : ''}
        ${model.model_fee_6month || model.model_fee_1year ? `
        <div class="section">
          <div class="section-title" style="color:${primary};border-color:${primary}">모델료</div>
          <table>
            ${row('6개월', fmtMoney(model.model_fee_6month))}
            ${row('1년', fmtMoney(model.model_fee_1year))}
          </table>
        </div>` : ''}
      </div>
    </div>
    ${careerSection(model, primary)}
    ${snsSection(model, primary)}
    ${model.memo ? `<div class="section"><div class="section-title" style="color:${primary};border-color:${primary}">메모</div>
      <p class="memo" style="border-color:${primary}">${model.memo}</p></div>` : ''}
    <div class="footer">CONFIDENTIAL — 본 자료는 외부 공개를 금합니다</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Template B — Bold (dark gray, large name emphasis)
// ---------------------------------------------------------------------------
function cardBold(model: PrintModel, idx: number): string {
  const { primary, bg } = PALETTE.new_model_b;
  return `
  <div class="model-page bold-page${idx > 0 ? ' page-break' : ''}">
    <div class="bold-header" style="background:${primary}">
      <span class="bold-agency">MODEL AGENCY</span>
      <span class="bold-type">${MODEL_TYPE_LABELS[model.model_type || ''] || ''}</span>
    </div>
    <div class="bold-body">
      <div class="bold-photo">${photoOrPlaceholder(model, 'bold-img')}</div>
      <div class="bold-info">
        <div class="bold-name">${model.name}</div>
        ${model.name_english ? `<div class="bold-name-en">${model.name_english}</div>` : ''}
        ${measurementsBadge(model, primary, bg)}
        <div class="section" style="margin-top:10px">
          <div class="section-title" style="color:${primary};border-color:${primary}">기본 정보</div>
          <table>
            ${row('성별', model.gender ? GENDER_LABELS[model.gender] : '')}
            ${row('생년월일', model.birth_date)}
            ${row('국적', model.nationality)}
            ${row('데뷔', model.debut)}
            ${row('언어', model.languages)}
          </table>
        </div>
        ${model.agency_name || model.contact1 ? `
        <div class="section">
          <div class="section-title" style="color:${primary};border-color:${primary}">연락처</div>
          <table>
            ${row('소속사', model.agency_name)}
            ${row('연락처', model.contact1)}
          </table>
        </div>` : ''}
      </div>
    </div>
    <div class="bold-lower">
      ${careerSection(model, primary)}
      ${snsSection(model, primary)}
    </div>
    <div class="footer" style="background:none">CONFIDENTIAL — 본 자료는 외부 공개를 금합니다</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Template C — Influencer (pink, SNS stats prominent)
// ---------------------------------------------------------------------------
function cardInfluencer(model: PrintModel, idx: number): string {
  const { primary, bg } = PALETTE.influencer;
  function statCard(platform: string, handle: string, count?: number, label = '팔로워'): string {
    return `
    <div class="infl-stat-card" style="border-color:${primary}">
      <div class="infl-platform">${platform}</div>
      <div class="infl-handle">${handle}</div>
      ${count ? `<div class="infl-count" style="color:${primary}">${fmtNum(count)}</div>
      <div class="infl-count-label">${label}</div>` : ''}
    </div>`;
  }
  return `
  <div class="model-page infl-page${idx > 0 ? ' page-break' : ''}">
    <div class="infl-header" style="background:${primary}">
      <div>
        <div class="infl-model-name">${model.name}</div>
        ${model.name_english ? `<div class="infl-name-en">${model.name_english}</div>` : ''}
      </div>
      <div class="infl-type">${MODEL_TYPE_LABELS[model.model_type || ''] || 'INFLUENCER'}</div>
    </div>
    <div class="infl-body">
      <div class="infl-photo-col">
        ${photoOrPlaceholder(model, 'infl-photo')}
        ${measurementsBadge(model, primary, bg)}
      </div>
      <div class="infl-stats">
        ${model.instagram_id ? statCard('📸 Instagram', '@' + model.instagram_id, model.instagram_followers) : ''}
        ${model.youtube_id   ? statCard('🎬 YouTube', model.youtube_id, model.youtube_subscribers, '구독자') : ''}
        ${model.tiktok_id    ? statCard('🎵 TikTok', '@' + model.tiktok_id, model.tiktok_followers) : ''}
        <div class="section" style="margin-top:8px;width:100%">
          <div class="section-title" style="color:${primary};border-color:${primary}">기본 정보</div>
          <table>
            ${row('성별', model.gender ? GENDER_LABELS[model.gender] : '')}
            ${row('국적', model.nationality)}
            ${row('데뷔', model.debut)}
            ${row('언어', model.languages)}
            ${row('소속사', model.agency_name)}
            ${row('연락처', model.contact1)}
          </table>
        </div>
      </div>
    </div>
    ${careerSection(model, primary)}
    <div class="footer" style="background:none">CONFIDENTIAL — 본 자료는 외부 공개를 금합니다</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Template D — Foreign Model (blue, English name primary)
// ---------------------------------------------------------------------------
function cardForeign(model: PrintModel, idx: number): string {
  const { primary, bg } = PALETTE.foreign_model;
  return `
  <div class="model-page intl-page${idx > 0 ? ' page-break' : ''}">
    <div class="intl-header" style="background:${primary}">
      <span class="intl-label">FOREIGN MODEL PROFILE</span>
      <span class="intl-type">${MODEL_TYPE_LABELS[model.model_type || ''] || '외국인모델'}</span>
    </div>
    <div class="profile-grid">
      <div class="photo-col">${photoOrPlaceholder(model)}</div>
      <div class="info-col">
        <div class="intl-name-en">${model.name_english || model.name}</div>
        <div class="intl-name-ko">${model.name}</div>
        ${measurementsBadge(model, primary, bg)}
        <div class="section">
          <div class="section-title" style="color:${primary};border-color:${primary}">국제 정보</div>
          <table>
            ${row('국적', model.nationality)}
            ${row('언어', model.languages)}
            ${row('비자', model.visa_type)}
            ${row('입국일', model.entry_date)}
          </table>
        </div>
        <div class="section">
          <div class="section-title" style="color:${primary};border-color:${primary}">기본 정보</div>
          <table>
            ${row('성별', model.gender ? GENDER_LABELS[model.gender] : '')}
            ${row('생년월일', model.birth_date)}
            ${row('출신학교', model.school)}
            ${row('데뷔', model.debut)}
            ${row('취미/특기', model.hobby)}
          </table>
        </div>
        ${model.agency_name || model.contact1 ? `
        <div class="section">
          <div class="section-title" style="color:${primary};border-color:${primary}">연락처</div>
          <table>
            ${row('소속사', model.agency_name)}
            ${row('소속사 전화', model.agency_phone)}
            ${row('연락처', model.contact1)}
          </table>
        </div>` : ''}
      </div>
    </div>
    ${careerSection(model, primary)}
    ${snsSection(model, primary)}
    <div class="footer" style="background:none">CONFIDENTIAL — 본 자료는 외부 공개를 금합니다</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Shared CSS
// ---------------------------------------------------------------------------
function baseStyles(): string {
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

// ---------------------------------------------------------------------------
// Card dispatcher
// ---------------------------------------------------------------------------
function buildCard(model: PrintModel, idx: number, template: TemplateKey): string {
  switch (template) {
    case 'new_model_b':   return cardBold(model, idx);
    case 'influencer':    return cardInfluencer(model, idx);
    case 'foreign_model': return cardForeign(model, idx);
    default:              return cardClassic(model, idx, template);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Open a popup window and trigger the print dialog.
 *
 * - Images are pre-fetched as base64 so they always render (no timing issues).
 * - After print/cancel the popup closes automatically (onafterprint).
 * - Focus returns to the main app window.
 */
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
 */
export async function printModels(
  models: PrintModel[],
  template: TemplateKey = 'new_model_a',
  win: Window,
): Promise<void> {
  // Pre-fetch all profile images as base64 (popup is open but blank while this runs)
  const resolved = await prefetchImages(models);

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
