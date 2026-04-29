# autopus-adk + JARVIS Protocol 결합 아키텍처 분석 V2

> **V1 → V2 업데이트 이유**: autopus-adk 공식 한국어 README.ko.md를 직접 확인한 결과, V1 분석에 근본적 오류 2가지가 있었음. V2는 공식 문서 검증 후 재작성한 문서.
> **작성일**: 2026-04-23
> **목적**: Apple Notes(참고용) + 새 창 대화 이어가기용 레퍼런스

---

## 0. V1의 오류 인정

### 오류 1: "HARNESS는 JARVIS만의 고유 개념"이라고 가정
- **실제**: autopus-adk 공식 문서가 자기 자신을 "하네스(Harness)"라고 부름
- **공식 정의**: "에이전트가 시니어 엔지니어가 승인할 코드를 생산하기 위해 필요한 맥락, 제약, 워크플로우를 제공하는 구조화된 환경"
- **결과**: 동일한 용어, 동일한 개념. JARVIS의 HARNESS는 autopus의 Harness와 **직접 경쟁** 관계

### 오류 2: "autopus의 SKILL 지원 여부 불명"이라고 함
- **실제**: 40개 내장 스킬 존재. `auto skill list / info / create` 명령 제공
- **스킬 표준**: YAML 프론트매터 + 트리거 기반 자동 활성화 (agentskills.io 호환으로 추정)
- **결과**: JARVIS SKILL 체계는 autopus의 성숙한 스킬 시스템에 비해 초기 단계

---

## 1. autopus-adk 전체 기능 인벤토리 (공식 문서 기반)

### 1.1 철학: AX (Agent Experience)
- UX → 사용자 경험
- DX → 개발자 경험
- **AX → 에이전트 경험** (autopus 고유 철학)
- 핵심 가정: "매 세션이 첫 출근" — 에이전트는 세션 간 모든 맥락을 잃음
- 해결: 아키텍처/의사결정/컨벤션을 "조직 기억"으로 하네스가 제공

### 1.2 16개 에이전트 팀

| 에이전트 | 역할 | 실행 시점 |
|---|---|---|
| Planner | SPEC 분해, 태스크 할당 | Phase 1 |
| Spec Writer | spec/plan/acceptance/research 문서 생성 | `/auto plan` |
| Tester | 테스트 스캐폴드(RED) + 커버리지 부스트(GREEN) | Phase 1.5, 3 |
| Executor ×N | 병렬 워크트리 TDD 구현 | Phase 2 |
| Annotator | @AX 태그 라이프사이클 관리 | Phase 2.5 |
| Validator | 빌드, vet, 린트, 파일 크기 | Gate 2 |
| Reviewer | TRUST 5 코드 리뷰 | Phase 4 |
| Security Auditor | OWASP Top 10 감사 | Phase 4 |
| Architect | 시스템 설계 결정 | 온디맨드 |
| Debugger | 재현 우선 버그 수정 | `/auto fix` |
| DevOps | CI/CD, Docker | 온디맨드 |
| Frontend Specialist | Playwright E2E + VLM | Phase 3.5 |
| UX Validator | 컴포넌트 시각적 검증 | Phase 3.5 |
| Perf Engineer | 벤치마크, pprof | 온디맨드 |
| Deep Worker | 장시간 자율 탐색 | 온디맨드 |
| Explorer | 코드베이스 구조 분석 | `/auto map` |

### 1.3 40개 스킬 시스템
- YAML 프론트매터 + 트리거 기반 자동 활성화
- `auto skill list / info / create` 명령
- 에이전트 친화적 파싱 설계 (문단 대신 표, 산문 대신 체크리스트)

### 1.4 파이프라인 (7단계 + 게이트)

```
Phase 1     Planner         SPEC → 태스크
Phase 1.5   Tester          RED: 실패 테스트
Phase 2     Executor ×N     병렬 워크트리 TDD
Phase 2.5   Annotator       @AX 태그
Gate 2      Validator       빌드/린트/vet
Phase 3     Tester          커버리지 85%+
Phase 4     Reviewer + Sec  TRUST 5 + OWASP
```

### 1.5 핵심 기능

