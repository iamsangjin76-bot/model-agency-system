# 🐙 Autopus-ADK 워크플로 (model-agency-system 전용)

> 이 프로젝트의 **표준 작업 흐름**을 정의합니다.
> 모든 새 개발·수정은 이 문서의 규칙을 따릅니다.
> 에이전트 정의는 `AGENTS.md`, 프로젝트 맥락은 `.autopus/project/`,
> 제약 룰은 `.autopus/context/constraints.yaml` 참고.

---

## 0. 이 문서를 읽는 법

- 비개발자가 Claude Code CLI (Opus 4.6) 와 일할 때의 **표준 플레이북**입니다.
- 매 작업마다 "어느 에이전트를 어떤 지시로 부를지" 를 3초 안에 판단하도록 설계되었습니다.
- 섹션 순서: **난이도 판정 → 워크플로 → Worker Contract → 에이전트 치트시트 → 보고 형식 → 커밋 규칙 → 체크리스트** 입니다.

---

## 1. 작업 난이도 판정

### 1단계 — 예시 리스트에서 매칭

**🟢 Simple** (설계 없이 바로 executor)
- 의존성 추가 (requirements.txt, package.json)
- 오타·주석·문서 수정
- 설정값 변경 (.env, 상수)
- 에러 메시지 문구 수정
- README·가이드 문서 업데이트
- 단일 파일 내 포맷팅·린트 수정

**🟡 Medium** (planner → executor → reviewer)
- 기존 API 에 필드 하나 추가
- 단일 버그 수정 (원인이 1~2 파일)
- 기존 컴포넌트 리팩토링
- 테스트 추가
- 새 유틸리티 함수 추가
- 화면 UI 수정 (로직 변경 없이 디자인 조정)

**🔴 Complex** (architect → planner → executor → reviewer → security-auditor)
- 새 SPEC (새 도메인 기능)
- DB 스키마 변경
- 인증·권한 시스템 건드림
- 성능 개선 (아키텍처 수준)
- 외부 서비스 연동
- 여러 모듈·계층 교차 변경

### 2단계 — 예시에 없으면 결정 트리

1. **DB 스키마 / API 계약 / 인증 시스템** 중 하나라도 건드리나?
   → **예 → Complex**
2. 새 파일 3개 이상 생기거나, 기존 로직 **여러 군데** 고쳐야 하나?
   → **예 → Medium**
3. 위 둘 다 아니면?
   → **Simple**

---

## 2. 난이도별 표준 워크플로

### 🟢 Simple — Single-step

```
[사용자 요청] → [executor 호출] → [커밋 → 푸시]
```

- planner·architect 생략
- Worker Contract 4줄 템플릿으로 executor 에게 바로 지시
- executor 보고 확인 → 이상 없으면 커밋

### 🟡 Medium — 3-step

```
[사용자 요청]
  → [planner: 작업 쪼개기]
  → [executor: 구현]
  → [reviewer: TRUST 5 검증]
  → [커밋 → 푸시]
```

- planner 가 관련 SPEC 을 확인하고 세부 태스크 분해
- executor 가 TDD 로 구현
- reviewer 가 `rule: objective-reasoning` 기준으로 검증

### 🔴 Complex — Full-stack

```
[사용자 요청]
  → [architect: 설계]
  → [planner: 태스크 분해]
  → [executor: 구현]
  → [reviewer: TRUST 5]
  → [security-auditor: OWASP 체크]
  → [커밋 → 푸시]
```

- 필요 시 architect 가 새 SPEC (`SPEC-{DOMAIN}-{NUMBER}`) 생성
- planner 가 SPEC 기반 태스크 분해
- security-auditor 는 **인증/권한/입력검증 건드린 경우 필수**

---

## 3. Worker Contract 4줄 템플릿

모든 서브에이전트 지시에 다음 4줄을 포함합니다.

