# Project-M 실제 상태 진단 보고서

> **작성일**: 2026-04-23
> **목적**: G드라이브 프로젝트의 진짜 상태 파악 + 문서 v1과의 불일치 분석
> **저장 위치**: Apple Notes + `G:\Project M\model-agency-system\docs\` 추천

---

## 1. 핵심 결론

Jin이 claude.ai에서 관리해온 **문서 v1(J-Phase 체계)**은 G드라이브의 실제 프로젝트와 일치하지 않음. 두 프로젝트는 별개의 아키텍처와 진행 이력을 가짐.

**G드라이브 프로젝트 = 진짜 작동하는 실체**
- 커밋 3개 (Phase 6~7, 8~11, 13)
- Phase 1~13 실제 구현
- 백엔드 라우터 17개, 프론트엔드 페이지 20개
- 오늘(2026-04-23) autopus-adk 설치 완료

**문서 v1 = 실체 없는 평행 계획서**
- 기준 커밋 `43c19dbd`가 G 저장소에 없음
- 문서가 기술한 파일들(news.py, ImagePreviewModal.tsx 등) 존재 안 함
- 명시된 GitHub 원격(`iamsangjin76-bot/model-agency-system`)의 실존 여부 미확인

---

## 2. G드라이브 실제 구현 완성도

### 백엔드 라우터 (17개)
| 라우터 | 기능 |
|---|---|
| auth.py | 인증 (JWT) |
| models.py | 모델 CRUD |
| clients.py | 고객 CRUD |
| castings.py | 캐스팅 관리 |
| contracts.py | 계약 관리 |
| settlements.py | 정산 |
| schedules.py | 일정 |
| notifications.py | 알림 시스템 |
| activity_logs.py | 활동 로그 |
| stats.py | 통계 API |
| files.py | 파일 업로드 |
| media.py | 미디어 |
| exports.py | 프로필 내보내기 |
| imports.py | Excel 일괄 등록 (Phase 13) |
| share.py | 공유 링크 |
| sns.py | SNS 분석 |

### 프론트엔드 페이지 (20개)
| 카테고리 | 페이지 |
|---|---|
| 인증 | LoginPage |
| 메인 | DashboardPage |
| 모델 | ModelListPage, ModelDetailPage, ModelFormPage |
| 비즈니스 | CastingPage, ClientPage, ContractPage, SettlementPage, SchedulePage |
| 기능 | ImageSearchPage, NewsSearchPage, SNSAnalyticsPage, ProfileExportPage, LibraryPage, ImportPage, TabletNewsPage |
| 관리 | AdminManagementPage, SettingsPage, SharedProfilePage |

### 기술 스택 확인
- FastAPI + Python
- React + TypeScript + Vite
- SQLite
- Electron (설정 있음, `build-electron.cmd`, `start-electron-dev.cmd` 존재)
- autopus-adk (오늘 설치)

### git 상태
- 브랜치: `master` + 5개 claude 작업 브랜치 (`claude/cranky-beaver`, `claude/vigilant-hypatia` 등)
- 커밋: 3개 (최신 `5ba369a6`)
- **원격 저장소 연결 없음** (로컬 전용)

---

## 3. 문서 v1과의 주요 불일치

| 항목 | 문서 v1 | G드라이브 실제 |
|---|---|---|
| 기준 커밋 | `43c19dbd` | 없음 (fatal) |
| Phase 체계 | A~J (알파벳+숫자) | 1~13 (숫자) |
| 최신 Phase | J-6 대기 | Phase 13 완료 |
| 뉴스 검색 구현 | `backend/routers/news.py` + `ModelNewsList.tsx` | `NewsSearchPage.tsx`만 (별도 라우터 없음, 추정) |
| 이미지 검색 구현 | `routers/images.py` (추정) + `ImagePreviewModal` + `ModelImageGallery` | `ImageSearchPage.tsx`만 |
| 프로필 내보내기 | K-1로 미착수 | `ProfileExportPage.tsx` 이미 존재 |
| SNS 분석 | SNS-1로 미착수 | `SNSAnalyticsPage.tsx` + `sns.py` 이미 존재 |
| GitHub 원격 | `iamsangjin76-bot/model-agency-system` (private) | 연결 없음 |
| Autopus 설치 | Phase C에서 완료 | 오늘 2026-04-23에 재설치 |
| 개발 철학 문서 | 인수인계 v17까지 누적 | DEVELOPMENT_PLAN.md (2026-02-25 단일본) |

---

## 4. 상태 시나리오 분석

### 시나리오 A: 문서 v1은 순수 이론서 (가능성 70%)
- Jin이 claude.ai에서 아키텍트와 함께 J-Phase 계획을 수립
- 실제 구현은 다른 경로(Claude Code CLI 직접 브랜치 작업)로 G드라이브에서 진행
- 두 경로가 서로 독립적으로 발전하며 이름만 공유

### 시나리오 B: 다른 저장소에 J-Phase 실존 (가능성 25%)
- `iamsangjin76-bot/model-agency-system` GitHub에 문서 v1의 J-Phase 프로젝트가 있을 수 있음
- 브라우저로 URL 접근 시 확인 가능
- 존재 시 G와 비교/통합 결정 필요

### 시나리오 C: Jin의 기억 혼선 (가능성 5%)
- 여러 프로젝트 버전을 오가며 작업한 결과 Jin도 정확한 상태 파악 어려움
- 이 경우 G드라이브 현실만 받아들이는 게 최선

---

## 5. 긴급 대응 우선순위

### 🔴 P0: GitHub 백업 (오늘 안에)
G드라이브는 외장 드라이브일 가능성 높음. 소유권 문제 SID가 그 증거. 드라이브 고장 = 1년치 작업 소실.

```powershell
# 1. GitHub에 새 저장소 생성 (웹 UI)
# 2. 로컬에 remote 추가
cd "G:\Project M\model-agency-system"
git remote add origin https://github.com/iamsangjin76-bot/model-agency-system-g.git
# (또는 문서에 있는 저장소가 비어있다면 기존 이름 사용)
git push -u origin master
git push --all origin  # 모든 브랜치
```

### 🟡 P1: 문서 v1의 진짜 정체 확인
브라우저에서 `https://github.com/iamsangjin76-bot/model-agency-system` 확인:
- 404 → 문서 v1은 이론서로 확정
- 존재 → 내용 비교 후 결정

