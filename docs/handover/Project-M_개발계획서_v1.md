# 🐙 Model Agency System — 통합 개발 계획서 v1

> **작성일**: 2026-04-23
> **작성자**: 아키텍트 Claude (claude.ai)
> **기준 시점**: Phase J-6 Call-1+1b 완료, Jin 시각 2건 대기 중
> **기준 커밋**: `43c19dbd` (Phase J-5 완료 시점의 origin/master HEAD)
> **전신 문서**: `구현계획서_Model_Agency_System.md` (2026-04-16 작성) + 인수인계 v4~v17 누적

---

## 📋 이 문서의 성격

이 문서는 **Project-M(Model Agency Management System)의 전체 설계·실행 이력을 하나로 통합한 기준 문서**입니다. 인수인계 문서 v4~v17에 분산된 결정·변경·교훈을 한 벌로 묶어, 새 세션에서 과거 맥락을 빠르게 복원하도록 설계했습니다. 작업 지시 용도가 아니라 **참조 및 기준선 정렬 용도**이며, 실제 다음 작업은 `Project-M_향후개발지시서_v1.md`를 따라야 합니다.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|---|---|
| 프로젝트명 | Model Agency Management System |
| 작업 경로 | `F:\Project M\model-agency-system` |
| GitHub | `iamsangjin76-bot/model-agency-system` (private, master 브랜치) |
| 핵심 사용자 | 비개발자 Jin (1인 개발, claude.ai 아키텍트 + Claude Code CLI 실행 분리) |
| 개발 프레임워크 | **Autopus-ADK (필수)** |
| 인수인계 문서 경로 | `F:\Project M\_handover\` (repo 외부) |

## 2. 기술 스택

### 백엔드
- **FastAPI** + Python 3.11
- **SQLAlchemy ORM** + **SQLite**
- **Pydantic** (스키마 검증)
- **httpx** (외부 API 호출)
- **Pillow** (이미지 처리)
- 기본 포트: **8000**

### 프론트엔드
- **React** + **TypeScript**
- **Vite** (개발 서버, 기본 포트 **5174**)
- **Tailwind CSS** (다크모드 지원)
- **lucide-react** (아이콘)
- **recharts** (차트)

### 패키징 (예정)
- **Electron** (Windows 데스크톱 앱)

### 개발 환경
- Windows PowerShell (경로 공백 시 따옴표 필수: `cd "F:\Project M\model-agency-system"`)
- Claude Code CLI + Autopus-ADK 에이전트 시스템
- claude.ai 아키텍트 채팅창 (Opus 4.6)

---

## 3. Autopus-ADK 워크플로 핵심

### 3.1 역할 분리 구조

| 주체 | 역할 |
|---|---|
| **claude.ai 아키텍트** | 설계·판단·지시·검토. 직접 구현 금지. |
| **Claude Code CLI** | Autopus-ADK 에이전트를 통한 실행·분석·검증. |

### 3.2 난이도 → 워크플로

- **🟢 Simple**: `executor` 직행 → 커밋 (의존성 추가, 오타 수정, 설정값 변경 등)
- **🟡 Medium**: `planner → executor → reviewer` (기존 API 필드 추가, 단일 버그, 리팩터)
- **🔴 Complex**: `architect → planner → executor → reviewer → security-auditor` (새 SPEC, DB 스키마, 인증, 외부 연동)

### 3.3 ADK 슬래시 커맨드

- `/auto xxx` 형식 사용 (17개 서브커맨드, `/auto help`로 확인)
- `/auto plan`, `/auto execute`, `/auto review`, `/auto secure`, `/auto verify` 등
- `/agent architect` 같은 존재하지 않는 커맨드 금지

### 3.4 Worker Contract 4줄 템플릿 (필수)

```markdown
**목표**: [한 문장 이내, 결과 상태로 표현]
**범위**: [어느 파일·모듈·화면까지 건드릴지 구체 경로]
**완료 기준**: [어떤 상태가 되면 "끝"인지 검증 가능한 형태]
**금지**: [범위 안에서도 건들면 안 되는 항목 / 없으면 "해당 없음 (범위 밖은 자동 금지)"]
```

### 3.5 모델 선택 기준

| 모델 | 용도 |
|---|---|
| **Sonnet 4.6** (기본) | 파일 읽기, 문서 편집, YAML 수정, Lore 커밋, 반복적 UI 작업 |
| **Opus 4.6** (Complex 전용) | 새 SPEC 설계, 아키텍처 변경, 복잡 디버깅, 보안 감사 |

- 새 CLI 세션: `claude --model sonnet` 기본, 필요 시 `/model opus` 전환
- 매 작업 지시 **최상단**에 `🎯 이번 작업 적합 모델: Sonnet|Opus (근거: ...)` 한 줄 블록 필수

### 3.6 TRUST 5 (reviewer 검증 기준)

- **T**estability — 테스트 가능성
- **R**eadability — 가독성
- **U**nambiguous — 명확성
- **S**cope — 범위 준수
- **T**ruthfulness — 진실성

---

## 4. Lore 커밋 규칙

### 4.1 형식

```
type(scope): english summary (50자 이내)