| 기능 | 명령 | 설명 |
|---|---|---|
| 300줄 파일 하드 리밋 | 자동 강제 | 컨텍스트 윈도우 최적화 |
| RALF 자가 치유 루프 | `--loop` | RED→GREEN→REFACTOR→LOOP, 서킷 브레이커 포함 |
| 병렬 워크트리 | 자동 (최대 5개) | 격리된 git 워크트리, 충돌 없음 |
| Lore 의사결정 추적 | `auto lore` | 9-trailer 프로토콜, 90일 stale 감지 |
| 멀티모델 오케스트레이션 | `--multi` | Consensus/Debate/Pipeline/Fastest |
| 자율 실험 루프 | `auto experiment` | 메트릭 기반 반복, 서킷 브레이커 |
| 실패 학습 | 자동 | `.autopus/learnings/pipeline.jsonl` |
| 카나리 배포 | `/auto canary` | 빌드+E2E+브라우저 자동 검증 |
| 스마트 모델 라우팅 | 자동 | Haiku/Sonnet/Opus 복잡도 기반 선택 |
| 컨텍스트 압축 | 자동 | 파이프라인 단계 간 자동 요약 |
| 체크포인트 재개 | `--continue` | 크래시 후 이어서 실행 |
| E2E 자동 생성 | `auto test` | 코드 분석 → 시나리오 생성 |
| Reaction Engine | `auto react` | CI 실패 자동 수정 |
| 비용 추적 | `auto telemetry cost` | 모델별 토큰 비용 |

### 1.6 TRUST 5 코드 리뷰 차원

| 차원 | 검사 항목 |
|---|---|
| **T**ested | 85%+ 커버리지, 엣지 케이스, race |
| **R**eadable | 명확한 네이밍, 단일 책임, ≤300 LOC |
| **U**nified | gofmt, goimports, golangci-lint, 일관된 패턴 |
| **S**ecured | OWASP Top 10, 인젝션 없음, 시크릿 없음 |
| **T**rackable | 의미 있는 로그, SPEC/Lore 참조 |

### 1.7 4개 플랫폼 지원

| 플랫폼 | 생성 파일 |
|---|---|
| Claude Code | `.claude/rules/`, `.claude/skills/`, `.claude/agents/`, `CLAUDE.md` |
| Codex | `.codex/`, `.agents/skills/`, `.agents/plugins/marketplace.json`, `AGENTS.md` |
| Gemini CLI | `.gemini/`, `GEMINI.md` |
| OpenCode | `.opencode/*`, `.agents/skills/`, `AGENTS.md`, `opencode.json` |

### 1.8 명령 체계 (CLI 28 + 서브 110+)

**슬래시 명령 (AI 코딩 CLI 내부)**:
- `/auto idea` — 멀티 프로바이더 브레인스토밍 + ICE 채점
- `/auto plan` — SPEC 작성
- `/auto go SPEC-ID` — 전체 파이프라인 구현
- `/auto sync SPEC-ID` — 문서 동기화 + 커밋
- `/auto dev` — plan + go + sync 한 번에 (풀 파워)
- `/auto fix` — 재현 우선 버그 수정
- `/auto review` — TRUST 5 리뷰
- `/auto secure` — OWASP 감사
- `/auto map` — 코드베이스 구조 분석
- `/auto setup` — 프로젝트 컨텍스트 5문서 생성
- `/auto why` — 의사결정 근거 조회
- `/auto canary` — 배포 후 헬스 체크
- `/auto stale` — 오래된 결정 감지

---

## 2. JARVIS vs autopus 기능 매트릭스 (재작성)

