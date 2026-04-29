# 📋 Project-M 인수인계 문서 v17

> **작성일**: 2026-04-24
> **이전 버전**: v16 (2026-04-19)
> **주요 변화**: 로컬 G드라이브 → 원격 GitHub 프로젝트로 마이그레이션 (옵션 B)
> **새 작업 경로**: `G:\Project M\model-agency-system\` (원격 clone)
> **다음 세션 시작점**: `/auto setup` 진행 (manually approve edits)

---

## 🎯 이번 세션 핵심 성과

### Jin이 해낸 것 (비개발자임에도 9시간 작업 완주)

| 작업 | 상태 |
|---|---|
| 로컬 G드라이브 프로젝트 1.7GB 완전 백업 | ✅ |
| 로컬 Phase 13 프로젝트 archive로 격리 | ✅ |
| 원격 GitHub 저장소 (Phase J-5) clone | ✅ |
| Backend 환경 복원 (venv, .env, requirements) | ✅ |
| `NEWS_API_KEY` 충돌 해결 | ✅ |
| Frontend 환경 복원 (npm install) | ✅ |
| Backend 서버 정상 실행 (포트 8000) | ✅ |
| Frontend 서버 정상 실행 (포트 5173) | ✅ |
| DB seed 22건 삽입 | ✅ |
| 로그인 성공 (`admin` / `admin1234`) | ✅ |
| Claude Code CLI 정상 실행 | ✅ |
| autopus-adk `/auto status` 실행 | ✅ |
| autopus-adk 심층 조사 (웹 검색 + GitHub fetch) | ✅ |
| `/auto setup` plan 검토 | ✅ |
| **컴퓨터 재부팅 후 모든 서버 재시작 성공** | ✅ |

---

## 🔄 중대 결정 — 옵션 B 선택의 배경

### 발견된 핵심 사실

이번 세션에서 **로컬 G드라이브와 원격 GitHub가 완전히 다른 프로젝트**임을 발견:

| 항목 | 로컬 (구 G:\Project M\model-agency-system) | 원격 (현재 작업 중) |
|---|---|---|
| Phase 체계 | 1~13 | A~J-5 |
| 커밋 수 | 3개 | 39개 |
| 백엔드 라우터 | 17개 (imports.py, sns.py, exports.py, share.py 포함) | 16개 (news.py, image_search.py 포함) |
| 프론트 페이지 | 20개 | 16개 (ModelNewsList, ModelImageGallery 포함) |
| 로그인 방식 | 아이디 기반 (admin/admin123) | 아이디 기반 (admin/admin1234) |
| 검색 기능 | UI만, 백엔드 미완성 | **완성** (Naver 활성, Google 비활성) |
| Excel Import | **있음 (Phase 13)** | 없음 |
| SNS 분석 페이지 | UI만 (껍데기) | UI만 (껍데기) |
| 프로필 내보내기 | UI만 (껍데기) | UI만 (껍데기) |

### 4가지 옵션 검토 결과

- **옵션 A** (병합): 1~2주 소요, 충돌 해결 어려움
- **옵션 B** (원격만 사용): **선택됨** - 오늘 진행
- **옵션 B+** (원격 + Excel Import 1개 이식): 처음 추천했으나 Jin이 B로 결정
- **옵션 C** (로컬만): 비추

### 옵션 B의 의미

- 로컬 G의 7개 기능 중 **Excel Import만 진정한 완성** (이식 가치 있음 → 나중에 결정)
- 나머지 6개는 UI만 있는 껍데기 또는 원격에 더 나은 구현 있음
- 원격 로드맵(K-1, SNS-1, J-7)에서 신규 개발 예정인 것이 많음
- **결론**: 원격을 새 기준으로, 로컬은 참고 자료

---

## 📁 현재 디렉토리 구조

```
G:\Project M\
├── _archive_local_v13_20260423\      ← 로컬 Phase 13 (참고용, 건드리지 않음)
├── _backup_20260423_211541.zip       ← 1.7GB 완전 백업
└── model-agency-system\               ← ★ 현재 작업 폴더 (원격 clone)
    ├── .autopus\                      ← autopus 설정 (SPEC-AUTH-001만 존재)
    ├── .claude\                       ← Claude Code 설정
    ├── .codex\                        ← Codex 설정
    ├── .gemini\                       ← Gemini 설정
    ├── backend\
    │   ├── venv\                      ← Python 가상환경 (활성화 가능)
    │   ├── .env                       ← Naver API 활성, NEWS_API_KEY 줄 삭제됨
    │   ├── model_agency.db            ← seed 22건
    │   ├── requirements.txt
    │   └── app\...
    ├── frontend\
    │   ├── node_modules\              ← 502개 패키지 설치됨
    │   ├── package.json
    │   └── src\...
    ├── docs\
    ├── templates\
    ├── ARCHITECTURE.md                ← /auto setup으로 생성 예정
    ├── CHANGELOG.md
    ├── CLAUDE.md
    ├── IMPLEMENTATION_PLAN.md
    ├── autopus.yaml
    └── opencode.json
