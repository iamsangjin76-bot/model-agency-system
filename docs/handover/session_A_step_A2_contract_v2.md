# Session A — Step A-2 Worker Contract v2

> **대상 세션**: 세션 A (Phase J-6 마무리)
> **대상 단계**: Step A-2 (executor fix 3건 통합 실행)
> **작성일**: 2026-04-23
> **v1과의 차이**: HTTP 상태 코드 확정, 근거 명시, 한국어 토스트 문구 제시, 다크모드 구체적 토큰 매핑, 금지 항목 세분화

---

## 🎯 이번 작업 적합 모델: **Sonnet 4.6**

**근거**: 3개 파일의 소규모 fix이며, 패턴이 기존 코드베이스(원칙 25: "CLI 확인 원칙"과 문서 섹션 6.4 검색 시스템)에서 확립됨. 새 아키텍처 결정 없음. Opus 수준 추론 불필요. TRUST 5 검증이 엄격해야 하므로 reviewer 단계에서만 신중히 진행.

---

## 📋 Worker Contract (Claude Code CLI에 전달)

```markdown
**목표**: Phase J-6 검증에서 확정된 fix 3건 일괄 적용 — (a) Google provider 500 에러를 사용자 친화적 503 응답으로 변환, (b) ImagePreviewModal 다크모드 전면 대응, (c) ModelNewsList/ModelImageGallery border 계열 클래스에 dark: 페어링 추가

**범위**:
  백엔드 (택1):
    - backend/app/routers/news.py
      또는
    - backend/app/services/search_service.py
    (※ Google provider 에러가 현재 어느 레이어에서 500으로 raise되는지 확인 후, 가장 상위에서 한 번만 변환)

  프론트엔드 (3개 파일):
    - frontend/src/components/.../ImagePreviewModal.tsx
    - frontend/src/components/.../ModelNewsList.tsx
    - frontend/src/components/.../ModelImageGallery.tsx
    (※ "..." 부분은 실제 경로 확인 후 고정. 추측 금지.)

  프론트엔드 에러 핸들러 (선택):
    - frontend/src/api/*.ts 중 이미지 검색 호출부 1개
    (※ 503 응답을 받았을 때 한국어 토스트를 띄우는 핸들러가 이미 있는지 확인. 없으면 추가, 있으면 수정.)

**완료 기준**:

  [백엔드 1-2]
  1. `GET /api/news/search?provider=google&...` 요청 시 Google API 호출이 실패하는 경우,
     서버가 **503 Service Unavailable** 응답을 반환.
     - 선택 근거: 502(Bad Gateway)는 외부 서비스가 "응답은 했는데 이상한 응답"일 때.
                500(Internal Server Error)은 서버 자체 버그 암시.
                Google API 키 미설정·쿼터 초과·403 모두 "서비스가 현재 사용 불가" 상태이므로 503이 가장 정확.
  2. 응답 body에 다음 구조 포함:
     ```json
     {
       "detail": {
         "provider": "google",
         "reason": "unavailable" | "quota_exceeded" | "auth_failed",
         "message_ko": "Google 이미지 검색이 일시적으로 사용할 수 없습니다."
       }
     }
     ```
     (reason은 확인 가능한 경우에만 세분화, 불명확하면 "unavailable" 고정)
  3. 서버 로그에 원본 Google 에러 메시지는 masked 처리로 기록 (원칙: 섹션 9.3 "에러 로그에 API 키 노출" 재발 방지).

  [프론트엔드 에러 토스트]
  4. 503 응답 수신 시 프론트에서 아래 한국어 토스트 표시:
     ```
     "Google 이미지 검색이 일시적으로 사용할 수 없습니다. 네이버 검색으로 전환하거나 잠시 후 다시 시도해주세요."
     ```
     - 토스트 종류: `toast.error` (warning이 아님. warning 사용은 별도 세션 2-12에서 처리)
     - 지속 시간: 기본값 유지

  [프론트엔드 3-5 ImagePreviewModal]
  5. ImagePreviewModal.tsx에 다음 요소 각각 dark: 페어링 적용:
     - 모달 배경 overlay (bg-black/50 류는 이미 반투명이지만, 컨텐츠 컨테이너 확인)
     - 모달 컨텐츠 컨테이너 background (bg-white → dark:bg-gray-900)
     - 모달 테두리 (border-gray-200 → dark:border-gray-700)
     - 닫기 버튼 아이콘 색 (text-gray-600 → dark:text-gray-300)
     - 이미지 메타 텍스트 (text-gray-700 → dark:text-gray-200)
     - 포트폴리오 등록 버튼 (bg-blue-500 hover:bg-blue-600 → dark: 페어링)
     - 기타 컴포넌트 내부의 모든 light/dark 분기 가능 지점
     (※ 패턴 기준: ToastContext, NotificationDropdown 등 이미 다크모드 처리된 컴포넌트의 토큰 매핑 규칙 그대로 따를 것)

  [프론트엔드 3-10 Gallery/List border]
  6. ModelNewsList.tsx:
     - 모든 border-* 클래스에 대응하는 dark:border-* 추가
     - 예: `border-gray-200` → `border-gray-200 dark:border-gray-700`
     - 텍스트 색/배경도 누락 없이 검토

  7. ModelImageGallery.tsx: 위와 동일 원칙 적용

  [검증 방법]
  8. 백엔드 검증 (curl):
     ```powershell
     # 정상 provider (네이버) 확인
     curl -X GET "http://localhost:8000/api/news/search?provider=naver&query=테스트"
     # → 200 기대

     # 문제 provider (구글)
     curl -X GET "http://localhost:8000/api/news/search?provider=google&query=테스트"
     # → 503 기대, body에 detail.message_ko 포함
     ```
  9. 프론트 검증 (브라우저):
     - 이미지 검색 페이지에서 provider=google 선택 후 검색
     - 한국어 토스트가 error 스타일로 떠야 함 (빨간색 계열)
     - 다크모드 토글 후 ImagePreviewModal, ModelNewsList, ModelImageGallery 순회
     - 어둠 속에 묻히는 텍스트·테두리가 없어야 함

**금지**:
  1. 검증 스코프 밖 파일 수정 금지:
     - `toast.warning` 관련 수정 금지 (2-12, 별도 UX 세션 대상)
     - AbortController/timeout 패턴 추가 금지 (4-8, 별도 UX 세션 대상)
  2. 백엔드 변경 시 기존 200 응답 경로에 영향 주지 말 것 (네이버 provider는 그대로 작동해야 함).
  3. Google API 키 재설정 작업 금지 (Jin 수동 작업, 섹션 9.3).
  4. 새 패키지 설치·의존성 추가 금지 (fix 범위가 명시적으로 "3건 일괄 적용"으로 고정됨).
  5. ImagePreviewModal 기능 확장 금지 (다크모드 대응만. 애니메이션/레이아웃/접근성 개선은 이번 범위 밖).
  6. schemas/ 하위 파일 건드리지 말 것 (섹션 9.4, schemas 충돌 재발 방지).
  7. Worker 실행 중 발견한 다른 다크모드 누락 이슈는 별도 로그로 기록만 하고 수정 금지.
     → 발견 시 `.autopus/learnings/J6_discovered.md` 에 추가.
  8. 커밋 금지 (커밋은 reviewer TRUST 5 PASS 후 아키텍트 허가를 받고 사용자가 직접 수행).
```

