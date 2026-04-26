# PLAN-J-8a — 백엔드 이미지 프록시 구현 계획

> **역할**: planner (Sonnet 4.6)
> **입력 SPEC**: `.autopus/specs/SPEC-IMAGE-PROXY-001.md` §1~§7 (J-8a 범위)
> **작성일**: 2026-04-26
> **정정**: v2 (2026-04-26) — 정정 3건 반영 (§6.6.2 fanout / §6.5 헤더-매직 불일치 / §3.2 TTL 7일)
> **실행 범위**: J-8a (백엔드 프록시) — J-8b/c/d/e 제외
> **전제**: HEAD `99253666` working tree clean, httpx·Pillow 설치 완료

---

## 1. 대상 파일 (5개)

| # | 경로 | 액션 | 예상 LoC |
|---|------|------|---------|
| F1 | `backend/app/utils/security.py` | **확장** — `validate_proxy_host()` + `_is_private_ip()` 추가 | +35 |
| F2 | `backend/app/config.py` | **변경** — 환경변수 5개 + 헬퍼 프로퍼티 추가 | +18 |
| F3 | `backend/app/services/image_proxy_service.py` | **신규** | ~95 |
| F4 | `backend/app/routers/proxy.py` | **신규** | ~38 |
| F5 | `backend/app/main.py` | **변경** — import 1줄 + include_router 1줄 | +2 |

**총 LoC 예상**: +188줄 신규/변경
**삭제 라인**: 0
**300줄 초과 위험**: F3·F4 각각 100줄 미만 — 안전. F1·F2 현재 줄수 executor가 Read 후 확인 요함

---

## 2. 의존 관계 그래프

```
F1 (security.py)  ──┐
                    ▼
F2 (config.py) ───▶ F3 (image_proxy_service.py)
                    │
                    ▼
                   F4 (proxy.py ─ router)
                    │
                    ▼
                   F5 (main.py ─ include_router)
```

**실행 순서**: F1 → F2 → F3 → F4 → F5
이유: F3은 F1(호스트 검증)과 F2(설정값) 양쪽에 의존. F4는 F3의 `fetch_proxied_image()`를 직접 호출. F5는 F4 임포트 후 등록.

---

## 3. 파일별 구현 명세

### F1. `backend/app/utils/security.py` — 확장

> executor 지시: 먼저 Read로 현재 내용 확인 후 파일 하단에 append. 기존 함수 수정 금지.

**추가 내용**:

```python
# ── Image Proxy SSRF defense (added for J-8a) ────────────────────────────

import ipaddress
import socket

_PRIVATE_NETS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),   # link-local / APIPA
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


def _is_private_ip(ip_str: str) -> bool:
    """Return True if the IP falls within any private/reserved range."""
    try:
        addr = ipaddress.ip_address(ip_str)
        return any(addr in net for net in _PRIVATE_NETS)
    except ValueError:
        return True  # unparseable → block


def validate_proxy_host(hostname: str, allowed_suffixes: list[str]) -> bool:
    """
    Return True only if:
      1. hostname matches an allowed suffix (suffix-only, no glob wildcard abuse)
      2. all resolved IPs are non-private

    Caller converts False → HTTP 403.
    """
    # Step 1: suffix whitelist (suffix-only matching)
    hostname_lower = hostname.lower()
    matched = any(
        hostname_lower == s.lower().lstrip(".")
        or hostname_lower.endswith("." + s.lower().lstrip("."))
        for s in allowed_suffixes
    )
    if not matched:
        return False

    # Step 2: DNS resolve + private IP check (re-resolved every request, no cache)
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False   # DNS failure → block
    for info in infos:
        ip = info[4][0]
        if _is_private_ip(ip):
            return False

    return True
```

**검증 예시** (F1 단독 단위 확인, executor 메모):
- `validate_proxy_host("imgnews.naver.net", ["naver.net"])` → True
- `validate_proxy_host("naver.net.evil.com", ["naver.net"])` → False  ← suffix 우회 차단
- `validate_proxy_host("127.0.0.1", ["naver.net"])` → False  ← suffix 매칭 실패
- `validate_proxy_host("evil.com", ["naver.net"])` → False

---

### F2. `backend/app/config.py` — 변경

