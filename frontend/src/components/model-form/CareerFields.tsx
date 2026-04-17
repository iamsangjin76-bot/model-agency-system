import React from 'react';
import { User, Globe, Briefcase } from 'lucide-react';
import { Model, ModelType } from '@/types/model';
import { FormSection, FormField, inputClass, textareaClass } from './FormParts';

interface Props {
  formData: Partial<Model>;
  onChange: (field: keyof Model, value: any) => void;
}

export default function CareerFields({ formData, onChange }: Props) {
  const isForeign = formData.modelType === ModelType.FOREIGN_MODEL;
  const isCelebrity = formData.modelType === ModelType.CELEBRITY;

  return (
    <>
      {/* Foreign model info */}
      {isForeign && (
        <FormSection title="외국인 정보" icon={Globe}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="국적">
              <input type="text" value={formData.nationality} onChange={e => onChange('nationality', e.target.value)} className={inputClass} placeholder="슬로바키아" />
            </FormField>
            <FormField label="여권번호">
              <input type="text" value={formData.passportNo} onChange={e => onChange('passportNo', e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="비자 종류">
              <input type="text" value={formData.visaType} onChange={e => onChange('visaType', e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="경력 (년)">
              <input type="number" value={formData.careerYears || ''} onChange={e => onChange('careerYears', parseInt(e.target.value) || undefined)} className={inputClass} />
            </FormField>
            <FormField label="입국일">
              <input type="date" value={formData.entryDate} onChange={e => onChange('entryDate', e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="출국일">
              <input type="date" value={formData.departureDate} onChange={e => onChange('departureDate', e.target.value)} className={inputClass} />
            </FormField>
          </div>
          <FormField label="외국어 능력" className="mt-4">
            <input type="text" value={formData.languages} onChange={e => onChange('languages', e.target.value)} className={inputClass} placeholder="영어, 러시아어, 한국어 기초" />
          </FormField>
        </FormSection>
      )}

      {/* Personal info — non-foreign */}
      {!isForeign && (
        <FormSection title="개인 정보" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="출신학교">
              <input type="text" value={formData.school} onChange={e => onChange('school', e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="데뷔">
              <input type="text" value={formData.debut} onChange={e => onChange('debut', e.target.value)} className={inputClass} placeholder="2020년 OO 드라마" />
            </FormField>
          </div>
          <FormField label="취미/특기" className="mt-4">
            <input type="text" value={formData.hobby} onChange={e => onChange('hobby', e.target.value)} className={inputClass} placeholder="요가, 수영, 피아노" />
          </FormField>
        </FormSection>
      )}

      {/* Career history */}
      <FormSection title="경력 정보" icon={Briefcase}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ['방송', 'careerBroadcast', '2024 OO드라마\n2023 OO예능'],
            ['영화', 'careerMovie', ''],
            ['광고', 'careerCommercial', ''],
            ['지면광고', 'careerPrintAd', ''],
            ['연극', 'careerTheater', ''],
            ['뮤지컬', 'careerMusical', ''],
            ['패션쇼', 'careerFashionShow', ''],
            ['뮤직비디오', 'careerMusicVideo', ''],
            ['앨범', 'careerAlbum', ''],
            ['기타', 'careerOther', ''],
          ] as [string, keyof Model, string][]).map(([label, field, ph]) => (
            <FormField key={field} label={label}>
              <textarea
                value={(formData[field] as string) || ''}
                onChange={e => onChange(field, e.target.value)}
                className={textareaClass}
                rows={3}
                placeholder={ph || undefined}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      {/* Celebrity-only fees */}
      {isCelebrity && (
        <FormSection title="모델료 정보" icon={Briefcase}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="6개월 모델료 (원)">
              <input type="number" value={formData.modelFee6month || ''} onChange={e => onChange('modelFee6month', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="400000000" />
            </FormField>
            <FormField label="1년 모델료 (원)">
              <input type="number" value={formData.modelFee1year || ''} onChange={e => onChange('modelFee1year', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="700000000" />
            </FormField>
            <FormField label="현재 진행 작품">
              <textarea value={formData.currentWorks} onChange={e => onChange('currentWorks', e.target.value)} className={textareaClass} rows={2} />
            </FormField>
            <FormField label="현재 광고">
              <textarea value={formData.currentAds} onChange={e => onChange('currentAds', e.target.value)} className={textareaClass} rows={2} />
            </FormField>
          </div>
        </FormSection>
      )}
    </>
  );
}
