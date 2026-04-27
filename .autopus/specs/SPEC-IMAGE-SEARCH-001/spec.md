# SPEC-IMAGE-SEARCH-001 — ImageSearchPage 자동 매칭 UX 패리티 (J-8c)

> **Status**: approved
> **Created**: 2026-04-27
> **Author**: planner (Sonnet 4.6 — `/auto plan --skip-prd`)
> **Phase**: J-8c
> **Test Mode**: SKIP-policy (vitest/Playwright 미구성 — Phase I-3 의존)

---

## 1. 개요

ImageSearchPage의 저장 플로우를 NewsSearchPage의 자동 매칭 패턴으로 교체한다.  
현재 수동 드롭다운으로 모델을 선택해야 저장이 가능한데, 뉴스 검색과 동일하게  
검색어에서 모델명을 자동 추출 → 1명이면 즉시 저장 / 복수면 피커 / 미등록이면 신규 생성 모달을 표시한다.

**Why**: Jin이 뉴스 검색과 이미지 검색의 저장 플로우가 달라 혼란스럽다고 표현.  
뉴스에서는 검색어로 자동 매칭되는데 이미지에서는 모델을 직접 골라야 함. UX 패리티 요구.

**Goals**:
- 수동 모델 드롭다운 제거, 자동 매칭으로 교체
- NewsSearchPage의 3-way 분기 로직 복제 (1명 / 복수 / 0명)
- 신규 모델 생성 → 즉시 저장 플로우 추가
- 기존 이미지 그리드 레이아웃·프리뷰 모달 유지

**Non-goals**:
- 백엔드 변경
- ImagePreviewModal 수정
- imageSearchAPI 인터페이스 변경
- 뉴스 검색 페이지 변경

---

## 2. 대상 파일

| # | 경로 | 액션 | 현재 줄수 | 예상 결과 |
|---|------|------|----------|----------|
| F1 | `frontend/src/pages/ImageSearchPage.tsx` | **변경** — 드롭다운 제거, 자동 매칭 추가 | 285줄 | ~285줄 (net ±0) |

**300줄 초과 위험**: 없음 (삭제 ~40줄, 추가 ~45줄, 순증 +5줄 이내).

---

## 3. 변경 명세

### 3.1 제거 항목

| 항목 | 코드 |
|------|------|
| `selectedModelId` state | `useState<number \| null>(null)` |
| `showModelDropdown` state | `useState(false)` |
| `selectedModel` 계산 | `models.find(...)` |
| `ChevronDown` import | lucide-react |
| 모델 드롭다운 UI | lines 128-160 (드롭다운 버튼 + 오버레이 div) |
| 기존 `handleSave` (수동 모델 선택 버전) | lines 75-95 |

### 3.2 추가 항목

```typescript
// Auto-match states (NewsSearchPage 패턴 복제)
const [matchingModels, setMatchingModels] = useState<Model[]>([]);
const [showNameModal, setShowNameModal] = useState(false);
const [newModelName, setNewModelName] = useState('');
const [isCreating, setIsCreating] = useState(false);
```

### 3.3 saveToModel 헬퍼 (NewsSearchPage 동일)

```typescript
const saveToModel = async (model: Model) => {
  setIsSaving(true);
  setMatchingModels([]);
  setShowNameModal(false);
  try {
    const selected = [...checkedImages].map(i => images[i]);
    const result = await imageSearchAPI.save({ model_id: model.id, images: selected }) as unknown as { saved?: number; failed?: number } | void;
    const modelName = model.name;
    if (result && typeof result === 'object' && 'failed' in result && (result.failed ?? 0) > 0) {
      toast.warning?.(`${result.saved ?? 0}개 저장, ${result.failed}개 실패`);
    } else {
      toast.success(`${checkedImages.size}개의 이미지가 ${modelName}에 저장되었습니다`);
    }
    setCheckedImages(new Set());
  } catch {
    toast.error('이미지 저장에 실패했습니다.');
  } finally {
    setIsSaving(false);
  }
};
```

### 3.4 handleSave 교체 (자동 매칭 3-way 분기)

```typescript
const handleSave = () => {
  if (checkedImages.size === 0) { toast.error('저장할 이미지를 선택해주세요.'); return; }
  const matched = models.filter(m => searchQuery.includes(m.name));
  if (matched.length === 1) { saveToModel(matched[0]); return; }
  if (matched.length > 1) { setMatchingModels(matched); return; }
  // 0 matches — ask for new model name
  setNewModelName(searchQuery.trim().split(/\s+/)[0] ?? searchQuery.trim());
  setShowNameModal(true);
};
```