```markdown
**목표**: [한 문장 이내, 결과 상태로 표현]
**범위**: [어느 파일·모듈·화면까지 건드릴지 구체 경로]
**완료 기준**: [어떤 상태가 되면 "끝" 인지 검증 가능한 형태로]
**금지**: [범위 안에서도 건들면 안 되는 구체 항목 / 없으면 "해당 없음 (범위 밖은 자동 금지)"]
```

**반환 형식은 섹션 5 의 전역 표준이 자동 적용**되므로 Worker Contract 에 쓰지 않습니다.

### Simple 예시

```markdown
**목표**: backend 에 httpx 라이브러리 공식 등록
**범위**: backend/requirements.txt
**완료 기준**: httpx==0.28.1 라인이 파일 마지막에 추가되어 있음 + pip install -r requirements.txt 성공
**금지**: 해당 없음 (범위 밖은 자동 금지)
```

### Medium 예시

```markdown
**목표**: 대시보드 차트 렌더링 중복 섹션 제거
**범위**: frontend/src/pages/DashboardPage.tsx
**완료 기준**: 차트 3개 (성별 분포 / 캐스팅 현황 / 정산 요약) 가 각 1번씩만 렌더링됨
**금지**: patch_*.py 류 자동 치환 스크립트 사용 금지 — 직접 편집으로만 진행
```

### Complex 예시

```markdown
**목표**: 알림 시스템 신규 도입 (SPEC-NOTIF-001)
**범위**: backend/app/services/notification.py (신규), frontend/src/components/NotificationBell.tsx (신규), backend/app/main.py (라우터 등록만)
**완료 기준**: SPEC-NOTIF-001 에 정의된 수락 기준 전부 통과 + 대시보드 우측 상단에 벨 아이콘 표시
**금지**: 기존 auth 모듈 수정 불가, DB 마이그레이션 별도 커밋으로 분리할 것
```

---

## 4. 에이전트 치트시트

### 🌟 주력 5개 — 매 작업마다 등장

**1. explorer** — 코드베이스 빠르게 훑고 구조 파악
- 언제? → 새 파일 찾거나, 기능이 어디 구현돼있는지 모를 때, 작업 범위 확정 전
- 예시 지시: *"대시보드 관련 파일 전부 찾아서 역할별로 분류해줘"*

**2. executor** — TDD 기반 코드 구현
- 언제? → 실제 구현·수정 작업 (Simple 은 바로, Medium/Complex 는 planner 다음)
- 예시 지시: Worker Contract 4줄 템플릿 그대로 전달

**3. debugger** — 근본 원인 분석 + 최소 수정
- 언제? → 에러 메시지·이상 동작이 나왔는데 원인이 불분명할 때
- 예시 지시: *"로그인 후 대시보드가 빈 화면으로 뜨는 원인 추적해줘"*
- ⚠️ executor 와 혼동 주의: debugger 는 **원인 파악 + 최소 패치**, executor 는 **기획된 구현**

**4. reviewer** — TRUST 5 코드 리뷰
- 언제? → Medium/Complex 작업에서 executor 끝난 직후 (필수 게이트)
- 예시 지시: *"방금 executor 가 수정한 내용 리뷰해줘"*
- TRUST 5 = Testability / Readability / Unambiguous / Scope / Truthfulness

**5. architect** — 시스템 설계·기술 결정
- 언제? → Complex 작업 시작 지점 (새 SPEC, 아키텍처 변경)
- 예시 지시: *"알림 시스템 도입 전 아키텍처 결정 필요해. SPEC 초안 잡아줘"*

### 🛠️ 보조 11개 — 필요 시 호출

