# 🩹 `.autopus/context/constraints.yaml` 교체안

> **상태**: 설계 문서 (다음 세션에서 Claude Code CLI 가 실제 YAML 반영)
> **목적**: Go 전용 deny 패턴 5개 → Python/FastAPI + React/TypeScript 패턴으로 교체
> **근거**: 이 프로젝트의 스택은 Python + React, Go 코드가 존재하지 않음 → 현재 룰은 전부 dead code

---

## 1. 현재 상태 (제거 대상)

`.autopus/context/constraints.yaml` 의 deny 패턴 중 Go 전용 항목들:

- `context.Background()` — Go 의 빈 컨텍스트 생성
- `fmt.Sprintf` — Go 의 포맷 문자열
- `os.Exit` — Go 의 즉시 종료
- (그 외 2개, 실제 파일 확인 후 교체)

이 룰들은 Python/React 프로젝트에서 **절대 매칭되지 않으므로** 이론적으로는 "무해" 하지만:

1. **템플릿 오해 유발**: 복사·수정해서 다른 프로젝트에 쓸 때 혼란
2. **거짓 안전감**: "constraints 가 지켜지고 있다" 는 착각 (실제는 발동 안 함)
3. **실제 보호 부재**: 이 프로젝트의 스택에 맞는 진짜 제약이 없는 상태

→ **치환이 맞다.**

---

## 2. 교체 제안 (Python/FastAPI + React/TypeScript)

### 🐍 Python/FastAPI 백엔드 deny 패턴

| 패턴 | 이유 | 대안 |
|---|---|---|
| `print(` | 운영 로그는 print 로 찍으면 안 됨 (구조화·레벨 관리 불가) | `logger.info()`, `logger.error()` 등 사용 |
| `except:` (빈 except) | 모든 예외를 삼켜 버그 은폐 | `except Exception as e:` 로 최소 명시 |
| `eval(`, `exec(` | 임의 코드 실행 → 치명적 보안 위험 | `json.loads`, `ast.literal_eval` 등 안전 파서 |
| `os.system(` | 쉘 인젝션 위험 | `subprocess.run([...], shell=False)` |
| `assert ` (런타임 검증용) | 파이썬 `-O` 플래그로 전부 제거됨 → 실제 배포에서 무력화 | 정식 조건문 + `raise ValueError()` |

### ⚛️ React/TypeScript 프론트엔드 deny 패턴

| 패턴 | 이유 | 대안 |
|---|---|---|
| `: any` (타입 표기) | TypeScript 의 존재 이유 무력화 | 정확한 타입 지정 / `unknown` + 타입가드 |
| `// @ts-ignore` | 에러 은폐 (원인 해결 안 됨) | `// @ts-expect-error` + 이유 주석, 또는 원인 수정 |
| `dangerouslySetInnerHTML` | XSS 위험 | 텍스트 렌더링 기본 사용, 필요하면 DOMPurify |
| `eval(` | XSS·임의 실행 위험 | JSON 파싱 등 안전 함수 |
| `localStorage.setItem('token'` | JWT 액세스 토큰을 localStorage 에 저장 → XSS 시 탈취 | httpOnly 쿠키 또는 메모리(React state) 저장 |

### 🚫 프로젝트 고유 금지 (이미 AGENTS.md 에 박혀있지만 constraints 에도 명시)

| 패턴 | 이유 |
|---|---|
| `patch_*.py` 스크립트 신규 생성 | 범용 텍스트 치환의 2026-04-16 사건 재발 방지 |
| `backend/venv/` 커밋 | 드라이브 이동 시 깨짐 + 용량 |
| `.env` 파일에 실제 시크릿 커밋 | GitHub 노출 방지 |

---

## 3. YAML 구조 반영 가이드 (다음 세션 Claude Code 용)

다음 세션에서 Claude Code 의 `executor` 에게 이 문서 + 실제 `constraints.yaml` 을 모두 보여주고 다음 Worker Contract 로 지시합니다:

```markdown
**목표**: .autopus/context/constraints.yaml 의 Go 전용 deny 패턴 5개를
         Python/FastAPI + React/TypeScript 패턴으로 교체 (이 설계안 반영)

**범위**: .autopus/context/constraints.yaml (단일 파일)

**완료 기준**:
  - Go 참조 패턴 5개 전부 제거됨
  - Python 5개 + React/TS 5개 + 프로젝트 고유 3개 = 총 13개 패턴 추가됨
  - YAML 문법 검증 통과 (yamllint 또는 python -c "import yaml; yaml.safe_load(open('...'))" 성공)
  - 기존 YAML 구조 (필드명·들여쓰기 컨벤션) 유지

**금지**:
  - 다른 파일 수정 불가
  - 기존 allow 패턴은 건드리지 말 것 (deny 섹션만 대상)
  - 이유(reason) 필드가 원래 있다면 한국어로 작성 (기존 파일 스타일 확인 후 일치)
```

---

## 4. 커밋 예정 메시지 (Lore 포맷)

```
chore(context): replace go-specific deny patterns with python/react rules

.autopus/context/constraints.yaml 의 Go 전용 패턴 5개 제거하고
이 프로젝트 스택 (Python/FastAPI + React/TypeScript) 에 맞는
13개 deny 패턴으로 재구성. Dead rule → Live guard 전환.

Constraint: preserve existing yaml structure and allow patterns
Confidence: high
Scope-risk: low
Reversibility: easy
Directive: validate rules actually fire on sample violations in next session
Tested: yaml syntax validation pass
Not-tested: runtime enforcement on real staged files
Related: 우선순위 #3.5, WORKFLOW.md 발행 준비

🐙 Autopus <noreply@autopus.co>
```

---

## 5. 리스크 · 주의사항

1. **실제 YAML 스키마 미확인** — ADK 의 constraints.yaml 이 어떤 필드명을 쓰는지 (예: `deny_patterns`, `forbidden`, `rules` 등) 이 세션에서는 모름. 다음 세션 시작 시 explorer 에이전트로 파일 읽기 먼저 해야 함.
2. **13개는 초안 갯수** — 실제 적용 시 너무 많다 판단되면 핵심 5~7개만 먼저 넣고 점진 확대 권장.
3. **기존 allow 패턴과 충돌 가능성** — `print(` 를 deny 로 넣었는데 테스트 코드에서 의도적으로 쓴다면 화이트리스트 예외 필요. 실제 코드베이스 grep 후 판단.
4. **훅 발동 확인 필요** — `pre-commit: auto check --arch --staged` 이 새 룰을 실제로 읽어서 막는지 작은 테스트 커밋으로 확인.

---

## 6. 다음 세션 체크리스트

- [ ] explorer 로 `.autopus/context/constraints.yaml` 현재 내용 확인
- [ ] 기존 스키마·필드명 파악
- [ ] 이 설계안 기반으로 executor 에게 Worker Contract 발급
- [ ] 수정 후 `python -c "import yaml; yaml.safe_load(open('.autopus/context/constraints.yaml'))"` 로 문법 검증
- [ ] 샘플 위반 코드로 훅 발동 테스트 (예: print 가 들어간 파일 스테이징 → pre-commit 거부되는지)
- [ ] 통과하면 Lore 커밋 → WORKFLOW.md 커밋 순으로 진행

---

> **작성일**: 2026-04-16 (Phase C 설계 단계)
> **실행 예정**: 다음 세션 (C-4 단계 가이드에 포함)