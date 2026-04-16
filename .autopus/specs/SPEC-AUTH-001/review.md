# Review: SPEC-AUTH-001

**Verdict**: REVISE
**Revision**: 2
**Date**: 2026-04-15 01:19:56

## Findings

| Provider | Severity | Description |
|----------|----------|-------------|
| gemini | critical | The SPEC document body is missing. Only the title "SPEC-AUTH-001 — JWT Token Refresh System" was provided along with the existing code context, leaving no actual requirements, architectural decisions, or implementation steps to evaluate. |
| gemini | major | A complete JWT Refresh System specification needs to detail several key components currently missing from the prompt: access token lifespan reduction (currently 24 hours in `config.py`), refresh token lifespan, storage mechanism (e.g., HttpOnly secure cookies vs. client-side), stateful vs. stateless refresh tokens (whether to store them in the database for revocation), and the actual `/refresh` endpoint logic. |
| claude | minor | The 30-second grace window for the previous refresh token (to handle network retries causing false-positive reuse detection) is mentioned in the PRD pre-mortem but deferred in `research.md` line 78. This is a reasonable deferral to implementation, but it should be captured as an explicit open decision in `spec.md` so the executor knows the latitude they have. |
| claude | minor | Cleanup runs only at application startup. For long-running deployments, the `refresh_tokens` table grows until the next restart. A periodic cleanup (e.g., daily) would be more robust, but the current approach is adequate for a SQLite-backed system with low token volume. |
| gemini | critical | The SPEC document body is missing. Only the title "SPEC-AUTH-001 — JWT Token Refresh System" was provided along with the existing code context, leaving no actual requirements, architectural decisions, or implementation steps to evaluate. |
| gemini | major | A complete JWT Refresh System specification needs to detail several key components currently missing from the prompt: access token lifespan reduction (currently 24 hours in `config.py`), refresh token lifespan, storage mechanism (e.g., HttpOnly secure cookies vs. client-side), stateful vs. stateless refresh tokens (whether to store them in the database for revocation), and the actual `/refresh` endpoint logic. |
| gemini | critical | The SPEC document body is missing. Only the title "SPEC-AUTH-001 — JWT Token Refresh System" was provided along with the existing code context, leaving no actual requirements, architectural decisions, or implementation steps to evaluate. |
| gemini | major | A complete JWT Refresh System specification needs to detail several key components currently missing from the prompt: access token lifespan reduction (currently 24 hours in `config.py`), refresh token lifespan, storage mechanism (e.g., HttpOnly secure cookies vs. client-side), stateful vs. stateless refresh tokens (whether to store them in the database for revocation), and the actual `/refresh` endpoint logic. |
| claude | minor | The 30-second grace window for the previous refresh token (to handle network retries causing false-positive reuse detection) is mentioned in the PRD pre-mortem but deferred in `research.md` line 78. This is a reasonable deferral to implementation, but it should be captured as an explicit open decision in `spec.md` so the executor knows the latitude they have. |
| claude | minor | Cleanup runs only at application startup. For long-running deployments, the `refresh_tokens` table grows until the next restart. A periodic cleanup (e.g., daily) would be more robust, but the current approach is adequate for a SQLite-backed system with low token volume. |
| gemini | critical | The SPEC document body is missing. Only the title "SPEC-AUTH-001 — JWT Token Refresh System" was provided along with the existing code context, leaving no actual requirements, architectural decisions, or implementation steps to evaluate. |
| gemini | major | A complete JWT Refresh System specification needs to detail several key components currently missing from the prompt: access token lifespan reduction (currently 24 hours in `config.py`), refresh token lifespan, storage mechanism (e.g., HttpOnly secure cookies vs. client-side), stateful vs. stateless refresh tokens (whether to store them in the database for revocation), and the actual `/refresh` endpoint logic. |

## Provider Responses

### Response 1

Line counts confirmed. Here is the full verification review:

---

**VERDICT: PASS**

