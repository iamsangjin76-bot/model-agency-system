# autopus-adk + JARVIS Protocol 결합 아키텍처 분석

> **작성 맥락**: project-m 개발을 위해 autopus-adk를 도입하면서, Jin의 기존 JARVIS Protocol (HARNESS + SKILL + G-STACK)과의 결합 전략을 아키텍트 관점에서 분석
> **작성일**: 2026-04-23
> **목적**: Apple Notes(참고용) + 새 창 대화 이어가기용 레퍼런스

---

## 1. 검증된 사실 (출처별 구분)

### autopus-adk 공식 사양 (GitHub 저장소 + install.ps1 직접 확인)

- **저장소**: `Insajin/autopus-adk`
- **슬로건**: "of the agents, by the agents, for the agents"
- **핵심 기능 (검증됨)**:
  - Multi-model orchestration: consensus / pipeline / debate / fastest
  - 자동 모델 라우터 (복잡도 기반 Haiku/Sonnet/Opus 선택)
  - SPEC/EARS 엔진 (EARS notation 기반)
  - Architecture-as-Code with `enforce: true`
  - Lore 결정 추적 (`Why`, `Decision` trailer 필수)
  - Review Gate (debate 전략으로 다중 AI 스펙 검토)
  - TDD 강제 옵션 (`methodology.mode: tdd`)
  - 설정: `autopus.yaml` + 프로젝트 루트 `CLAUDE.md`
  - 지원 플랫폼 어댑터: Claude Code, Codex, Gemini, OpenCode
  - 28개 CLI 명령 (110+ 서브커맨드)

### 아직 검증 안 된 것 (확인 필요)

- [ ] autopus가 agentskills.io 표준 SKILL.md를 읽는지 여부
- [ ] `autopus.yaml`에 커스텀 원칙(policies) 섹션이 있는지
- [ ] Lore 시스템이 외부 지식 저장소(JARVIS Knowledge OS) 연결을 지원하는지
- [ ] `/auto` 슬래시 명령을 사용자가 커스터마이즈할 수 있는지
- [ ] Claude API 전용 모드로 고정 가능한지 (멀티모델 비활성화)

---

## 2. JARVIS Protocol 현황 (Jin의 기존 시스템)

### 구성 요소

- **HARNESS (원칙 계층)**
  - 속도보다 정확도 우선
  - RAG-first query
  - Local-only data security
  - Human-in-the-Loop
  - 14개 절대 개발 원칙
- **SKILL (작업 단위 계층)**
  - Research Analyst
  - Report Data Refiner
- **G-STACK (단계 추적 계층)**
  - G1: 요청 파악
  - G2: 환경 점검
  - G3: 실행
  - G4: 검증
- **저장 구조**
  - `F:\Jarvis_Protocol\Workspace\` — 실행 공간
  - `D:\Jarvis_Data\` — 메모리/지식 레이어

### 목적

**Jin 개인의 지식/기억/작업 철학을 AI 도구에 주입하는 메타 시스템.**

---

## 3. 두 시스템의 계층 비교

### 공식 레이어 매핑

| 계층 | JARVIS Protocol | autopus-adk | 겹침 판정 |
|---|---|---|---|
| 철학/원칙 | HARNESS | `architecture.enforce`, `methodology` | ⚠️ 부분 겹침 |
| 작업 단위 | SKILL (Research Analyst 등) | `pkg/adapter`, skills 시스템 | ⚠️ 부분 겹침 |
| 단계 추적 | G-STACK (G1~G4) | `/auto idea→plan→go→review` | ⚠️ 강한 겹침 |
| 결정 기록 | Knowledge OS (`D:\Jarvis_Data\`) | Lore 시스템 | ⚠️ 강한 겹침 |
| 지식 검색 | RAG (ChromaDB 계획) | 없음 (외부 통합 필요) | ❌ JARVIS만 |
| 멀티모델 오케스트레이션 | 없음 (Claude API 고정) | 있음 (consensus/debate 등) | ❌ autopus만 |
| SPEC/EARS | 없음 | 있음 | ❌ autopus만 |
| TDD 강제 | 없음 | 있음 | ❌ autopus만 |

### 결론

**단순 레이어링("JARVIS는 위, autopus는 아래")은 부정확한 모델이다.** 두 시스템은 같은 계층에서 부분적으로 겹친다. 결합은 **"한 쪽을 다른 쪽에 번역 주입"** 방식으로 설계해야 한다.

---

## 4. 결합 전략 3가지 옵션

### 옵션 A: JARVIS를 autopus.yaml에 주입 (autopus 주도)

**방식**: project-m 범위 안에서는 autopus의 규약을 따르되, HARNESS 원칙을 `autopus.yaml`의 확장 필드나 `CLAUDE.md` 상단에 주입.

```yaml
# autopus.yaml (예시 — 실제 스키마 확인 필요)
mode: full
project_name: project-m