한국어 본문 설명.

Constraint: [적용된 제약]
Confidence: high|medium|low
Scope-risk: local|module|system
Reversibility: trivial|moderate|difficult
Directive: [후속 방향 / 없으면 none]
Tested: [검증 방법]
Not-tested: [미검증 부분 / 없으면 -]
Related: [관련 SPEC 또는 이슈]

🐙 Autopus <noreply@autopus.co>
```

### 4.2 type 종류

`feat` (새 기능) / `fix` (버그) / `docs` (문서) / `chore` (설정·의존성) / `refactor` (구조 개선) / `test` / `perf` / `style`

### 4.3 PowerShell 실전 팁

- `-m` 반복 금지 (Lore trailer 블록이 깨짐)
- 대신 **`.git/COMMIT_MSG_TMP.txt` 파일 경유 방식** 사용:
  ```powershell
  notepad .git/COMMIT_MSG_TMP.txt
  git commit -F .git/COMMIT_MSG_TMP.txt
  Remove-Item .git/COMMIT_MSG_TMP.txt
  ```
- Trailer 허용값: `Confidence/Scope-risk/Reversibility`는 괄호 주석 없이 순수 열거값만

---

## 5. 전체 Phase 진행 현황 (2026-04-23 기준)

### 5.1 완료 Phase

| Phase | 이름 | 주요 산출물 | 상태 |
|---|---|---|---|
| **A+B** | ADK 초기 세팅 + git 인프라 | GitHub private repo 생성, 브랜치 설정, AGENTS.md 초안 | ✅ |
| **C** | ADK 워크플로 확정 | `.autopus/WORKFLOW.md`, `constraints.yaml` 교체, Lore 커밋 규칙 | ✅ |
| **D** | Repo 위생 정리 | 추적 파일 315→199개, `.gitignore` 정비, 히스토리 유지 | ✅ |
| **E-1** | 시드 데이터 | `backend/app/seed.py` (17건 삽입, idempotent) | ✅ |
| **E-2** | 최근 활동 API 연결 | 하드코딩 → `activityLogsAPI.recent()` 바인딩 | ✅ |
| **E-3** | 대시보드 차트 실데이터 | 3개 차트 (성별/캐스팅/정산) API 연결 | ✅ |
| **F-1** | 모델 CRUD + 상세 페이지 | `ModelDetailPage`, 26필드 스키마 | ✅ |
| **F-2** | 캐스팅 CRUD | CastingPage 479→211줄, soft delete, FormModal 패턴 | ✅ |
| **F-3** | 정산 CRUD | SettlementPage 657→158줄, 월별 통계 엔드포인트 2개 | ✅ |
| **G-1** | 알림 시스템 (SPEC-NOTIF-001) | NotificationBell/Dropdown, 30초 폴링, 자동 트리거 | ✅ |
| **G-2** | 파일 업로드 | 모델 프로필 사진 2흐름 지원, 포트폴리오 다중 업로드 | ✅ |
| **G-3** | 검색·필터·정렬 고도화 | 3도메인 복합 조건 검색 | ✅ |
| **H-1** | 반응형 레이아웃 | 사이드바 접기, 테이블→카드 전환, 폼 xl: breakpoint | ✅ |
| **H-2** | 다크모드 | Tailwind dark: 클래스, 토글, 차트 색상 대응 | ✅ |
| **H-3** | 에러 처리·로딩 UX | 토스트, 404, 스켈레톤, 폼 유효성 | ✅ |
| **J-1** | 검색 백엔드 인프라 | `models/search.py`, `search_service.py`, config 6개 env | ✅ |
| **J-2** | 뉴스 라우터 | 4개 엔드포인트 (네이버 검색, 저장, 조회, 삭제) | ✅ |
| **J-3** | 이미지 라우터 | 5개 엔드포인트 (구글/네이버 검색, 저장, 포트폴리오 등록) | ✅ |
| **J-4** | 프론트엔드 API 연동 | NewsSearchPage, ImageSearchPage 전면 리팩터링 | ✅ |
| **J-5** | 모델 상세 통합 | ModelNewsList, ModelImageGallery 컴포넌트 | ✅ |

### 5.2 진행 중 / 미완료 Phase

| Phase | 이름 | 상태 | 난이도 | 적합 모델 |
|---|---|---|---|---|
| **J-6** | 통합 검증 + fix | 🟡 Call-1+1b 완료, Jin 시각 2건 대기 → fix 3건 대기 | Medium | Sonnet |
| **J-8** | 이미지 검색 UX 개선 (자동 매칭 패턴) | 🔴 미착수 | Medium | Sonnet |
| **J-7** | 라이브러리 관리 뷰 (앱 내 폴더 탐색) | 🔴 미착수 | Complex | Opus → Sonnet |
| **SNS-1** | SPEC-SNS-001 (Instagram/TikTok/YouTube) | 🔴 미착수 | Complex | Opus → Sonnet |
| **K-1** | 프로필 내보내기 템플릿 4종 | 🔴 미착수 | Complex | Opus |
| **I-1** | Electron 패키징 | 🔴 미착수 | Complex | Opus |
| **I-2** | 백업·복원 | 🔴 미착수 | Medium | Sonnet |
| **I-3** | 테스트 기반 구축 | 🔴 미착수 | Medium~Complex | Sonnet/Opus |

---

## 6. 구현된 핵심 시스템 요약

### 6.1 인증 시스템 (SPEC-AUTH-001)

- JWT 로그인 + 토큰 갱신
- `auth-api.ts` 에러 핸들러에서 FastAPI 422 배열 응답 처리 (`Array.isArray` 체크)

### 6.2 3대 도메인 CRUD

- **모델**: 목록·상세·등록·수정·소프트삭제 + 검색/필터/정렬, 프로필 사진 업로드 2흐름
- **캐스팅**: 공고 등록·모델 배정(N:N)·상태 변경·수정·삭제 + `is_active` soft delete
- **정산**: 레코드 생성·기간/모델/상태별 조회·상태 관리·수정·삭제 + 월별/지출 비율 통계

### 6.3 알림 시스템 (SPEC-NOTIF-001)

- Notification 테이블에 `target_type` / `target_id` 인덱스 3개
- `notification_service.py` 중앙 서비스
- 프론트: NotificationBell + Dropdown + Item (30초 폴링, 미읽음 뱃지)
- 트리거: 캐스팅 생성/상태변경, 정산 완료, 모델 등록. `exclude_admin_id`로 자기 알림 제외

### 6.4 검색 시스템 (SPEC-SEARCH-001)

- **뉴스 기본 프로바이더**: Naver (25,000 req/일 무료)
- **이미지 기본 프로바이더**: Google Custom Search (현재 키 비활성)
- **자동 모델 매칭**: 검색어에서 모델명 자동 매칭 → 미등록 시 이름 입력 모달 → `modelsAPI.create()` 자동 생성 (`model_type='new_model'`)
- **저장 폴더**: `uploads/{model_name}/news/*.json`, `uploads/{model_name}/images/*.{jpg|png}`
- **보안**: SSRF 방어 + 매직 바이트 검증 (`utils/security.py`)
- **모델 상세 연동**: ModelNewsList + ModelImageGallery로 저장 데이터 표시

---

## 7. 프로필 내보내기 템플릿 4종 (Phase K-1 예정)

Jin 제공 이미지 기반:

| # | 템플릿 | 대상 | 주요 구성 |
|---|---|---|---|
| 1 | **연예인 A (레드)** | 연예인 | SNS 데이터(팔로워/검색량/관심도 차트) + 관련 뉴스 |
| 2 | **일반 모델** | 일반 모델 | 사진 3장 + 인스타 + 경력사항 |
| 3 | **외국인 모델** | 외국인 | 사진 5장 + 신체 사이즈 + 입출국일 |
| 4 | **연예인 B (옐로우)** | 연예인 | 모델료 + 활동사항 + 관련기사 섹션 |

- 연예인은 A/B **선택 가능**
- 출력 형식: PPT 또는 PDF (K-1에서 최종 확정)

---

## 8. 핵심 개발 원칙 (v17 누적 34개)

### 8.1 협업 프로토콜

1. **Autopus-ADK 기반 개발 필수** — 모든 새 기능/수정은 ADK 에이전트 경유
2. **claude.ai 아키텍트 단독 구현 금지** — 설계·지시·검토만
3. **모델 선택 선제시** — 매 작업 지시 최상단에 "🎯 이번 작업 적합 모델: Sonnet|Opus" 한 줄 블록
4. **한 단계씩만 제공** — 명령어 포함, 연속 두 단계 금지
5. **존댓말 사용** — 반말 금지
6. **솔직하게 답변** — 불확실한 내용은 확인 후 진행
7. **되돌리기 어려운 명령은 허가 후에만**
8. **스냅샷 자동 제공 금지** — 토큰 한도 임박 또는 Phase 종료 시점에만

### 8.2 기술 원칙

9. **자동 패치 스크립트 금지** — `patch_*.py` 류 사용 ❌, 직접 편집만
10. **의미 단위 커밋 분리** — 하나의 논리 변경 = 하나의 커밋
11. **Lore trailer 포맷 준수** — `.git/COMMIT_MSG_TMP.txt` 파일 경유
12. **Worker Contract 4행 구조 필수** — 목표/범위/완료 기준/금지
13. **금지 항목 없을 때 "해당 없음" 명시**
14. **300줄 파일 제한** — 초과 시 분리 (ex. Settlement ORM → `models/settlement.py`)

### 8.3 검증 원칙

15. **reviewer는 프론트엔드 코드 직접 읽기 의무** — curl만으로 "통과" 판정 금지
16. **클릭 가능 UI는 반드시 Link/button** — hover 스타일만 있는 `<div>` 금지
17. **optimistic update 우선** — 알림 등 비핵심 작업은 state 먼저 변경
18. **사용자에게 시각 확인만 요청** — 데이터 직접 입력 테스트 시키지 말 것
19. **Phase 중복 실행 금지** — `/auto review`, `/auto secure`는 Phase 개발 중 이미 실행됨
20. **debugger → executor 직행 패턴 유효** — 분석이 충분히 구체적이면 planner 생략 가능
21. **architect 스키마 분석 → executor 직행 패턴 유효** — 설계가 실행 단위까지 내려가면 planner 생략 가능

### 8.4 구조·환경 원칙

22. **schemas 충돌 주의** — `schemas/agency.py`가 `schemas.py`를 shadowing하면 20+ 필드 무시됨
23. **vite.config.ts 프록시 `/uploads` 필수** — 누락 시 curl OK / 브라우저 FAIL
24. **알림 테스트 시 2개 계정 필요** — `exclude_admin_id` 설계상 자기 알림 제외
25. **CLI 확인 원칙** — "확실하다"고 해도 명령어로 검증 후 진행
26. **신규 에이전트에 기지식 주입** — Contract 본문에 확인된 사실 직접 주입 + 재탐색 금지 명시

### 8.5 난이도·스코프 원칙

27. **난이도 분류 엄수** — Simple → executor 직행, Medium/Complex → 전체 워크플로
28. **세션 경계는 논리적 Phase** — 에이전트 호출 횟수로 작업 중단 금지
29. **검증 세션 스코프 경계 엄수** — 검증 후 새 기능 진입 금지, 세션 분할 권장

### 8.6 프로토콜 세부

30. **git 용어 설명 의무** — 비개발자에게 push/merge/rebase 등 처음 질문 시 비유로 설명
31. **인수인계 문서 버전 관리** — `인수인계_문서_{YYYYMMDD}_v{N}.md` 규칙
32. **인수인계 문서는 repo 외부에** — `F:\Project M\_handover\` 저장

### 8.7 v17 신규 원칙

33. **planner 시각 항목 과잉 분류 방지** — planner 계획 검토 시 "자동화 가능한가?" 기준으로 재분류. curl/grep으로 대체 가능한 것은 executor로 이관
34. **아키텍트 모델 판단 명시 블록** — 에이전트 호출 지시 최상단에 모델 판단 1줄 고정 블록 (본문 언급만으로는 Jin이 놓칠 수 있음)

---

## 9. 알려진 이슈 & 기술 부채

### 9.1 Phase J-6에서 fix 예정 (본 세션 범위)

- **1-2**: Google provider 500 에러 전파 → graceful 4xx 처리 필요 (`backend/app/routers/news.py` 또는 `services/search_service.py`)
- **3-5**: `ImagePreviewModal.tsx` 다크모드 클래스 전무
- **3-10**: `ModelNewsList`, `ModelImageGallery` `dark:border-` 누락

### 9.2 별도 UX 세션으로 이관

- **2-12**: `toast.warning` optional chaining (ToastContext에 warning 없을 가능성)
- **4-8**: AbortController/timeout 패턴 부재 (장시간 요청 시 피드백 없음)

### 9.3 환경 문제

- **Google Custom Search API 403 에러** — 현재 `GOOGLE_API_KEY` / `GOOGLE_CX` 비어 있음. 재발급 필요 (Jin 작업)
- **.env 29번째 줄 파싱 경고** — 서버 동작 영향 없음, 형식 점검 필요
- **에러 로그에 API 키 노출** — 키 마스킹 권장

### 9.4 구조 부채

- **database.py 330줄** — 300줄 초과, 별도 리팩터 세션 필요
- **DashboardPage.tsx 440줄** — DashboardHome 270줄 추출 후보
- **테스트 데이터 잔존** — F-2, F-3 자동 테스트 시 생성한 더미 레코드 (J-6에서는 cleanup 완료)
- **CLI 가끔 일본어 출력** — Opus/Sonnet 내부 사고 과정이 일본어로 나오는 경우 (작업 영향 없음)

---

## 10. 새 세션 시작 프로토콜

### 10.1 첨부 필수 파일

1. **본 개발 계획서** (`Project-M_개발계획서_v1.md`) — 맥락 복원용
2. **향후 개발지시서** (`Project-M_향후개발지시서_v1.md`) — 실행 지시
3. **최신 인수인계 문서** (`인수인계_문서_20260419_v17.md`) — 직전 세션 디테일

### 10.2 새 세션 첫 메시지 템플릿

```
나는 비개발자이고 Claude Code CLI로 model-agency-system 프로젝트를 개발 중이야.
항상 한 단계씩, 명령어 포함해서 자세히 설명해줘. 두 단계 이어서 주지 마.
모든 개발은 Autopus-ADK 기반으로 진행해.
매 작업 지시 전에 Sonnet/Opus 중 어느 쪽을 쓸지 먼저 판단해서 알려줘.

[개발 계획서 v1] + [향후 개발지시서 v1] + [인수인계 v17] 첨부했어.
계획서의 맥락을 확인한 뒤, 개발지시서의 "현재 지점"부터 이어서 진행해줘.
```

### 10.3 서버 실행 명령어 (참고)

**백엔드**:
```powershell
cd "F:\Project M\model-agency-system\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

**프론트엔드**:
```powershell
cd "F:\Project M\model-agency-system\frontend"
npm run dev
```

---

## 11. 본 문서의 유지보수 원칙

- 이 문서는 **Phase 대규모 전환점에서만 갱신**합니다 (v1 → v2 조건: J-6 종료 또는 Phase K/I 진입 시).
- 매 세션마다 발생하는 변경은 `인수인계_문서_{YYYYMMDD}_v{N}.md`에 기록하며, 이 계획서는 **누적 정리본**으로만 유지됩니다.
- 본 문서 갱신 시 버전 헤더(상단)와 섹션 5(진행 현황), 섹션 8(원칙), 섹션 9(이슈)를 우선 업데이트합니다.

---

> **종료 시점 상태**: Phase J-6 fix 대기 중, 전체 Phase 진행률 약 **63%** (21/33 완료 기준, SNS/K/I 미착수 포함)
> **다음 작업**: `Project-M_향후개발지시서_v1.md` 를 따라 진행
> **🐙 Autopus-ADK로 만드는 에이전시 관리 도구**