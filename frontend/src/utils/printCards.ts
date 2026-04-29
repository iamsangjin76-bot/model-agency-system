/**
 * HTML card builders for each model profile print template.
 * Each template function returns a full HTML page fragment.
 * Only buildCard() is exported; the per-template functions are internal.
 */

import type { PrintModel, TemplateKey } from '../constants/exportTemplates';
import { PALETTE, MODEL_TYPE_LABELS } from '../constants/exportTemplates';
import { photoOrPlaceholder } from './imagePreprocessing';
import {
  fmtNum, fmtMoney, row, measurementsBadge, careerSection, snsSection,
} from './printHelpers';
import { GENDER_LABELS } from './printHelpers';

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
// Card dispatcher (public API)
// ---------------------------------------------------------------------------

/** Dispatch to the correct template card builder based on the template key. */
export function buildCard(model: PrintModel, idx: number, template: TemplateKey): string {
  switch (template) {
    case 'new_model_b':   return cardBold(model, idx);
    case 'influencer':    return cardInfluencer(model, idx);
    case 'foreign_model': return cardForeign(model, idx);
    default:              return cardClassic(model, idx, template);
  }
}
