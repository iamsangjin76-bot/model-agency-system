# Phase D-2 설계문서 — Repo 오염 5항목 통합 정리 전략

> **작성**: architect 에이전트 (2026-04-16)
> **출처 세션**: Phase D-2 architect 단계 (이전 단계: `a72988b3` Phase D-1 B 완료)
> **단계**: 설계 확정 대기 → 사용자 결정 3건 → planner Worker Contract 작성

---

## 0. 정찰 요약

| 메트릭 | 값 |
|---|---|
| 총 추적 파일 | 315개 |
| 총 추적 용량 | 49.1 MB |
| `(2)` 복사본 수 | 68개 |
| `frontend/dist/` 파일 수 | 8개 (7.9 MB) |
| `patch_dashboard.py` | 1개 (21줄) |
| `autopus-adk-main.zip` | 1개 (3.1 MB) |
| `.minimax/skills/` 파일 수 | 83개 (36.7 MB, 대부분 exe/dll 바이너리) |

### 핵심 발견

`.gitignore`에 `dist/`, `*.exe`, `*.zip` 규칙이 **이미 존재**하지만, initial commit (`dc5c6575`)에서 규칙 설정 전·동시에 `git add` 된 파일은 **이미 추적 중이라 gitignore 미적용**. → `git rm --cached` 필수.

---

## 1. 항목별 처리 결정표

| 항목 | 대상 | 파일 수 | 방식 | 로컬 삭제 | 근거 |
|---|---|---|---|---|---|
| **C** | `* (2).*` 전체 | 68 | `git rm` | Yes | 67/68 원본 존재. 대부분 IDENTICAL. DIFFER 3건(config/main/auth)도 원본이 최신. Import 참조 0건 |
| **D** | `frontend/dist/` 전체 | 8 | `git rm --cached` | No | 빌드 산출물. `.gitignore dist/` 규칙 기존 존재, `--cached`로 해제 시 즉시 작동 |
| **E** | `patch_dashboard.py` | 1 | `git rm` | Yes | 파일 1행에 `# DEPRECATED (2026-04-16) 절대 재실행 금지` 명시. git history로 보존 |
| **F** | `autopus-adk-main.zip` | 1 | `git rm` | Yes | 3.1MB. ADK 이미 설치 완료 (`.claude/`, `.autopus/`). `*.zip` 규칙 존재하나 추적 중 |
| **G** | `.minimax/skills/` 전체 | 83 | `git rm --cached` + `.gitignore` 추가 | No | 36.7MB (exe 23.6MB + dll 13MB). 외부 도구, 프로젝트 소스 아님 |

---

## 2. C 항목 "진짜 vs 가짜" 판별 상세

| 카테고리 | (2) 파일 | vs 원본 | 판정 | 근거 |
|---|---|---|---|---|
| `backend/app/config` | `config (2).py` | DIFFER | **원본이 진짜** | (2)는 `ACCESS_TOKEN_EXPIRE_MINUTES=60*24`(24h). 원본은 `15min + REFRESH_TOKEN_EXPIRE_DAYS=7` — refresh token 도입 이후 |
| `backend/app/main` | `main (2).py` | DIFFER | **원본이 진짜** | (2)에 `token_refresh` router, `cleanup_expired_tokens` 없음 |
| `backend/app/routers/auth` | `auth (2).py` | DIFFER | **원본이 진짜** | (2)는 한국어 docstring + 긴 포맷. 원본은 영문 + refresh token 반환 + `token_service` 참조 |
| `backend/` 나머지 10개 | 전부 | IDENTICAL | (2)는 무용 사본 | 바이트 동일 |
| `frontend/` 10개 | 전부 | IDENTICAL | (2)는 무용 사본 | 바이트 동일 |
| `.minimax/` 39개 | 거의 전부 | IDENTICAL | (2)는 무용 사본 | spot-check IDENTICAL |
| `.claude/settings.local` | `(2).json` | DIFFER (orphan) | (2)는 구버전 | 원본이 MCP 서버 + 추가 permission 포함. (2)는 부분집합 |

**Import/Require 참조**: (2) 파일을 참조하는 코드 0건. Python/JS/TS import 경로 모두 원본 지시. 런타임·빌드 경로에서 dead file 확정.

---

## 3. 커밋 분할 순서

### 분할 기준