---

## 🛡️ Worker 실행 전 Pre-flight Check

executor를 호출하기 전에 Claude Code CLI에서 다음을 먼저 확인:

```powershell
# 1. 현재 브랜치와 커밋 확인
git rev-parse HEAD
# 기대값: 43c19dbd (또는 J-5 이후 working tree clean 상태)

# 2. working tree clean 확인
git status
# 기대값: "nothing to commit, working tree clean"

# 3. 백엔드 서버 실행 중 확인
curl -X GET "http://localhost:8000/api/health" 2>&1 | Select-Object -First 5
# 기대값: 200 OK 응답

# 4. 프론트엔드 서버 실행 중 확인 (브라우저)
# http://localhost:5174 접속 가능한지
```

---

## 🔄 Worker 실행 후 Post-check

executor 완료 직후 reviewer 호출 전에 사용자가 확인:

```powershell
# 1. 변경된 파일 수 확인 (예상: 3~4개)
git status

# 2. 변경 범위 확인
git diff --stat

# 3. 위험 경로가 수정되지 않았는지 확인
git diff --name-only | Select-String -Pattern "schemas|database\.py|seed\.py"
# 기대값: 빈 결과
```

---

## 📞 에이전트 호출 순서 (한 단계씩)

1. **executor 호출** — 위 Contract를 통째로 전달
2. (사용자) Pre-flight Check → Post-check
3. **reviewer 호출** — TRUST 5 검증 + 프론트엔드 코드 직접 읽기 의무 (원칙 15)
4. (사용자) 브라우저에서 시각 확인 (다크모드 토글, Google 토스트 확인)
5. **아키텍트에게 결과 보고**
6. 커밋 (Lore 포맷, `.git/COMMIT_MSG_TMP.txt` 경유) — 아키텍트 허가 후