The SPEC-AUTH-001 suite (spec.md, plan.md, prd.md, research.md, acceptance.md) is complete, well-structured, and internally consistent. All prior critical and major findings are resolved. The two remaining minor items are either resolved or acknowledged-and-acceptable for the project's current scale.

---

1. FINDING_STATUS: F-001 | resolved | `spec.md` contains 87 lines of substantive content: Purpose, 14 requirements (R1–R14), Deferred/Out of Scope, Files to Create or Modify (with prerequisite split plan), and Constraints. Supporting documents (prd.md, plan.md, research.md, acceptance.md) are all present and detailed. The prior finding was caused by a reviewer that could not access the SPEC files due to MCP issues (visible in review.md Response 2).

2. FINDING_STATUS: F-002 | resolved | All five missing components are now fully specified: access token reduced to 15 min (R2, config change in plan T1), refresh token TTL of 7 days (R1, R2), client-side localStorage storage / SHA-256 hashed DB storage server-side (R10, R11, R14), stateful opaque UUID4 with DB-tracked revocation chain (R10, research.md "Opaque UUID4 vs JWT" decision), and `/refresh` endpoint logic with rotation and family revocation (R4, R5, R6).

3. FINDING_STATUS: F-003 | resolved | R6 in spec.md (line 24) now explicitly states: "There is NO grace window for reuse — any reuse of a consumed token triggers family revocation." It further explains the distinction between safe network retries (resending a not-yet-consumed token) and the actual attack vector (presenting an already-rotated token). This is a clear, documented design decision rather than an ambiguous deferral. The research.md line 78 phrasing ("deferred to implementation") is slightly inconsistent with R6's definitive stance, but the spec (authoritative document) takes precedence and the executor has an unambiguous directive.

4. FINDING_STATUS: F-004 | open | R9 and acceptance criterion S8 still specify startup-only cleanup. No periodic cleanup mechanism has been added. S8 was refined to give precise cleanup criteria (only `expires_at < now` rows are deleted, preserving revoked-but-not-expired tokens needed for R6 reuse detection chain), which is a quality improvement. However, for long-running deployments the table still grows until the next restart. This remains acceptable for a SQLite-backed system with low token volume — the finding's own assessment stands.

5. FINDING_STATUS: F-001 (duplicate) | resolved | Same as item 1. This is a duplicate entry in the checklist from the same Gemini reviewer (visible in review.md — both Gemini findings were recorded twice).

6. FINDING_STATUS: F-002 (duplicate) | resolved | Same as item 2. Duplicate entry from the same source.

---

No new critical or security issues found. Two non-blocking observations for completeness:

- The spec.md "Prerequisites" section (lines 51–59) and plan tasks T0a–T0c now address the file-size violations in `database.py` (320 lines, confirmed), `schemas.py` (545 lines, confirmed), and `api.ts` (413 lines, confirmed). These prerequisite splits are correctly sequenced before new code is added, which resolves the file-size concerns raised in the first reviewer's new observations.
- The `research.md` line 78 phrasing ("deferred to implementation — the executor **may** implement a short grace period") contradicts R6's definitive "There is NO grace window." This is a documentation inconsistency, not a functional gap — the spec takes precedence. A minor edit to research.md aligning it with R6 would eliminate ambiguity for the executor.


### Response 2

MCP issues detected. Run /mcp list for status.1. VERDICT: REVISE
2. FINDING_STATUS: F-001 | open | The SPEC document body is still completely missing from the prompt. Only the title and existing code context were provided.
3. FINDING_STATUS: F-002 | open | Without the SPEC document, key components such as token lifespans, storage mechanisms, and the `/refresh` endpoint logic remain unspecified.
4. FINDING_STATUS: F-003 | open | Due to the missing SPEC document, the explicit open decision regarding the 30-second grace window for refresh tokens is not captured.
5. FINDING_STATUS: F-004 | open | With no SPEC document provided, the token cleanup strategy cannot be evaluated or confirmed.


