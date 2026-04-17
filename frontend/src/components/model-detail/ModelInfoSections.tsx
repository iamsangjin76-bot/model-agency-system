import React from 'react';
import {
  Building2, Phone, User, Globe, Briefcase, Star, Instagram, Tag,
} from 'lucide-react';
import DetailSection from './DetailSection';

// Format follower/subscriber count for display
function fmtNum(n?: number): string {
  if (!n) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// Generic label-value row pair
function Field({ label, value }: { label: string; value?: string | number | null }) {
  const display = value !== undefined && value !== null && value !== '' ? String(value) : '-';
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{display}</p>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {children}
    </div>
  );
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export default function ModelInfoSections({ data }: Props) {
  const isForeign = data.model_type === 'foreign_model';
  const isCelebrity = data.model_type === 'celebrity';

  // Agency section — only when has_agency is truthy
  const agencySection = data.has_agency ? (
    <DetailSection title="소속사 정보" icon={Building2}>
      <FieldGrid>
        <Field label="소속사명" value={data.agency_name} />
        <Field label="소속사 전화" value={data.agency_phone} />
        <Field label="소속사 팩스" value={data.agency_fax} />
        <Field label="매니저" value={data.has_manager ? '있음' : '없음'} />
      </FieldGrid>
    </DetailSection>
  ) : null;

  // Contact section — skip if all fields are empty
  const contactFields = [
    data.contact1, data.contact2, data.contact3, data.contact4,
    data.personal_contact, data.home_phone, data.contact_note,
  ];
  const contactSection = contactFields.some(Boolean) ? (
    <DetailSection title="연락처" icon={Phone}>
      <FieldGrid>
        <Field label="연락처 1" value={data.contact1} />
        <Field label="연락처 2" value={data.contact2} />
        <Field label="연락처 3" value={data.contact3} />
        <Field label="연락처 4" value={data.contact4} />
        <Field label="개인 연락처" value={data.personal_contact} />
        <Field label="집 전화" value={data.home_phone} />
      </FieldGrid>
      {data.contact_note && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">연락시 유의점</p>
          <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-line">{data.contact_note}</p>
        </div>
      )}
    </DetailSection>
  ) : null;

  // Personal info — for non-foreign models
  const personalSection = !isForeign && (data.school || data.debut || data.hobby) ? (
    <DetailSection title="개인 정보" icon={User}>
      <FieldGrid>
        <Field label="출신학교" value={data.school} />
        <Field label="데뷔" value={data.debut} />
        <Field label="취미/특기" value={data.hobby} />
      </FieldGrid>
    </DetailSection>
  ) : null;

  // Foreign model info
  const foreignSection = isForeign ? (
    <DetailSection title="외국인 모델" icon={Globe}>
      <FieldGrid>
        <Field label="국적" value={data.nationality} />
        <Field label="여권번호" value={data.passport_no} />
        <Field label="비자 종류" value={data.visa_type} />
        <Field label="경력 (년)" value={data.career_years} />
        <Field label="입국일" value={data.entry_date} />
        <Field label="출국일" value={data.departure_date} />
      </FieldGrid>
      {data.languages && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">외국어 능력</p>
          <p className="text-sm text-gray-800 mt-0.5">{data.languages}</p>
        </div>
      )}
    </DetailSection>
  ) : null;

  // Career section — skip if all career fields are empty
  const careerItems: [string, string][] = [
    ['방송', data.career_broadcast],
    ['영화', data.career_movie],
    ['광고', data.career_commercial],
    ['지면광고', data.career_print_ad],
    ['연극', data.career_theater],
    ['뮤지컬', data.career_musical],
    ['패션쇼', data.career_fashion_show],
    ['뮤직비디오', data.career_music_video],
    ['앨범', data.career_album],
    ['기타', data.career_other],
  ];
  const careerSection = careerItems.some(([, v]) => v) ? (
    <DetailSection title="경력" icon={Briefcase}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {careerItems.filter(([, v]) => v).map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-line">{value}</p>
          </div>
        ))}
      </div>
    </DetailSection>
  ) : null;

  // Fee section — only for celebrities
  const feeSection = isCelebrity && (data.model_fee_6month || data.model_fee_1year || data.current_works || data.current_ads) ? (
    <DetailSection title="모델료" icon={Star}>
      <FieldGrid>
        <Field
          label="6개월 모델료"
          value={data.model_fee_6month ? `${Number(data.model_fee_6month).toLocaleString()}원` : undefined}
        />
        <Field
          label="1년 모델료"
          value={data.model_fee_1year ? `${Number(data.model_fee_1year).toLocaleString()}원` : undefined}
        />
        <Field label="현재 진행 작품" value={data.current_works} />
        <Field label="현재 광고" value={data.current_ads} />
      </FieldGrid>
    </DetailSection>
  ) : null;

  // SNS section — skip if all empty
  const hasSNS = data.instagram_id || data.youtube_id || data.tiktok_id;
  const snsSection = hasSNS ? (
    <DetailSection title="SNS" icon={Instagram}>
      <FieldGrid>
        {data.instagram_id && (
          <>
            <Field label="인스타그램" value={`@${data.instagram_id}`} />
            <Field label="팔로워" value={fmtNum(data.instagram_followers)} />
          </>
        )}
        {data.youtube_id && (
          <>
            <Field label="유튜브" value={data.youtube_id} />
            <Field label="구독자" value={fmtNum(data.youtube_subscribers)} />
          </>
        )}
        {data.tiktok_id && (
          <>
            <Field label="틱톡" value={`@${data.tiktok_id}`} />
            <Field label="팔로워" value={fmtNum(data.tiktok_followers)} />
          </>
        )}
      </FieldGrid>
    </DetailSection>
  ) : null;

  // Keywords & memo section
  const keywords: string[] = data.keywords
    ? data.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    : [];
  const keywordsSection = (keywords.length > 0 || data.memo) ? (
    <DetailSection title="키워드 & 메모" icon={Tag}>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {keywords.map((kw) => (
            <span key={kw} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
              {kw}
            </span>
          ))}
        </div>
      )}
      {data.memo && (
        <p className="text-sm text-gray-700 whitespace-pre-line">{data.memo}</p>
      )}
    </DetailSection>
  ) : null;

  return (
    <>
      {agencySection}
      {contactSection}
      {personalSection}
      {foreignSection}
      {careerSection}
      {feeSection}
      {snsSection}
      {keywordsSection}
    </>
  );
}