---

## 📝 커밋 메시지 초안 (reviewer PASS 후 사용)

```
fix(search): graceful google error + dark mode coverage for image modal and borders

J-6 검증 fix 3건 일괄 적용. Google provider 호출 실패 시 500을 503으로 변환하고
한국어 detail을 담아 프론트에서 사용자 친화적 토스트로 노출. ImagePreviewModal에
다크모드 토큰을 전면 추가하고, ModelNewsList/ModelImageGallery의 border-* 클래스에
dark:border- 페어링을 추가.

Constraint: verification scope strict, other UX items deferred
Confidence: high
Scope-risk: local
Reversibility: trivial
Directive: none
Tested: reviewer TRUST 5 PASS + 브라우저 다크모드 토글 확인 + curl google 요청 503 응답 확인
Not-tested: toast.warning optional chaining, AbortController (별도 UX 세션)
Related: J-6 verification, SPEC-SEARCH-001

🐙 Autopus <noreply@autopus.co>
```

---

## ⚠️ v1 대비 v2 개선 사항 요약

| # | v1 | v2 | 근거 |
|---|---|---|---|
| 1 | "4xx (400 또는 503)" 모호 | **503 확정** | 에러 성격이 "서비스 일시 중단"이므로 503이 정확 |
| 2 | 응답 body 구조 미명시 | `detail.reason` + `detail.message_ko` 구조 지정 | 프론트 핸들러가 분기 처리 가능하게 |
| 3 | 토스트 문구 미명시 | 한국어 정확 문구 제공 + `toast.error` 종류 지정 | 원칙 18 "데이터 입력 테스트 금지" — 사용자가 보는 실제 문구 명시 |
| 4 | ImagePreviewModal "전면 추가" 모호 | 6개 구체 토큰 매핑 예시 | executor가 빠뜨릴 위험 감소 |
| 5 | border 처리 원칙 불명 | 기존 컴포넌트 패턴 참조 지시 (ToastContext, NotificationDropdown) | 일관성 확보 |
| 6 | 금지 항목 4개 | 금지 항목 8개 + 범위 외 발견 이슈 기록 규칙 | 스코프 크리프 방지 강화 |
| 7 | curl 검증만 | curl + 브라우저 시각 검증 단계 분리 | 원칙 15 reviewer 직접 확인 의무 대응 |
| 8 | Pre/Post check 없음 | 추가 | 원칙 25 "CLI 확인 원칙" 구체화 |

---

## 🧭 이 문서의 위치

- 저장 경로: `F:\Project M\_handover\` 또는 `F:\Project M\model-agency-system\.autopus\session_contracts\` 중 선택
- 파일명: `session_A_step_A2_contract_v2.md`
- 보존 기간: Phase J-6 완료 시까지. 완료 후 `.autopus/archived/` 이동