# JARVIS HARNESS 상속 (custom section)
jarvis_harness:
  accuracy_over_speed: true
  rag_first: true
  local_only: true
  human_in_loop: true

methodology:
  mode: tdd
  enforce: true

architecture:
  auto_generate: true
  enforce: true

lore:
  enabled: true
  required_trailers: [Why, Decision, JARVIS-Trace]  # 커스텀 trailer 추가
  stale_threshold_days: 90
```

**장점**:
- project-m 개발 속도 최대화
- autopus의 TDD, Review Gate, SPEC 활용
- 단일 설정 파일로 관리

**단점**:
- autopus.yaml이 커스텀 섹션을 무시할 가능성 (스키마 검증 필요)
- JARVIS Knowledge OS와의 연결 끊김
- G-STACK 용어가 autopus 명령 체계에 흡수됨

**추천 대상**: project-m을 "autopus 프로젝트"로 완전히 맡기고 싶을 때

---

### 옵션 B: 두 CLAUDE.md 병렬 운용 (계층 분리)

**방식**:
- `user-level ~/.claude/CLAUDE.md` → JARVIS 원칙 (모든 프로젝트 상속)
- `G:\Project M\model-agency-system\CLAUDE.md` → autopus가 생성한 project-m 전용 실행 규약

Claude Code는 두 파일을 모두 읽으므로 자연스럽게 병렬 적용됨.

**장점**:
- 두 시스템 모두 원본 유지
- JARVIS는 다른 프로젝트에도 동일하게 적용됨
- 롤백 쉬움

**단점**:
- autopus의 `/auto` 명령이 HARNESS를 "참고"만 할 뿐 강제하지는 않음
- 원칙 충돌 시 어느 쪽이 이기는지 불명확
- Lore vs Knowledge OS 중복 기록 가능성

**추천 대상**: JARVIS를 포기하지 않으면서 autopus를 시험적으로 도입할 때 — **현재 Jin 상황에 가장 적합**

---

### 옵션 C: JARVIS가 autopus를 감싸는 상위 시스템 (JARVIS 주도)

**방식**: JARVIS Knowledge OS가 autopus를 하나의 "도구"로 등록. autopus의 모든 출력(SPEC, Lore, 코드)은 JARVIS의 메모리 레이어로 자동 수집.

**장점**:
- 아키텍처적으로 가장 깨끗 (단일 진실 원천)
- 여러 프로젝트의 autopus 산출물을 JARVIS가 통합 관리
- RAG에 모든 결정 내역이 들어감

**단점**:
- 연동 브릿지를 직접 만들어야 함 (개발 비용 큼)
- autopus 업데이트마다 브릿지 유지보수 필요
- 단기 생산성에는 마이너스

**추천 대상**: 장기적으로 JARVIS가 성숙한 후 — **현재는 시기상조**

---

## 5. 구체적 충돌 지점과 해결책

### 충돌 1: "속도보다 정확도" vs autopus 자동 라우터

- autopus 라우터: 간단한 쿼리를 Haiku로 보냄 (빠르지만 정확도 낮음)
- JARVIS HARNESS: 속도보다 정확도 우선
- **해결**: `--quality ultra` 기본값으로 설정 또는 라우터 비활성화

### 충돌 2: Lore vs JARVIS Knowledge OS

- 둘 다 "왜 이 결정을 했는가"를 기록
- 같은 정보가 두 곳에 중복 저장 가능
- **해결**: Lore가 일차 기록, `D:\Jarvis_Data\Raw\`에 정기 export (주 1회 수동 또는 스크립트)

### 충돌 3: Multi-model debate vs "Local-only data security"

- autopus가 Claude, Gemini, Codex에 동시 전송 → 코드가 여러 API에 노출
- JARVIS HARNESS: Local-only data security
- **해결**: `providers: [claude]`만 유지, debate 비활성화

### 충돌 4: TDD 강제 vs Jin 작업 스타일

- `methodology.mode: tdd, enforce: true`는 모든 기능에 테스트 선행 강제
- Jin이 TDD를 원하는지 확인 필요
- **해결**: `enforce: false`로 시작, 필요시 활성화

---

## 6. 권장 실행 순서 (옵션 B 기반)

### Phase 1: 안전한 도입 (이번 주)

1. autopus-adk 설치 완료 (진행 중)
2. `auto init` 후 생성된 `G:\Project M\model-agency-system\CLAUDE.md` **백업**
3. `autopus.yaml` 확인 — 실제 지원 필드 검증
4. `providers: [claude]`만 남기기 (Local-only 원칙)
5. `methodology.enforce: false`로 낮추기 (초기)
6. `/auto setup` 실행, 결과 관찰

### Phase 2: HARNESS 주입 (다음 주)

1. user-level `CLAUDE.md`에 JARVIS HARNESS 명시 (옵션 B 적용)
2. project-m 루트 `CLAUDE.md` 상단에 "JARVIS HARNESS 상속" 선언 추가
3. `/auto plan` 실행해서 SPEC이 HARNESS 원칙을 반영하는지 확인
4. 반영 안 되면 `CLAUDE.md`에 원칙을 더 명시적으로 재작성

### Phase 3: G-STACK 매핑 검증 (그 다음)

```
G1 (요청 파악) ≈ /auto idea
G2 (환경 점검) ≈ /auto setup
G3 (실행)     ≈ /auto go SPEC-XXX
G4 (검증)     ≈ /auto review
```

실제로 이 매핑이 Jin의 작업 흐름에 맞는지 1주일 사용 후 판단.

### Phase 4: Knowledge OS 연결 (장기)

- autopus Lore의 export 주기 설정
- `D:\Jarvis_Data\Raw\autopus_lore\`로 주기 백업 스크립트 작성
- RAG 색인 대상에 포함

---

## 7. 의사결정 체크리스트

결합 전략을 확정하기 전 Jin이 답해야 할 질문:

- [ ] **autopus를 project-m 전용으로만 쓸 것인가, 다른 프로젝트에도 확장할 것인가?**
  - 전용 → 옵션 B 충분
  - 확장 → 옵션 A 또는 C
- [ ] **멀티모델 debate 기능을 쓸 것인가?**
  - 쓴다 → Local-only 원칙 재검토 필요
  - 안 쓴다 → `providers: [claude]` 고정
- [ ] **TDD를 강제할 것인가?**
  - 네 → `methodology.enforce: true`
  - 아니오 → `false`
- [ ] **JARVIS Knowledge OS의 결정 기록과 Lore를 통합할 것인가?**
  - 네 → Phase 4까지 진행
  - 아니오 → Lore는 project-m 로컬로만

---

## 8. 리스크 요약

| 리스크 | 발생 가능성 | 영향 | 대응 |
|---|---|---|---|
| autopus가 HARNESS를 무시 | 중 | 중 | `/auto plan` 결과 수동 검토 |
| Lore/Knowledge OS 중복 | 높 | 낮 | 일방향 동기화 스크립트 |
| `autopus.yaml` 스키마 미지원 필드 | 중 | 낮 | README/docs 직접 확인 |
| 멀티모델 API 키 노출 | 낮 | 높 | Claude만 사용 |
| PowerShell install 스크립트 버그 | **발생함** | 중 | 직접 zip 다운로드로 우회 |
| CLAUDE.md 덮어쓰기 | 중 | 중 | 설치 전 백업 |

---

## 9. 새 창에서 이어갈 때 전달할 핵심 컨텍스트

새 대화로 이어갈 경우 다음을 먼저 공유:

```
나는 JARVIS Protocol(HARNESS + SKILL + G-STACK)을 쓰고 있고,
project-m(G:\Project M\model-agency-system)에 autopus-adk를 도입하려 한다.
결합 전략은 "옵션 B (user-level CLAUDE.md에 JARVIS, project-level에 autopus)"로 결정했고,
현재 Phase [1|2|3|4]에 있다.
이번 세션에서 확인/수정할 것은 [구체 항목]이다.
```

이 문서 경로: `autopus_jarvis_integration_analysis.md` (Apple Notes 복사 권장)

---

## 10. 아직 내가 모르는 것 (정직한 한계)

이 분석에서 **추정에 의존한 부분**:
- `autopus.yaml`의 실제 지원 필드 (공식 스키마 미확인)
- autopus의 SKILL.md 호환 여부 (공식 언급 없음)
- Lore의 저장 포맷 및 외부 export 방법
- `/auto` 명령 커스터마이즈 가능 여부

**권장**: `auto init` 이후 생성되는 실제 파일 구조를 확인한 뒤, 이 문서의 옵션 A/B/C를 재검증할 것.