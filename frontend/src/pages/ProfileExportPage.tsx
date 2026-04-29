import React, { useState, useEffect, useCallback } from 'react';
import {
  Download, Loader2, Search, RefreshCw, FileImage, Presentation,
} from 'lucide-react';
import { modelsAPI, exportAPI, type ExportTemplateKey } from '@/services/domain-api';
import { useToast } from '@/contexts/ToastContext';
import { openPrintWindow, printModels, type TemplateKey } from '@/utils/printProfile';
import {
  TEMPLATES, MODEL_TYPE_LABELS,
} from '../components/export/TemplatePreviewSvgs';
import {
  ModelSelectList, type ModelListItem,
} from '../components/export/ModelSelectList';

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

    // Open popup NOW (synchronous, inside user gesture) before any await
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
      <ModelSelectList
        models={models}
        selected={selected}
        isLoading={isLoading}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />

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
