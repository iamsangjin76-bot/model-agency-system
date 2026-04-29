<!-- AUTOPUS:BEGIN -->
# Autopus-ADK Harness

> 이 섹션은 Autopus-ADK에 의해 자동 생성됩니다. 수동으로 편집하지 마세요.

- **프로젝트**: model-agency-system
- **모드**: full
- **플랫폼**: claude-code, codex, gemini-cli, opencode

## 설치된 구성 요소

- Rules: .claude/rules/autopus/
- Skills: .claude/skills/autopus/
- Commands: .claude/skills/auto/SKILL.md
- Agents: .claude/agents/autopus/

## Language Policy

IMPORTANT: Follow these language settings strictly for all work in this project.

- **Code comments**: Write all code comments, docstrings, and inline documentation in English (en)
- **Commit messages**: Summary line in English; body and trailers in Korean allowed (commits: ko)
- **AI responses**: Respond to the user in English (en)

## Core Guidelines

### Subagent Delegation

IMPORTANT: Use subagents for complex tasks that modify 3+ files, span multiple domains, or exceed 200 lines of new code. Define clear scope, provide full context, review output before integrating.

### File Size Limit

IMPORTANT: No source code file may exceed 300 lines. Target under 200 lines. Split by type, concern, or layer when approaching the limit. Excluded: generated files (*_generated.go, *.pb.go), documentation (*.md), and config files (*.yaml, *.json).

### Code Review

During review, verify:
- No file exceeds 300 lines (REQUIRED)
- Complex changes use subagent delegation (SUGGESTED)
- See .claude/rules/autopus/ for detailed guidelines

<!-- AUTOPUS:END -->

---

<!-- JARVIS:BEGIN -->
# JARVIS Standing Rules (Jin 전용)

> 이 섹션은 Jin이 직접 설정한 JARVIS 운영 규칙입니다. 절대 삭제하지 마세요.

## 컨텍스트 자동 저장 규칙

**CRITICAL: 컨텍스트가 약 80% 차면 작업을 멈추고 반드시 아래를 실행할 것.**

### 저장 위치
```
G:\Project M\model-agency-system\docs\handover\
  └── session_YYYYMMDD_HHMM.md    ← 작업 요약 (인간이 읽는 형식)
  └── session_YYYYMMDD_HHMM.json  ← 구조화 데이터 (다음 세션 복원용)
```

### MD 파일 필수 포함 항목
1. 세션 날짜 및 작업 배경
2. 완료한 작업 목록 (커밋 ID 포함)
3. 수정된 핵심 파일 경로
4. 발견된 이슈 및 처리 여부
5. 다음 세션에서 이어할 작업 (우선순위 포함)
6. 현재 git 브랜치 및 상태

### JSON 파일 필수 포함 항목
```json
{
  "session_date": "YYYY-MM-DD",
  "last_commit": "커밋 해시",
  "completed_tasks": [],
  "modified_files": [],
  "pending_tasks": [{ "priority": "high|medium|low", "description": "", "files": [] }],
  "known_issues": [],
  "git_status": "clean|dirty",
  "next_action": ""
}
```

### 저장 후 Jin에게 보고할 것
> "컨텍스트가 80%에 도달했습니다. 진행 내용을 저장했습니다: [파일경로]"
<!-- JARVIS:END -->
