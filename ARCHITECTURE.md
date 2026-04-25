# ARCHITECTURE — Model Agency Management System

> 생성: 2026-04-25 (`/auto setup`, 옵션 B 마이그레이션 직후)
> 갱신: `/auto sync` 가 자동 갱신함

광고 모델 에이전시 1인 운영자(Jin)를 위한 데스크톱 + 로컬 API 시스템. FastAPI 백엔드와 React/Electron 프론트엔드를 단일 PC에서 함께 구동한다.

---

## 1. 도메인 맵 (5개)

| 도메인 | 책임 | 핵심 파일 | 상태 |
|--------|------|-----------|------|
| **Auth** | 관리자 계정, JWT 발급/검증, 권한 기반 접근 제어 | `routers/auth.py`, `routers/token_refresh.py`, `services/token_service.py` | ✅ SPEC-AUTH-001 완료 |
| **Model** | 모델 프로필 (26필드), 포트폴리오, 파일 업로드 | `routers/models.py`, `models/database.py:Model` | ✅ J-1~J-5 완료 |
| **Casting** | 공고 등록, 모델 N:N 제안, 상태 워크플로 | `routers/castings.py`, `routers/contracts.py` | ✅ F-2 완료 |
| **Settlement** | 계약, 정산, 일정, 월별 통계 | `routers/settlements.py`, `routers/schedules.py` | ✅ F-3 완료 |
| **Media** | 뉴스/이미지 검색, 자동 모델 매칭, 포트폴리오 승격 | `routers/news.py`, `routers/image_search.py`, `services/search_service.py` | ✅ J-1~J-5 완료, J-6 검증 대기 |

부가 도메인: **Notification** (`services/notification_service.py`, 30초 폴링), **Admin** (관리자 CRUD, SUPER_ADMIN 전용), **Stats** (대시보드 통계).

---

## 2. 레이어 구조

```
┌─ Frontend ──────────────────────────────────────────────┐
│  React 18 + TypeScript + Vite + Electron               │
│                                                         │
│  Pages (14)  →  Components  →  Services  →  Contexts   │
│       │                          │                      │
│       └──────────────────────────┴────────┐            │
└──────────────────────────────────────────  │ ───────────┘
                                             │ HTTP/JSON
                                             ↓
┌─ Backend ───────────────────────────────────────────────┐
│  FastAPI 0.109 + Python 3.12                            │
│                                                         │
│  Routers (17)  →  Services  →  Models  →  SQLAlchemy   │
│                                              │          │
│                                              ↓          │
│                                          SQLite DB     │
│                                       (model_agency.db)│
└─────────────────────────────────────────────────────────┘
```

### 2.1 인증 흐름 (SPEC-AUTH-001)

```
[Login] username/password
   ↓
[Server] Access JWT (15분) + Refresh UUID4 (7일, SHA-256 해시 저장)
   ↓
[Frontend] localStorage 에 두 토큰 저장
   ↓
[401 발생] auth-api.ts 인터셉터가 자동 /api/auth/refresh 호출
   ↓
[refreshPromise 싱글톤] 동시 갱신 폭주 방지 (R13)
   ↓
[원 요청 1회 재시도] 성공 → 사용자 모름. 실패 → 로그인 페이지로
```

토큰 재사용 감지 시 family revocation, 시작 시 만료 토큰 자동 청소 (R6, R9).

---

## 3. 의존성 흐름

```
auth-api.ts (singleton refreshPromise)
   ↓
domain-api.ts ─→ {modelsAPI, clientsAPI, castingsAPI, contractsAPI,
                  settlementsAPI, schedulesAPI, newsAPI, imageSearchAPI,
                  notificationsAPI, statsAPI, activityLogsAPI}
   ↓
Pages (14) / Components (search/, model-detail/, ui/)

────────────────────────────────────────────────

backend/app/main.py
   ↓
register routers (17개)
   ↓
routers/{auth, models, casting, ...}
   ↓
services/{token_service, notification_service, search_service}
   ↓
models/{database.py, auth.py, agency.py}
   ↓
SQLAlchemy → SQLite
```

