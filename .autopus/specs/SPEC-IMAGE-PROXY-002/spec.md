# SPEC-IMAGE-PROXY-002 — 프론트엔드 이미지 프록시 통합 (J-8b)

> **Status**: completed
> **Created**: 2026-04-26
> **Author**: planner (Sonnet 4.6 — `/auto plan --ultrathink`)
> **Parent SPEC**: `SPEC-IMAGE-PROXY-001.md` §5.1 (백엔드 c458bed5 commit으로 §1·§3·§6 종결)
> **Phase**: J-8b (frontend integration only)
> **Test Mode**: SKIP-policy (vitest/Playwright 미구성 — Phase I-3 의존)
>
> **본 파일 (spec.md) 포함 절**: §1·§2·§3·§4·§5·§10·§11
> **관련 파일**: `plan.md` (§7·§9) / `acceptance.md` (§8) / `research.md` (§6·§12)

---

## 1. 개요

J-8a에서 구현된 `/api/proxy/image` 백엔드 엔드포인트를 프론트엔드 이미지 표시에 실제 적용한다. 외부 CDN(Naver·Ruliweb 등)의 핫링크 차단으로 회색 placeholder로 떨어지던 이미지가 정상 렌더링되도록 한다.

**Why**: J-8a는 백엔드 SSRF 방어 + 캐시 + 매직 바이트 검증 인프라를 완성했으나(`c458bed5`), 프론트엔드에서 프록시를 호출하지 않으면 사용자 가시 효과가 0. J-8b가 백엔드 투자의 가시 가치를 실현한다.

**Goals**:
- 외부 이미지 src 4 call site를 `/api/proxy/image?url=...` 경유로 변환
- 로컬 업로드(`/uploads/...` 등 same-origin) 이미지는 프록시 우회 (불필요 호출 방지)
- 프록시 4xx/5xx 응답 시 placeholder 이미지로 graceful fallback (무한 루프 방지)

**Non-goals**:
- ImageSearchPage UX 패리티 (J-8c)
- DashboardPage `:278` PlaceholderPage 다크 짝 (J-8d)
- 통합 KPI 정책 (J-8e — 결정 보류)
- NewsResultCard·ModelNewsList 등 뉴스 도메인 이미지 (별도 SPEC 검토)

---

## 2. 대상 파일 (4개)

| # | 경로 | 액션 | 예상 LoC | 현재 줄수 |
|---|------|------|---------|----------|
| F1 | `frontend/src/utils/imageProxy.ts` | **신규** — `proxify()` 헬퍼 | ~30 | (신규) |
| F2 | `frontend/src/components/search/ImageResultCard.tsx` | **변경** — `<img>` src 1곳 + onError | +3 | 65 |
| F3 | `frontend/src/components/search/ImagePreviewModal.tsx` | **변경** — `<img>` src 1곳 + onError | +3 | 60 |
| F4 | `frontend/src/components/model-detail/ModelImageGallery.tsx` | **변경** — `<img>` src 2곳 (line 71·133) + onError | +6 | 167 |

**총 LoC**: +42줄. **삭제 라인**: 0. **300줄 초과 위험**: 없음.
**디렉토리 신규**: `frontend/src/utils/` (현재 부재 — Glob 확인 2026-04-26).

---

## 3. proxify() 함수 명세 (F1)

### 3.1 시그니처
```typescript
export function proxify(url: string | null | undefined): string;
```

### 3.2 변환 규칙 (우선순위 순)

| 입력 패턴 | 처리 |
|----------|------|
| `null` / `undefined` / 빈 문자열 | 빈 문자열 반환 (`<img src="">` 자체 처리) |
| `data:` / `blob:` 시작 | 원본 그대로 반환 (인라인 데이터, 프록시 불필요) |
| `/api/proxy/image?url=` 시작 | 원본 그대로 반환 (이중 프록시 방지) |
| `/` 시작 (server-relative, 예: `/uploads/...`) | 원본 그대로 반환 (same-origin) |
| `http://` / `https://` 시작 | `/api/proxy/image?url=${encodeURIComponent(url)}` 반환 |
| 그 외 (스킴 미상) | 원본 그대로 반환 (proxify 책임 외 — 백엔드가 422로 처리) |

### 3.3 placeholder 상수
```typescript
export const IMAGE_PROXY_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' " +
  "viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e5e7eb'/>" +
  "<text x='50' y='55' font-size='10' text-anchor='middle' fill='%239ca3af'>" +
  "image unavailable</text></svg>";
```
- 인라인 SVG (네트워크 요청 0)
- 다크/라이트 모드 무관 (회색 톤 — Tailwind `gray-200`/`gray-400` 매칭)
- 라이센스·외부 의존성 없음

### 3.4 onError 헬퍼 (옵션, 인라인 가능)
```typescript
export function handleImgError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === "true") return;  // infinite loop guard
  img.dataset.fallbackApplied = "true";
  img.src = IMAGE_PROXY_PLACEHOLDER;
}
```

---

## 4. 컴포넌트 변경 명세 (F2·F3·F4)

