# 🐙 Model Agency System — 향후 개발지시서 v1

> **작성일**: 2026-04-23
> **작성자**: 아키텍트 Claude (claude.ai)
> **기준 시점**: Phase J-6 Call-1+1b 완료, Jin 시각 2건 대기 중
> **기준 커밋**: `43c19dbd` (Phase J-5 완료 시점, working tree clean)
> **짝 문서**: `Project-M_개발계획서_v1.md` (맥락 참조용)

---

## 📋 이 문서의 성격

이 문서는 **"새 세션에서 다음에 해야 할 일을 한 줄씩 따라가면 되는 실행 지향 지시서"**입니다. 개발 계획서가 "무엇을 만들었고 어떻게 일하는지"를 설명한다면, 이 지시서는 **"지금 뭐부터 할지, 어느 에이전트를 어떤 모델로 어떻게 부를지"**를 명시합니다.

⚠️ **원칙**: 본 문서의 지시는 **Phase 단위로 한 단계씩** 수행하며, 연속 두 Phase를 한 세션에 몰아넣지 않습니다. 검증 세션은 검증만, 구현 세션은 구현만.

---

## 🎯 현재 지점 — "여기서부터 시작하세요"

### 위치

**Phase J-6 통합 검증** 중 멈춘 상태입니다.

- ✅ Call-1 (executor 자동 검증) 완료 — PASS 30 / FAIL 2 / WARN 3 / Jin 보류 9
- ✅ Call-1b (보충 자동 검증) 완료 — 자동화 가능 항목을 executor로 이관, PASS 6 / WARN 1
- ✅ 통합 집계: PASS 36 / FAIL 2 / WARN 4 / Jin 시각 보류 2
- ✅ 테스트 데이터 cleanup 완료 (models/19 soft, news/10·11 hard delete)
- ✅ fix 범위 확정 (3건: 1-2, 3-5, 3-10)
- 🟡 **남은 것**: Jin 시각 2건 → Call-4 executor fix → Call-2 reviewer → 커밋 push

### 확정된 fix 범위 (본 세션 처리)

| # | 항목 | 심각도 | 변경 파일 |
|---|---|---|---|
| 1-2 | Google provider 500 → 4xx graceful 처리 | 🟡 Medium | `backend/app/routers/news.py` 또는 `services/search_service.py` |
| 3-5 | `ImagePreviewModal.tsx` 다크모드 클래스 전무 | 🟠 High | `frontend/src/components/.../ImagePreviewModal.tsx` |
| 3-10 | `ModelNewsList`, `ModelImageGallery` `dark:border-` 누락 | 🟢 Low | `frontend/src/components/.../ModelNewsList.tsx`, `ModelImageGallery.tsx` |

**예상 변경 파일 수**: 3~4개

### 스킵 (별도 UX 세션으로 이관)

- 2-12: `toast.warning` optional chaining
- 4-8: AbortController/timeout 패턴

---

## 📐 Step 0 — 새 세션 준비

### 0.1 첨부 파일 확인

새 세션 시작 시 다음 3개 파일을 첨부했는지 확인하세요:

1. `Project-M_개발계획서_v1.md` (본 문서의 짝)
2. `Project-M_향후개발지시서_v1.md` (본 문서)
3. `인수인계_문서_20260419_v17.md` (직전 세션 디테일)

### 0.2 터미널 2개 실행

**창 A — 백엔드**:
```powershell
cd "F:\Project M\model-agency-system\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

**창 B — 프론트엔드**:
```powershell
cd "F:\Project M\model-agency-system\frontend"
npm run dev
```

### 0.3 Claude Code CLI 실행

**창 C — CLI** (관리자 PowerShell 권장):
```powershell
cd "F:\Project M\model-agency-system"
claude --model sonnet
```

### 0.4 아키텍트 Claude 첫 메시지 (복사용)

```
나는 비개발자이고 Claude Code CLI로 model-agency-system 프로젝트를 개발 중이야.
항상 한 단계씩, 명령어 포함해서 자세히 설명해줘. 두 단계 이어서 주지 마.
모든 개발은 Autopus-ADK 기반으로 진행해.
매 작업 지시 전에 Sonnet/Opus 중 어느 쪽을 쓸지 먼저 판단해서 알려줘.