```

---

## 🔑 환경 정보

### 로그인 계정 (확정)

| 역할 | 아이디 | 비밀번호 |
|---|---|---|
| 슈퍼 관리자 | `admin` | `admin1234` |
| 일반 사용자 | `manager1` | `manager1234` |

⚠️ **주의**: 이메일 형식 아님. seed.py에서 username 필드 사용.

### 서버 포트

| 서버 | 포트 | URL |
|---|---|---|
| Backend (FastAPI) | 8000 | http://127.0.0.1:8000 |
| Frontend (Vite) | 5173 | http://localhost:5173 |
| API Docs | 8000 | http://localhost:8000/docs |

### .env 현재 상태

```
APP_NAME=Model Agency Management System
APP_VERSION=1.0.0
DEBUG=true
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite:///./model_agency.db
SECRET_KEY=값있음
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
NAVER_CLIENT_ID=값있음 (정상 동작)
NAVER_CLIENT_SECRET=값있음
# NEWS_API_KEY 줄 삭제됨 (Pydantic 충돌 해결)
UPLOAD_DIR=./uploads
MODEL_FILES_DIR=./model_files
```

### .env.sample에 있지만 미설정인 것 (선택적)

- `UNSPLASH_ACCESS_KEY` (이미지 검색)
- `BING_SEARCH_API_KEY` (이미지 검색)
- `AZURE_COMPUTER_VISION_KEY` (이미지 분석)
- `OPENAI_API_KEY` (문서 생성 - K-1 대비 필요할 수 있음)
- `GOOGLE_API_KEY` / `GOOGLE_CX` (구글 이미지 검색 - 비활성)

config.py에서 모두 `Optional[str] = None` 처리 → 없어도 서버 정상 실행

---

## 🐙 Autopus-ADK 현황

### 확인된 것

- **버전**: v0.39.1 (2026-04-12)
- **개발사**: Insajin (개인 개발자, 한국어 README 제공)
- **Stars**: 11개 (매우 작은 커뮤니티)
- **상태**: Jin의 PC에 정상 설치됨, `/auto status` 정상 동작

### 17개 서브커맨드 분류

| 카테고리 | 명령 |
|---|---|
| 개발 워크플로우 | idea, plan, go, sync, fix, dev |
| 품질 & 리뷰 | review, spec review, secure, stale, verify, browse, test, canary |
| 탐색 & 분석 | map, why, status |
| 관리 | setup, init, update, doctor, platform |

### 현재 SPEC 상태 (`/auto status` 결과)

```
SPEC-AUTH-001 [completed] — JWT Token Refresh System
총 1개 | completed: 1
```

⚠️ **중요**: 인수인계 v16에 언급된 SPEC-SEARCH-001, SPEC-NOTIF-001은 실제 `.autopus/specs/`에 **없음**. 뉴스/이미지 검색은 SPEC 없이 코드만 올라간 상태.

### 페르소나 표시

`jarvis-core`로 표시됨. Jin의 user-level CLAUDE.md에 JARVIS Protocol이 설정되어 있어서 발생. 기능에 문제 없음, 개념적 혼동만 있음.

---

## 🎯 다음 세션 즉시 시작 절차

### Step 1 — 3개 PowerShell 창 열기

**창 1: Backend**
```powershell
cd "G:\Project M\model-agency-system\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```
→ `Application startup complete` 확인

**창 2: Frontend**
```powershell
cd "G:\Project M\model-agency-system\frontend"
npm run dev
```
→ `VITE ready` 확인 (포트 5173)

**창 3: Claude Code CLI**
```powershell
cd "G:\Project M\model-agency-system"
claude
```
→ Claude Code CLI 시작

### Step 2 — 브라우저 확인

http://localhost:5173 접속 → 대시보드 또는 로그인 페이지 표시 확인

### Step 3 — `/auto setup` 진행

Claude Code CLI에서:
```
/auto setup
```

이전 세션에서 작성된 plan과 거의 동일한 plan이 나옴.

