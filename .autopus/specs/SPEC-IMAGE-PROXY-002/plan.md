# PLAN — SPEC-IMAGE-PROXY-002 (J-8b 프론트엔드 이미지 프록시 통합)

> **Status**: draft
> **Created**: 2026-04-26
> **Author**: planner (Sonnet 4.6 — `/auto plan --ultrathink`)
> **Parent SPEC**: `spec.md` (동일 디렉토리)
> **본 파일 (plan.md) 포함 절**: §7·§9
> **관련 파일**: `spec.md` (§1·§2·§3·§4·§5·§10·§11) / `acceptance.md` (§8) / `research.md` (§6·§12)

---

## 7. 구현 Phase

### Phase J-8b-1: F1 헬퍼 신규
1. `frontend/src/utils/` 디렉토리 생성
2. `imageProxy.ts` 작성 (proxify + IMAGE_PROXY_PLACEHOLDER + handleImgError)
3. tsc 타입 체크 단독 통과 확인

### Phase J-8b-2: F2·F3·F4 컴포넌트 변경
1. F2 ImageResultCard line 21 — proxify + onError
2. F3 ImagePreviewModal line 26 — proxify + onError
3. F4 ModelImageGallery line 71 — proxify + onError
4. F4 ModelImageGallery line 133 — proxify + onError

각 파일 import 1줄 + src 변환 + onError 핸들러 부착.

### Phase J-8b-3: 빌드 검증 (Gate 2)
```powershell
cd frontend
npm run build
# 기대: exit 0, dist/ 생성, 타입/린트 오류 0
```

### Phase J-8b-4: Jin 수동 시각 회귀 (V1~V8)
다크/라이트 토글하며 `research.md` §6.3 체크리스트 8항목 확인.

### Phase J-8b-5: Lore commit (§9 뼈대 사용)

---

## 9. Lore commit 뼈대

```
feat(frontend,proxy): integrate /api/proxy/image into search and gallery components

J-8b: 외부 이미지 프록시 프론트엔드 통합 (SPEC-IMAGE-PROXY-002)

신규:
- frontend/src/utils/imageProxy.ts — proxify() + placeholder + onError 핸들러

변경 (4 call site):
- frontend/src/components/search/ImageResultCard.tsx (line 21)
- frontend/src/components/search/ImagePreviewModal.tsx (line 26)
- frontend/src/components/model-detail/ModelImageGallery.tsx (line 71, 133)

proxify() 변환 규칙: 외부 http(s) → /api/proxy/image?url=encodeURIComponent.
data:/blob:/server-relative(/) 입력은 우회. 이미 프록시된 URL 이중 적용 방지.
onError → IMAGE_PROXY_PLACEHOLDER (인라인 SVG, 무한 루프 가드 dataset.fallbackApplied).

검증:
- npm run build exit 0 (tsc + vite)
- Jin 수동 시각 회귀 V1~V8 PASS (라이트/다크 × 3 컴포넌트 + fallback + 로컬 우회)
- 백엔드 c458bed5 prerequisite

신규 npm 패키지 0건. SPEC-IMAGE-PROXY-001 §5.1 후속.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
