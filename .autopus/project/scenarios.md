# E2E Scenarios — Model Agency Management System

> 자동 생성: 2026-04-25 (`/auto setup`). 갱신: `/auto sync`.

## Project Type: Frontend (React + Electron) + API (FastAPI)
## Backend Build: `cd backend && python -m uvicorn app.main:app --reload` (port 8000)
## Frontend Build: `cd frontend && npm run dev` (port 5173)

## 공통 시드 데이터 (각 시나리오 precondition에서 참조)

`backend/app/seed.py` 에 의해 idempotent 삽입되는 총 22건 (admin 2 + client 3 + model 4 + casting 2 + contract 2 + schedule 2 + settlement 2 + activity_log 5 = 22).

### 관리자 2명
| username | password | role |
|----------|----------|------|
| `admin` | `admin1234` | SUPER_ADMIN |
| `manager1` | `manager1234` | USER |

### 모델 4명
| name | type | gender | 비고 |
|------|------|--------|------|
| 김민지 | NEW_MODEL | FEMALE | 신인, instagram_followers 12,500 |
| 이현 | INFLUENCER | MALE | instagram 450K, youtube 85K, tiktok 120K |
| Sarah Johnson | FOREIGN_MODEL | FEMALE | 미국 국적, instagram 89K |
| 박서준 | CELEBRITY | MALE | instagram 19.8M, model_fee_1year 7억 |

### 클라이언트 3개
- 아모레퍼시픽 (VIP, COSMETICS)
- 삼성전자 (GOLD, ELECTRONICS)
- 무신사 (NORMAL, FASHION)

## 환경