### 3.5 handleCreateAndSave (NewsSearchPage 동일, 이미지 버전)

```typescript
const handleCreateAndSave = async () => {
  if (!newModelName.trim()) return;
  setIsCreating(true);
  try {
    const created = await modelsAPI.create({ name: newModelName.trim(), model_type: 'new_model' });
    setModels(prev => [...prev, created]);
    const selected = [...checkedImages].map(i => images[i]);
    await imageSearchAPI.save({ model_id: created.id, images: selected });
    toast.success(`'${created.name}' 모델이 생성되고 ${checkedImages.size}개의 이미지가 저장되었습니다`);
    setCheckedImages(new Set());
    setShowNameModal(false);
  } catch {
    toast.error('모델 생성 또는 저장에 실패했습니다.');
  } finally {
    setIsCreating(false);
  }
};
```

### 3.6 closeModal 헬퍼

```typescript
const closeModal = () => { setMatchingModels([]); setShowNameModal(false); };
```

### 3.7 입력 placeholder 변경

```
Before: "검색할 이름을 입력하세요..."
After:  "모델 이름을 포함하여 검색하세요 (예: 한서주 광고)"
```

### 3.8 설명 문구 변경

```
Before: "모델 이름으로 이미지를 검색하고 저장하세요"
After:  "모델 이름을 검색어에 포함하면 저장 시 자동으로 해당 모델에 연결됩니다"
```

### 3.9 provider 기본값

```
Before: useState<'google' | 'naver'>('google')
After:  useState<'naver' | 'google'>('naver')
```

(Google 이미지 검색은 현재 비활성. Naver를 기본으로.)

### 3.10 통합 모달 UI (NewsSearchPage 동일 패턴, 이미지용 메시지)

```tsx
{/* Unified modal: multi-match picker OR new model name input */}
{(matchingModels.length > 1 || showNameModal) && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {showNameModal ? '새 모델 생성' : '저장할 모델 선택'}
        </h3>
        <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {showNameModal ? (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            등록된 모델이 없습니다. 새 모델을 생성하고 이미지를 저장합니다.
          </p>
          <input
            value={newModelName} onChange={e => setNewModelName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateAndSave()}
            placeholder="모델 이름 입력" autoFocus
            className="w-full px-4 py-2.5 mb-4 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
          <div className="flex gap-2">
            <button onClick={handleCreateAndSave} disabled={isCreating || !newModelName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" />생성 중...</> : '생성 후 저장'}
            </button>
            <button onClick={() => setShowNameModal(false)}
              className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            검색어와 일치하는 모델이 여러 명입니다. 저장할 모델을 선택하세요.
          </p>
          <div className="space-y-2">
            {matchingModels.map(m => (
              <button key={m.id} onClick={() => saveToModel(m)}
                className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors flex items-center justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-100">{m.name}</span>
                {m.english_name && <span className="text-sm text-gray-400 dark:text-gray-500">{m.english_name}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  </div>
)}
```

### 3.11 import 변경

```typescript
// Before:
import { Search, Image as ImageIcon, Download, Loader2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// After:
import { Search, Image as ImageIcon, Download, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
```

---

## 4. 검증 기준 (Acceptance)

| ID | 검증 항목 |
|----|----------|
| V1 | `npm run build` 0 TS 오류 |
| V2 | 모델 드롭다운 UI 제거 확인 — `showModelDropdown` 코드 없음 |
| V3 | 검색어에 모델명 포함 시 이미지 체크 후 저장 버튼 → 드롭다운 없이 즉시 저장 |
| V4 | 검색어에 모델명 없으면 신규 모델 생성 모달 표시 |
| V5 | 복수 모델 일치 시 피커 모달 표시 |
| V6 | 이미지 그리드·프리뷰 모달 정상 유지 |
| V7 | 다크 모드: 새 모달 dark: 클래스 누락 없음 |

---

## 5. 금지 / 범위 외

| # | 금지 항목 |
|---|----------|
| 1 | 백엔드 코드 변경 |
| 2 | ImagePreviewModal.tsx 수정 |
| 3 | NewsSearchPage.tsx 수정 |
| 4 | imageSearchAPI 인터페이스 변경 |
| 5 | 신규 npm 패키지 추가 |
| 6 | 300줄 초과 |

---

> **다음 단계**: `/auto go SPEC-IMAGE-SEARCH-001` — executor 직행
