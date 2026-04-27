# RESEARCH — SPEC-IMAGE-PROXY-002 (J-8b 프론트엔드 이미지 프록시 통합)

> **Status**: draft
> **Created**: 2026-04-26
> **Author**: planner (Sonnet 4.6 — `/auto plan --ultrathink`)
> **Parent SPEC**: `spec.md` (동일 디렉토리)
> **본 파일 (research.md) 포함 절**: §6·§12 (정책·제약 분석)
> **관련 파일**: `spec.md` (§1·§2·§3·§4·§5·§10·§11) / `plan.md` (§7·§9) / `acceptance.md` (§8)

---

## 6. 검증 정책 (테스트 인프라 부재)

### 6.1 SKIP 항목 (Phase I-3 도입 전 정책)

| 단계 | 정책 | 근거 |
|------|------|------|
| Phase 1.5 (Test Scaffold) | **SKIP** | vitest 미구성 |
| Phase 3 (Testing) | **SKIP** | vitest 미구성 |
| Phase 3.5 (frontend-verify) | **SKIP** | Playwright 미구성 |
| Phase 4 reviewer 'Tested' | **N/A 처리** | 테스트 자산 부재 — Phase I-3에서 회수 |

### 6.2 대체 검증 (Gate 2 + Phase 4 + Jin 수동)

| 검증 | 도구 | 통과 기준 |
|------|------|----------|
| **Gate 2-A 빌드** | `cd frontend && npm run build` | exit 0 (tsc + vite build) |
| **Gate 2-B 타입** | `tsc --noEmit` (npm run build에 포함) | 타입 오류 0 |
| **Phase 4 reviewer TRUST 4** | Readable / Unified / Secured / Trackable | APPROVE |
| **Jin 수동 시각 회귀** | 다크/라이트 토글 × 3 컴포넌트 | 4 call site 모두 정상 표시 |

### 6.3 Jin 수동 시각 회귀 체크리스트

| # | 시나리오 | 기댓값 |
|---|---------|--------|
| V1 | 이미지 검색 → 결과 카드 (라이트 모드) | Naver 이미지 정상 표시 (회색 placeholder 없음) |
| V2 | 이미지 검색 → 결과 카드 (다크 모드) | 다크 배경 + 이미지 정상 |
| V3 | 검색 결과 클릭 → ImagePreviewModal 열림 | 라이트박스(어두움) + 원본 크기 이미지 |
| V4 | 모델 상세 → ModelImageGallery 썸네일 (라이트) | 그리드 정상 표시 |
| V5 | 모델 상세 → ModelImageGallery 썸네일 (다크) | 그리드 + dark border 정상 |
| V6 | 모델 상세 → 갤러리 클릭 → 라이트박스 | 큰 이미지 정상 |
| V7 | 비허용 도메인 검색 (예: facebook 이미지) | placeholder SVG 표시, 무한 reload 없음 |
| V8 | 로컬 `/uploads/...` 이미지 (모델 프로필 사진) | 프록시 우회, 정상 표시 (Network 탭에서 `/api/proxy/image` 호출 없음 확인) |

---

## 12. Review 정책 (TRUST 4)

| 항목 | 상태 | 검증 방법 |
|------|------|----------|
| **T**ested | 🔴 N/A | vitest 미구성 (Phase I-3 의존) — 본 SPEC `검증 정책 §6.1`로 대체 |
| **R**eadable | ✅ 검증 | proxify() 30줄 이내, 변환 규칙 표 명시. 함수명·상수명 명확 |
| **U**nified | ✅ 검증 | 기존 `<img>` 패턴 + dark: 클래스 + Tailwind 토큰 그대로. import 경로 일관 |
| **S**ecured | ✅ 검증 | encodeURIComponent 적용. proxify 입력 화이트리스트 검증 (data:/blob: 우회만, 그 외 백엔드 위임) |
| **T**rackable | ✅ 검증 | commit message에 SPEC-IMAGE-PROXY-002 + c458bed5 prerequisite 명시. @AX:NOTE 추가 가능 (옵션) |

reviewer 4항목 모두 APPROVE 필요. security-auditor: 본 SPEC은 SSRF 방어 자체가 백엔드(c458bed5)에 있으므로 프론트는 input sanitization(encodeURIComponent)만 검증.
