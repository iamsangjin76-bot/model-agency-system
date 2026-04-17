import React from 'react';
import { User } from 'lucide-react';
import { Model, ModelType, GENDER_LABELS } from '@/types/model';
import { FormSection, FormField, inputClass, selectClass } from './FormParts';

interface Props {
  formData: Partial<Model>;
  onChange: (field: keyof Model, value: any) => void;
}

export default function BasicInfoFields({ formData, onChange }: Props) {
  return (
    <FormSection title="기본 정보" icon={User}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="이름" required>
          <input type="text" value={formData.name} onChange={e => onChange('name', e.target.value)} className={inputClass} placeholder="홍길동" />
        </FormField>
        <FormField label="영문 이름">
          <input type="text" value={formData.nameEnglish} onChange={e => onChange('nameEnglish', e.target.value)} className={inputClass} placeholder="Hong Gildong" />
        </FormField>
        <FormField label="생년월일">
          <input type="date" value={formData.birthDate} onChange={e => onChange('birthDate', e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="성별">
          <select value={formData.gender} onChange={e => onChange('gender', e.target.value)} className={selectClass}>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Body measurements */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="font-medium text-gray-700 mb-4">신체 정보</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="키 (cm)">
            <input type="number" value={formData.height || ''} onChange={e => onChange('height', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="170" />
          </FormField>
          <FormField label="체중 (kg)">
            <input type="number" step="0.1" value={formData.weight || ''} onChange={e => onChange('weight', parseFloat(e.target.value) || undefined)} className={inputClass} placeholder="55" />
          </FormField>
          <FormField label="신발 사이즈">
            <input type="number" value={formData.shoeSize || ''} onChange={e => onChange('shoeSize', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="250" />
          </FormField>
        </div>

        {/* Three sizes — foreign models only */}
        {formData.modelType === ModelType.FOREIGN_MODEL && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <FormField label="바스트 (cm)">
              <input type="number" value={formData.bust || ''} onChange={e => onChange('bust', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="82" />
            </FormField>
            <FormField label="허리 (cm)">
              <input type="number" value={formData.waist || ''} onChange={e => onChange('waist', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="59" />
            </FormField>
            <FormField label="힙 (cm)">
              <input type="number" value={formData.hip || ''} onChange={e => onChange('hip', parseInt(e.target.value) || undefined)} className={inputClass} placeholder="88" />
            </FormField>
          </div>
        )}
      </div>
    </FormSection>
  );
}
