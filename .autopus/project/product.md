# Product — Model Agency Management System

> 생성: 2026-04-25 (`/auto setup`, 옵션 B 마이그레이션 후 첫 동기화)
> 최종 갱신: 2026-04-27 (`/auto sync SPEC-IMAGE-PROXY-002`, J-8b 프론트엔드 프록시 통합 완료 후)

## 프로젝트 정보

| 항목 | 값 |
|------|------|
| 프로젝트명 | Model Agency Management System (모델 에이전시 관리 시스템) |
| 모드 | desktop-app + local-api (Electron + FastAPI) |
| 대상 사용자 | 비개발자 Jin 1인 운영 (광고 모델 에이전시) |
| 기준 시점 | 옵션 B 마이그레이션 완료 (2026-04-24, v17) |
| 작업 경로 | `G:\Project M\model-agency-system\` |
| GitHub | `iamsangjin76-bot/model-agency-system` (private) |

## 개요

광고 모델 에이전시의 모델·고객·캐스팅·계약·정산을 한 데스크톱 앱에서 관리한다. 뉴스/이미지 검색을 모델별로 자동 매칭하여 포트폴리오를 업데이트하고, 캐스팅 → 계약 → 정산을 연결된 흐름으로 다룬다. Electron 패키징 후 단일 PC 설치형으로 배포 예정 (Phase I-1).

## 핵심 기능 10개 (옵션 B 후 + J-8a 후 실제 구현)

| 기능 | 핵심 동작 | 관련 Phase |
|------|-----------|-----------|
| 1. 모델 CRUD | 26필드 상세 페이지 (`ModelDetailPage`), soft delete, 검색/필터/정렬 | F-1 |
| 2. 캐스팅 CRUD | 공고 등록 + N:N 모델 제안 + 상태 워크플로 | F-2 |
| 3. 정산 CRUD | 수입/지출 기록 + 월별 통계 + 지출 비율 | F-3 |
| 4. 클라이언트 CRM | 4등급(VIP/Gold/Silver/Normal) + 산업 태그 | F-1 |
| 5. 계약 + 일정 관리 | 전속/프로젝트/연간/이벤트 4종 계약 + 캘린더 일정 | F-1, F-3 |
| 6. 뉴스 검색 + 자동 매칭 | Naver 검색 → 검색어에서 모델명 자동 추출 → 미등록 시 자동 생성 → JSON 저장 | J-2, J-4 |
| 7. 이미지 검색 + 포트폴리오 등록 | Naver(Google 비활성) → SSRF 방어 다운로드 → 포트폴리오 승격 | J-3, J-4 |
| 8. 알림 시스템 | 30초 폴링 + 자동 트리거 (캐스팅/정산/모델) + `exclude_admin_id` 자기 제외 | G-1 (SPEC-NOTIF-001) |
| 9. JWT 토큰 갱신 | Access 15분 + Refresh 7일, silent refresh, family revocation | SPEC-AUTH-001 ✅ |
| **10. 외부 이미지 프록시** | `/api/proxy/image` SSRF 방어 + 디스크 캐시 (TTL 7일) + 매직 바이트 검증 + 핫링크 우회 (Naver/Ruliweb CDN) | **J-8a (SPEC-IMAGE-PROXY-001 §1)** ✅ |

## Phase 진행 현황 (v17 옵션 B 후 기준)

| Phase | 이름 | 상태 |
|-------|------|------|
| A~D | ADK 세팅 + repo 위생 | ✅ 완료 |
| E-1~E-3 | 시드 + 활동로그 + 대시보드 차트 | ✅ 완료 |
| F-1 | 모델 CRUD + 상세 | ✅ 완료 |
| F-2 | 캐스팅 CRUD (479→211줄) | ✅ 완료 |
| F-3 | 정산 CRUD (657→158줄) | ✅ 완료 |
| G-1 | 알림 시스템 (SPEC-NOTIF-001 비공식) | ✅ 완료 |
| G-2 | 파일 업로드 (프로필 사진 + 추가 이미지 4칸) | ✅ 완료 |
| G-3 | 검색·필터·정렬 (모델·캐스팅·정산 3도메인) | ✅ 완료 |
| H-1 | 반응형 레이아웃 | ✅ 완료 |
| H-2 | 다크모드 | ✅ 완료 |
| H-3 | 에러 처리·로딩 UX | ✅ 완료 |
| J-1 | 검색 백엔드 인프라 | ✅ 완료 |
| J-2 | 뉴스 라우터 (4 엔드포인트) | ✅ 완료 |
| J-3 | 이미지 라우터 (5 엔드포인트) | ✅ 완료 |
| J-4 | 프론트 검색 페이지 API 연동 | ✅ 완료 |
| J-5 | 모델 상세 + 뉴스/이미지 통합 | ✅ 완료 |
| **J-6** | **통합 검증 + graceful 503 fix** | ✅ **완료** (2026-04-25, commit `99253666`) |
| **J-8a** | **외부 이미지 프록시 백엔드** (SSRF 방어 6항목 + 디스크 캐시) | ✅ **완료** (2026-04-26, commit `c458bed5`) |
| **J-8b** | **프론트엔드 이미지 프록시 통합** (`proxify()` 헬퍼 + 4 call site + onError fallback) | ✅ **완료** (2026-04-27, SPEC-IMAGE-PROXY-002) |
| J-8c | ImageSearchPage UX 패리티 (NewsSearchPage 자동 매칭 패턴 복제) | 🔴 미착수 |
| J-8d | DashboardPage.tsx:278 PlaceholderPage 다크 짝 1줄 보정 | 🔴 미착수 |
| J-8e | 통합 KPI vs 도메인별 분산 호출 정책 (Option B 권고) | 🔴 미착수 (결정 보류) |
| J-7 | 라이브러리 관리 뷰 | 🔴 미착수 |
| SNS-1 | SPEC-SNS-001 (Instagram/TikTok/YouTube) | 🔴 미착수 |
| K-1 | 프로필 내보내기 4종 (PPT/PDF) | 🔴 미착수 |
| I-1 | Electron 패키징 | 🔴 미착수 |
| I-2 | 백업·복원 | 🔴 미착수 |
| I-3 | 테스트 기반 구축 (pytest + vitest) | 🔴 미착수 |

> 개발계획서 v1의 "J-6 진행 중"은 옵션 B **이전** 로컬 라인 기준이므로 무시. v17 옵션 B 후 J-6는 미착수다.
>
> **출처**: F-2/F-3 리팩터 줄수(479→211, 657→158)는 `handover/인수인계_문서_20260417_v11.md:73,84` + `handover/Project-M_개발계획서_v1.md:156-157`. G-2 파일 업로드 + G-3 3도메인 상세는 `handover/인수인계_문서_20260417_v12.md:59-76`.

## 사용 사례 4가지

1. **신규 모델 등록**: 모델 폼 → 26필드 입력 → 프로필 사진 업로드 → 키워드/SNS 메타 등록 → 모델 목록에서 검색/필터 가능.
2. **뉴스/이미지 자동 수집**: NewsSearchPage 또는 ImageSearchPage → 검색어 입력 (예: "김민지") → 자동 매칭된 기사/이미지 선택 → 모델별 폴더에 저장 → ModelDetailPage에서 뉴스 리스트 + 이미지 갤러리 확인.
3. **캐스팅 → 계약 → 정산**: CastingPage 공고 생성 → 모델 제안 (status: request → confirmed) → ContractPage 계약 등록 → SettlementPage 수수료/모델료 기록.
4. **데스크톱 + 다크모드 + 알림**: 사이드바 접기, 테이블↔카드 자동 전환, 30초마다 알림 폴링, Tailwind dark: 클래스로 야간 작업 지원.

## 로드맵 (J-8b 완료 후 갱신, 2026-04-27)

```
✅ J-6 통합 검증 + graceful 503 (완료 — commit 99253666)
   ↓
