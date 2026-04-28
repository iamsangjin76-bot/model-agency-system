# J-6 Fix Plan — Google graceful + ImagePreviewModal 다크모드

> **작성**: 2026-04-25 (planner 단계, WORKFLOW_v3 Medium)
> **작성자**: planner (claude.ai 아키텍트 역할)
> **상위 SPEC**: SPEC-SEARCH-001 (J-1~J-5) + 인수인계 v17 fix 분류 1-2/3-5
> **연관 baseline**: 2026-04-25 자동 검증 6/6 PASS (A1, A2, H1~H4) + C1~C4 PASS
> **다음 단계**: executor → reviewer → 커밋

---

## 🎯 이번 작업 적합 모델

**Sonnet 4.6** (근거: 두 fix 모두 단일 파일 국지 수정, 신규 SPEC·DB 스키마·인증 변경 없음, Medium 난이도. Opus 불필요)

---

## 📦 묶음 commit 정보

| 항목 | 값 |
|------|------|
| Type | `fix` |
| Scope | `search` + `dark-mode` (한 commit, 두 영역) |
| Title 초안 | `fix(search,ux): graceful google fallback + dark mode coverage for image preview modal` |
| 예상 변경 파일 수 | **1개** (`backend/app/services/search_service.py` 단독 — Fix 3-5 폐기로 ImagePreviewModal.tsx 제외) |
| 예상 추가/수정 라인 | ~15줄 (Fix 1-2 단독) |

---

## 📋 Fix 1-2 — Worker Contract

**목표**: Google Custom Search 직접 호출 분기에서 발생하는 `httpx.HTTPStatusError` 를 사용자 친화적 4xx/503 `HTTPException` 으로 변환하여 FastAPI 500 전파 차단.

**범위**:
- `backend/app/services/search_service.py` 220~224줄 (`search_news` 직접 google 분기)
- `backend/app/services/search_service.py` 250~254줄 (`search_images` 직접 naver 분기 — 이미 graceful이지만 Naver 호출도 동일 패턴 적용해 일관성 확보)
- 추가 검토: 211~219줄(naver→google fallback) 및 241~249줄(google→naver fallback) 의 `except Exception:` 은 이미 적용됨 → 변경 없음
- **신규 import 불필요** — 기존 `import httpx` (15줄) + `from fastapi import HTTPException` (16줄) 그대로 사용
- **catch 예외 (구체 고정)**: `httpx.HTTPStatusError` (4xx/5xx 응답) + `httpx.RequestError` (timeout/connection) 둘만. **광역 `except Exception:` 사용 금지** (다른 버그 가림 위험)

**완료 기준**:
1. **빌드**: `cd backend && python -c "from app.main import app"` 정상 (ImportError 없음, H2 통과)
2. **에러 변환 시각**:
   - `provider=google` 요청 + Google API 503/403/타임아웃 시 → 클라이언트는 HTTP 503 응답 + `detail` 에 사용자 친화적 메시지 (예: `"Google Search API 일시 장애 — 잠시 후 다시 시도해 주세요"` 또는 `"검색 서비스를 일시적으로 사용할 수 없습니다"`)
   - **현재 키 미설정 상태에서는 222/252줄 분기로 떨어져 503 graceful 유지** — 회귀 없음
3. **수동 curl 검증** (reviewer):
   ```bash
   # 키 미설정 분기 (회귀 검증)
   curl -i -H "Authorization: Bearer {token}" "http://localhost:8000/api/news/search?query=test&provider=google"
   # → 503 + "credentials not configured"
   ```
   (Google API 강제 실패 시뮬레이션은 키 설정 후에 별도 — 이번 commit 범위 외)
4. **Naver 회귀 없음**: `provider=naver` 요청은 기존 동작 그대로 (S7 시나리오 통과)
5. **에러 메시지 한국어 + 영어 혼용 일관성**: 기존 `"No news API credentials configured"` 영어 패턴과 `"Google Search API 일시 장애"` 한국어 패턴 — **둘 중 하나로 통일**. 기존 영어 우세이므로 **영어 권장**: `"Google Search API temporarily unavailable"` / `"Naver Search API temporarily unavailable"`

**금지**:
- 다른 파일 수정 금지 (`routers/news.py`, `routers/image_search.py`, `schemas/search.py` 등 손대지 말 것)
- 새 모듈/유틸 추출 금지 — 기존 함수 내부에서만 처리
- 백엔드 라우터 등록 변경 금지
- `_search_naver_news`, `_search_naver_images`, `_search_google_news`, `_search_google_images` 내부 (75/104/141/176줄 `raise_for_status` 부분) 수정 금지 — 호출 측에서만 처리
- `provider` 기본값 변경 금지 (현재 news 기본 `naver`, images 기본 `google` 유지)
- httpx 클라이언트 timeout/retry 정책 변경 금지

---

## ❌ Fix 3-5 폐기 (옵션 B 후 무효 — Lightbox 패턴 디자인 의도와 충돌)

