# Structure — Model Agency Management System

> 생성: 2026-04-25 (`/auto setup`, 옵션 B 마이그레이션 후 첫 동기화)
> 최종 갱신: 2026-04-27 (`/auto sync SPEC-IMAGE-PROXY-002`, J-8b 완료 후)

## 저장소 레이아웃 (옵션 B 후 G드라이브 기준)

```
G:\Project M\
├── _archive_local_v13_20260423\         # 옵션 B로 격리한 로컬 Phase 13 라인 (참고용, 건드리지 않음)
├── _backup_20260423_211541.zip          # 1.7GB 완전 백업 (옵션 B 직전 시점)
└── model-agency-system\                  # ★ 현재 작업 폴더 (원격 GitHub clone)
    │
    ├── handover\                         # 인수인계 자산 31개 .md (언더스코어 없음)
    │   ├── Project-M 인수인계 문서 v17.md  # 옵션 B 마이그레이션 기록 (2026-04-24)
    │   ├── 인수인계_문서_20260419_v17.md   # J-6 Call-1+1b 결과 (옵션 B 이전)
    │   ├── Project-M_개발계획서_v1.md       # 누적 정리본
    │   ├── Project-M_향후개발지시서_v1.md   # 세션 A~O 로드맵
    │   ├── autopus_jarvis_integration_analysis_v2.md
    │   ├── WORKFLOW_v3.md                  # = .autopus/WORKFLOW.md
    │   ├── 기타 SPEC/설계/진단 문서 8개 (Phase_D-2_설계문서.md, autopus_jarvis_integration_analysis.md, constraints_yaml_replacement_design.md, project_m_actual_state_diagnosis.md, session_A_step_A2_contract_v2.md, 구현계획서_Model_Agency_System.md, WORKFLOW.md, WORKFLOW_v2.md)
    │   └── 인수인계_문서.md + 인수인계_문서_20260416.md (무번호 2개) + v2~v16 시리즈 (15개) = 17개 (옵션 B 이전 역사 자료. v17 두 개는 위 14·15줄에 별도 명시)
    │
    ├── backend\                          # Python FastAPI (port 8000)
    │   ├── venv\                         # Python 가상환경 (Poetry)
    │   ├── .env                          # NAVER + IMAGE_PROXY_* 키 활성, line 29 파싱 경고
    │   ├── model_agency.db               # SQLite (seed 22건)
    │   ├── proxy_cache\                  # ★ J-8a 신규 (런타임 디스크 캐시, .gitignore)
    │   ├── requirements.txt
    │   ├── tests\                        # ★ J-8a 신규
    │   │   └── test_image_proxy_mismatch.py  # S11 회귀 (Poetry 환경)
    │   └── app\
    │       ├── main.py                   # FastAPI 진입점 + CORS + 시작 훅
    │       ├── config.py                 # Settings (case_sensitive=True)
    │       ├── seed.py                   # 시드 스크립트 (admin/admin1234, manager1/manager1234, activity_logs 포함 총 22건)
    │       ├── models\                   # SQLAlchemy ORM
    │       │   ├── database.py           # Admin/Model/Client/... (330줄, 분리 대기)
    │       │   ├── auth.py               # RefreshToken (SPEC-AUTH-001)
    │       │   └── agency.py             # 재수출
    │       ├── schemas\                  # Pydantic 검증
    │       │   ├── auth.py
    │       │   ├── agency.py
    │       │   └── agency_financial.py
    │       ├── schemas.py                # 모놀리식 (573줄, 하위 호환)
    │       ├── routers\                  # 16개 엔드포인트 핸들러 (__init__.py 제외)
    │       │   ├── auth.py               # /api/auth/login, /me, admins CRUD
    │       │   ├── token_refresh.py      # /api/auth/refresh, /logout
    │       │   ├── models.py
    │       │   ├── clients.py
    │       │   ├── castings.py
    │       │   ├── contracts.py
    │       │   ├── settlements.py
    │       │   ├── schedules.py
    │       │   ├── files.py
    │       │   ├── media.py              # 531줄 (분리 대기)
    │       │   ├── news.py               # 4 엔드포인트 (Naver)
    │       │   ├── image_search.py       # 5 엔드포인트 (Naver/Google)
    │       │   ├── stats.py
    │       │   ├── activity_logs.py
    │       │   ├── notifications.py
    │       │   └── proxy.py              # ★ J-8a 신규 — GET /api/proxy/image (SSRF 방어)
    │       ├── services\
    │       │   ├── token_service.py      # SPEC-AUTH-001 토큰 라이프사이클
    │       │   ├── notification_service.py
    │       │   ├── search_service.py     # Naver/Google 통합 (graceful 503, 99253666)
    │       │   └── image_proxy_service.py  # ★ J-8a 신규 — 캐시(2-level) + 매직 바이트
    │       └── utils\
    │           ├── activity_log.py
    │           └── security.py           # SSRF 방어 + 매직 바이트 + validate_proxy_host (J-8a 확장)
    │
    ├── frontend\                         # React + TypeScript + Electron (port 5173)
    │   ├── node_modules\                 # 502 패키지
    │   ├── package.json
    │   ├── vite.config.ts                # `/uploads` 프록시 필수 (R23)
    │   ├── tsconfig.json
    │   └── src\
    │       ├── main.tsx                  # React 마운트
    │       ├── App.tsx                   # react-router-dom v6 라우트
    │       ├── contexts\
    │       │   └── AuthContext.tsx       # 토큰 상태 + login/logout
    │       ├── services\
    │       │   ├── auth-api.ts           # 401 인터셉터 + silent refresh + refreshPromise 싱글톤
    │       │   ├── domain-api.ts         # modelsAPI/clientsAPI/...
    │       │   └── api.ts                # 배럴 재수출
    │       ├── pages\                    # 16개 페이지 (NotFoundPage 신설 2cfe17bc, 이전 setup의 14는 카운트 오류)
    │       │   ├── LoginPage.tsx
    │       │   ├── DashboardPage.tsx                # 445줄
    │       │   ├── ModelListPage.tsx
    │       │   ├── ModelFormPage.tsx
    │       │   ├── ModelDetailPage.tsx              # 뉴스 + 이미지 갤러리 통합 (J-5)
    │       │   ├── CastingPage.tsx
    │       │   ├── ClientPage.tsx                   # 692줄
    │       │   ├── ContractPage.tsx                 # 692줄
    │       │   ├── SettlementPage.tsx
    │       │   ├── SchedulePage.tsx                 # 679줄
    │       │   ├── AdminManagementPage.tsx          # 671줄
    │       │   ├── NewsSearchPage.tsx               # Naver + 자동 모델 매칭 (J-2/J-4)
    │       │   ├── ImageSearchPage.tsx              # Naver/Google + SSRF 방어 (J-3/J-4)
    │       │   ├── SNSAnalyticsPage.tsx             # 390줄, 껍데기 (SNS-1 미착수)
    │       │   ├── ProfileExportPage.tsx            # 476줄, 껍데기 (K-1 미착수)
    │       │   └── NotFoundPage.tsx                 # ★ catch-all 404 라우트 (2cfe17bc)
    │       ├── utils\                    # ★ J-8b 신규
    │       │   └── imageProxy.ts         # proxify() + handleImgError() + IMAGE_PROXY_PLACEHOLDER (SPEC-IMAGE-PROXY-002 §3)
    │       ├── components\
    │       │   ├── search\               # 검색 결과 카드, 모달 (ImageResultCard·ImagePreviewModal: proxify 적용 J-8b)
    │       │   ├── model-detail\         # ModelNewsList, ModelImageGallery (J-5; proxify 적용 J-8b)
    │       │   ├── model-form\
    │       │   ├── notification\         # NotificationBell, Dropdown (G-1)
    │       │   ├── casting\
    │       │   ├── settlement\
    │       │   └── ui\
    │       └── types\
    │           ├── auth.ts
    │           └── model.ts
    │
    ├── docs\
    │   ├── BACKEND_TEST.md
    │   └── PROGRESS.md                   # 2026-02-22 시점 (구버전, E드라이브 표기)
    │
    ├── templates\                        # 이메일/리포트 템플릿
    ├── ARCHITECTURE.md                   # ★ /auto setup 으로 생성 (2026-04-25)
    ├── CHANGELOG.md                      # 0.2.0 (2026-04-15) SPEC-AUTH-001
    ├── CLAUDE.md                         # Autopus-ADK 하네스 진입점
    ├── AGENTS.md                         # 16 에이전트 정의
    ├── IMPLEMENTATION_PLAN.md            # 2026-02-22 초기 계획 (구버전)
    ├── autopus.yaml                      # 하네스 설정
    ├── config.toml
    ├── opencode.json
    │
    ├── .autopus\
    │   ├── WORKFLOW.md                   # = WORKFLOW_v3 (Phase C v2)
    │   ├── project\
    │   │   ├── product.md
    │   │   ├── structure.md              # 본 문서
    │   │   ├── tech.md
    │   │   ├── scenarios.md              # ★ /auto setup 으로 생성
    │   │   └── canary.md                 # ★ /auto setup 으로 생성
    │   ├── specs\
    │   │   ├── SPEC-AUTH-001\            # ✅ completed
    │   │   │   ├── spec.md
    │   │   │   ├── plan.md
    │   │   │   ├── prd.md
    │   │   │   ├── research.md
    │   │   │   ├── acceptance.md
    │   │   │   └── review.md
    │   │   ├── SPEC-IMAGE-PROXY-002\     # ✅ completed (J-8b 프론트엔드 프록시 통합, 2026-04-27)
    │   │   │   ├── spec.md
    │   │   │   ├── plan.md
    │   │   │   ├── acceptance.md
    │   │   │   └── research.md
    │   │   └── SPEC-IMAGE-PROXY-001.md   # ★ J-8 통합 SPEC (J-8a 백엔드 ✅ / J-8b ✅ / 8c·d·e 미착수)
    │   ├── plans\                        # ★ J-8a 신규
    │   │   └── PLAN-J-8a.md              # planner v2 (정정 3건 반영)
    │   └── brainstorms\                  # untracked (Option B 정책)
    │       └── J-6-fix-plan.md           # J-6 fix 1-2 + 폐기 결정 기록
    │
    └── .claude\, .codex\, .gemini\       # AI CLI 하네스 미러 3종 (autopus.yaml `platforms`는 4종이지만 OpenCode는 root의 `opencode.json`로만 통합 — `.opencode\` 폴더 부재)
```