**선택 2 "Yes, manually approve edits"** 권장:
- ↓ 방향키 1번
- Enter

각 파일 프리뷰가 나오면 **claude.ai 새 대화창**에 보여주고 검토.

---

## 📊 6개 생성 예정 파일 (이미 plan 작성됨)

| 파일 | 종류 | 위치 |
|---|---|---|
| ARCHITECTURE.md | 신규 | 프로젝트 루트 |
| product.md | 덮어쓰기 | .autopus/project/ |
| structure.md | 덮어쓰기 | .autopus/project/ |
| tech.md | 덮어쓰기 | .autopus/project/ |
| scenarios.md | 신규 | .autopus/project/ |
| canary.md | 신규 | .autopus/project/ |

### 주의: tech.md에서 추가 검토 필요

- OpenAI API Key (Phase K-1 대비)
- Gemini API Key (Autopus --multi 활용 대비)
- 두 API 모두 `.env.sample`에는 미반영. tech.md 작성 시 명시 권장.

---

## 🗺️ Phase 진행 현황

| Phase | 이름 | 상태 |
|-------|------|------|
| A~J-5 | 원격 프로젝트 전체 | ✅ 완료 (39 커밋) |
| **세팅** | **로컬 → 원격 마이그레이션** | ✅ 오늘 완료 |
| **autopus 활성화** | **/auto status 정상 동작** | ✅ 오늘 완료 |
| `/auto setup` | 6개 컨텍스트 문서 생성 | 🟡 plan 작성됨, 실행 대기 |
| J-6 | 통합 검증 | 🔴 미착수 |
| J-7 | 라이브러리 관리 뷰 | 🔴 미착수 |
| J-8 | 이미지 검색 UX 개선 | 🔴 미착수 |
| K-1 | 프로필 내보내기 4종 | 🔴 미착수 (OpenAI API 필요할 수 있음) |
| SNS-1 | SPEC-SNS-001 | 🔴 미착수 |
| I-1 | Electron 패키징 | 🔴 미착수 |

---

## ⚠️ 알려진 이슈

### 옵션 B로 인한 결과

1. **Excel Import 기능 없음** — 로컬 G에 있던 기능. 필요 시 archive에서 코드 참고하여 재구현
2. **Share 링크 기능 없음** — 로컬 G에만 있던 기능
3. **TabletNews 페이지 없음** — 로컬 G에만 있던 기능
4. **기존 사용자 입력 데이터 없음** — DB는 seed 22건만 (실 데이터는 archive DB에)

### 원격에 이미 있는 알려진 이슈 (인수인계 v16에서 인계)

5. **Google Custom Search API 403 에러** — GOOGLE_API_KEY/CX 미설정. 네이버만 동작
6. **ImageSearchPage 모델 자동 매칭 미적용** — J-8에서 처리 예정
7. **.env 파싱 경고** — `python-dotenv could not parse statement starting at line 29`
8. **database.py 330줄** — 300줄 초과
9. **300줄 초과 파일 11개** — autopus가 발견 (ClientPage 692, ContractPage 692, SchedulePage 679, AdminManagementPage 671, schemas.py 573, media.py 531 등)

### 오늘 발견한 새 이슈

10. **인수인계 v16의 SPEC들이 실제 `.autopus/specs/`에 없음** — 검색/뉴스 SPEC은 말로만 있고 문서는 없는 상태

---

## 🎓 이번 세션에서 얻은 교훈

### 1. 구현계획서 매번 재조회 필수
- 아키텍트(claude.ai)가 기억 의존 시 오류 발생
- `project_knowledge_search` 도구로 매번 확인 후 답변

### 2. 옵션 추천 시 신중함
- 처음 B+ 추천했으나 Jin이 J-8 미완성 발견 후 분노 정당
- 추천 시 **로드맵 미완성 부분**을 더 정확히 인지해야 함

### 3. Username vs Email 구분
- 원격 프로젝트는 **username 기반 로그인** (admin/admin1234)
- 이메일 형식 추측 금지 — seed.py 직접 확인 필수

### 4. 환경변수 충돌 처리
- Pydantic은 `.env`에 정의 안 된 변수가 있으면 서버 실행 거부
- 원격 `config.py` 기준으로 `.env` 정리 필요 (NEWS_API_KEY 삭제 사례)

### 5. PowerShell + 한글 인코딩 주의
- 메모장으로 파일 열어서 처리하는 게 한글 깨짐 회피
- 명령어는 영문 모드, 답변은 한글 모드 구분

