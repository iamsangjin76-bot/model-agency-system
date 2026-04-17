import React from 'react';
import { Instagram, Youtube, User } from 'lucide-react';
import { Model } from '@/types/model';
import { FormSection, FormField, inputClass, textareaClass } from './FormParts';
import KeywordTagInput from '@/components/model/KeywordTagInput';

interface Props {
  formData: Partial<Model>;
  onChange: (field: keyof Model, value: any) => void;
}

export default function SnsKeywordFields({ formData, onChange }: Props) {
  return (
    <>
      {/* SNS */}
      <FormSection title="SNS 정보" icon={Instagram}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="인스타그램 ID">
            <div className="relative">
              <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
              <input type="text" value={formData.instagramId} onChange={e => onChange('instagramId', e.target.value)} className={`${inputClass} pl-12`} placeholder="@username" />
            </div>
          </FormField>
          <FormField label="인스타그램 팔로워">
            <input type="number" value={formData.instagramFollowers || ''} onChange={e => onChange('instagramFollowers', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="125000" />
          </FormField>
          <FormField label="유튜브 채널">
            <div className="relative">
              <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              <input type="text" value={formData.youtubeId} onChange={e => onChange('youtubeId', e.target.value)} className={`${inputClass} pl-12`} placeholder="@channel" />
            </div>
          </FormField>
          <FormField label="유튜브 구독자">
            <input type="number" value={formData.youtubeSubscribers || ''} onChange={e => onChange('youtubeSubscribers', parseInt(e.target.value) || undefined)} className={inputClass} />
          </FormField>
          <FormField label="틱톡 ID">
            <input type="text" value={formData.tiktokId} onChange={e => onChange('tiktokId', e.target.value)} className={inputClass} placeholder="@username" />
          </FormField>
          <FormField label="틱톡 팔로워">
            <input type="number" value={formData.tiktokFollowers || ''} onChange={e => onChange('tiktokFollowers', parseInt(e.target.value) || undefined)} className={inputClass} />
          </FormField>
        </div>
      </FormSection>

      {/* Keywords & Memo */}
      <FormSection title="키워드 및 메모" icon={User}>
        <FormField label="키워드">
          <KeywordTagInput value={formData.keywords || ''} onChange={v => onChange('keywords', v)} />
        </FormField>
        <FormField label="메모" className="mt-4">
          <textarea value={formData.memo} onChange={e => onChange('memo', e.target.value)} className={textareaClass} rows={4} placeholder="추가 메모 사항..." />
        </FormField>
      </FormSection>
    </>
  );
}
