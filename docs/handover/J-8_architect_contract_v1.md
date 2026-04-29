# 🐙 J-8 architect Worker Contract — SPEC-IMAGE-PROXY-001 설계

> **작성일**: 2026-04-26
> **이전 문서**: `인수인계_문서_20260426_v20.md`
> **호출 대상**: architect (Opus 4.6)
> **WORKFLOW_v3 난이도**: Complex (SPEC 신규 + 보안 + 정책 결정)

---

## 🎯 목표

J-8 (이미지 검색 UX + 외부 이미지 프록시) 통합 SPEC을 단일 문서로 설계한다.
산출물은 `.autopus/specs/SPEC-IMAGE-PROXY-001.md` (가칭 — architect 재명명 권한 보유).

본 SPEC은 4대 통합 처리 범위를 포함한다:

1. **외부 이미지 프록시** (`/api/proxy/image`) — SSRF 방어 포함 신규 백엔드 라우터
2. **ImageSearchPage UX 패리티** — NewsSearchPage의 검색어 자동 매칭 + 미등록 모델 자동 생성 패턴 동일 적용
3. **PlaceholderPage 다크 짝 부재** — `DashboardPage.tsx:278` 1줄 보정
4. **통합 KPI vs 도메인별 분산 호출 정책** — 권고안 제시 (구현은 본 SPEC 범위 외, J-7 또는 별도 후속에서 처리 가능)

---

## 📐 범위 (Scope)

### 1. 외부 이미지 프록시 (Backend)

**대상 파일 (신규/변경)**:
- 신규: `backend/app/routers/proxy.py`
- 신규/확장: `backend/app/utils/security.py` (기존 SSRF 방어 유틸 확장)
- 신규: `backend/app/services/image_proxy_service.py` (선택 — architect 판단)
- 변경: `backend/app/main.py` (라우터 등록 1줄)
- 변경: `frontend/src/components/search/ImageResultCard.tsx`, `ImagePreviewModal.tsx`, `ModelImageGallery.tsx` — `<img src>`를 프록시 경유로 변경

**엔드포인트**:
- `GET /api/proxy/image?url=<external_url>` — Referer 헤더 우회 + 캐싱 + SSRF 방어

**보안 요건 (SSRF 6항목, v20에서 사전 합의됨)**:
1. **허용 도메인 화이트리스트** — `imgnews.naver.net`, `i1.ruliweb.com` 등 검색 결과에서 실제로 발견되는 도메인만 허용. 환경변수 또는 `config.py`에 정의
2. **Private IP 대역 차단** — `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7` 등
3. **응답 크기 제한** — 기본 10MB (환경변수 `IMAGE_PROXY_MAX_SIZE`)
4. **Timeout** — 기본 5초 (환경변수 `IMAGE_PROXY_TIMEOUT`)
5. **Content-Type 화이트리스트** — `image/jpeg`, `image/png`, `image/webp`, `image/gif`만 (비-이미지 응답 차단)
6. **캐싱 전략** — architect 결정 (디스크 vs 메모리 vs ETag/Cache-Control 헤더 위임). Jin 환경(SQLite + 로컬 파일시스템)에 적합한 단순 전략 권장

**기타 보안**:
- URL 디코딩 1회 한정(이중 인코딩 우회 차단)
- 리다이렉트 follow 비활성화 또는 max 1회 + 재검증
- 응답 헤더 sanitize (`Set-Cookie`, `Content-Disposition` 등 클라이언트 측 부작용 제거)

### 2. ImageSearchPage UX 패리티 (Frontend)

**대상 파일**:
- 변경: `frontend/src/pages/ImageSearchPage.tsx` (전면 리팩터링)
- 참조: `frontend/src/pages/NewsSearchPage.tsx` (패턴 복제 원본)