> executor 지시: Read 후 `class Settings` 블록 내 기존 변수 마지막 줄 다음에 추가.

**추가 내용**:

```python
    # ── Image proxy (J-8a) ────────────────────────────────────────────────
    IMAGE_PROXY_ALLOWED_DOMAINS: str = (
        "imgnews.naver.net,naver.net,blogfiles.naver.net,"
        "postfiles.pstatic.net,ssl.pstatic.net,"
        "i1.ruliweb.com,i2.ruliweb.com,i3.ruliweb.com,"
        "image.fmkorea.com,img.insight.co.kr"
    )
    IMAGE_PROXY_MAX_SIZE: int = 10_485_760   # 10 MB
    IMAGE_PROXY_TIMEOUT: float = 5.0          # seconds
    IMAGE_PROXY_CACHE_DIR: str = "proxy_cache"
    IMAGE_PROXY_CACHE_TTL: int = 604800        # 7 days (SPEC §3.2)

    @property
    def image_proxy_allowed_suffixes(self) -> list[str]:
        """Parse comma-separated domain list into a list of suffix strings."""
        return [d.strip() for d in self.IMAGE_PROXY_ALLOWED_DOMAINS.split(",") if d.strip()]
```

> ⚠️ **Jin 수동 작업 (M1)**: `.env` 파일에 아래 5줄을 텍스트 편집기로 직접 추가 (executor 수정 금지):
> ```
> IMAGE_PROXY_ALLOWED_DOMAINS=imgnews.naver.net,naver.net,blogfiles.naver.net,postfiles.pstatic.net,ssl.pstatic.net,i1.ruliweb.com,i2.ruliweb.com,i3.ruliweb.com,image.fmkorea.com,img.insight.co.kr
> IMAGE_PROXY_MAX_SIZE=10485760
> IMAGE_PROXY_TIMEOUT=5.0
> IMAGE_PROXY_CACHE_DIR=proxy_cache
> IMAGE_PROXY_CACHE_TTL=604800
> ```

---

### F3. `backend/app/services/image_proxy_service.py` — 신규