| 영역 | JARVIS 상태 | autopus 상태 | 결론 |
|---|---|---|---|
| **하네스 개념** | HARNESS 14원칙 (설계 중) | 공식 "하네스" 시스템 완성 | autopus 압승 |
| **스킬 시스템** | 2개 SKILL (Research Analyst, Report Data Refiner) | 40개 내장 + 생성 CLI | autopus 압승 |
| **단계 추적** | G-STACK (G1~G4, 추상적) | `/auto idea→plan→go→sync` (구체적/작동) | autopus 압승 |
| **에이전트** | "jarvis-core 에이전트" 1개 | 16개 특화 에이전트 팀 | autopus 압승 |
| **의사결정 기록** | Knowledge OS (계획만) | Lore 9-trailer 프로토콜 (작동) | autopus 압승 |
| **TDD 강제** | 없음 | `methodology.mode: tdd, enforce: true` | autopus만 |
| **멀티모델** | 없음 (Claude API 고정) | Consensus/Debate/Pipeline/Fastest | autopus만 |
| **코드 리뷰 시스템** | 없음 | TRUST 5 자동 | autopus만 |
| **보안 감사** | 없음 | OWASP Top 10 자동 | autopus만 |
| **RAG + 지식 OS** | ChromaDB 계획 중 | **없음** | **JARVIS만** |
| **개인 지식 축적** | D:\Jarvis_Data\Raw\ 120,000 파일 | 없음 | **JARVIS만** |
| **IGNIX 비즈니스 컨텍스트** | 있음 (이그닉스 렉시콘/스튜디오/포지/스크립트) | 없음 | **JARVIS만** |
| **한국어 페르소나** | 있음 | 영문 중심 (한글 README는 있음) | **JARVIS만** |
| **성숙도** | 구축 중 | Go 바이너리 배포 완료 | autopus 압승 |
| **정신적 코치 역할** | Jin의 작업 원칙 내재화 | 없음 | **JARVIS만** |

### 결정적 발견

**autopus가 이미 JARVIS가 구축하려던 것의 60~70%를 더 성숙한 형태로 구현했다.**

JARVIS의 고유 가치는 다음 영역으로 축소:
1. 개인 지식 OS (RAG + Knowledge)
2. IGNIX 비즈니스 컨텍스트
3. 한국어 페르소나
4. Jin 개인의 삶/업무 철학 통합

---

## 3. 세 가지 결합 시나리오 (V2)

### 시나리오 A: JARVIS를 autopus의 개인화 레이어로 축소 (권장)

**아키텍처**:
```
Layer 3 [JARVIS]: 지식 OS + IGNIX 컨텍스트 + 한국어 페르소나
   ↕ Lore export
Layer 2 [autopus]: 하네스 + 16 에이전트 + 40 스킬 + 파이프라인
   ↕ autopus.yaml 주입
Layer 1 [JARVIS 원칙]: 14개 절대 원칙을 autopus 규칙으로 주입
```

**실행 방법**:

1. **Layer 1 — autopus.yaml에 JARVIS 원칙 주입**
```yaml
# autopus.yaml
mode: full
project_name: project-m

architecture:
  auto_generate: true
  enforce: true

# JARVIS 14원칙을 여기 반영 (커스텀 섹션)
# autopus가 이 섹션을 무시해도, CLAUDE.md에 별도 반영됨

methodology:
  mode: tdd
  enforce: false  # 초기에는 권장만

spec:
  review_gate:
    enabled: true
    strategy: debate
    providers: [claude]  # Local-only 원칙: Claude만
    judge: claude

lore:
  enabled: true
  required_trailers: [Why, Decision, IGNIX-Context]  # 커스텀 trailer

orchestra:
  enabled: false  # 초기에는 멀티모델 비활성화 (Local-only)

providers:
  claude:
    binary: claude
```

2. **Layer 1 — `.claude/rules/jarvis-principles.md` 생성**

autopus `auto init` 후 `.claude/rules/` 디렉토리에 Jin의 14개 원칙을 규칙 파일로 추가:
```markdown
---
trigger: always
priority: highest
---

# JARVIS 14 절대 원칙

IMPORTANT: 이 원칙들은 autopus 기본 규칙보다 우선한다.

1. 속도보다 정확도 우선 — 추측 답변 금지
2. RAG-first — 기존 문서 먼저 조회
3. Local-only data security — 외부 업로드 금지
4. Human-in-the-Loop — 파괴적 작업 전 승인
5. (기타 10개 원칙...)

[IGNIX 비즈니스 컨텍스트]
- 이그닉스 렉시콘: ...
- 이그닉스 스튜디오: ...
- 이그닉스 포지: ...
- 이그닉스 스크립트: ...
```

`autopus update`가 `AUTOPUS:BEGIN~END` 마커 밖은 보존하므로, 이 파일을 그 범위 밖에 두면 업데이트 시 유지됨.

