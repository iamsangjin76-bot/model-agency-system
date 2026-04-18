import React from 'react';
import { Building2, Phone } from 'lucide-react';
import { Model } from '@/types/model';
import { FormSection, FormField, inputClass, textareaClass } from './FormParts';

interface Props {
  formData: Partial<Model>;
  onChange: (field: keyof Model, value: any) => void;
}

export default function AgencyContactFields({ formData, onChange }: Props) {
  return (
    <>
      {/* Agency */}
      <FormSection title="소속사 정보" icon={Building2}>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.hasAgency} onChange={e => onChange('hasAgency', e.target.checked)} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600" />
            <span className="text-gray-700 dark:text-gray-200">소속사 있음</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.hasManager} onChange={e => onChange('hasManager', e.target.checked)} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600" />
            <span className="text-gray-700 dark:text-gray-200">매니저 있음</span>
          </label>
        </div>
        {formData.hasAgency && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="소속사명">
              <input type="text" value={formData.agencyName} onChange={e => onChange('agencyName', e.target.value)} className={inputClass} placeholder="ABC엔터테인먼트" />
            </FormField>
            <FormField label="소속사 전화">
              <input type="tel" value={formData.agencyPhone} onChange={e => onChange('agencyPhone', e.target.value)} className={inputClass} placeholder="02-1234-5678" />
            </FormField>
            <FormField label="소속사 팩스">
              <input type="tel" value={formData.agencyFax} onChange={e => onChange('agencyFax', e.target.value)} className={inputClass} placeholder="02-1234-5679" />
            </FormField>
          </div>
        )}
      </FormSection>

      {/* Contact */}
      <FormSection title="연락처 정보" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="연락처 1">
            <input type="tel" value={formData.contact1} onChange={e => onChange('contact1', e.target.value)} className={inputClass} placeholder="010-1234-5678" />
          </FormField>
          <FormField label="연락처 2">
            <input type="tel" value={formData.contact2} onChange={e => onChange('contact2', e.target.value)} className={inputClass} placeholder="010-1234-5678" />
          </FormField>
          <FormField label="연락처 3">
            <input type="tel" value={formData.contact3} onChange={e => onChange('contact3', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="연락처 4">
            <input type="tel" value={formData.contact4} onChange={e => onChange('contact4', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="개인 연락처">
            <input type="tel" value={formData.personalContact} onChange={e => onChange('personalContact', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="집 전화">
            <input type="tel" value={formData.homePhone} onChange={e => onChange('homePhone', e.target.value)} className={inputClass} />
          </FormField>
        </div>
        <FormField label="연락시 유의점" className="mt-4">
          <textarea value={formData.contactNote} onChange={e => onChange('contactNote', e.target.value)} className={textareaClass} rows={3} placeholder="연락 시 참고할 사항을 입력하세요..." />
        </FormField>
      </FormSection>
    </>
  );
}