[개발 계획서 v1] + [향후 개발지시서 v1] + [인수인계 v17] 첨부했어.
계획서의 맥락을 확인한 뒤, 개발지시서의 "현재 지점"부터 이어서 진행해줘.
첫 행동은 Jin 시각 2건(2-9, 3-8) 확인 요청이야.
```

---

## 🧭 다음 작업 흐름 (전체 로드맵)

```
[현재 위치]
    ↓
세션 A — Phase J-6 마무리 (Jin 시각 → fix → reviewer → 커밋)
    ↓
세션 B — Phase J-8 이미지 검색 UX 개선
    ↓
세션 C, D — Phase J-7 라이브러리 관리 뷰 (Complex, 2세션 분할)
    ↓
세션 E, F — Phase SNS-1 SPEC-SNS-001 (Complex, 설계 + 구현 분리)
    ↓
세션 G, H, I — Phase K-1 프로필 내보내기 템플릿 4종 (Complex, 대작업)
    ↓
세션 J, K, L — Phase I-1 Electron 패키징 (Complex)
    ↓
세션 M — Phase I-2 백업·복원
    ↓
세션 N, O — Phase I-3 테스트 기반 구축
    ↓
[배포 가능 상태]
```

**총 예상**: 14~17 세션 (하루 1~2세션 기준, 약 2~3주)

---

## 🟡 세션 A — Phase J-6 마무리 (지금 세션)

**🎯 적합 모델**: Sonnet 4.6 (검증 + 소규모 fix)
**예상 에이전트 호출**: 2~3회 (Call-3 사용자 시각 → Call-4 executor fix → Call-2 reviewer)

### Step A-1. Jin 시각 2건 확인 (사용자 직접)

**2-9. 포트폴리오 등록 UI 존재 여부**
- 모델 상세 페이지 → 이미지 갤러리 → 이미지 하나에 **"포트폴리오 등록" 버튼/토글** 보이는지
- 버튼 존재만 확인 (실제 등록 동작은 코드 PASS로 검증됨)

**3-8. 다크모드 1~4번 화면 텍스트 가독성**
- 헤더 다크모드 토글 클릭
- 순서대로 훑기: 뉴스 검색 페이지 → 이미지 검색 페이지 → 모델 상세 뉴스 섹션 → 모델 상세 이미지 탭
- 텍스트가 어둠 속에 묻히는 곳 있는지만 확인
- 5번 프리뷰 모달은 FAIL 확정이라 스킵

**보고 형식**: `2-9: PASS / 3-8: PASS` 또는 FAIL 시 한 줄 코멘트

### Step A-2. Call-4 — executor fix 3건 통합 실행

**🎯 모델**: Sonnet 4.6

Claude Code CLI에서 아키텍트 지시에 따라 다음 Worker Contract로 executor 호출:

```markdown
**목표**: J-6 검증 fix 3건 일괄 적용 (Google 500 graceful 처리 + ImagePreviewModal 다크모드 + Gallery border 다크모드)
**범위**:
  - backend/app/routers/news.py 또는 backend/app/services/search_service.py (Google provider 500 → 4xx)
  - frontend/src/components/.../ImagePreviewModal.tsx (dark: 클래스 전면 추가)
  - frontend/src/components/.../ModelNewsList.tsx (dark:border- 추가)
  - frontend/src/components/.../ModelImageGallery.tsx (dark:border- 추가)
**완료 기준**:
  - provider=google 요청 시 서버가 4xx (400 또는 503) 반환 + 프론트 에러 토스트 표시
  - ImagePreviewModal 다크모드 전환 시 배경/테두리/텍스트 전부 대응
  - ModelNewsList, ModelImageGallery의 border-* 클래스가 dark 모드에서도 대응