## 패키지 역할

| 패키지 | 역할 | 핵심 파일 |
|--------|------|-----------|
| `backend/app/models/` | SQLAlchemy ORM | `database.py` (Admin/Model/ModelFile/NewsArticle/SNSData/ShareLink/ActivityLog/Notification 8개), `search.py` (ModelNews/ModelSearchImage 2개), `settlement.py` (Settlement 1개), `auth.py` (RefreshToken 1개) — **시스템 총 12개 ORM 모델** (grep `^class.*Base` 검증 2026-04-26). 도메인 4개(Client/Casting/Contract/Schedule)는 별도 ORM 클래스 없이 `routers/*.py` 핸들러 + `schemas/*.py` Pydantic으로 처리 |
| `backend/app/schemas/` | Pydantic 요청/응답 검증 | `auth.py`, `agency.py`, `agency_financial.py` |
| `backend/app/routers/` | 16개 HTTP 핸들러 (`__init__.py` 제외, J-8a `proxy.py` 추가) | 도메인별 분리 |
| `backend/app/services/` | 비즈니스 로직 | `token_service.py`, `notification_service.py`, `search_service.py`, `image_proxy_service.py` (J-8a) |
| `backend/app/utils/` | 보안 + 활동 로그 | `security.py` (SSRF/매직바이트 + `validate_proxy_host` J-8a 확장), `activity_log.py` |
| `backend/tests/` | 회귀 테스트 (J-8a 신규) | `test_image_proxy_mismatch.py` (S11 — Poetry 환경 전제) |
| `frontend/src/services/` | API 계층 + 토큰 관리 | `auth-api.ts` (R13 싱글톤), `domain-api.ts` |
| `frontend/src/contexts/` | 전역 상태 | `AuthContext.tsx` |
| `frontend/src/pages/` | 16 페이지 (Explorer 2026-04-26 검증) | LoginPage 외 15개 |
| `frontend/src/components/` | 재사용 UI | search/, model-detail/, notification/ |