```python
# -*- coding: utf-8 -*-
"""
Image proxy service — fetch, cache, and verify external images.

SSRF defense implemented via validate_proxy_host() in utils/security.py.
No new pip packages: httpx (already installed), hashlib + pathlib (stdlib).
"""
from __future__ import annotations

import hashlib
import time
from pathlib import Path
from urllib.parse import urlparse, unquote

import httpx
from fastapi import HTTPException

from app.config import settings
from app.utils.security import validate_proxy_host

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_ALLOWED_CONTENT_TYPES = frozenset({
    "image/jpeg", "image/png", "image/webp", "image/gif",
})

# Magic byte signatures (first N bytes → expected content-type)
_MAGIC: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
    # WebP: RIFF????WEBP — handled separately below
]


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def _cache_paths(url: str) -> tuple[Path, Path]:
    """Return (data_path, content_type_path) — 2-level fanout (SPEC §6.6.2)."""
    h = _cache_key(url)
    base = Path(settings.IMAGE_PROXY_CACHE_DIR) / h[:2] / h[2:]
    return base.with_suffix(".bin"), base.with_suffix(".ct")


def _cache_valid(data_path: Path) -> bool:
    if not data_path.exists():
        return False
    age = time.time() - data_path.stat().st_mtime
    return age < settings.IMAGE_PROXY_CACHE_TTL


# ---------------------------------------------------------------------------
# Magic byte verification
# ---------------------------------------------------------------------------

def _verify_magic(data: bytes) -> str | None:
    """Return detected content-type or None if not a recognised image format."""
    for magic, ctype in _MAGIC:
        if data[: len(magic)] == magic:
            return ctype
    # WebP special case: RIFF + 4 bytes + WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def fetch_proxied_image(url: str) -> tuple[bytes, str]:
    """
    Validate, optionally return from cache, otherwise download and cache.

    Returns (image_bytes, content_type).
    Raises HTTPException on any security/protocol violation.
    """
    # 1. URL decode exactly once (double-encoding bypass prevention)
    decoded = unquote(url)
    if decoded != url:
        url = decoded  # use decoded form for further validation

    # 2. Scheme whitelist
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=422, detail="URL scheme must be http or https")

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise HTTPException(status_code=422, detail="URL has no hostname")

    # 3. Host whitelist + private IP check (DNS re-resolved, no TTL cache)
    if not validate_proxy_host(hostname, settings.image_proxy_allowed_suffixes):
        raise HTTPException(status_code=403, detail="Host not in proxy allowlist")

    # 4. Disk cache hit?
    data_path, ct_path = _cache_paths(url)
    if _cache_valid(data_path) and ct_path.exists():
        return data_path.read_bytes(), ct_path.read_text().strip()

    # 5. Fetch — no redirect follow, streaming size check
    # Initialise outside try so raw_ct and chunks are accessible post-block
    chunks: list[bytes] = []
    raw_ct: str = ""
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.IMAGE_PROXY_TIMEOUT),
            follow_redirects=False,
            headers={"Referer": f"https://{hostname}/"},
        ) as client:
            async with client.stream("GET", url) as resp:
                if resp.is_redirect:
                    raise HTTPException(status_code=502, detail="Upstream redirect not followed")
                resp.raise_for_status()

                raw_ct = resp.headers.get("content-type", "").split(";")[0].strip().lower()
                if raw_ct not in _ALLOWED_CONTENT_TYPES:
                    raise HTTPException(
                        status_code=415,
                        detail=f"Upstream Content-Type not allowed: {raw_ct}",
                    )

                total = 0
                async for chunk in resp.aiter_bytes(8192):
                    total += len(chunk)
                    if total > settings.IMAGE_PROXY_MAX_SIZE:
                        raise HTTPException(status_code=413, detail="Image exceeds size limit")
                    chunks.append(chunk)

    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream HTTP error: {exc.response.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream request timed out")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Upstream connection failed")

    data = b"".join(chunks)

    # 6. Magic bytes verification + header/magic mismatch check (SPEC §6.5)
    detected_ct = _verify_magic(data)
    if detected_ct is None:
        raise HTTPException(status_code=415, detail="Response body is not a recognised image format")
    if detected_ct != raw_ct:
        raise HTTPException(status_code=415, detail="Content-Type 헤더와 실제 이미지 형식 불일치")

    # 7. Persist to disk cache (2-level fanout directory)
    data_path.parent.mkdir(parents=True, exist_ok=True)
    data_path.write_bytes(data)
    ct_path.write_text(detected_ct)

    return data, detected_ct
```

---

### F4. `backend/app/routers/proxy.py` — 신규

```python
# -*- coding: utf-8 -*-
"""
Image proxy router.

Exposes GET /api/proxy/image — proxies external images with SSRF defense.
Response headers are explicitly controlled; Set-Cookie and Content-Disposition
are never forwarded to prevent client-side side-effects.
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import Response

from app.config import settings
from app.services.image_proxy_service import fetch_proxied_image

router = APIRouter()


@router.get("/image", summary="Proxy an external image URL")
async def proxy_image(
    url: str = Query(..., description="Fully-qualified external image URL to proxy"),
) -> Response:
    data, content_type = await fetch_proxied_image(url)
    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Cache-Control": f"public, max-age={settings.IMAGE_PROXY_CACHE_TTL}",
            "X-Content-Type-Options": "nosniff",
            # Intentionally omitted: Set-Cookie, Content-Disposition, etc.
        },
    )
```

---

### F5. `backend/app/main.py` — 변경 (2줄)

> executor 지시: Read 후 기존 라우터 import 블록과 include_router 블록에 각 1줄씩 추가.

**import 블록**에 추가:
```python
from app.routers import proxy
```

**include_router 블록** 마지막에 추가:
```python
app.include_router(proxy.router, prefix="/api/proxy", tags=["proxy"])
```

---

## 4. Jin 수동 작업

| # | 작업 | 방법 |
|---|------|------|
| M1 | `.env`에 환경변수 5개 추가 | 텍스트 편집기 직접 편집 (executor 수정 금지) |
| M2 | `proxy_cache/` → `.gitignore` 추가 | `.gitignore` 파일 열어 `proxy_cache/` 한 줄 추가 |

---

## 5. 검증 시나리오 (15개)

### SSRF 방어 (S1~S11)