**금지**: 검증 범위 밖 파일 수정 금지. toast.warning, AbortController 관련은 손대지 말 것 (별도 세션 대상)
```

### Step A-3. Call-2 — reviewer TRUST 5 최종 판정

**🎯 모델**: Sonnet 4.6

executor fix 완료 직후 reviewer 호출. 프론트엔드는 브라우저 실제 동작 확인까지 포함 (curl만으로 판정 금지).

### Step A-4. 커밋 + push

Lore 포맷으로 단일 커밋 작성 (PowerShell):

```powershell
# 1. 커밋 메시지 파일 작성
notepad .git/COMMIT_MSG_TMP.txt
# (아래 내용 붙여넣기 후 저장)

# 2. 커밋
git commit -F .git/COMMIT_MSG_TMP.txt

# 3. 임시 파일 삭제
Remove-Item .git/COMMIT_MSG_TMP.txt

# 4. push (아키텍트 허가 후)
git push origin master
```

**커밋 메시지 골격**:
```
fix(search): graceful google error + dark mode coverage for image modal and borders

J-6 검증 fix 3건 일괄 적용. Google provider 500을 4xx로 변환하여 프론트에서
사용자 친화적 토스트로 노출. ImagePreviewModal에 다크모드 클래스 전면 추가.
ModelNewsList/ModelImageGallery의 border- 에 dark:border- 페어링 추가.

Constraint: verification scope strict, other UX items deferred
Confidence: high
Scope-risk: local
Reversibility: trivial
Directive: none
Tested: reviewer TRUST 5 PASS + 브라우저 다크모드 토글 확인 + curl google 요청 4xx 응답 확인
Not-tested: toast.warning optional chaining, AbortController (별도 UX 세션)
Related: J-6 verification, SPEC-SEARCH-001

🐙 Autopus <noreply@autopus.co>
```

### Step A-5. 세션 종료 체크

- [ ] v18 인수인계 문서 작성 (`F:\Project M\_handover\인수인계_문서_20260423_v18.md`)
- [ ] 서버 2개 종료 (Ctrl+C)
- [ ] CLI 세션 `/exit`
- [ ] 본 개발지시서의 "Step A" 체크아웃 → "Step B"로 커서 이동

---

## 🟡 세션 B — Phase J-8 이미지 검색 UX 개선

**🎯 적합 모델**: Sonnet 4.6 (기존 패턴 복제)
**예상 에이전트 호출**: 3회 (planner → executor → reviewer)

### 목표

**NewsSearchPage에서 이미 구현된 "검색어 자동 매칭 + 미등록 모델 자동 생성" 패턴을 ImageSearchPage에도 동일 적용**

### 완료 기준

1. ImageSearchPage에서 모델 드롭다운 제거
2. 검색어에서 모델명 자동 매칭 로직 적용
3. 미매칭 시 모델명 입력 모달 표시
4. 미존재 모델은 `modelsAPI.create()`로 자동 생성 (`model_type='new_model'`)
5. NewsSearchPage와 UX 동등성 확보

### Worker Contract

```markdown
**목표**: ImageSearchPage에 NewsSearchPage의 자동 매칭 + 자동 생성 UX 패턴 동일 적용
**범위**: frontend/src/pages/ImageSearchPage.tsx (+ 필요 시 신규 모달 컴포넌트 분리)
**완료 기준**:
  - 모델 선택 드롭다운 제거됨
  - 검색어에서 모델명 자동 추출·매칭
  - 미매칭 시 NewsSearchPage와 동일한 이름 입력 모달
  - 모달에서 입력한 이름으로 자동 모델 생성 후 이미지 저장 진행
  - 다크모드 동작 유지