### 4.1 공통 패턴

```tsx
// Before (각 컴포넌트):
<img src={item.thumbnail_url} alt={...} className={...} />

// After:
import { proxify, handleImgError } from "../../utils/imageProxy";

<img
  src={proxify(item.thumbnail_url)}
  alt={...}
  className={...}
  onError={handleImgError}
/>
```

### 4.2 파일별 적용 위치

| 파일 | 위치 | 변경 |
|------|------|------|
| F2 ImageResultCard.tsx | line 21 `<img>` | src + onError 추가 |
| F3 ImagePreviewModal.tsx | line 26 `<img>` | src + onError 추가 |
| F4 ModelImageGallery.tsx | line 71 `<img>` (썸네일) | src + onError 추가 |
| F4 ModelImageGallery.tsx | line 133 `<img>` (라이트박스 또는 미리보기) | src + onError 추가 |

### 4.3 import 경로
- 검색 컴포넌트(F2·F3): `import { proxify, handleImgError } from "../../utils/imageProxy";`
- 모델 상세 컴포넌트(F4): `import { proxify, handleImgError } from "../../utils/imageProxy";`

(둘 다 컴포넌트 디렉토리에서 2단계 상위로 이동하여 utils 진입.)

---

## 5. 디자인 정책

### 5.1 다크모드
- **유지 원칙**: 기존 `dark:` 클래스 패턴 100% 보존
- **ImagePreviewModal lightbox**: `bg-black/90 + text-white` 그대로 (Lightbox 패턴 — 라이트 모드에서도 어두운 배경. J-6 fix 3-5 폐기 결정 존중)
- **placeholder SVG**: `gray-200` 배경 + `gray-400` 텍스트 — 라이트/다크 양쪽에서 자연스러움 확인

### 5.2 에러 처리 정책
- **Network 4xx/5xx**: img onError 발화 → `IMAGE_PROXY_PLACEHOLDER` 으로 src 교체
- **무한 루프 방지**: `dataset.fallbackApplied = "true"` 마커로 1회 한정
- **Console 에러**: 의도된 동작 — 별도 suppress 없음 (개발자가 백엔드 이슈 즉시 인지 가능)

### 5.3 성능 메모
- 백엔드 캐시 TTL 7일 (SPEC-IMAGE-PROXY-001 §3.2) — 같은 URL 반복 호출은 디스크 캐시 히트
- 첫 호출만 외부 fetch 비용 발생, 이후는 로컬 디스크 응답
- 1인 운영 트래픽 기준 부하 무시 가능

---

## 10. 금지 / 범위 외

| # | 금지 항목 | 사유 |
|---|----------|------|
| 1 | `frontend/src/pages/NewsSearchPage.tsx` 수정 | 참조만 가능 (별개 도메인, J-8c 시점에 재검토) |
| 2 | 백엔드 코드 변경 | `c458bed5`로 종결 — 본 SPEC 범위 밖 |
| 3 | `SPEC-IMAGE-PROXY-001.md` 본문 수정 | 별개 SPEC, 백엔드 Phase 종결 표시 유지 |
| 4 | 신규 npm 패키지 추가 | 헬퍼 30줄 + onError 핸들러는 외부 의존성 불필요 |
| 5 | `DashboardPage.tsx` 수정 | 현재 445줄 — 300줄 한도 초과 Known Issue. J-8d에서 별도 처리 |
| 6 | `NewsResultCard.tsx` / `ModelNewsList.tsx` 수정 | 본 SPEC 명시 4 call site 외 (뉴스 도메인 이미지는 별도 검토) |
| 7 | placeholder를 외부 파일로 분리 | 인라인 SVG 정책 (네트워크 요청 0 보장) |

---

## 11. SPEC-IMAGE-PROXY-001과의 관계

| 항목 | SPEC-IMAGE-PROXY-001 | SPEC-IMAGE-PROXY-002 (본 문서) |
|------|---------------------|-------------------------------|
| 범위 | 4대 통합 (proxy / UX 패리티 / PlaceholderPage / KPI) | §5.1 frontend `<img src>` 적용 단독 |
| 백엔드 변경 | 5파일 신규/변경 | 0건 |
| 프론트엔드 변경 | §5.1 (3 컴포넌트, 추상적 명세) | 4 call site 구체 라인 명시 |
| 구현 단계 | Phase J-8a~J-8e | J-8b만 |
| 의존 | (독립) | **prerequisite: J-8a 완료 (commit `c458bed5`)** |
| 본문 수정 | 본 SPEC에서 수정 금지 (불변) | — |

본 SPEC은 SPEC-IMAGE-PROXY-001 §5.1 의 구체 실행 계약이며, 부모 SPEC을 보강하되 수정하지 않는다.

---

> **다음 단계**: Jin 검토 후 status `approved` 변경 → `/auto go SPEC-IMAGE-PROXY-002` (executor 직행, Phase 1.5 SKIP-scaffold 옵션 권장) → npm run build → Jin V1~V8 시각 회귀 → Lore commit
