# Canary Configuration — Model Agency Management System

> 자동 생성: 2026-04-25 (`/auto setup`). 최종 갱신: 2026-04-26 (`/auto setup`, J-8a 후 H6 추가).

## Project Type: Frontend (React + Electron) + API (FastAPI)
## Backend Build: `cd backend && python -m uvicorn app.main:app --reload`
## Frontend Build: `cd frontend && npm run build`
## Deploy Platform: 로컬 개발 (Electron 패키징은 Phase I-1 예정)

## Health Checks (6개, J-8a 후 H6 추가)

| ID | Type | Target | Expect | Timeout |
|----|------|--------|--------|---------|
| H1 | build | `cd frontend && npm run build` (tsc + vite build) | exit 0 | 90s |
| H2 | build | `cd backend && python -c "from app.main import app"` | exit 0 (import OK) | 30s |
| H3 | endpoint | `GET http://localhost:8000/api/health` | status 200, `status="healthy"` | 5s |
| H4 | browser | `http://localhost:5173/login` | LoginPage 렌더, no console errors | 15s |
| H5 | browser | `http://localhost:5173/dashboard` (admin/admin1234 로그인 후) | DashboardHome 렌더, no console errors | 15s |
| **H6** | endpoint | `GET http://localhost:8000/api/proxy/image?url=http://127.0.0.1/x` | status 403 (SSRF 방어 정상 — J-8a) | 5s |

## Detailed Specification

### H1: Frontend Production Build

```powershell
cd "G:\Project M\model-agency-system\frontend"
npm run build
```

- **Validates**: TypeScript 타입 검사 (`tsc`) + Vite 번들링.
- **Pass criteria**: 종료 코드 0, `dist/` 디렉터리 생성됨.
- **Fail signals**: 타입 에러, 의존성 missing, OOM (Vite 빌드).

### H2: Backend Import Smoke Test

```powershell
cd "G:\Project M\model-agency-system\backend"
.\venv\Scripts\Activate.ps1
python -c "from app.main import app"
```