## 진입점

| 진입점 | 경로 | 설명 |
|--------|------|------|
| Backend | `backend/app/main.py` | FastAPI 앱 + CORS + 시작 훅 (`cleanup_expired_tokens`) |
| Frontend | `frontend/src/main.tsx` | React 마운트 |
| Frontend Router | `frontend/src/App.tsx` | react-router-dom v6, PrivateRoute 가드 |
| Electron | `frontend/electron/main.js` | 데스크톱 래퍼 |
| Seed | `backend/app/seed.py` | `python -m app.seed` (idempotent, 총 22건 시드) |

## 워크플로 분류 (WORKFLOW_v3 = `.autopus/WORKFLOW.md`)

| 난이도 | 트리거 예시 | 워크플로 |
|--------|-----------|----------|
| 🟢 **Simple** | 의존성 추가, 오타·주석 수정, 설정값 변경, 에러 메시지 문구, README 업데이트, 단일 파일 포맷팅 | `executor` 직행 → 커밋 |
| 🟡 **Medium** | 기존 API 필드 추가, 단일 버그 수정 (1~2 파일), 컴포넌트 리팩토링, 테스트 추가, UI 디자인 조정 | `planner → executor → reviewer` |
| 🔴 **Complex** | 새 SPEC, DB 스키마 변경, 인증·권한 수정, 성능 개선, 외부 서비스 연동, 다중 모듈 교차 변경 | `architect → planner → executor → reviewer → security-auditor` |