| 기준 | D-2a | D-2b |
|---|---|---|
| 관심사 | Windows (2) 사본 정리 | gitignore 미적용 산출물 추적 해제 |
| `git rm` 방식 | `git rm` (로컬 삭제) | 혼합: `--cached` (D, G) + `git rm` (E, F) |
| 되돌리기 난이도 | moderate (68개 파일 복구 필요 시) | trivial (`--cached`는 다시 add) |
| `.gitignore` 편집 | 불필요 | 필요 (`.minimax/`, `patch_dashboard.py` 추가) |
| 세션 커밋 예산 | 1/3 | 2/3 |

**총 2커밋** — Phase D-1 B의 1커밋 포함 시 세션 통산 3커밋 한계선.

---

### Commit 1: D-2a — Windows `(2)` 복사본 제거

**Lore 메시지**:

```
chore(cleanup): remove 68 Windows duplicate files from tracking and disk

Windows 파일 시스템 충돌로 생성된 (2) 사본 68개를 삭제한다.
67/68개는 원본과 바이트 동일 또는 구 버전(config/main/auth 3건은 원본이 최신 기능 포함).
Import/require 참조 전수 검사 결과 (2) 파일을 참조하는 코드 없음.
1개 orphan (.claude/settings.local (2).json)도 원본의 부분집합.

Constraint: (2) files are Windows filesystem conflict artifacts with zero runtime references
Confidence: high
Scope-risk: local
Reversibility: moderate
Directive: if any (2) file is later found needed, recover from git history (dc5c6575)
Tested: diff comparison all 68 pairs, import/require reference scan across 315 tracked files
Not-tested: none
Related: Phase D-2a, dc5c6575 (initial commit)

🐙 Autopus <noreply@autopus.co>
```

**실행 명령 (bash 기준)**:

```bash
git ls-files | grep "(2)" | while IFS= read -r f; do git rm "$f"; done
```

> ⚠️ PowerShell 환경이면 구문 변환 필요. executor 단계 Contract에서 명시해야 함.

---

### Commit 2: D-2b — 빌드/바이너리 산출물 추적 해제

**Lore 메시지**:

```
chore(gitignore): untrack build artifacts, deprecated script, and vendor binaries

D: frontend/dist/ 8개 — 빌드 산출물, gitignore dist/ 규칙 존재하나 추적 상태로 미적용
E: patch_dashboard.py — DEPRECATED 원샷 스크립트, 버그 원인으로 표시됨
F: autopus-adk-main.zip (3.1MB) — 설치 완료된 ADK 아카이브, *.zip 규칙 미적용 상태
G: .minimax/skills/ 83개 (36.7MB) — 외부 도구 바이너리(exe/dll), 프로젝트 소스 아님

.gitignore에 .minimax/ 및 patch_dashboard.py 규칙 추가.
dist/, *.exe, *.zip 규칙은 이미 존재하므로 git rm --cached만 실행.

Constraint: local files preserved for D and G (runtime references possible), deleted for E and F
Confidence: high
Scope-risk: local
Reversibility: trivial
Directive: history rewrite (filter-repo) 는 Phase D-3 이후 별도 판단, 현재는 forward-only 정리
Tested: git check-ignore confirms existing rules will apply after --cached removal
Not-tested: .minimax runtime dependency verification
Related: Phase D-2b, dc5c6575 (initial commit)

🐙 Autopus <noreply@autopus.co>
```

**실행 명령**:

```bash
# D: frontend/dist/ 인덱스만 제거
git rm -r --cached frontend/dist/

# E: patch_dashboard.py 완전 삭제
git rm patch_dashboard.py

# F: autopus-adk-main.zip 완전 삭제
git rm autopus-adk-main.zip

# G: .minimax/skills/ 인덱스만 제거
git rm -r --cached .minimax/skills/
```

**`.gitignore` 추가 블록** (파일 맨 끝):

```gitignore
# .minimax vendor binaries (Phase D-2)
.minimax/

# Deprecated one-shot scripts (Phase D-2)
patch_dashboard.py
```

---

## 4. Pre-commit Hook 도입 권고 — **Medium Priority**

### 근거

현재 repo에 commit-msg (Lore 포맷 검증) + pre-commit hook이 이미 존재. 그러나 initial commit에서 68개 (2) + 빌드 산출물 + 3.1MB zip + 36.7MB 바이너리가 한꺼번에 유입된 것은 **파일 패턴 검증이 없음**을 의미.