3. **Layer 3 — Lore → JARVIS Knowledge OS 흘려보내기**

주 1회 스크립트로 `.autopus/specs/*/lore.md`를 `D:\Jarvis_Data\Raw\autopus_lore\`로 복사:
```bash
# weekly_lore_sync.ps1
Copy-Item ".autopus/specs/*/lore.md" "D:\Jarvis_Data\Raw\autopus_lore\" -Recurse
# ChromaDB 재색인 트리거
```

**장점**:
- JARVIS의 헛된 재구현 멈춤
- autopus의 성숙한 하네스 즉시 활용
- Jin 고유 가치(지식 OS, IGNIX, 한국어)는 보존
- project-m 개발 속도 최대화

**단점**:
- JARVIS의 "HARNESS/SKILL/G-STACK"이라는 용어는 은퇴
- Jin의 멘탈 모델 재구성 필요

---

### 시나리오 B: JARVIS를 autopus 상위 메타 시스템으로 유지 (옵션 B from V1)

**현재의 Jin 상황에도 가능하지만, 시나리오 A 대비 장점이 적음.** 이유:
- JARVIS의 HARNESS+SKILL+G-STACK을 계속 유지하면 autopus와 중복
- 장기적으로 둘 다 유지보수해야 함
- "무엇이 메타인가"가 불명확해짐

**단, 이런 경우엔 B가 맞음**:
- Jin이 JARVIS의 HARNESS/SKILL/G-STACK 용어에 강한 애착이 있고 포기 불가
- 여러 프로젝트를 오갈 때 JARVIS가 공통 레이어 역할 필요
- autopus 없는 환경(순수 Claude Code)에서도 작업해야 함

---

### 시나리오 C: JARVIS를 autopus로 완전 대체 + 지식 OS만 유지

**가장 극단적**. JARVIS의 개념/용어 전부 폐기하고 autopus 체계로 단일화. JARVIS는 "Jin의 개인 지식 저장소"라는 좁은 역할만 유지.

**적절한 경우**:
- JARVIS 구축에 지친 상태이고 생산성 즉시 회복하고 싶을 때
- 개인 철학을 도구에 강하게 녹이는 것보다 이미 만들어진 좋은 도구를 쓰는 게 낫다고 판단할 때

**리스크**:
- Jin의 고유 정체성 희석
- IGNIX 컨텍스트가 autopus 안에서 길을 잃을 수 있음

---

## 4. 권장: 시나리오 A

### 왜 시나리오 A인가

1. **공학적 합리성**: autopus가 이미 잘 만든 것을 재구현하지 않음
2. **시간 절약**: JARVIS HARNESS 구축에 더 이상 리소스 안 씀
3. **고유 가치 보존**: JARVIS의 진짜 강점인 지식 OS + IGNIX 컨텍스트 보존
4. **점진적 전환 가능**: JARVIS 용어를 완전 폐기하지 않고 "autopus 위에 얹는 레이어"로 재정의 가능

### 점진적 전환 로드맵

**Week 1 (이번 주)**: autopus 안정화
- autopus-adk 설치 완료
- `auto init` → autopus.yaml 생성
- `providers: [claude]`, `orchestra.enabled: false`, `methodology.enforce: false` 설정
- `/auto setup`으로 5개 컨텍스트 문서 생성
- 간단한 기능 1개 `/auto plan` → `/auto go` 실행해보기

**Week 2**: JARVIS 원칙 주입
- `.claude/rules/jarvis-principles.md` 작성 (14개 원칙 + IGNIX 컨텍스트)
- `/auto plan` 결과가 Jin 원칙을 반영하는지 확인
- 반영 안 되면 규칙 문장 재작성 (더 명시적으로)

**Week 3**: Lore → Knowledge OS 브릿지
- `weekly_lore_sync.ps1` 작성
- `D:\Jarvis_Data\Raw\autopus_lore\` 폴더 생성
- 수동으로 첫 동기화 실행

**Week 4**: JARVIS 용어 재정의
- JARVIS HARNESS → "autopus 규칙 + JARVIS 원칙 주입"의 별칭
- JARVIS G-STACK → autopus `/auto idea/plan/go/sync`의 한국어 명명
- JARVIS SKILL → 필요 시 autopus 스킬로 재작성 (`auto skill create`)

**Month 2+**: JARVIS 지식 OS 집중 개발
- ChromaDB 구축
- RAG 파이프라인
- Raw 파일 120,000 wiki 컴파일

---

## 5. 충돌 지점 재검토 (공식 문서 기반)

### 충돌 1: autopus 자동 모델 라우터 vs "속도보다 정확도"
- **autopus 동작**: Haiku(간단)/Sonnet(균형)/Opus(복잡) 자동 선택
- **Jin 원칙**: 속도보다 정확도 우선
- **해결**: `--quality ultra` 기본값으로 설정 (모든 에이전트 Opus) 또는 프로젝트 alias

### 충돌 2: 멀티모델 오케스트레이션 vs Local-only
- **autopus 동작**: `--multi`로 Claude + Codex + Gemini 동시 호출
- **Jin 원칙**: Local-only data security
- **해결**: `orchestra.enabled: false` 또는 `providers: [claude]`만

### 충돌 3: Lore vs Knowledge OS 이중 기록
- **autopus 동작**: Lore가 `.autopus/lore/`에 기록
- **JARVIS 동작**: Knowledge OS가 `D:\Jarvis_Data\`에 기록
- **해결**: Lore를 일차 저장소로 삼고, 주기적으로 Knowledge OS에 복사 (일방향)

### 충돌 4: TDD 강제 vs Jin 작업 스타일
- **autopus 동작**: `methodology.enforce: true`면 테스트 먼저
- **Jin 미지정**: 확인 필요
- **해결**: 초기 `enforce: false`, 1개월 사용 후 판단

### 충돌 5: 매 세션 "첫 출근" vs JARVIS "지속 기억"
- **autopus 전제**: "매 세션이 첫 출근", 하네스로 맥락 제공
- **JARVIS 가치**: 세션 간 기억 유지 (RAG)
- **해결**: 충돌 아님. 상호 보완. autopus는 프로젝트 내 맥락을, JARVIS는 프로젝트 간 맥락을 제공

---

## 6. Jin이 지금 결정해야 할 것

- [ ] 시나리오 A/B/C 중 어느 것을 선택할 것인가?
- [ ] JARVIS의 "HARNESS/SKILL/G-STACK" 용어를 은퇴시킬 수 있는가?
- [ ] 멀티모델(`--multi`)을 쓸 것인가, Local-only 고수할 것인가?
- [ ] TDD 강제를 활성화할 것인가?
- [ ] Lore → Knowledge OS 동기화를 만들 것인가?
- [ ] autopus의 "매 세션 첫 출근" 철학을 받아들일 것인가?

---

## 7. 새 창에서 이어갈 때 전달할 핵심 컨텍스트

```
나는 JARVIS Protocol을 구축 중이었는데,
project-m 개발을 위해 autopus-adk를 도입하면서
두 시스템이 HARNESS + SKILL 계층에서 완전 중복됨을 발견했다.
autopus가 이미 공식적으로 "하네스"를 쓰고 40개 스킬, 16 에이전트를 제공한다.

결정: 시나리오 [A|B|C]를 선택했고,
현재 Week [1|2|3|4]에 있다.

JARVIS의 장기 가치는 지식 OS(RAG) + IGNIX 컨텍스트 + 한국어 페르소나로 축소했다.
autopus는 project 실행 하네스로 활용한다.

이번 세션에서 확인/수정할 것은 [구체 항목]이다.
```

---

## 8. 아직 모르는 것 (정직한 한계)

- autopus가 커스텀 YAML 섹션을 무시하는지 보존하는지 (실제 `autopus.yaml` 검증 필요)
- `.claude/rules/` 하위에 사용자 작성 파일을 추가했을 때 `auto update`가 보존하는지 (AUTOPUS 마커 동작 실제 확인 필요)
- Lore의 실제 파일 포맷과 export 방법 (`.autopus/lore/` 구조 확인 필요)
- autopus 스킬이 agentskills.io 표준을 따르는지 (공식 문서에 명시 안 됨)
- `/auto setup`이 생성하는 ARCHITECTURE.md가 JARVIS Knowledge OS와 호환되는 포맷인지

**→ `auto init` 완료 후, 생성된 파일들을 같이 열어보고 확정**