- **planner**: 기능 계획·요구사항 분석 (Medium 이상에서 태스크 분해)
- **tester**: 복잡한 테스트 케이스 설계 필요할 때
- **spec-writer**: SPEC 문서 생성 (architect 가 지시하면 실행)
- **security-auditor**: OWASP Top 10 취약점 스캔 (인증·입력검증 건드린 후 필수)
- **devops**: CI/CD·Docker·배포 인프라
- **deep-worker**: 장시간 복잡 작업 + 체크포인트 (여러 SPEC 동시 진행 시)
- **validator**: 경량 품질 검증 (LSP·lint·test 만 돌림)
- **annotator**: Phase 2.5 @AX 태그 스캔 (현재 미활용)
- **frontend-specialist**: Playwright E2E·스크린샷 분석
- **perf-engineer**: 벤치마크·프로파일링 (성능 이슈 진단)
- **ux-validator**: 비전 기반 레이아웃·접근성 검증

---

## 5. 서브에이전트 보고 표준 형식 (전역)

모든 서브에이전트는 작업 종료 시 다음 구조로 보고합니다.

```markdown
## 요약 (3줄)
- 한 것: [구체적으로 완료한 작업]
- 바꾼 것: [수정·추가·삭제된 내용 핵심]
- 남은 것: [미완료 또는 후속 필요 사항]

## 변경 파일 리스트
- path/to/file.py: [어떤 변경]
- path/to/other.tsx: [어떤 변경]

## 다음 단계 제안
[사용자가 확인할 것 / 다른 에이전트에게 넘길 것]
```

Worker Contract 에 "반환 형식" 을 매번 쓰지 않아도, **모든 서브에이전트가 자동으로 이 포맷** 을 따릅니다.

---

## 6. Lore 커밋 규칙

### 언어 정책 (이 프로젝트 전용)

이 프로젝트는 `autopus.yaml`의 `commits: ko`로 설정되어 있습니다.
- **Summary line (type(scope): ...)**: **영어** 권장 (국제 관행, 툴 호환성)
- **본문 (body) 및 trailers**: **한국어** 허용

> 참고: ADK 기본값은 `commits: en` 이지만, 이 프로젝트는 비개발자 1인 + 한국어 사용자 + private repo 특성을 반영해 `ko`로 수정했습니다. 수정 커밋 이력은 git log 참조.

### 형식

```
type(scope): english summary (50자 이내)

한국어 본문 설명 (무엇을·왜 바꿨는지).

Constraint: [적용된 제약 요약]
Confidence: [high/medium/low]
Scope-risk: [low/medium/high]
Reversibility: [trivial/moderate/difficult]
Directive: [후속 작업 방향 / 없으면 none]
Tested: [어떻게 검증했는지]
Not-tested: [검증 안 한 부분 / 없으면 -]
Related: [관련 SPEC 또는 이슈]

🐙 Autopus <noreply@autopus.co>
```

### type(scope) 종류

| type | 쓰임 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서만 변경 |
| `chore` | 설정·의존성·무시규칙 |
| `refactor` | 기능 변경 없는 구조 개선 |
| `test` | 테스트 추가·수정만 |
| `perf` | 성능 개선 |
| `style` | 포맷팅 (동작 영향 없음) |

### PowerShell 실전 팁 (중요!)

**`-m` 반복 ❌ — Lore trailer 블록 깨짐**

대신 **`.git/COMMIT_MSG_TMP` 파일 경유** ✅:

```powershell
# 1. 임시 파일에 메시지 작성
notepad .git/COMMIT_MSG_TMP
# (편집 후 저장 + 닫기)

# 2. 파일로 커밋
git commit -F .git/COMMIT_MSG_TMP

# 3. 임시 파일 삭제
Remove-Item .git/COMMIT_MSG_TMP
```

### 샘플 커밋 메시지

**Simple (의존성 추가)**
```
chore(deps): register httpx in backend requirements

backend/requirements.txt 에 httpx==0.28.1 공식 등록.
이전까지 수동 설치로 로컬에만 존재.

Constraint: pin to current installed version
Confidence: high
Scope-risk: low
Reversibility: trivial
Directive: none
Tested: pip install -r requirements.txt success
Not-tested: -
Related: priority-9

🐙 Autopus <noreply@autopus.co>
```