**금지**: NewsSearchPage 로직 수정 금지. 백엔드 엔드포인트 추가 금지 (기존 imageSearchAPI 그대로 활용)
```

### 세션 종료 체크

- [ ] 커밋 (feat scope) + push
- [ ] v19 인수인계 문서
- [ ] 서버 종료

---

## 🔴 세션 C-D — Phase J-7 라이브러리 관리 뷰 (Complex)

**🎯 적합 모델**: 설계는 Opus 4.6, 구현은 Sonnet 4.6
**예상 에이전트 호출**: 세션 C에서 architect → planner, 세션 D에서 executor → reviewer

### 목표

앱 내에서 `uploads/{model_name}/` 폴더 구조를 탐색·관리할 수 있는 라이브러리 뷰 신규 추가

### 세션 C — 설계 (Opus)

architect가 SPEC-LIBRARY-001 설계. 다음을 결정:

1. 라우트 경로 (`/library` 등)
2. 사이드바 메뉴 진입점
3. 폴더 트리 vs 타일 뷰
4. 파일 미리보기 방식 (이미지는 썸네일, JSON은 요약)
5. 삭제/이동 권한 범위
6. 백엔드 파일시스템 API 필요성
7. Phase 분할 (Phase 1 백엔드 / Phase 2 프론트엔드 / Phase 3 통합)

### 세션 D — 구현 (Sonnet)

architect의 SPEC을 따라 planner → executor → reviewer 순으로 진행.

### 세션 종료 체크

각 세션마다:
- [ ] 커밋 (feat scope) + push
- [ ] 인수인계 문서 (v20, v21)

---

## 🔴 세션 E-F — Phase SNS-1 SPEC-SNS-001 (Complex)

**🎯 적합 모델**: Opus 4.6 (설계), Sonnet 4.6 (구현)
**예상 에이전트 호출**: 설계 + 구현 2세션 분할

### 목표

Instagram, TikTok, YouTube 통합. 모델별 SNS 계정 등록 + 주요 지표(팔로워, 최근 업로드 등) 자동 수집.

### 세션 E — 설계 (Opus)

architect가 SPEC-SNS-001 설계. 주요 결정 포인트:

1. **데이터 소스 전략** — 공식 API vs 크롤링 vs 수동 입력
2. **갱신 주기** — 자동 스케줄 vs 사용자 트리거
3. **DB 스키마** — `ModelSNSAccount` 테이블 설계
4. **UI 배치** — 모델 상세 페이지 내 탭 vs 별도 섹션
5. **K-1 프로필 내보내기와의 데이터 공유** (연예인 A 템플릿이 SNS 데이터 의존)
6. Phase 분할 방안

### 세션 F — 구현 (Sonnet, 필요 시 F-1/F-2로 분할)

architect SPEC 기반 단계별 구현.

### 주의

- SPEC-SEARCH-001 완료 이후 진행 (의존성 있음)
- 외부 API/크롤링은 **보안 감사 필수** → `/auto secure` 반드시 실행

---

## 🔴 세션 G-I — Phase K-1 프로필 내보내기 템플릿 4종 (대작업)

**🎯 적합 모델**: Opus 4.6 (설계), Sonnet 4.6 (구현)
**예상 에이전트 호출**: 3세션 이상 분할 필수

### 템플릿 4종

| # | 템플릿 | 대상 | 주요 구성 |
|---|---|---|---|
| 1 | **연예인 A (레드)** | 연예인 | SNS 데이터 + 관심도 차트 + 관련 뉴스 |
| 2 | **일반 모델** | 일반 모델 | 사진 3장 + 인스타 + 경력사항 |
| 3 | **외국인 모델** | 외국인 | 사진 5장 + 신체 사이즈 + 입출국일 |
| 4 | **연예인 B (옐로우)** | 연예인 | 모델료 + 활동사항 + 관련기사 |

### 세션 G — 설계 (Opus)

architect가 SPEC-EXPORT-001 설계. 주요 결정:

1. **출력 형식** — PPTX vs PDF vs 둘 다
2. **라이브러리 선택** — python-pptx / reportlab / weasyprint
3. **템플릿 변수 매핑** — 모델 필드 → 템플릿 슬롯
4. **이미지 처리** — 해상도, 비율, 누락 시 기본 이미지
5. **세션 분할** — 템플릿 1개씩 vs 기반 공통 모듈 + 템플릿 4개 이후 적용

### 세션 H, I — 구현 (Sonnet, 세션별 템플릿 1~2개씩)

각 세션 종료 시 커밋 + 인수인계.

### 주의

- SNS-1 완료 이후 진행 (연예인 A 템플릿이 SNS 데이터 의존)
- 템플릿 이미지 참조는 Jin이 제공한 4장 스크린샷 기준

---

## 🔴 세션 J-L — Phase I-1 Electron 패키징 (Complex)

**🎯 적합 모델**: Opus 4.6 (설정·빌드 스크립트), Sonnet 4.6 (UI 통합)
**예상 에이전트 호출**: 3세션 이상

### 목표

Windows `.exe` 설치 파일 1개로 배포 가능한 상태 만들기.

### 세션 J — 설정 (Opus)

- `electron-builder` 설정
- 백엔드 자동 시작 (Electron 내부 프로세스)
- 개발/프로덕션 환경 분기
- SQLite 파일 경로 결정 (`%APPDATA%` 등)

### 세션 K — 백엔드 통합 (Sonnet)

- FastAPI 내장 실행 스크립트
- 포트 자동 선점 로직
- 종료 시 cleanup

### 세션 L — 빌드·테스트 (Sonnet)

- `npm run build` → `.exe` 생성
- 다른 PC에서 실행 테스트
- 자동 업데이트 (선택)

---

## 🟡 세션 M — Phase I-2 백업·복원

**🎯 적합 모델**: Sonnet 4.6
**예상 에이전트 호출**: 2회 (planner → executor)

### 목표

- SQLite DB 파일 백업 (날짜별 자동)
- 백업 복원 기능 (설정 메뉴)
- 업로드된 파일 백업 포함

---

## 🟡 세션 N-O — Phase I-3 테스트 기반 구축

**🎯 적합 모델**: Sonnet 4.6 기본, Complex 시 Opus
**예상 에이전트 호출**: 2세션 분할

### 목표

- 백엔드 `pytest` — 핵심 API 테스트
- 프론트엔드 `vitest` — 주요 컴포넌트 테스트
- E2E 3개 이상 (로그인 → 모델 등록 → 캐스팅 배정)

---

## 🧾 각 세션 공통 체크리스트

### 세션 시작 시

- [ ] 첨부 3파일 확인 (계획서 v1 + 본 지시서 v1 + 최신 인수인계)
- [ ] 백엔드·프론트엔드·CLI 창 3개 기동
- [ ] 아키텍트 첫 메시지에 **현재 Phase** 명시
- [ ] 아키텍트가 **🎯 적합 모델** 1줄 블록 먼저 제시하는지 확인

### 세션 진행 중

- [ ] Worker Contract 4행(목표/범위/완료 기준/금지) 필수
- [ ] 에이전트 호출 전 **모델 선택** 한 번 더 확인
- [ ] reviewer는 curl 뿐 아니라 프론트엔드 코드 직접 읽기 의무
- [ ] 사용자에게는 시각 확인만 요청 (데이터 입력 테스트 금지)

### 세션 종료 전

- [ ] 커밋 (Lore 포맷, `.git/COMMIT_MSG_TMP.txt` 경유)
- [ ] push (아키텍트 허가 후)
- [ ] `git status` clean 확인
- [ ] 원격 동기화 확인: `git rev-parse HEAD` = `git rev-parse origin/master`
- [ ] 인수인계 문서 작성 (`v{N+1}`, `F:\Project M\_handover\` 저장 + claude.ai 프로젝트 업로드)
- [ ] 서버 창 2개 Ctrl+C 종료
- [ ] CLI 세션 `/exit`
- [ ] 본 지시서에서 다음 세션 섹션으로 커서 이동

---

## ⚠️ 함정 주의 (재발 방지용)

### 1. reviewer가 curl만 보고 "통과" 선언

- curl은 API 200 응답까지만 확인 가능
- UI disabled 조건, navigate 경로, 드롭다운 상태는 프론트엔드 코드 직접 읽어야 확인 가능
- **대응**: reviewer 프롬프트에 "프론트엔드 코드를 직접 읽고 isEdit/disabled 조건 확인" 명시

### 2. 알림 테스트는 반드시 2개 계정으로

- `exclude_admin_id` 설계상 본인 알림은 안 옴
- admin으로 등록 → admin에게 알림 안 옴 (설계대로) → manager1로 로그인해서 확인

### 3. 프론트↔백엔드 필드명 불일치 = 422 에러

- 새 도메인 작업 시 Phase 1에 "필드명 정렬" 반드시 포함
- 과거 사례: 캐스팅의 `project_name` vs `title` 불일치

### 4. DB 마이그레이션 선제 처리

- `is_active` 컬럼 추가 시 `ALTER TABLE`을 코드 수정과 **동시에** 실행
- SQLAlchemy `checkfirst=True`는 테이블 생성만 담당, 기존 테이블 컬럼 추가는 안 됨

### 5. `[object Object]` 에러 패턴

- FastAPI 422 응답의 `detail`이 배열일 때 `new Error(배열)` → `[object Object]`
- `auth-api.ts`의 에러 핸들러에서 `Array.isArray` 처리 필수

### 6. vite.config.ts `/uploads` 프록시 누락

- curl로는 이미지 보여도 브라우저에서 안 보임
- 새 경로 추가 시 vite 프록시 설정 확인

### 7. schemas 충돌

- `schemas/agency.py`가 `schemas.py`를 shadowing하면 20+ 필드 무시됨
- 새 스키마 파일 추가 시 기존 동명 파일 존재 여부 확인

### 8. Phase 중복 실행 금지

- `/auto review`, `/auto secure`는 각 Phase 개발 중 이미 실행됨
- 이후 검증 세션에서 재실행 금지

### 9. 검증 세션 스코프 엄수

- 검증만 하고 끝. 검증 후 새 기능 진입 금지, 세션 분할 필수
- 과거 사례: J-6 Call-1+1b+Call-3+Call-4+Call-2 = 5회 호출은 예외적 허용

### 10. 세션 경계는 논리적 Phase

- 에이전트 호출 횟수로 작업 중단 금지
- Phase 단위로 끊는 게 자연스러운 경계

---

## 🔄 이 지시서의 갱신 규칙

- Phase 1개 완료할 때마다 해당 섹션에 ✅ 표시 + 결과 요약 1줄 추가
- 새 함정 발견 시 "⚠️ 함정 주의" 섹션에 추가
- Phase 순서 조정 시 아키텍트 판단 + Jin 동의 후 본 문서 갱신
- 대규모 전환점 (J 전체 완료, K 완료, I 완료)에서 v2로 증분

---

## 📎 참고: 문서 버전 관리

| 구분 | 파일명 규칙 | 갱신 주기 |
|---|---|---|
| **개발 계획서** (누적 정리본) | `Project-M_개발계획서_v{N}.md` | Phase 대규모 전환점 |
| **향후 개발지시서** (실행용) | `Project-M_향후개발지시서_v{N}.md` | Phase 대규모 전환점 |
| **인수인계 문서** (세션별) | `인수인계_문서_{YYYYMMDD}_v{N}.md` | 매 세션 종료 시 |

현재 이 문서가 **v1**. 다음 증분 조건: Phase J 전체(J-6, J-7, J-8) 완료 또는 Phase K 진입 시.

---

> **다음 작업**: Step 0 → Step A-1 (Jin 시각 2건 확인)부터
> **🐙 Autopus-ADK로 한 단계씩, 착실히**