```bash
BASE="http://localhost:8000/api/proxy/image"

# S1: localhost 직접 접근
curl -o /dev/null -w "%{http_code}" "$BASE?url=http://127.0.0.1/secret"
# 기대: 403

# S2: 10.x 대역 사설 IP
curl -o /dev/null -w "%{http_code}" "$BASE?url=http://10.0.0.1/img.jpg"
# 기대: 403

# S3: 192.168 대역 사설 IP
curl -o /dev/null -w "%{http_code}" "$BASE?url=http://192.168.1.1/img.jpg"
# 기대: 403

# S4: 비허용 도메인 (google.com)
curl -o /dev/null -w "%{http_code}" "$BASE?url=https://www.google.com/logo.png"
# 기대: 403

# S5: suffix 우회 시도 (naver.net.evil.com)
curl -o /dev/null -w "%{http_code}" "$BASE?url=https://naver.net.evil.com/img.jpg"
# 기대: 403

# S6: 이중 URL 인코딩 우회 (%2527 등)
curl -o /dev/null -w "%{http_code}" "$BASE?url=http%3A%2F%2F127.0.0.1%2Fsecret"
# 기대: 403 (decode 1회 후 scheme 검증, private IP 차단)

# S7: file:// scheme
curl -o /dev/null -w "%{http_code}" "$BASE?url=file:///etc/passwd"
# 기대: 422

# S8: ftp:// scheme
curl -o /dev/null -w "%{http_code}" "$BASE?url=ftp://imgnews.naver.net/img.jpg"
# 기대: 422

# S9: link-local IP (169.254.x.x — AWS metadata 공격 패턴)
curl -o /dev/null -w "%{http_code}" "$BASE?url=http://169.254.169.254/latest/meta-data/"
# 기대: 403

# S10: url 파라미터 누락
curl -o /dev/null -w "%{http_code}" "$BASE"
# 기대: 422 (FastAPI Query validation)

# S11: Content-Type 헤더 위조 차단 (SPEC §6.5 — 헤더-매직 불일치)
# 수동 검증: mock 서버에서 Content-Type: image/jpeg 반환하나 실제 body는 PNG인 경우
# image_proxy_service.py 단위 테스트로 대체 가능
# 기대: 415 "Content-Type 헤더와 실제 이미지 형식 불일치"
```

### 정상 경로 (N1~N4)

```bash
# N1: 네이버 이미지 정상 프록시
# 먼저 /api/image-search/search?query=한서주 로 실제 이미지 URL 획득 후:
NAVER_IMG="<검색 결과에서 획득한 imgnews.naver.net URL>"
curl -I "$BASE?url=$NAVER_IMG"
# 기대: 200, Content-Type: image/jpeg (또는 png)

# N2: 캐시 히트 확인 (같은 URL 2회 — 2번째가 명확히 빠름, TTL 내 유효)
time curl -s -o /dev/null "$BASE?url=$NAVER_IMG"
time curl -s -o /dev/null "$BASE?url=$NAVER_IMG"
# 기대: 2번째 응답 << 1번째 (로컬 디스크 캐시 히트)

# N3: 응답 헤더 sanitize — Set-Cookie 전달 안 됨
curl -I "$BASE?url=$NAVER_IMG" | grep -i "set-cookie"
# 기대: 출력 없음 (0줄)

# N4: 서버 기동 후 기본 헬스 체크 (의존 서비스 포함)
curl -s http://localhost:8000/api/health | python -c "import sys,json; print(json.load(sys.stdin)['status'])"
# 기대: healthy
```

---

## 6. reviewer TRUST 5 체크리스트

| # | 항목 | 확인 방법 | 통과 기준 |
|---|------|----------|---------|
| T1 | 타입 힌트 완전성 | 함수 시그니처 전체 리뷰 | 모든 파라미터·반환값에 타입 명시 (`str`, `list[str]`, `tuple[bytes, str]` 등) |
| T2 | 에러 처리 경로 완결성 | 분기 코드 추적 | 403/413/415/422/502/503/504 모두 HTTPException으로 래핑, bare except 없음 |
| T3 | 비밀값 하드코딩 없음 | `grep -r "password\|secret\|key\s*=" proxy.py image_proxy_service.py security.py` | 결과 0건 (모든 설정값은 `settings.*` 경유, 매직 넘버 3600 제거됨) |
| T4 | 300줄 초과 없음 | `wc -l` 각 파일 | proxy.py ≤42, image_proxy_service.py ≤105, security.py 확장 후 전체 ≤130 |
| T5 | 시나리오 커버리지 | S1~S11·N1~N4가 코드 분기에 1:1 매핑 | scheme(S7·S8) / suffix(S4·S5) / private IP(S1~S3·S9) / 이중인코딩(S6) / 파라미터(S10) / 헤더-매직 불일치(S11) / 정상(N1~N4) |