**Medium (버그 수정)**
```
fix(dashboard): remove duplicated chart section

patch_dashboard.py 의 범용 </div> 매칭으로 인한
중복 삽입 제거. CSS 오타 bg-whiteborder-b 동시 수정.

Constraint: no text-replacement scripts
Confidence: high
Scope-risk: low
Reversibility: trivial
Directive: deprecate patch_*.py scripts
Tested: 로그인 후 대시보드 차트 3개 단일 렌더링 확인
Not-tested: -
Related: SPEC-DASHBOARD-001

🐙 Autopus <noreply@autopus.co>
```

**Complex (새 SPEC)**
```
feat(notif): introduce notification system (SPEC-NOTIF-001)

새 도메인 모듈로 알림 시스템 도입. 대시보드 벨 아이콘 +
백엔드 notification 서비스 + Websocket 스트림.

Constraint: no changes to auth module, DB migration separated
Confidence: medium
Scope-risk: medium
Reversibility: moderate
Directive: follow up with load testing
Tested: SPEC-NOTIF-001 acceptance criteria, manual UI check
Not-tested: high-concurrency behavior
Related: SPEC-NOTIF-001

🐙 Autopus <noreply@autopus.co>
```

---

## 7. 비개발자 체크리스트

### 작업 시작 전
- [ ] 난이도 분류 확정 (Simple/Medium/Complex)
- [ ] 해당 난이도의 표준 워크플로 확인 (섹션 2)
- [ ] Worker Contract 4줄 템플릿 준비 (아키텍트 Claude 가 채워줌)
- [ ] 서버 필요하면 백엔드·프론트엔드 구동 확인

### 작업 중
- [ ] 서브에이전트 보고 표준 형식으로 응답 오는지 확인
- [ ] 완료 기준과 실제 결과 일치하는지 검증
- [ ] 범위 밖 파일이 건드려지진 않았는지 `git status` 로 확인

### 커밋 직전
- [ ] `git diff` 로 변경 내용 직접 확인
- [ ] Lore 메시지를 `.git/COMMIT_MSG_TMP` 에 작성
- [ ] `git commit -F .git/COMMIT_MSG_TMP` 로 커밋 → 훅 통과 확인
- [ ] 임시 파일 삭제 (`Remove-Item .git/COMMIT_MSG_TMP`)

### 푸시 전
- [ ] `git log --oneline -5` 로 최근 커밋 확인
- [ ] push 허가 받기 (아키텍트 Claude 에게)
- [ ] `git push` 후 `origin/master` 최신화 확인

---

## 8. 이 워크플로가 다루지 않는 것

- **Orchestra 다중 AI debate** — 1 SPEC 단계에선 과함. SPEC 3개 이상 쌓이면 재검토.
- **4-platform mirror (codex/gemini/opencode)** — claude-code 단일 사용 중엔 미동기화.
- **`.claude/hooks/autopus/` 내부 훅** — 하네스가 자동 관리, 사용자 개입 불필요.
- **deep-worker 장시간 작업** — 현재 프로젝트 규모에선 일반 executor 로 충분.

---

## 9. 참고 문서

- `.autopus/project/product.md` — 제품 비전·대상·성공 지표
- `.autopus/project/structure.md` — 폴더·파일 구조
- `.autopus/project/tech.md` — 기술 스택·주요 의존성
- `.autopus/specs/SPEC-AUTH-001/` — 현재 유일 SPEC
- `.autopus/context/constraints.yaml` — 프로젝트 고유 제약 룰
- `AGENTS.md` — 에이전트 레지스트리 + 개발 금지 사항
- `autopus.yaml` — 하네스 중앙 설정
- `CLAUDE.md` — Claude Code 하네스 진입점

---

> **최종 수정**: 2026-04-16 (Phase C v2 — architect 리뷰 반영: Reversibility 값 정규화, 언어 정책 명시)
> **다음 개정 예정**: SPEC 3개 이상 쌓이거나, 팀원 추가 시점, 난이도 분류에 어긋나는 작업 3회 등장 시