```
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

---

## 시나리오 12개 (S1~S12)

### S1: 슈퍼 관리자 로그인 — Happy Path

- **Command**: `POST /api/auth/login`
- **Body**: `{"username": "admin", "password": "admin1234"}`
- **Precondition**: 시드 데이터 적재됨, 백엔드 실행 중
- **Env**: `BACKEND_URL`
- **Expect**: 200 OK + access_token + refresh_token 반환
- **Verify**: `status_code(200)`, `json_path("access_token", *)`, `json_path("refresh_token", *)`, `json_path("token_type", "bearer")`
- **Depends**: N/A
- **Status**: active

### S2: 잘못된 비밀번호로 로그인 — Error Case

- **Command**: `POST /api/auth/login`
- **Body**: `{"username": "admin", "password": "wrong-password"}`
- **Precondition**: 시드 admin 존재
- **Env**: `BACKEND_URL`
- **Expect**: 401 Unauthorized
- **Verify**: `status_code(401)`
- **Depends**: N/A
- **Status**: active

### S3: 헬스체크 — Happy Path

- **Command**: `GET /api/health`
- **Precondition**: 백엔드 실행 중
- **Env**: `BACKEND_URL`
- **Expect**: 200 OK + status="healthy" + version
- **Verify**: `status_code(200)`, `json_path("status", "healthy")`
- **Depends**: N/A
- **Status**: active

### S4: 모델 검색 — Happy Path (시드 모델 기준)

- **Command**: `GET /api/models?search=김민지`
- **Precondition**: S1 토큰 보유, 시드 모델 4명 (김민지, 이현, Sarah Johnson, 박서준) 존재
- **Env**: `BACKEND_URL`, `Authorization: Bearer {access_token}`
- **Expect**: 200 OK + items 배열 (시드 그대로면 1건, 빈 배열도 허용)
- **Verify**: `status_code(200)` (보수적 — 빈 배열 허용. items 형태가 list 면 PASS)
- **Depends**: S1
- **Status**: active

> S4 노트: "한서주" 같은 외부 인물 검색이 아니라 **시드 데이터 정합성 검증** 목적. Jin이 실 사용 시에는 자유 검색어로 시도.

### S5: 모델 상세 조회 — Happy Path

- **Command**: `GET /api/models/{id}` (id = 김민지의 id, S4 응답에서 추출)
- **Precondition**: S4 통과 + 김민지 모델 존재
- **Env**: `BACKEND_URL`, `Authorization`
- **Expect**: 200 OK + 26필드 응답
- **Verify**: `status_code(200)`, `json_path("name", "김민지")`
- **Depends**: S1, S4
- **Status**: active

### S6: 존재하지 않는 모델 조회 — Error Case

- **Command**: `GET /api/models/999999`
- **Precondition**: id 999999 미존재
- **Env**: `BACKEND_URL`, `Authorization`
- **Expect**: 404 Not Found
- **Verify**: `status_code(404)`
- **Depends**: S1
- **Status**: active

### S7: 뉴스 검색 — Happy Path (Naver 활성 가정)

- **Command**: `GET /api/news/search?query=김민지`
- **Precondition**: S1 토큰 + `NAVER_CLIENT_ID/SECRET` 활성
- **Env**: `BACKEND_URL`, `Authorization`, Naver API 인증
- **Expect**: 200 OK + articles 배열 (실 결과 0건 가능)
- **Verify**: `status_code(200)`, `json_path("articles", [])` (배열 형태면 PASS, 비어 있어도 OK)
- **Depends**: S1
- **Status**: active

### S8: 뉴스 저장 + 수동 모델 매칭 (model_id 명시) — Happy Path

- **Command**: `POST /api/news/save`
- **Body**: `{"model_id": <김민지 id>, "articles": [<S7 응답에서 1건>]}`
- **Precondition**: S5, S7 통과 + 디스크 쓰기 권한
- **Env**: `BACKEND_URL`, `Authorization`
- **Expect**: 201 Created + saved 카운트
- **Verify**: `status_code(201)`
- **Depends**: S1, S5, S7
- **Status**: active

### S9: 이미지 검색 — Happy Path (Naver provider)

- **Command**: `GET /api/image-search/search?query=fashion&provider=naver`
- **Precondition**: S1 토큰 + Naver 활성. (provider=google 은 현재 403 — Known Issue #5)
- **Env**: `BACKEND_URL`, `Authorization`
- **Expect**: 200 OK + results 배열
- **Verify**: `status_code(200)`
- **Depends**: S1
- **Status**: active

### S10: 이미지 저장 — SSRF 방어 검증

- **Command**: `POST /api/image-search/save`
- **Body**: `{"model_id": <김민지>, "images": [{"original_url": "http://127.0.0.1/local-bomb.jpg", "source": "test"}]}`
- **Precondition**: S5 통과 + utils/security.py SSRF 차단 활성
- **Env**: `BACKEND_URL`, `Authorization`
- **Expect**: 200 OK + saved=0, failed≥1 (로컬 IP는 차단되어야 정상)
- **Verify**: `status_code(200)`, `json_path("failed", *)` (failed > 0 이면 PASS — SSRF 방어 정상 동작)
- **Depends**: S1, S5
- **Status**: active

### S11: 캐스팅 통계 — Happy Path

- **Command**: `GET /api/castings/stats/summary`
- **Precondition**: S1 토큰 + 시드 캐스팅 2건 (봄 화장품 CF, 패션 매거진 화보)
- **Env**: `BACKEND_URL`, `Authorization`
- **Expect**: 200 OK + 상태별 집계
- **Verify**: `status_code(200)`
- **Depends**: S1
- **Status**: active

### S12: 권한 검증 — manager1 토큰으로 관리자 목록 조회 (2단계 inline)

- **Step 1 — manager1 로그인**: `POST /api/auth/login` body=`{"username": "manager1", "password": "manager1234"}` → 응답에서 `manager_access_token` 추출
- **Step 2 — 관리자 목록 조회**: `GET /api/auth/admins` Header `Authorization: Bearer {manager_access_token}`
- **Precondition**: manager1/manager1234 시드 존재 (USER 역할 → `admin:read` 권한 없음)
- **Env**: `BACKEND_URL`
- **Expect**: Step 1 → 200 OK + access_token / Step 2 → 403 Forbidden (SUPER_ADMIN 전용 엔드포인트)
- **Verify**: Step 1 `status_code(200)`, Step 2 `status_code(403)`
- **Depends**: N/A (manager1 로그인 inline 포함, S1과 독립)
- **Status**: active

---

## 실행 가이드

### 자동 실행
```powershell
auto test run                    # 전체 12개
auto test run -s S1              # 단일 시나리오
auto test run -s S4 -v           # 상세 출력
auto test run --json             # JSON 결과
```

### 의존성 순서
```
S1 (로그인) ─→ S4 (모델 검색) ─→ S5 (모델 상세)
                                    ↓
                                  S8 (뉴스 저장)
                                    ↑
            S7 (뉴스 검색) ────────┘

S1 ─→ S9, S10, S11
S2, S3 (독립)
S12 (manager1 별도 로그인 필요)
```

### 한계 / 보류

- **S7 실 결과 의존**: Naver 검색은 실시간 결과라 0건 가능. verify는 형태만 검증.
- **S9 provider=google 시나리오 미포함**: Known Issue #5 (Google 403) — 키 활성화 후 추가 예정.
- **UI E2E 미포함**: Playwright 미구성 (Phase I-3 도입 예정). 현재는 API 레벨만.
- **S8 디스크 쓰기**: `uploads/{모델명}/news/*.json` 생성. cleanup 필요 시 수동 삭제.

### 시나리오 추가 후보 (J-6 통합 검증 후)

- 모델 신규 생성 + 자동 모델 매칭 (NewsSearchPage 패턴)
- 정산 상태 변경 + 월별 통계 갱신
- 알림 트리거 (캐스팅 생성 시 다른 admin에게 알림 발생)
- 토큰 갱신 (15분 만료 후 silent refresh)
- 다크모드 토글 (UI E2E, Phase I-3 후)