결정 트리: DB 스키마 / API 계약 / 인증 중 하나라도 건드리면 → **Complex**. 새 파일 3개 이상 또는 여러 군데 수정 → **Medium**. 둘 다 아니면 → **Simple**.

## 에이전트 팀 16개

### 주력 5 (매 작업마다 등장)

| 에이전트 | 역할 |
|----------|------|
| **explorer** | 코드베이스 빠르게 훑기, 구조 파악 |
| **executor** | TDD 기반 코드 구현 |
| **debugger** | 근본 원인 분석 + 최소 수정 |
| **reviewer** | TRUST 5 코드 리뷰 (Testability/Readability/Unambiguous/Scope/Truthfulness) |
| **architect** | 시스템 설계, 기술 결정, 새 SPEC |

### 보조 11 (필요 시 호출)

`planner` (Medium 이상에서 태스크 분해), `tester` (테스트 설계), `spec-writer` (SPEC 문서), `security-auditor` (OWASP Top 10), `devops`, `deep-worker`, `validator` (LSP/lint 경량), `annotator` (@AX 태그), `frontend-specialist` (Playwright E2E), `perf-engineer`, `ux-validator` (Vision 기반).

### Complex 워크플로 핵심 4

```
architect → planner → executor → reviewer → security-auditor
```

이 4개가 반드시 등장하는 핵심: **planner / executor / reviewer / security-auditor**.

## Worker Contract 4행 템플릿

모든 서브에이전트 지시에 다음 4줄 포함 (반환 형식은 전역 표준 자동 적용):

```markdown
**목표**: [한 문장, 결과 상태로 표현]
**범위**: [파일·모듈·화면 구체 경로]
**완료 기준**: [검증 가능한 형태]
**금지**: [범위 안에서도 건들면 안 되는 항목 / 없으면 "해당 없음 (범위 밖은 자동 금지)"]
```

## 파일 크기 정책

- 모든 소스 파일은 **300줄 이하** 유지 (목표 200 이하). 제외: 생성 파일 + .md/.yaml/.json.
- 현재 10개 파일이 한도 초과 (ARCHITECTURE.md `Known Issues #9` 참조 — `seed.py` 311줄은 시드 모음으로 의도된 길이라 제외). 도메인별 분리 SPEC 대기.

## SPEC-AUTH-001 신규 추가 파일 (2026-04-15)

`backend/app/services/token_service.py`, `backend/app/routers/token_refresh.py`, `backend/app/models/auth.py`, `backend/app/schemas/auth.py` 외 6개. CHANGELOG 0.2.0 참조.

## 참고

- 표준 워크플로 상세: `.autopus/WORKFLOW.md`
- 에이전트 정의: `AGENTS.md` + `.claude/agents/autopus/` (각 16개 에이전트별 .md)
- 제약 룰: `.autopus/context/constraints.yaml`