### 🟢 P2: 새 기준서 작성
- 기존 `DEVELOPMENT_PLAN.md` + `IMPLEMENTATION_PLAN.md` 갱신
- Phase 13까지의 실제 완료 상태 기록
- Phase 14+ 다음 로드맵 정의
- autopus 기반 SPEC 체계로 전환

---

## 6. autopus-adk를 G에 적용하는 경로

`.autopus/specs/`가 비어 있으므로 아직 autopus SPEC 없음. 다음 순서로 진행 권장:

### Step 1 — 프로젝트 컨텍스트 생성
```powershell
cd "G:\Project M\model-agency-system"
# Claude Code CLI에서:
/auto setup
```
기대 결과: 5개 컨텍스트 문서 자동 생성
- `ARCHITECTURE.md`
- `.autopus/project/product.md`
- `.autopus/project/structure.md`
- `.autopus/project/tech.md`
- `.autopus/project/scenarios.md`

### Step 2 — 기존 DEVELOPMENT_PLAN.md 갱신
autopus가 생성한 컨텍스트를 참고해 DEVELOPMENT_PLAN.md를 Phase 13 기준으로 업데이트.

### Step 3 — Phase 14 SPEC 작성
다음 기능 결정 후:
```
/auto plan "Phase 14 설명"
```

### Step 4 — 구현
```
/auto go SPEC-ID --auto --loop
```

---

## 7. Jin이 결정해야 할 질문들

- [ ] 문서 v1(J-Phase 체계)을 **폐기**할 것인가, **참고 자료**로 보존할 것인가?
- [ ] GitHub 저장소 이름 — 문서의 `iamsangjin76-bot/model-agency-system` 쓸지, 새 이름 쓸지?
- [ ] Phase 13 다음 기능은 무엇인가? (DEVELOPMENT_PLAN.md의 "미구현" 섹션 참조)
- [ ] 여러 브랜치(`claude/cranky-beaver` 등) 정리 필요한가?
- [ ] autopus를 기반으로 새 Phase를 시작할 것인가, 기존 스타일 유지할 것인가?

---

## 8. 오늘 한 작업 요약

1. autopus-adk 설치 (PowerShell install.ps1 버그 → 우회)
2. JARVIS Protocol과의 결합 전략 분석 (V1, V2 문서 작성)
3. G드라이브 프로젝트 실제 상태 진단
4. 문서 v1과 현실 불일치 확인
5. 새 기준서 작성 방향 수립

## 9. 오늘 발견한 함정

- **외장 드라이브 소유권 SID 불일치** → git `safe.directory` 설정으로 우회 가능
- **파일명 가정 금지** → 문서와 실제 코드는 다를 수 있음, 반드시 `Test-Path`로 확인
- **Git 원격 연결 유무 항상 확인** → `git remote -v` 먼저
- **GitHub URL은 직접 브라우저 확인** → CLI만으로 저장소 존재 확정 불가

---

## 10. 새 창에서 이어갈 때 전달할 핵심 컨텍스트

```
Project-M은 G:\Project M\model-agency-system에 있는 Phase 13까지 완료된 프로젝트다.
2026-04-23에 autopus-adk를 설치했고, .autopus/specs/는 비어 있다.
GitHub 원격 연결 없음 (백업 시급).

이전에 claude.ai에서 작성한 J-Phase 체계 문서(v1)는 이 프로젝트와 다른 계획서이며,
실제 G드라이브와 아키텍처가 다르다. 현재 새 기준서 작성 중.

다음 작업: [P0 GitHub 백업 | P1 원격 저장소 확인 | P2 Phase 14 정의 | Step 1 /auto setup] 중 선택.