import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Loader2, Search, User,
  CheckSquare, Square, RefreshCw, FileImage, Presentation,
} from 'lucide-react';
import { modelsAPI, exportAPI, type ExportTemplateKey } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import Spinner from '@/components/ui/Spinner';
import { openPrintWindow, printModels, type TemplateKey } from '@/utils/printProfile';

// ---------------------------------------------------------------------------
// Template metadata
// ---------------------------------------------------------------------------
const TEMPLATES: Array<{
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

const MODEL_TYPE_LABELS: Record<string, string> = {
  new_model: '신인 모델', influencer: '인플루언서',
  foreign_model: '외국인 모델', celebrity: '연예인',
};
const MODEL_TYPE_COLORS: Record<string, string> = {
  new_model: 'bg-blue-100 text-blue-700',
  influencer: 'bg-pink-100 text-pink-700',
  foreign_model: 'bg-green-100 text-green-700',
  celebrity: 'bg-purple-100 text-purple-700',
};

interface ModelListItem {
  id: number; name: string; model_type?: string; gender?: string;
  height?: number; instagram_followers?: number; profile_image?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// SVG Template Previews
// ---------------------------------------------------------------------------
function TemplatePreviewA() {
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

function TemplatePreviewB() {
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

function TemplatePreviewC() {
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

function TemplatePreviewD() {
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
// Main page
// ---------------------------------------------------------------------------
export default function ProfileExportPage() {
  const { toast } = useToast();
  const [models, setModels] = useState<ModelListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplateKey>('new_model_a');
  const [format, setFormat] = useState<'pdf' | 'pptx'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await modelsAPI.list({
        size: 200,
        search: search || undefined,
        model_type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setModels(res.items as ModelListItem[]);
    } catch {
      toast.error('모델 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const toggle = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(selected.size === models.length ? new Set() : new Set(models.map(m => m.id)));

  const handleExport = async () => {
    if (selected.size === 0) { toast.warning('모델을 선택해주세요.'); return; }
    if (selected.size > 10) { toast.warning('한 번에 최대 10명까지 내보낼 수 있습니다.'); return; }

    const ids = [...selected];

    // ── PDF: open popup NOW (synchronous, inside user gesture) before any await ──
    let printWin: Window | null = null;
    if (format === 'pdf') {
      printWin = openPrintWindow();
      if (!printWin) {
        toast.error('팝업이 차단되었습니다. 브라우저 주소창 옆 팝업 차단을 해제해 주세요.');
        return;
      }
    }

    setIsExporting(true);
    try {
      if (format === 'pdf' && printWin) {
        const details = await Promise.all(ids.map(id => modelsAPI.get(id)));
        await printModels(details as any[], selectedTemplate as TemplateKey, printWin);
        toast.success(`${details.length}명의 PDF를 준비했습니다. 인쇄 창이 열립니다.`);
      } else {
        const blob = await exportAPI.pptx(ids, selectedTemplate);
        const templateMeta = TEMPLATES.find(t => t.key === selectedTemplate);
        const filename = `model_profiles_${templateMeta?.label || selectedTemplate}.pptx`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${ids.length}명의 PPTX 파일을 다운로드했습니다.`);
      }
    } catch (e: any) {
      if (printWin && !printWin.closed) printWin.close();
      toast.error(e?.message || '내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const fmtNum = (n?: number | null) => {
    if (!n) return null;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">프로필 내보내기</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">템플릿을 선택하고 PDF 또는 PPT로 내보내세요</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || selected.size === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting
            ? <><Loader2 className="w-5 h-5 animate-spin" />생성 중...</>
            : <><Download className="w-5 h-5" />{format === 'pdf' ? 'PDF' : 'PPT'} 내보내기{selected.size > 0 ? ` (${selected.size}명)` : ''}</>}
        </button>
      </div>

      {/* Template selection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">① 템플릿 선택</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.key}
              onClick={() => setSelectedTemplate(tmpl.key)}
              className={`relative rounded-xl border-2 p-0 overflow-hidden transition-all focus:outline-none ${
                selectedTemplate === tmpl.key
                  ? 'shadow-lg scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              style={selectedTemplate === tmpl.key ? { borderColor: tmpl.color } : {}}
            >
              {/* Preview thumbnail */}
              <div className="h-24 bg-gray-50 dark:bg-gray-900">
                {tmpl.preview}
              </div>
              {/* Label */}
              <div className="p-2 text-left border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5">
                  {selectedTemplate === tmpl.key && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: tmpl.color }}
                    />
                  )}
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {tmpl.label}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{tmpl.desc}</p>
              </div>
              {selectedTemplate === tmpl.key && (
                <div
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: tmpl.color }}
                >✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Format selection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">② 출력 형식 선택</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setFormat('pdf')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 font-medium transition-all ${
              format === 'pdf'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            <FileImage className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm">PDF</div>
              <div className="text-[11px] opacity-70 font-normal">브라우저 인쇄 저장</div>
            </div>
          </button>
          <button
            onClick={() => setFormat('pptx')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 font-medium transition-all ${
              format === 'pptx'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            <Presentation className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm">PowerPoint (PPT)</div>
              <div className="text-[11px] opacity-70 font-normal">파일 직접 다운로드</div>
            </div>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">③ 모델 선택</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchModels()}
              placeholder="모델 이름 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[['all', '전체'], ...Object.entries(MODEL_TYPE_LABELS)].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === val
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >{label}</button>
            ))}
          </div>
          <button
            onClick={fetchModels}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Model list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* List header */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={models.length > 0 && selected.size === models.length}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-purple-600"
            />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">전체 선택</span>
          </label>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {isLoading ? '로딩 중...' : `${models.length}명 / ${selected.size}명 선택`}
          </span>
        </div>

        {/* List body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : models.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">해당 조건의 모델이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {models.map(model => {
              const isSel = selected.has(model.id);
              return (
                <div
                  key={model.id}
                  onClick={() => toggle(model.id)}
                  className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors ${
                    isSel ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="shrink-0 text-purple-600">
                    {isSel
                      ? <CheckSquare className="w-5 h-5" />
                      : <Square className="w-5 h-5 text-gray-300 dark:text-gray-600" />}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
                    {model.profile_image
                      ? <img src={model.profile_image} alt={model.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"><User className="w-5 h-5" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{model.name}</span>
                      {model.model_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODEL_TYPE_COLORS[model.model_type] || 'bg-gray-100 text-gray-600'}`}>
                          {MODEL_TYPE_LABELS[model.model_type] || model.model_type}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-2">
                      {model.height && <span>키 {model.height}cm</span>}
                      {model.height && model.instagram_followers && <span>·</span>}
                      {model.instagram_followers && <span>팔로워 {fmtNum(model.instagram_followers)}</span>}
                    </div>
                  </div>
                  {model.gender && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      {model.gender === 'female' ? '여성' : model.gender === 'male' ? '남성' : '기타'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usage guide */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">사용법</p>
        <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>① 원하는 템플릿을 선택하세요 (신인모델 A/B · 인플루언서 · 외국인)</li>
          <li>② 출력 형식을 선택하세요 — PDF(인쇄) 또는 PPT(파일 저장)</li>
          <li>③ 모델을 체크박스로 선택하세요 (최대 10명)</li>
          <li>"내보내기" 버튼을 클릭하면 PDF는 새 창에서, PPT는 파일로 저장됩니다</li>
        </ol>
      </div>
    </div>
  );
}
