# J-6 부수 이슈 메모 (별개 처리)

> **작성일**: 2026-04-25 (J-6 Fix 1-2 commit `99253666` push 직후, Jin 시각 회귀 검증 PASS 시점)
> **본 commit scope**: search_service.py 단독, 본 메모는 staging 제외 (옵션 B handover/ untracked 정책 준수)
> **상위 인수인계**: v18(2026-04-25) — 본 메모는 v19 작성 시 통합 후보

---

## 시각 회귀 검증 결과 (참고)

이미지 검색 결과 정상 표시 — **8 카드 + 4,588,656 카운트**. 콘솔에 `localhost:8000` 관련 5xx/4xx 에러 **0건**. 검출된 콘솔 메시지는 모두 (a) 크롬 확장 잔여 또는 (b) React Router future warning 만으로 본 fix와 무관.

---

## 별개 이슈 3건

| # | 이슈 | 증상 / 근거 | 우선순위 | 처리 계획 |
|---|------|------------|---------|----------|
| **1** | **외부 이미지 핫링크 차단** | `imgnews.naver.net`, `i1.ruliweb.com` 등 외부 CDN 이미지가 `<img>` 태그에서 로드 안 됨. 검색 결과 카드의 메타데이터(도메인 라벨 / 해상도 N×M)는 정상 표시되나, 실제 이미지는 회색 placeholder로 떨어짐. CORS/Referer/`crossorigin` 정책 추정 — 직접 hotlink 차단 사이트 다수 | 🟡 Medium | **J-8 또는 신규 Phase**에서 백엔드 프록시 도입 (`GET /api/proxy/image?url=...` — `utils/security.py` SSRF 방어 + Pillow 매직 바이트 기반). 또는 검색 시점에 이미지를 미리 다운로드해 로컬 캐시 (디스크 비용 우려). SPEC 별도 작성 권장 |
| **2** | **React Router v7 future flag 경고 2건** | 콘솔에 `v7_startTransition`, `v7_relativeSplatPath` 경고 노출. 동작 영향 없음 (현 v6 기본값 그대로) | 🟢 Low | v7 마이그레이션 시점에 일괄 처리. 현 시점 별도 작업 불필요. v6에서 future flag 활성화는 옵션이지만 회귀 테스트 부담 → Phase I 시점 또는 v7 정식 채택 시 한 번에 |
| **3** | **ImagePreviewModal 다크모드 (Fix 3-5 폐기) 시각 회귀 검증** | 본 commit `99253666` 은 search_service.py 단독 변경이라 ImagePreviewModal 미수정. 그러나 Fix 3-5 폐기 **결정** 자체의 시각 검증(Lightbox 패턴이 라이트/다크 모두 자연스러운가)은 별도 세션에서 확인 후 v17 fix 분류 회고 자료로 정리 | 🟢 Low | 별도 세션. Jin이 다크모드 토글 → 이미지 검색 → 미리보기 모달 열기 → 라이트 / 다크 양쪽 자연스러움 확인. 회귀 발견 시 본 메모를 부활 SPEC으로 승격 |

---

## 본 메모의 staging 정책

- **staging 제외 결정**: 본 commit `99253666` 의 `Constraint: 변경 파일 1개 제한` 준수. 본 메모는 commit scope 외 자료
- **handover/ 폴더 정책**: 옵션 B 마이그레이션 후 handover/ 31개 .md 모두 untracked 유지 (인수인계 v17 명시 — repo 외부 자산 의도). v18은 setup commit 묶음으로 예외적 staging 했으나 본 메모는 그 패턴 적용 안 함
- **다음 git 추적 시점**: v19 인수인계 작성 시 v18처럼 명시적 staging 1건만 (또는 본 메모 내용을 v19에 통합)

---

## 다음 액션 (Jin 결정)

- **A. v19 인수인계 작성** — 본 fix + side-issues + Jin 시각 검증 결과를 v19에 정리 (옵션 B 후 두 번째 인수인계). v18 패턴 답습
- **B. J-7/J-8 진입** — Fix 1-2 완료 + side-issues는 보류 후 다음 Phase 즉시 진입. 인수인계는 누적해서 다음 세션 종료 시 한 번에
- **C. side-issue #1(이미지 프록시) SPEC 작성 진입** — Medium 우선순위지만 J-8과 직결되므로 J-8 SPEC에 통합 가능

권장: **A → B 순** — 인수인계 v19 짧게(50줄 이내) 작성 후 J-8 진입. v18은 215줄 = 큰 마일스톤(setup 정합화), v19는 작은 마일스톤(fix 1-2 + side-issues)이라 부담 적음.

---

> 🐙 본 메모는 J-6 fix 1-2 직후 컨텍스트가 살아있을 때 빠르게 기록. 시간 흐를수록 누락 위험 — 별도 세션에서 다시 추적하기 어려움.