✅ J-8a 백엔드 이미지 프록시 (완료 — commit c458bed5)
   ↓
✅ J-8b 프론트엔드 이미지 프록시 통합 (완료 — SPEC-IMAGE-PROXY-002, 2026-04-27)
   - proxify() 헬퍼 + 4 call site + onError fallback
   ↓
🔴 J-8c·d 프론트엔드 잔여 (Sonnet, 1세션)
   - 8c: ImageSearchPage UX 패리티 (NewsSearch 패턴 복제)
   - 8d: DashboardPage.tsx:278 dark 1줄
   ↓
🔴 J-7 라이브러리 관리 뷰 (Opus 설계 → Sonnet 구현, 2세션)
   ↓
SNS-1 SPEC-SNS-001 (Opus 설계 → Sonnet 구현, 2세션)
   ↓
K-1 프로필 내보내기 4종 (Opus → Sonnet, 3세션 이상)
   ↓
I-1 Electron 패키징 (Opus → Sonnet, 3세션)
   ↓
I-2 백업·복원 (Sonnet, 1세션)
   ↓
I-3 테스트 기반 구축 (Sonnet/Opus, 2세션)
   ↓
[배포 가능 상태]
```

## 핵심 협업 원칙 (v17 누적 36개 중 발췌)

1. **Autopus-ADK 기반 개발 필수** — 모든 새 기능/수정은 ADK 에이전트 경유.
2. **비개발자 1인 운영** — claude.ai 아키텍트(Opus 4.6)가 설계·지시·검토, Claude Code CLI(Sonnet 4.6 기본)가 실행.
3. **모델 선택 선제시** — 매 작업 지시 최상단에 `🎯 이번 작업 적합 모델: Sonnet|Opus (근거: ...)` 1줄 블록.
4. **한 단계씩만** — 명령어 포함, 연속 두 단계 금지.
5. **patch_*.py 자동 치환 스크립트 금지** — 2026-04-16 인시던트 (DashboardPage 차트 중복 삽입).
6. **300줄 파일 제한** — 초과 시 도메인별 분리.
7. **검증 세션 스코프 엄수** — 검증 후 새 기능 진입 금지.

전체 원칙은 `handover/Project-M_개발계획서_v1.md` 8장 참조.

## 배포 모델

- **현재**: 로컬 개발 (Vite 5173 + uvicorn 8000), Docker/CI/CD 없음.
- **목표**: Electron 단일 `.exe` 설치 파일 (Phase I-1).
- **DB 위치**: 개발 시 `backend/model_agency.db`, 패키징 후 `%APPDATA%` 예정.