### 6. autopus-adk 한계 인지
- Stars 11개 = 매우 작은 커뮤니티
- 유튜브 튜토리얼 거의 없음
- Stack Overflow 답변 없음 → Claude(아키텍트) 의존도 100%
- 그러나 **설계 자체는 매우 정교함**

### 7. 컨텍스트 한도 관리
- 9시간 세션은 너무 김
- Phase 단위로 새 대화창 시작하는 게 효율적
- 인수인계 문서 v17 시점이 적절한 분기점

---

## 🏗️ 개발 원칙 (v17 갱신)

v16 기존 32개 원칙 유지 + 아래 추가:

33. **로컬 vs 원격 프로젝트 분리** 🆕 — 두 라인이 동시에 발전한 경우 옵션 평가 필수 (A 병합 / B 원격만 / B+ 1개 이식 / C 로컬만)
34. **archive 폴더는 참고용** 🆕 — 로컬 자산은 `_archive_local_v13_20260423\`에 보존. 필요 시 코드 참고만
35. **3개 PowerShell 창 패턴** 🆕 — Backend / Frontend / CLI 각각 독립 창. 한 창에 모두 X
36. **컨텍스트 한도 인지** 🆕 — 9시간 + 60+ 라운드 시 새 대화창 시작 권장

---

## 💡 도구 설정 (v17)

| 도구 | 기본 모델 |
|---|---|
| claude.ai 채팅창 | Opus 4.6 (아키텍트) |
| Claude Code CLI | **Sonnet 4.6 기본** / Complex 작업은 Opus 4.6 |
| autopus 워크플로 | claude.ai가 판단 → CLI에 명령 전달 |

---

## 🔧 다음 세션 시작 안내

### Step 1 — 3개 PowerShell 창 열기 + 서버 실행

(위 "다음 세션 즉시 시작 절차" 참고)

### Step 2 — 새 claude.ai 대화창 열기

**프로젝트 첨부**: `인수인계_문서_20260424_v17.md` (이 문서)

**메시지 (복사용)**:

```
나는 비개발자이고 model-agency-system 프로젝트를 개발 중이야.
항상 한 단계씩, 명령어 포함해서 자세히 설명해줘. 두 단계 이어서 주지 마.
모든 개발은 Autopus-ADK 기반으로 진행해.
매 작업 지시 전에 Sonnet/Opus 중 어느 쪽을 쓸지 먼저 판단해서 알려줘.
존댓말 사용해줘.
구현계획서/인수인계 매번 project_knowledge_search로 확인 후 답변해줘.

이전 세션(2026-04-24)에서 로컬 G → 원격 GitHub 마이그레이션 완료.
3개 PowerShell 서버 모두 정상 실행 중.
인수인계 v17 첨부했으니 맥락 확인하고,
/auto setup 부터 이어서 진행해줘 (manually approve edits 모드).
```

### Step 3 — Claude Code CLI에서 `/auto setup`

새 대화창에서 안내 받은 후 CLI에서:
```
/auto setup
```

각 파일 프리뷰가 나오면 새 대화창에 공유 → 검토 → 승인.

---

## 🏁 이번 세션 종료 체크리스트

- [x] 옵션 B 결정 + 실행 (로컬 격리 + 원격 clone)
- [x] Backend/Frontend 환경 복원 + 서버 실행
- [x] 로그인 계정 확정 (admin/admin1234)
- [x] DB seed 22건 실행
- [x] autopus-adk 정상 동작 확인 (`/auto status`)
- [x] `/auto setup` plan 검토 (6개 파일 생성 계획)
- [x] autopus-adk 심층 조사 보고서 작성
- [x] 컴퓨터 재부팅 후 서버 재시작 성공
- [x] v17 인수인계 문서 작성 — **바로 이 문서**
- [ ] v17을 `F:\Project M\_handover\` 또는 `G:\Project M\_handover\`에 저장 (사용자 작업)
- [ ] v17을 claude.ai 프로젝트 파일에 업로드 (사용자 작업)

---

## 🎯 새 세션 첫 작업

**`/auto setup` 진행 (manually approve edits)** — 6개 컨텍스트 문서 생성

이게 끝나면 J-6 (통합 검증) 시작 가능.

---

> **최종 작성**: 2026-04-24 (옵션 B 마이그레이션 + autopus 활성화 시점)
> **실행 재개 시점**: 새 세션에서 `/auto setup` (manually approve edits) 부터
> **수고하셨습니다. Jin님은 비개발자임에도 9시간 작업을 완주하셨습니다. 🐙**