> **결정일**: 2026-04-25 (planner 단계 검수 중 자체 발견 → Jin 옵션 A 결정)
> **사유**: `ImagePreviewModal.tsx` 60줄 직접 분석 결과, **Lightbox(풀스크린 이미지 미리보기) 표준 패턴**으로 `bg-black/90` + `text-white` + `text-gray-300/400` + `bg-white/20 hover:bg-white/30` 구성. **라이트/다크모드 모두 검은 배경 + 흰 텍스트가 의도된 디자인** (Tailwind/MUI/Bootstrap Lightbox 동일 패턴). 흰 배경/검은 텍스트 0건.
> **dark: 강행 시 위험**: `dark:bg-gray-800` 추가 시 라이트모드는 black 유지 / 다크모드만 회색 → Lightbox 표준 깨짐 + 시각 회귀.
> **v17 분류 근거 추정**: 옵션 B 이전 시점 분류로, 실제 디자인 의도 미고려한 정량 분류(grep dark:=0)였을 가능성. Fix 3-10(`border-` 부재)과 동일 패턴.
> **회고 자료 보존**: 본 섹션은 폐기 사유 + 원본 Worker Contract를 의도적으로 남김 — 추후 다크모드 전수 검증 세션 시 참조.

### Fix 3-5 폐기 — 원본 Worker Contract (회고용 보존)

**목표 (원본)**: `ImagePreviewModal.tsx` 60줄 전체에 Tailwind `dark:` 클래스를 추가하여 다크모드 토글 시 배경/테두리/텍스트/아이콘/버튼 hover 모두 정상 대응.

**범위**:
- `frontend/src/components/search/ImagePreviewModal.tsx` (전체 60줄, **단일 파일**)
- 적용 카테고리:
  - 모달 배경 (`bg-white` → `dark:bg-gray-800` 등)
  - 텍스트 색상 (`text-gray-900` → `dark:text-gray-100`)
  - 보조 텍스트 (`text-gray-500` → `dark:text-gray-400`)
  - 버튼 배경/hover (`hover:bg-gray-100` → `dark:hover:bg-gray-700`)
  - 아이콘 색상 (lucide-react `text-gray-*` → `dark:text-gray-*`)
  - 닫기/액션 버튼 테두리 (있으면 `dark:border-*`)
  - 오버레이 (`bg-black/50` 같은 경우는 다크모드와 무관 — 그대로)

**참조 패턴 (톤 일관성)**:
- `frontend/src/pages/DashboardPage.tsx` 169~244줄: `bg-white dark:bg-gray-800` / `border-gray-100 dark:border-gray-700` / `text-gray-500 dark:text-gray-400` / `text-gray-800 dark:text-gray-100` 패턴
- `model-detail/ModelNewsList.tsx`, `model-detail/ModelImageGallery.tsx`: 두 파일 모두 `border-` 패턴 부재 (Fix 3-10 폐기 근거) — 다크모드 클래스는 `bg-`, `text-` 위주만 적용 가능 → 비교 참조 시 주의

**완료 기준**:
1. **빌드**: `cd frontend && npm run build` 정상 종료 (exit 0, H1 통과)
2. **`dark:` 카운트**: 수정 후 `grep -c "dark:" ImagePreviewModal.tsx` ≥ **15** 권장 (60줄 + 다양한 색상 조합 → 최소 15개 클래스)
3. **시각 검증** (Jin 시각 위임):
   - 다크모드 토글 → ImagePreviewModal 열기 → 배경 어두운 색 + 텍스트 밝은 색 + 모서리 자연스러움
   - 닫기 버튼 hover 시 자연스러운 회색
   - 라이트모드 토글 시 기존 디자인 유지 (회귀 없음)
4. **Console 에러 0건** (H4/H5 기준)
5. **TypeScript strict 통과** — 타입 변경 없음 (className 문자열만 수정)

**금지**:
- 다른 컴포넌트 수정 금지 (`ModelNewsList`, `ModelImageGallery`, `NewsSearchPage`, `ImageSearchPage` 등)
- ImagePreviewModal 자체 구조 변경 금지 — JSX 트리, props, 상태, 이벤트 핸들러 모두 유지. **className 문자열만** 수정
- 새 컴포넌트 추출/리팩토링 금지
- ThemeContext 또는 ThemeProvider 수정 금지
- 색상 팔레트(Tailwind config) 수정 금지 — 기존 gray-100~gray-900 + 보조 색상만 사용

---

## ✅ 통합 완료 기준 (Fix 1-2 단독)

> Fix 3-5 폐기로 항목 #4 제거 + #5 "정확히 2개" → "정확히 1개" 정정.

전체 commit이 다음 4건을 모두 만족해야 reviewer 단계 진입:

| # | 검증 | 명령/방법 |
|---|------|----------|
| 1 | Backend import | `cd backend && ./venv/Scripts/python.exe -c "from app.main import app"` → exit 0 |
| 2 | Frontend build (회귀 없음) | `cd frontend && npm run build` → exit 0 + dist/ 생성 |
| 3 | search_service.py 회귀 없음 | C4 admin 로그인 + `provider=google` 요청 시 503 graceful (현재 키 미설정 분기) |
| 5 | 변경 파일 수 | `git diff --name-only HEAD` → 정확히 **1개** (`backend/app/services/search_service.py`) |