- **Validates**: 모든 라우터/서비스/모델 import 가능, .env 로드 가능, 데코레이터 등록 성공.
- **Pass criteria**: 종료 코드 0, ImportError 없음.
- **Fail signals**: `ModuleNotFoundError`, `ValidationError` (pydantic-settings .env 파싱), DB 연결 오류.
- **Note**: `.env` line 29 파싱 경고 (Known Issue #7) 는 stderr 에 나오지만 종료 코드 0 → PASS.

### H3: Health Endpoint

```bash
curl -sf http://localhost:8000/api/health
```

- **Validates**: 백엔드 서버 응답 가능 + `/api/health` 엔드포인트 정의됨.
- **Pass criteria**: HTTP 200 + `{"status": "healthy", "version": "1.0.0"}`.
- **Source**: `backend/app/main.py:health_check`.

### H4: Login Page Render

대상 URL: `http://localhost:5173/login`

- **Validates**: Vite dev 서버 실행 중 + LoginPage 라우트 매칭 + React 마운트.
- **Pass criteria**:
  - 페이지 로드 < 15초
  - DOM 에 `<form>` (username, password 입력) 존재
  - Console 에러 0건 (`error` 레벨)
- **Browser backend**: `auto terminal detect` 로 cmux 또는 agent-browser 자동 선택.

### H5: Dashboard Render (Auth 후)

대상 URL: `http://localhost:5173/dashboard` (로그인 후)

- **Pre-step**: H4 통과 → admin / admin1234 로 로그인 → access_token 획득.
- **Depends**: H4 PASS (H4 fail 시 H5 자동 skip — fail-fast)
- **Validates**: PrivateRoute 가드 통과 + DashboardHome 통계 카드 렌더.
- **Pass criteria**:
  - KPI 카드 4개 (등록 모델, 이번 달 캐스팅, 저장된 기사, 공유 링크) + 차트 3개 (모델 성별 분포, 캐스팅 현황, 정산 수입·지출) 렌더
  - Console 에러 0건
  - 401 silent refresh 가 발생하면 자동 재시도 후 정상 렌더 (R13 검증)

### H6: Image Proxy SSRF Defense (J-8a)

```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/proxy/image?url=http://127.0.0.1/x"
```

- **Validates**: J-8a 프록시 라우터 + `validate_proxy_host()` + `_PRIVATE_NETS` 차단 정상 동작.
- **Pass criteria**: HTTP 403 (private IP 차단 — `127.0.0.1` 은 `_PRIVATE_NETS` 의 `127.0.0.0/8` 매칭).
- **Fail signals**: 200/302 (SSRF 우회) → CRITICAL, 404 (라우터 미등록) → 중대.
- **Source**: `backend/app/routers/proxy.py`, `backend/app/utils/security.py:validate_proxy_host`.

## 사전 조건

H3, H4, H5, H6 은 백엔드 서버가 실행 중이어야 동작:

```powershell
# 창 1: Backend (port 8000)
cd "G:\Project M\model-agency-system\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload

# 창 2: Frontend (port 5173)
cd "G:\Project M\model-agency-system\frontend"
npm run dev
```

H1, H2 는 서버 실행 여부와 무관하게 즉시 가능.

## Detection Sources

| 항목 | 출처 |
|------|------|
| Frontend 빌드 명령 | `frontend/package.json` `scripts.build` |
| Backend 진입점 | `backend/app/main.py` |
| Health 엔드포인트 | `backend/app/main.py:health_check` |
| 브라우저 라우트 | `frontend/src/App.tsx` (PrivateRoute + DashboardPage nested) |
| 시드 계정 | `backend/app/seed.py:seed_admins` |
| 포트 정보 | `frontend/vite.config.ts` (5173), `backend/app/config.py` (8000) |

## Verdict 규칙

| 결과 | 조건 |
|------|------|
| **PASS** | H1~H6 모두 통과 + console 에러 없음 |
| **WARN** | 빌드 OK + 일부 E2E 실패 또는 비치명적 console warning |
| **FAIL** | 빌드 실패 / Health endpoint 다운 / 페이지 렌더 실패 / 프록시 SSRF 방어 우회 (H6 통과 못함) |

## 결과 저장

`.autopus/canary/latest.json` 에 자동 저장. `--compare {commit}` 으로 이전 결과와 diff.

## 한계 / 향후 개선

- **Linting/타입 검사 없음**: ESLint/Prettier 미구성 → H1 의 tsc 만이 정적 검증. Phase I-3 에서 도입 예정.
- **Test 미구성**: pytest/vitest 부재 → H1, H2 가 build smoke 수준에 머묾. Phase I-3 도입 후 test 단계 추가 권장.
- **HTTPS 미사용**: 로컬 개발이므로 HTTP 만. Electron 배포 (Phase I-1) 후 재평가.
- **Visual regression 없음**: 스크린샷 비교 미수행. 필요 시 frontend-specialist 에이전트 + Playwright 활용.
- **부하 테스트 없음**: 1인 운영 전제로 생략. Phase I-1 패키징 후 시작 시간 측정 정도만 추가 검토.

## 사용 예 (⚠️ 향후 CLI 지원 시)

> **현재 사양 검증 결과**: `auto canary` 서브커맨드는 Autopus CLI(v0.39.1)에 **미구현** — `auto --help` 36개 서브커맨드 목록 중 canary 부재 (agent / arch / check / completion / config / connect / desktop / docs / doctor / effort / experiment / hash / help / init / issue / learn / lore / lsp / mcp / orchestra / permission / pipeline / platform / react / search / setup / skill / spec / status / telemetry / terminal / test / update / verify / version / worker). 인수인계 v17 분류에는 canary가 명시됐으나 실제 CLI 사양에는 없음. 본 H1~H5는 수동 검증으로 대체하거나, 향후 CLI 도입 시 아래 명령으로 활용:

```powershell
auto canary                              # 전체 H1~H5 실행 (향후 지원 예정)
auto canary --url http://localhost:5173  # 브라우저 체크 URL 명시 (향후 지원 예정)
auto canary --watch 5m                   # 5분 간격 반복 (max 30m, FAIL 시 정지) (향후 지원 예정)
auto canary --compare abc1234            # 이전 commit 결과와 diff (향후 지원 예정)
```

J-6 통합 검증 시작 전 baseline 확보 권장: `/auto canary` → `latest.json` 저장 → J-6 fix 후 비교.