---

## 7. security-auditor OWASP A10 (SSRF) 체크리스트

| # | 항목 | 구현 위치 | 합격 기준 |
|---|------|----------|---------|
| A1 | 입력값 화이트리스트 검증 | `validate_proxy_host()` — F1 | suffix-only 매칭. `naver.net.evil.com` → False 확인 |
| A2 | DNS rebinding 방지 | `socket.getaddrinfo()` + `_is_private_ip()` — F1 | 매 요청 DNS 재조회. TTL 캐시 없음 |
| A3 | URL scheme 제한 | `parsed.scheme not in ("http","https")` — F3 | `file://`, `ftp://`, `gopher://` → 422 반환 |
| A4 | 리다이렉트 차단 | `follow_redirects=False` — F3 | 301~308 응답 시 502 반환. 리다이렉트 호스트 재검증 없음 |
| A5 | 응답 헤더 sanitize | `Response(headers={...})` — F4 | `Set-Cookie`, `Content-Disposition` 전달 안 됨. 허용 헤더만 명시적 화이트리스트 |
| A6 | 이중 인코딩 우회 차단 | `unquote(url)` 1회 — F3 | decode 후 원본 비교. 2회 반복 decode 없음 |

---

## 8. Lore commit 뼈대

```
feat(search,proxy,security): add /api/proxy/image endpoint with SSRF defense

J-8a: 외부 이미지 프록시 백엔드 구현

- backend/app/routers/proxy.py          신규 — GET /api/proxy/image
- backend/app/services/image_proxy_service.py  신규 — SHA256 디스크 캐시(2-level fanout) + 매직 바이트 검증
- backend/app/utils/security.py         확장 — validate_proxy_host() + _is_private_ip()
- backend/app/config.py                 변경 — IMAGE_PROXY_* 환경변수 5개
- backend/app/main.py                   변경 — proxy 라우터 등록 1줄

SSRF 방어 6항목:
  1. 도메인 화이트리스트 (suffix-only, 초기 9개 도메인)
  2. DNS resolve + private IP CIDR 차단 (RFC1918 + link-local + ::1 + fc00::/7)
  3. 응답 크기 제한 10MB (IMAGE_PROXY_MAX_SIZE)
  4. 요청 Timeout 5초 (IMAGE_PROXY_TIMEOUT)
  5. Content-Type + 매직 바이트 이중 검증 + 헤더-매직 불일치 차단 (SPEC §6.5)
  6. 디스크 캐시 TTL 7일 / 2-level fanout (SPEC §3.2, §6.6.2)

추가: scheme 제한 (http/https only), 리다이렉트 차단, 응답 헤더 sanitize
신규 pip 패키지 없음 — httpx·Pillow·stdlib만 사용

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 9. 범위 외 항목

| 항목 | 처리 Phase |
|------|-----------|
| `<img src>` → `proxify()` 적용 (3 컴포넌트) | J-8b |
| ImageSearchPage UX 패리티 (NewsSearchPage 패턴 복제) | J-8c |
| DashboardPage.tsx:278 dark: 1줄 보정 | J-8d |
| 통합 KPI 정책 구현 | J-8e (결정 보류, Option B 권고) |
| `.env` 환경변수 5개 추가 | **Jin 수동 (M1)** |
| `proxy_cache/` → `.gitignore` | **Jin 수동 (M2)** |

---

> **다음 단계**: Jin 검토 후 executor 호출 → F1→F2→F3→F4→F5 순 구현 → 검증 15개 (S1~S11, N1~N4) → reviewer TRUST 5 → security-auditor OWASP A10 → Lore commit