**완료 요건** (v16 기존 미구현 #40 + 향후개발지시서 세션 B와 동일):
- 모델 선택 드롭다운 제거
- 검색어에서 모델명 자동 추출·매칭
- 미매칭 시 NewsSearchPage와 동일 모달로 모델명 입력
- 모달에서 입력한 이름으로 `modelsAPI.create(model_type='new_model')` 호출 후 이미지 저장 진행
- 다크모드 동작 유지

### 3. PlaceholderPage 다크 짝 보정 (Frontend, 1줄)

**대상**: `frontend/src/pages/DashboardPage.tsx:278`
- 현재: `<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">`
- 변경: `<div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">`

### 4. 통합 KPI 정책 권고안 (의사결정 산출물, 코드 변경 없음)

architect는 다음 두 옵션의 trade-off를 명시하고 **권고안 1건**을 SPEC에 포함한다:
- **옵션 A**: `/api/stats/dashboard` 통합 endpoint로 일원화 → DashboardPage.tsx의 분산 호출 3건 제거
- **옵션 B**: 도메인별 분산 호출 유지 → 현 상태 (단순 비효율)

판단 기준: 추가 호출 비용, 캐싱·갱신 주기, 도메인 책임 분리 원칙, J-7 라이브러리 관리 뷰의 향후 KPI 추가 가능성.

**구현은 본 SPEC 범위 외** — 권고안만 제시. Jin 승인 후 별도 후속 또는 J-7 통합.

---

## ✅ 완료 기준 (Definition of Done)

architect SPEC 문서가 다음 절(節)을 모두 포함해야 한다:

1. **개요** — 4대 범위 요약 + 의존관계 그래프
2. **사용자 흐름** — 이미지 검색 → 프록시 경유 표시 → 자동 매칭 → 저장 (시퀀스 다이어그램 또는 numbered flow)
3. **백엔드 설계** — 신규 라우터 1개 + 신규/확장 utils + main.py 등록 + 환경변수 5개 (`IMAGE_PROXY_ALLOWED_DOMAINS`, `IMAGE_PROXY_MAX_SIZE`, `IMAGE_PROXY_TIMEOUT`, `IMAGE_PROXY_CACHE_DIR`, `IMAGE_PROXY_CACHE_TTL`)
4. **API 명세** — `GET /api/proxy/image` 요청/응답/에러 코드 (4xx 5xx 정책 포함, v18 graceful 503 패턴 준수)
5. **프론트엔드 설계** — `<img src>` 변경 위치 3건 + ImageSearchPage 리팩터링 범위 + PlaceholderPage 1줄
6. **보안 설계** — SSRF 6항목 구체 구현 방안 (화이트리스트 도메인 초기 목록 포함)
7. **캐싱 전략** — 디스크/메모리/헤더 중 1안 결정 + 사유
8. **통합 KPI 권고안** — 옵션 A vs B 비교 + 권고안 1건
9. **구현 Phase 분할** — Phase J-8a (백엔드 프록시) / J-8b (프론트엔드 patch) / J-8c (UX 패리티) / J-8d (PlaceholderPage 1줄) / J-8e (통합 KPI 결정) — architect 재분할 가능
10. **테스트 항목** — curl SSRF 우회 시도 시나리오 5건 이상 + 정상 경로 3건 + frontend 시각 회귀 항목

**산출 형식**: 단일 markdown 파일 (`.autopus/specs/SPEC-IMAGE-PROXY-001.md`)

---

## 🚫 금지 (Constraints)

1. **NewsSearchPage 로직 수정 금지** — UX 패리티는 ImageSearchPage 단방향 복제만 허용
2. **기존 `imageSearchAPI` 시그니처 변경 금지** — 신규 함수 추가는 허용
3. **신규 백엔드 의존성 추가 시 사유 명시 의무** — `httpx`(이미 설치) 외 신규 패키지 도입 시 SPEC 본문에 사유 1줄 이상 기재
4. **통합 KPI 정책의 구현 코드 작성 금지** — 권고안 텍스트만, DashboardPage.tsx 변경 금지
5. **재정찰(re-scouting) 무한 반복 금지** — v20에서 확정된 사실은 그대로 인용:
   - HEAD = `99253666` working tree clean
   - DashboardPage.tsx:96 함수형 DashboardHome (별도 파일 아님)
   - DashboardPage.tsx:278 PlaceholderPage 다크 짝 부재 1줄
   - `/api/stats/dashboard` 통합 endpoint 정상 동작 확인됨
   - `Naver` 활성 / `Google Custom Search API` 미설정 (`.env` 빈 값)
6. **Worker Contract 외 범위 추가 금지** — 본 Contract 4대 범위 밖의 항목(예: J-7, K-1, SNS-1)은 SPEC 본문에 언급해도 설계 대상 아님

---

## 🔐 보안 사전 메모 (v20 합의 사항 재확인)

architect는 SSRF 방어 6항목을 **반드시 구체 구현 방안과 함께** SPEC에 포함해야 한다. 추상 원칙 나열만으로는 불충분하다.

예: "허용 도메인 화이트리스트" → `["imgnews.naver.net", "*.naver.net", "i1.ruliweb.com", ...]` 초기 목록 명시 + 와일드카드 매칭 정책 (suffix-only vs glob)

다음 단계에서 security-auditor가 본 SPEC을 OWASP A10(SSRF) 기준으로 재검토할 예정이므로, 사전 방어선을 SPEC 단계에서 단단히 잡아야 한다.

---

## 📋 architect 산출 후 즉시 확인 항목 (Jin 검토용)

architect가 SPEC 문서를 산출하면, 아키텍트(claude.ai)는 다음 항목을 자동 검증하여 Jin님 검토에 회부한다:

| # | 항목 | 검증 방법 |
|---|---|---|
| 1 | SPEC 절(節) 10개 모두 존재 | grep 헤더 카운트 |
| 2 | SSRF 6항목 모두 구체 구현 방안 포함 | grep 키워드 매칭 |
| 3 | 환경변수 5개 모두 명시 | grep `IMAGE_PROXY_*` |
| 4 | 통합 KPI 권고안 1건 명확 | 권고안 섹션 존재 확인 |
| 5 | Phase 분할 5단계 (J-8a~J-8e) | 헤더 매칭 |
| 6 | 금지 6항목 위반 0건 | 키워드 grep |

자동 검증 통과 시 Jin님 시각 검토 1회로 SPEC 승인. 미통과 시 architect 재호출.

---

> **다음 분기점**: architect SPEC 산출 → 아키텍트 자동 검증 6항목 → Jin 승인 → planner 진입
