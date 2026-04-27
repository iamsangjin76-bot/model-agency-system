# ACCEPTANCE — SPEC-IMAGE-PROXY-002 (J-8b 프론트엔드 이미지 프록시 통합)

> **Status**: draft
> **Created**: 2026-04-26
> **Author**: planner (Sonnet 4.6 — `/auto plan --ultrathink`)
> **Parent SPEC**: `spec.md` (동일 디렉토리)
> **본 파일 (acceptance.md) 포함 절**: §8
> **관련 파일**: `spec.md` (§1·§2·§3·§4·§5·§10·§11) / `plan.md` (§7·§9) / `research.md` (§6·§12)

---

## 8. Acceptance Criteria

다음 모두 만족 시 J-8b PASS:

- [ ] AC1: F1 신규 — `proxify()` + `IMAGE_PROXY_PLACEHOLDER` + `handleImgError` 정의됨
- [ ] AC2: F2·F3·F4 — 4 call site 전부 `proxify()` 경유 확인 (`grep "proxify(" frontend/src/components`)
- [ ] AC3: `npm run build` exit 0
- [ ] AC4: tsc 타입 오류 0건
- [ ] AC5: V1~V6 정상 흐름 PASS (Jin 수동)
- [ ] AC6: V7 fallback 동작 PASS (placeholder, 무한 reload 없음)
- [ ] AC7: V8 로컬 이미지 프록시 우회 PASS (Network 탭 확인)
- [ ] AC8: NewsSearchPage.tsx / 백엔드 / DashboardPage.tsx / SPEC-IMAGE-PROXY-001.md 무변경
- [ ] AC9: 신규 npm 패키지 추가 0건 (`git diff frontend/package.json` 무변경)