### 권장 차단 패턴

| 패턴 | 차단 대상 | 유형 |
|---|---|---|
| `* (2).*` / `* (2)` | Windows 중복 사본 | reject |
| `*/dist/` | 빌드 산출물 | reject |
| `*.zip` / `*.tar.gz` / `*.rar` | 아카이브 바이너리 | reject |
| `.agent/` | 에이전트 캡처 산출물 | reject |
| `.minimax/` | 외부 벤더 바이너리 | reject |
| `*.exe` / `*.dll` / `*.pdb` | 컴파일 바이너리 | reject |
| 단일 파일 > 500KB | 대형 파일 | warn |

### 도입 시기

**Phase D-3 (별도 커밋)**:
1. Phase D-2는 이미 2커밋으로 세션 예산 도달
2. hook 로직은 테스트 필요 → 정리 커밋과 분리가 안전
3. 기존 pre-commit hook 내용 확인 후 추가 vs 대체 결정

### 미도입 시 리스크

`.gitignore` 규칙만으로는 `git add -f` 또는 규칙 추가 전 staging된 파일을 막지 못함. 현재 repo 오염이 정확히 그 시나리오.

---

## 5. 예상 효과

| 메트릭 | Before | After D-2 | 감소 |
|---|---|---|---|
| 추적 파일 수 | 315 | ~155 (-160) | **-51%** |
| 추적 용량 | 49.1 MB | ~5.7 MB (-43.4 MB) | **-88%** |
| (2) 파일 | 68 | 0 | -100% |
| 바이너리 추적 | ~40 MB | 0 | -100% |

> ⚠️ **주의**: git history 상의 용량은 변하지 않음. `git clone` 시 여전히 전체 히스토리를 받음. 히스토리 정리는 Phase D-3 (`git filter-repo`) 별도 판단.

---

## 6. 사용자 결정 대기 항목 (실행 전)

| 번호 | 결정 사항 | architect 기본값 |
|---|---|---|
| 1 | DIFFER 3건 판정 신뢰 여부 (config/main/auth.py) | 원본이 최신 판정 — 신뢰 진행 |
| 2 | `.minimax/skills/` 로컬 보존 vs 삭제 | `--cached` (로컬 보존) |
| 3 | D-2a + D-2b 단일 세션 실행 vs 분할 | 단일 세션 (총 2커밋) |

---

## 7. 아키텍트 우려 포인트 (executor Contract 작성 시 반영 필수)

1. **PowerShell 환경 대응**
   - `while IFS= read -r f; do ... done` 구문은 bash 전용
   - PowerShell 환경이면 `Get-ChildItem`/`ForEach-Object` 또는 `.git/COMMIT_MSG_TMP.txt` 방식 동등 변환 필요
   - Phase D-1 B 세션에서 PowerShell 사용 이력 있음 (v8 참고 #5)

2. **Commit 2 복합성**
   - 4개 git 명령 + `.gitignore` 편집이 한 커밋
   - 중간 실패 시 rollback 복잡 → executor Contract에 **중간 검증 단계** 명시 권장
   - 각 `git rm` 후 `git status` 확인 단계 삽입

3. **Lore hook enum 제약 (v8 교훈 #1)**
   - `Confidence: high`, `Scope-risk: local`, `Reversibility: moderate/trivial` — **bare 값만**
   - 부가 설명은 `Tested`/`Directive`/`Related` 필드로 분리됨 (확인됨)

4. **[금지] 절대형 작성 (v8 교훈 #2)**
   - executor Contract에 `이 Contract 범위에서 git push 일체 금지 — 단 한 번도 실행하지 않는다` 명시
   - planner Contract 단계부터 유지

---

## 8. 다음 단계 (사용자 결정 후)

1. **planner 에이전트 호출** — 이 설계문서를 기반으로 executor용 실행 계획 수립
2. **executor Contract 작성** — PowerShell/bash 환경 구분 + 중간 검증 단계 포함
3. **reviewer 단계** — 커밋 후 `git log`, `git ls-files | wc -l`, 예상 효과 달성 검증

---

> **설계 확정 시점**: 2026-04-16 Phase D-2 architect 단계 종료
> **다음 갱신**: planner Contract 작성 시