/**
 * SVG thumbnail previews for each export template, plus shared template metadata.
 * Used by ProfileExportPage to render the template selection grid.
 */

import React from 'react';
import type { ExportTemplateKey } from '@/services/domain-api';
import { MODEL_TYPE_LABELS, MODEL_TYPE_BADGE_COLORS } from '@/constants/exportTemplates';

// ---------------------------------------------------------------------------
// SVG preview components
// ---------------------------------------------------------------------------

export function TemplatePreviewA() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" fill="white" />
      <rect width="120" height="10" fill="#7c3aed" />
      <rect x="4" y="14" width="28" height="38" rx="2" fill="#ede9fe" />
      <rect x="36" y="14" width="40" height="6" rx="1" fill="#111827" />
      <rect x="36" y="22" width="25" height="3" rx="1" fill="#6b7280" />
      <rect x="36" y="28" width="75" height="1" fill="#7c3aed" opacity="0.5" />
      <rect x="36" y="31" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect x="58" y="31" width="30" height="2" rx="1" fill="#d1d5db" />
      <rect x="36" y="35" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect x="58" y="35" width="25" height="2" rx="1" fill="#d1d5db" />
      <rect x="36" y="39" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect x="58" y="39" width="30" height="2" rx="1" fill="#d1d5db" />
      <rect x="4" y="56" width="112" height="1" fill="#7c3aed" opacity="0.3" />
      <rect x="4" y="59" width="35" height="3" rx="1" fill="#d1d5db" />
      <rect x="4" y="64" width="50" height="3" rx="1" fill="#d1d5db" />
      <rect width="120" height="6" y="74" fill="#7c3aed" />
    </svg>
  );
}

export function TemplatePreviewB() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" fill="white" />
      <rect width="120" height="10" rx="3" fill="#1f2937" />
      <rect x="4" y="14" width="30" height="42" rx="3" fill="#e5e7eb" />
      <rect x="38" y="14" width="50" height="10" rx="2" fill="#111827" />
      <rect x="38" y="26" width="30" height="3" rx="1" fill="#6b7280" />
      <rect x="38" y="32" width="75" height="7" rx="2" fill="#f3f4f6" />
      <rect x="40" y="34" width="60" height="3" rx="1" fill="#9ca3af" />
      <rect x="38" y="42" width="75" height="1" fill="#1f2937" opacity="0.4" />
      <rect x="38" y="45" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect x="60" y="45" width="35" height="2" rx="1" fill="#d1d5db" />
      <rect x="38" y="49" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect x="60" y="49" width="28" height="2" rx="1" fill="#d1d5db" />
      <rect width="120" height="6" y="74" fill="#1f2937" />
    </svg>
  );
}

export function TemplatePreviewC() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" fill="white" />
      <rect width="120" height="14" rx="3" fill="#db2777" />
      <rect x="4" y="18" width="25" height="35" rx="2" fill="#fce7f3" />
      <rect x="33" y="18" width="30" height="10" rx="3" fill="white" stroke="#db2777" strokeWidth="1" />
      <rect x="35" y="20" width="12" height="2" rx="1" fill="#9ca3af" />
      <rect x="35" y="24" width="20" height="5" rx="1" fill="#db2777" />
      <rect x="67" y="18" width="30" height="10" rx="3" fill="white" stroke="#db2777" strokeWidth="1" />
      <rect x="69" y="20" width="12" height="2" rx="1" fill="#9ca3af" />
      <rect x="69" y="24" width="20" height="5" rx="1" fill="#db2777" />
      <rect x="33" y="32" width="64" height="1" fill="#db2777" opacity="0.3" />
      <rect x="33" y="35" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect x="55" y="35" width="35" height="2" rx="1" fill="#d1d5db" />
      <rect x="33" y="39" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect x="55" y="39" width="30" height="2" rx="1" fill="#d1d5db" />
      <rect width="120" height="6" y="74" fill="#db2777" />
    </svg>
  );
}

export function TemplatePreviewD() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" fill="white" />
      <rect width="120" height="10" rx="0" fill="#1d4ed8" />
      <rect x="4" y="14" width="28" height="38" rx="2" fill="#dbeafe" />
      <rect x="36" y="14" width="45" height="8" rx="2" fill="#1d4ed8" opacity="0.8" />
      <rect x="36" y="24" width="25" height="3" rx="1" fill="#6b7280" />
      <rect x="36" y="30" width="75" height="1" fill="#1d4ed8" opacity="0.4" />
      <rect x="36" y="33" width="18" height="2" rx="1" fill="#d1d5db" />
      <rect x="56" y="33" width="30" height="2" rx="1" fill="#d1d5db" />
      <rect x="36" y="37" width="18" height="2" rx="1" fill="#d1d5db" />
      <rect x="56" y="37" width="25" height="2" rx="1" fill="#d1d5db" />
      <rect x="36" y="41" width="18" height="2" rx="1" fill="#d1d5db" />
      <rect x="56" y="41" width="35" height="2" rx="1" fill="#d1d5db" />
      <rect x="36" y="45" width="18" height="2" rx="1" fill="#d1d5db" />
      <rect x="56" y="45" width="20" height="2" rx="1" fill="#d1d5db" />
      <rect width="120" height="6" y="74" fill="#1d4ed8" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Template metadata array
// ---------------------------------------------------------------------------

export const TEMPLATES: Array<{
  key: ExportTemplateKey;
  label: string;
  desc: string;
  color: string;
  preview: React.ReactNode;
}> = [
  {
    key: 'new_model_a',
    label: '신인모델 A타입',
    desc: '클래식 레이아웃 · 보라색 컬러',
    color: '#7c3aed',
    preview: <TemplatePreviewA />,
  },
  {
    key: 'new_model_b',
    label: '신인모델 B타입',
    desc: '볼드 레이아웃 · 다크 컬러',
    color: '#1f2937',
    preview: <TemplatePreviewB />,
  },
  {
    key: 'influencer',
    label: '인플루언서',
    desc: 'SNS 강조 레이아웃 · 핑크 컬러',
    color: '#db2777',
    preview: <TemplatePreviewC />,
  },
  {
    key: 'foreign_model',
    label: '외국인모델',
    desc: '국제 레이아웃 · 블루 컬러',
    color: '#1d4ed8',
    preview: <TemplatePreviewD />,
  },
];

// Re-export from single source of truth so consumers only need one import
export { MODEL_TYPE_LABELS, MODEL_TYPE_BADGE_COLORS as MODEL_TYPE_COLORS };