`schemas/` 패키지가 `schemas.py` 파일을 shadowing — 실제 사용되는 것은 `schemas/agency.py`이므로 `schemas.py`에 필드를 추가해도 무시된다. 신규 필드는 반드시 `schemas/agency.py` 또는 `schemas/auth.py` 등 패키지 내 파일에 추가해야 함 (인수인계 v12 교훈 #1, 9시간 디버깅 사례).

---

## 4. 외부 통합

| 공급자 | 용도 | 키 | 상태 |
|--------|------|----|------|
| **Naver Search API** | 뉴스 + 이미지 검색 | `NAVER_CLIENT_ID/SECRET` | ✅ 활성 (25,000 req/일 무료) |
| **Google Custom Search** | 이미지 검색 보조 | `GOOGLE_API_KEY/CX` | ❌ 비활성 (403) |
| Unsplash | 이미지 검색 후보 | `UNSPLASH_ACCESS_KEY` | 미설정 |
| Bing | 이미지 검색 후보 | `BING_SEARCH_API_KEY` | 미설정 |
| Azure CV | 이미지 분석 | `AZURE_COMPUTER_VISION_KEY` | 미설정 |
| **OpenAI** | Phase K-1 프로필 내보내기 대비 | `OPENAI_API_KEY` | 미설정 (예정) |
| **Gemini** | Autopus `--multi` 멀티프로바이더 대비 | `GEMINI_API_KEY` | 미설정 (예정) |

보안 방어: `utils/security.py` 에서 SSRF 차단 + 매직 바이트 검증, 이미지 다운로드 10MB 제한.

---

## 5. 파일 통계

- **소스 파일 96개 / 약 15,350 라인** (backend 39 + frontend 57)
- **15개 백엔드 라우터** (`backend/app/routers/` 의 `__init__.py` 제외): `activity_logs`, `auth`, `castings`, `clients`, `contracts`, `files`, `image_search`, `media`, `models`, `news`, `notifications`, `schedules`, `settlements`, `stats`, `token_refresh`
- **14개 프론트엔드 페이지**

---

## 6. Known Issues (10건, 인수인계 v17 기준)

| # | 분류 | 항목 | 영향 | 처리 계획 |
|---|------|------|------|-----------|
| 1 | 기능 | Excel Import 부재 | 옵션 B로 잃은 기능 (archive 보존) | 별도 SPEC 이식 검토 |
| 2 | 기능 | Share 링크 부재 | 로컬 라인에만 있던 기능 | 우선순위 낮음 |
| 3 | 기능 | TabletNews 페이지 부재 | 로컬 라인에만 있던 페이지 | 우선순위 낮음 |
| 4 | 데이터 | 사용자 입력 데이터 부재 | DB seed 22건만 | 점진적 축적 |
| 5 | API | **Google Custom Search 403** | `GOOGLE_API_KEY/CX` 미설정 → Naver fallback | Jin 키 발급 후 설정 |
| 6 | UX | ImageSearchPage 모델 자동 매칭 미적용 | NewsSearchPage와 UX 불일치 | **J-8 에서 처리** |
| 7 | 환경 | `.env` line 29 파싱 경고 | `python-dotenv could not parse statement` (NEWS_API_KEY 충돌은 해결됨) | 형식 점검 |
| 8 | 구조 | `database.py` 330줄 | 300줄 한도 초과 | 도메인별 분리 SPEC |
| 9 | 구조 | **300줄 초과 파일 10개** | 컨텍스트 윈도우 부담 | (아래 표 참조) |
| 10 | 문서 | v16의 SPEC-SEARCH-001 / SPEC-NOTIF-001 부재 | 코드만 있고 SPEC 문서 없음 | 역설계 SPEC 작성 |

### 300줄 초과 파일 10개 (자동 검증 결과)

> `backend/app/seed.py` 311줄은 시드 데이터 모음으로 의도적으로 길어진 정상 파일이며 분리 대상이 아니므로 본 표에서 제외 (인수인계 v10 명시).

| 파일 | 줄수 |
|------|------|
| `frontend/src/pages/ContractPage.tsx` | 692 |
| `frontend/src/pages/ClientPage.tsx` | 692 |
| `frontend/src/pages/SchedulePage.tsx` | 679 |
| `frontend/src/pages/AdminManagementPage.tsx` | 671 |
| `backend/app/schemas.py` | 573 |
| `backend/app/routers/media.py` | 531 |
| `frontend/src/pages/ProfileExportPage.tsx` | 476 |
| `frontend/src/pages/DashboardPage.tsx` | 445 |
| `frontend/src/pages/SNSAnalyticsPage.tsx` | 390 |
| `backend/app/models/database.py` | 330 |

---

## 7. 개발 워크플로 (요약)

| 난이도 | 트리거 | 워크플로 | 적합 모델 |
|--------|--------|----------|-----------|
| 🟢 Simple | 의존성/오타/설정값 | `executor` 직행 | Sonnet 4.6 |
| 🟡 Medium | API 필드 추가/단일 버그/리팩터 | `planner → executor → reviewer` | Sonnet 4.6 |
| 🔴 Complex | 새 SPEC/DB 스키마/인증 | `architect → planner → executor → reviewer → security-auditor` | Opus 4.6 (설계) → Sonnet (구현) |

상세 규칙은 `.autopus/WORKFLOW.md` (=WORKFLOW_v3) 참조. Worker Contract 4행 템플릿(목표/범위/완료 기준/금지) 필수.

---

## 8. SPEC 현황

| SPEC | 상태 | 산출물 |
|------|------|--------|
| **SPEC-AUTH-001** | ✅ completed | JWT Token Refresh System (Access 15분 + Refresh 7일, family revocation) |

비공식 SPEC (코드만 존재, 문서 부재): SPEC-SEARCH-001 (J-1~J-5), SPEC-NOTIF-001 (G-1).

---

## 9. 참고 문서

- `.autopus/project/product.md` — 제품 비전·기능
- `.autopus/project/structure.md` — 디렉터리 / 에이전트 팀
- `.autopus/project/tech.md` — 기술 스택 / 환경변수
- `.autopus/project/scenarios.md` — E2E 시나리오 12개
- `.autopus/project/canary.md` — 헬스체크 5개
- `.autopus/WORKFLOW.md` — 표준 워크플로 (Phase C v2)
- `handover/Project-M_개발계획서_v1.md` — 누적 개발 이력
- `handover/Project-M_향후개발지시서_v1.md` — 세션 A~O 로드맵
- `handover/Project-M 인수인계 문서 v17.md` — 옵션 B 마이그레이션 기록 (2026-04-24)
- `handover/인수인계_문서_20260419_v17.md` — J-6 Call-1+1b 결과 (2026-04-19, 옵션 B 이전)
- `CHANGELOG.md` — 릴리스 노트

---

> 🐙 Autopus-ADK 기반. 비개발자 1인 운영을 전제로 설계.
