/**
 * Browser print-to-PDF utility for model profiles.
 * Opens a new window with print-optimised HTML and triggers the print dialog.
 */

interface PrintModel {
  name: string;
  nameEnglish?: string;
  modelType?: string;
  gender?: string;
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  shoeSize?: number;
  birthDate?: string;
  nationality?: string;
  school?: string;
  debut?: string;
  hobby?: string;
  languages?: string;
  agencyName?: string;
  agencyPhone?: string;
  contact1?: string;
  instagramId?: string;
  instagramFollowers?: number;
  youtubeId?: string;
  youtubeSubscribers?: number;
  tiktokId?: string;
  tiktokFollowers?: number;
  careerBroadcast?: string;
  careerMovie?: string;
  careerCommercial?: string;
  careerPrintAd?: string;
  careerTheater?: string;
  careerAlbum?: string;
  careerMusical?: string;
  careerFashionShow?: string;
  careerMusicVideo?: string;
  careerOther?: string;
  modelFee6month?: number;
  modelFee1year?: number;
  currentWorks?: string;
  currentAds?: string;
  keywords?: string;
  memo?: string;
  profile_image?: string;
  [key: string]: any;
}

const MODEL_TYPE_LABELS: Record<string, string> = {
  new_model: '신인 모델',
  influencer: '인플루언서',
  foreign_model: '외국인 모델',
  celebrity: '연예인',
};

const GENDER_LABELS: Record<string, string> = {
  male: '남성', female: '여성', other: '기타',
};

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

function careerSection(model: PrintModel): string {
  const items: Array<[string, string]> = (
    [
      ['방송', model.careerBroadcast],
      ['영화', model.careerMovie],
      ['광고/CF', model.careerCommercial],
      ['지면광고', model.careerPrintAd],
      ['연극', model.careerTheater],
      ['앨범', model.careerAlbum],
      ['뮤지컬', model.careerMusical],
      ['패션쇼', model.careerFashionShow],
      ['뮤직비디오', model.careerMusicVideo],
      ['기타', model.careerOther],
    ] as Array<[string, string | undefined]>
  ).filter((pair): pair is [string, string] => !!pair[1]);
  if (!items.length) return '';
  return `
    <div class="section">
      <div class="section-title">경력</div>
      <table>${items.map(([l, v]) => row(l, v)).join('')}</table>
    </div>`;
}

function snsSection(model: PrintModel): string {
  const items: string[] = [];
  if (model.instagramId) items.push(`Instagram ${model.instagramId} ${model.instagramFollowers ? '(' + fmtNum(model.instagramFollowers) + ')' : ''}`);
  if (model.youtubeId) items.push(`YouTube ${model.youtubeId} ${model.youtubeSubscribers ? '(' + fmtNum(model.youtubeSubscribers) + ')' : ''}`);
  if (model.tiktokId) items.push(`TikTok ${model.tiktokId} ${model.tiktokFollowers ? '(' + fmtNum(model.tiktokFollowers) + ')' : ''}`);
  if (!items.length) return '';
  return `
    <div class="section">
      <div class="section-title">SNS</div>
      <table>${items.map(v => `<tr><td class="value" colspan="2">${v}</td></tr>`).join('')}</table>
    </div>`;
}