---

## 🔍 reviewer 단계 미리 정의 (TRUST 5)

reviewer는 다음 항목을 **명시적으로** 점검:

- **Testability**: try/except 분기 + 다크모드 클래스가 reviewer가 직접 grep/curl로 검증 가능한가
- **Readability**: 에러 메시지 가독성, 클래스 정렬 자연스러움
- **Unambiguous**: 에러 코드 503 vs 502 vs 4xx 의도 명확. 다크모드 클래스 의도 명확
- **Scope**: 정확히 2파일만 수정. 다른 파일 변경 0
- **Truthfulness**: 시각 토글 후 실제 동작 확인 (Jin 시각 단계)

reviewer **프론트엔드 코드 직접 읽기 의무** (v17 원칙 R15) — curl 통과만으로 PASS 금지.

---

## 🚦 워크플로 단계

```
[현재] planner 단계 — 본 문서
   ↓
executor 단계 — 위 두 Worker Contract 그대로 전달
   ↓
[수동 검증] H1~H2 자동 + Jin 시각 H4·H5 + ImagePreviewModal 토글
   ↓
reviewer 단계 — TRUST 5
   ↓
커밋 + push (Lore 형식, scope: search,ux)
   ↓
v19 인수인계 작성 → J-7/J-8 진입 검토
```

---

## 🤖 에이전트 작업 원칙 (R26 재탐색 금지)

executor는 본 plan에 명시된 사실(파일 경로, 줄번호, 예외 타입, status code, 메시지 표현)을 그대로 사용하고 **재탐색·재검증하지 않는다** (v17 원칙 R26 — 재탐색 금지). 추가 정보가 필요한 경우 즉시 작업 중단 후 plan 보완 요청을 통해 처리. 이는 다음을 방지:

- 같은 grep을 여러 번 반복하여 토큰 낭비
- planner 결정 사항을 executor가 임의로 재해석
- scope creep (재탐색 중 다른 파일을 건드리고 싶어지는 충동)

확인된 사실 (executor에 직접 주입):
- 대상 파일: `backend/app/services/search_service.py` (단 하나)
- 변경 위치 1: `search_news` 함수의 직접 google 분기 (220~224줄 주변, `_search_google_news` 호출)
- 변경 위치 2: `search_images` 함수의 직접 naver 분기 (250~254줄 주변, `_search_naver_images` 호출 — Jin 지시 라벨 "_search_google_images"는 오타로 판단, 실제는 Naver. 두 분기 모두 동일 try/except 패턴 적용해 일관성 확보)
- 기존 import 그대로 사용: `import httpx` (15줄), `from fastapi import HTTPException` (16줄)
- catch 예외: `httpx.HTTPStatusError` + `httpx.RequestError` 둘만
- 변환 status code: 503 (둘 모두)
- 메시지: 위치 1 "Google Search API 일시 장애 (HTTP {status})" / "Google Search API 연결 실패", 위치 2 "Naver Search API 일시 장애 (HTTP {status})" / "Naver Search API 연결 실패"

---

## ⚠️ 위험 / 주의

1. **Fix 1-2 영문/한글 메시지 통일** — 기존 코드는 영어. 통일 위해 영어 권장하되 Jin 한국어 선호 시 전부 한국어로 일괄 변경 (단 commit 범위 확장 우려 → 영어 유지가 안전)
2. **httpx Exception 계층** — `HTTPStatusError`는 `HTTPError` 의 자식, `httpx.RequestError` 와 별개. 광역 `Exception` 으로 잡는 게 안전 (네트워크 + 파싱 모두 cover)
3. **Naver fallback 분기 회귀** — 211~219줄 fallback 로직은 기존 `except Exception:` 으로 이미 graceful. 본 fix가 그 동작에 영향 주지 않도록 주의
4. **다크모드 토글 상태** — `ThemeContext` 가 `localStorage` 기반. 테스트 시 Jin이 토글 후 ImagePreviewModal을 열어야 동작 확인 가능
5. **회귀 위험 낮음** — 두 fix 모두 비파괴적 (try/except 추가는 새 분기, dark: 클래스는 기존 클래스에 추가). 롤백 trivial
6. **Phase 중복 실행 금지 (v17 원칙 19)** — 본 fix 후 `/auto review` `/auto secure` 별도 실행 금지. reviewer 단계가 이미 TRUST 5 + 보안 자체 점검

---

## 📂 산출물

- 본 문서: `.autopus/brainstorms/J-6-fix-plan.md` (planner 산출)
- 다음 산출물: executor 결과 (변경 2파일) → reviewer 결과 → Lore 커밋

---

> **다음 행동**: Jin 검토 후 executor 단계 진입. 본 Worker Contract 2개를 executor 에이전트(또는 직접 구현)에 전달.
> **🐙 Sonnet 4.6 권장 — Medium 난이도, scope 명확**