function modelCard(model: PrintModel, index: number): string {
  const imgSrc = model.profile_image
    ? (model.profile_image.startsWith('http') ? model.profile_image : `http://localhost:8000${model.profile_image}`)
    : '';

  const measurements: string[] = [];
  if (model.height) measurements.push(`키 ${model.height}cm`);
  if (model.weight) measurements.push(`몸무게 ${model.weight}kg`);
  if (model.bust) measurements.push(`가슴 ${model.bust}`);
  if (model.waist) measurements.push(`허리 ${model.waist}`);
  if (model.hip) measurements.push(`힙 ${model.hip}`);
  if (model.shoeSize) measurements.push(`신발 ${model.shoeSize}`);

  return `
  <div class="model-page${index > 0 ? ' page-break' : ''}">
    <div class="header">
      <div class="agency-name">MODEL AGENCY SYSTEM</div>
      <div class="model-type">${MODEL_TYPE_LABELS[model.modelType || ''] || ''}</div>
    </div>

    <div class="profile-grid">
      <div class="photo-col">
        ${imgSrc
          ? `<img class="profile-img" src="${imgSrc}" alt="${model.name}" />`
          : `<div class="profile-img no-photo"><span>사진 없음</span></div>`}
      </div>

      <div class="info-col">
        <div class="model-name">${model.name}</div>
        ${model.nameEnglish ? `<div class="model-name-en">${model.nameEnglish}</div>` : ''}
        ${measurements.length ? `<div class="measurements">${measurements.join(' · ')}</div>` : ''}

        <div class="section">
          <div class="section-title">기본 정보</div>
          <table>
            ${row('성별', model.gender ? GENDER_LABELS[model.gender] : '')}
            ${row('생년월일', model.birthDate)}
            ${row('국적', model.nationality)}
            ${row('출신학교', model.school)}
            ${row('데뷔', model.debut)}
            ${row('취미/특기', model.hobby)}
            ${row('언어', model.languages)}
          </table>
        </div>

        ${model.agencyName || model.agencyPhone || model.contact1 ? `
        <div class="section">
          <div class="section-title">연락처</div>
          <table>
            ${row('소속사', model.agencyName)}
            ${row('소속사 전화', model.agencyPhone)}
            ${row('연락처', model.contact1)}
          </table>
        </div>` : ''}

        ${model.modelFee6month || model.modelFee1year || model.currentWorks || model.currentAds ? `
        <div class="section">
          <div class="section-title">모델료 / 현황</div>
          <table>
            ${row('6개월', fmtMoney(model.modelFee6month))}
            ${row('1년', fmtMoney(model.modelFee1year))}
            ${row('현재 작품', model.currentWorks)}
            ${row('현재 광고', model.currentAds)}
          </table>
        </div>` : ''}
      </div>
    </div>

    ${careerSection(model)}
    ${snsSection(model)}
    ${model.memo ? `<div class="section"><div class="section-title">메모</div><p class="memo">${model.memo}</p></div>` : ''}

    <div class="footer">CONFIDENTIAL — 본 자료는 외부 공개를 금합니다</div>
  </div>`;
}

export function printModels(models: PrintModel[]): void {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>모델 프로필</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 11pt; color: #1a1a1a; background: white; }

    .model-page { padding: 20mm 18mm; min-height: 100vh; position: relative; }
    .page-break { page-break-before: always; }

    .header { display: flex; justify-content: space-between; align-items: center;
               border-bottom: 2px solid #7c3aed; padding-bottom: 6px; margin-bottom: 16px; }
    .agency-name { font-size: 13pt; font-weight: 700; color: #7c3aed; letter-spacing: 1px; }
    .model-type { font-size: 9pt; color: #6b7280; background: #f3f0ff; padding: 2px 10px; border-radius: 12px; }

    .profile-grid { display: grid; grid-template-columns: 180px 1fr; gap: 20px; margin-bottom: 16px; }

    .profile-img { width: 180px; height: 240px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; }
    .no-photo { width: 180px; height: 240px; border-radius: 8px; border: 1px solid #e5e7eb;
                display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 10pt; }

    .model-name { font-size: 22pt; font-weight: 700; color: #111827; line-height: 1.1; }
    .model-name-en { font-size: 12pt; color: #6b7280; margin-top: 2px; margin-bottom: 10px; }
    .measurements { font-size: 9pt; color: #7c3aed; background: #f3f0ff; padding: 4px 10px;
                    border-radius: 6px; margin-bottom: 12px; display: inline-block; }

    .section { margin-bottom: 12px; }
    .section-title { font-size: 9pt; font-weight: 700; color: #7c3aed; text-transform: uppercase;
                     letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 4px; vertical-align: top; font-size: 9.5pt; line-height: 1.5; }
    td.label { width: 80px; color: #6b7280; white-space: nowrap; }
    td.value { color: #1a1a1a; }

    .memo { font-size: 9.5pt; color: #374151; line-height: 1.6; background: #f9fafb;
            padding: 8px 10px; border-radius: 6px; border-left: 3px solid #7c3aed; }

    .footer { position: absolute; bottom: 10mm; left: 18mm; right: 18mm;
              text-align: center; font-size: 7.5pt; color: #9ca3af;
              border-top: 1px solid #e5e7eb; padding-top: 4px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .model-page { padding: 15mm 15mm; }
    }
  </style>
</head>
<body>
  ${models.map((m, i) => modelCard(m, i)).join('\n')}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('팝업이 차단되었습니다. 팝업 차단을 해제해 주세요.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
