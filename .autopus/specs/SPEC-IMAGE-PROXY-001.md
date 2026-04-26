# SPEC-IMAGE-PROXY-001 — 외부 이미지 프록시 + ImageSearch UX 패리티

> **Status**: draft
> **작성일**: 2026-04-26
> **작성자**: architect (Opus 4.6)
> **이전 문서**: `handover/J-8_architect_contract_v1.md`, `handover/인수인계_문서_20260426_v20.md`
> **상위 SPEC**: SPEC-SEARCH-001 (J-1~J-5, 비공식 — 코드만 존재)
> **Phase**: J-8 (옵션 B 후 두 번째 fix)
> **WORKFLOW_v3 난이도**: 🔴 Complex (신규 SPEC + SSRF 보안 + 정책 결정)

> **🎯 이번 SPEC 적합 모델**: Opus 4.6 (설계) → Sonnet 4.6 (구현). 사유: SSRF 6항목 구체 설계 + 캐싱 전략 결정 + KPI 정책 권고는 Opus 영역. 구현은 단일 라우터 + 단일 utils 확장으로 Sonnet 충분.

---

## 1. 개요

### 1.1 4대 통합 처리 범위

| # | 영역 | 범위 | Phase |
|---|------|------|-------|
| ① | 외부 이미지 프록시 (Backend) | 신규 라우터 `/api/proxy/image` + SSRF 방어 6항목 + 디스크 캐시 | J-8a |
| ② | `<img src>` 프록시 경유 (Frontend) | `ImageResultCard.tsx` / `ImagePreviewModal.tsx` / `ModelImageGallery.tsx` 3개 컴포넌트 | J-8b |
| ③ | ImageSearchPage UX 패리티 | NewsSearchPage 자동 매칭 패턴 단방향 복제 | J-8c |
| ④ | PlaceholderPage 다크 짝 1줄 | `DashboardPage.tsx:278` 보정 | J-8d |

### 1.2 의존관계 그래프

```
[J-8a Backend Proxy] ──┐
   ↓ (URL 형식 합의)   │
[J-8b Frontend img]   │  (병렬 가능, 단 J-8a 완료 후 J-8b 시각 검증)
                       │
[J-8c UX 패리티] ──────┴── (병렬, J-8a/b와 무관 — NewsSearchPage 패턴 단방향 복제)
                          
[J-8d PlaceholderPage] ── (독립, 1줄 변경만)

[J-8e KPI 정책 권고안 별도 문서] ── (구현 0건, J-7 통합 검토)
```

### 1.3 v20 확정 사실 인용 (재정찰 금지)

- **HEAD**: `99253666` working tree clean
- **DashboardHome 위치**: `frontend/src/pages/DashboardPage.tsx:96` 내부 함수 (별도 파일 아님)
- **PlaceholderPage 위치**: `DashboardPage.tsx:278` (`bg-white` 다크 짝 부재 1줄)
- **`/api/stats/dashboard`**: 4 KPI 필드(`model_count`, `casting_count`, `news_count`, `share_count`) 정상 응답
- **외부 검색 활성도**: Naver Search API 활성 (NAVER_CLIENT_ID/SECRET) / Google Custom Search 미설정
- **외부 핫링크 차단 도메인 (실측)**: `imgnews.naver.net`, `i1.ruliweb.com` 외 검색 결과 다수

---

## 2. 사용자 흐름 (Numbered Flow)

### 2.1 이미지 검색 → 프록시 표시 → 자동 매칭 → 저장

```
[Step 1] 사용자 ImageSearchPage 진입 + 검색어 입력 ("김민지 화보")
[Step 2] frontend → GET /api/image-search/search?query=김민지+화보&provider=naver
[Step 3] backend (Naver API) → SearchImage[] 응답 (originalUrl: imgnews.naver.net/...)
[Step 4] frontend → 결과 카드 8개 렌더 (originalUrl을 직접 <img src>가 아닌 프록시 URL로 변환)
         · src = `/api/proxy/image?url=${encodeURIComponent(originalUrl)}`
[Step 5] 브라우저 → GET /api/proxy/image?url=... (각 카드별 8회)
[Step 6] backend proxy:
   6.1 URL 디코딩 1회 → 호스트 파싱
   6.2 화이트리스트 체크 (suffix-only 매칭)
   6.3 DNS resolve → Private IP 검증
   6.4 디스크 캐시 hit 검사 (SHA256(url).bin)
   6.5 cache miss → httpx GET (timeout=5s, follow_redirects=False, max_size=10MB 스트리밍)
   6.6 응답 Content-Type 화이트리스트 검증 + Pillow 매직 바이트 검증
   6.7 디스크 캐시 저장 (mtime 기반 TTL 7일)
   6.8 응답 헤더 sanitize (Set-Cookie/Content-Disposition 제거) + Cache-Control: public, max-age=604800
[Step 7] frontend → 이미지 정상 표시
[Step 8] 사용자 카드 선택 + 저장 버튼 클릭
[Step 9] frontend: 검색어("김민지 화보")에서 모델명 자동 추출
   9.1 modelsAPI.search("김민지") → 시드 모델 적중 → model_id=1
   9.2 적중 실패 시 → 모달 표시 → Jin이 "한서주" 입력 → modelsAPI.create({name:"한서주", model_type:"new_model"}) → 신규 model_id
[Step 10] frontend → POST /api/image-search/save (model_id, images[])
[Step 11] backend → SSRF 방어 + 매직 바이트 검증 (기존 J-3 로직) → DB 저장 + 디스크 저장
[Step 12] frontend → ModelImageGallery 갱신 (이미지도 프록시 경유로 표시)
```

---

## 3. 백엔드 설계

### 3.1 파일 구조

| 파일 | 종류 | 역할 |
|------|------|------|
| `backend/app/routers/proxy.py` | 🆕 신규 | `/api/proxy/image` 라우터 1개 (단일 endpoint, 향후 다른 프록시 종류 추가 시 본 파일에 추가) |
| `backend/app/utils/security.py` | 🔧 확장 | 기존 `validate_image_url`(J-3) + `_PRIVATE_NETWORKS` 재사용. 신규 `validate_proxy_host(hostname, allowed_suffixes)` 추가 |
| `backend/app/services/image_proxy_service.py` | 🆕 신규 | 캐시 키 계산 + 디스크 캐시 hit/miss + 외부 fetch + 매직 바이트 검증. 라우터에서 호출 |
| `backend/app/main.py` | 🔧 변경 (1줄) | `app.include_router(proxy.router, prefix="/api/proxy", tags=["proxy"])` 등록 |
| `backend/app/config.py` | 🔧 변경 (5줄) | 환경변수 5개 추가 (아래 §3.2) |

### 3.2 환경변수 5개 (필수)

| 키 | 기본값 | 용도 |
|---|---|---|
| `IMAGE_PROXY_ALLOWED_DOMAINS` | `imgnews.naver.net,*.naver.net,i1.ruliweb.com,*.ruliweb.com,*.googleusercontent.com,*.bing.net,*.unsplash.com` | 콤마 구분, suffix-only glob (`*` prefix만 허용) |
| `IMAGE_PROXY_MAX_SIZE` | `10485760` (10MB) | 응답 본문 최대 크기 (bytes). 초과 시 스트리밍 중 abort |
| `IMAGE_PROXY_TIMEOUT` | `5` | httpx connect+read 합산 timeout (seconds) |
| `IMAGE_PROXY_CACHE_DIR` | `./cache/image_proxy` | 디스크 캐시 저장 디렉토리. 시작 시 자동 생성 |
| `IMAGE_PROXY_CACHE_TTL` | `604800` (7일) | mtime 기반 TTL (seconds) |

### 3.3 의존성

- **신규 패키지 추가 0건**. 기존 `httpx`(설치됨, J-1~J-5에서 사용) + `Pillow`(설치됨, `utils/security.py`에서 사용) + `hashlib`(표준) + `aiofiles`(설치됨, J-3에서 사용)만 사용.

---

## 4. API 명세

### 4.1 `GET /api/proxy/image`

| 항목 | 값 |
|---|---|
| 인증 | **불필요** (R4 unauthenticated, J-3 `/save` 로직과 별개. 사유: 브라우저 `<img src>`에서 직접 호출되므로 Bearer 헤더 주입 불가능) |
| 권한 | 화이트리스트 도메인 + Private IP 차단으로 대신 보호 |
| 쿼리 파라미터 | `url` (str, required, max_length=2048) |
| 응답 (성공) | HTTP 200 + `Content-Type: image/<jpeg|png|webp|gif>` + `Cache-Control: public, max-age=604800` + body는 이미지 바이트 |
| 응답 (실패) | 아래 §4.2 표 |

### 4.2 에러 코드 정책 (v18 graceful 503 패턴 준수)

| 상황 | HTTP | detail (한국어) |
|------|------|------|
| `url` 누락 또는 길이 초과 | 422 | (FastAPI 자동) |
| 화이트리스트 불일치 | 403 | `"허용되지 않은 외부 도메인입니다"` |
| Private IP / loopback / link-local | 403 | `"내부 네트워크 주소는 차단되었습니다"` |
| DNS resolve 실패 | 502 | `"외부 호스트를 찾을 수 없습니다"` |
| 외부 응답 4xx | 404 | `"원본 이미지를 찾을 수 없습니다 (HTTP {status})"` |
| 외부 응답 5xx | 503 | `"외부 이미지 서버 일시 장애 (HTTP {status})"` |
| Timeout / connection error | 503 | `"외부 이미지 서버 연결 실패"` |
| 응답 크기 초과 | 413 | `"이미지 크기가 한도(10MB)를 초과했습니다"` |
| Content-Type 위반 | 415 | `"지원하지 않는 이미지 형식입니다"` |
| 매직 바이트 검증 실패 | 415 | `"이미지 파일이 손상되었거나 위조되었습니다"` |
| 리다이렉트 감지 | 502 | `"리다이렉트는 허용되지 않습니다"` |

---

## 5. 프론트엔드 설계

### 5.1 `<img src>` 프록시 경유 변경 (3 컴포넌트)

| 파일 | 변경 위치 | 변경 내용 |
|------|-----------|----------|
| `frontend/src/components/search/ImageResultCard.tsx` | `<img src={...}>` | `src={\`/api/proxy/image?url=${encodeURIComponent(image.originalUrl)}\`}` |
| `frontend/src/components/search/ImagePreviewModal.tsx` | 26줄 `<img src={image.originalUrl}>` | 동일 패턴 적용 |
| `frontend/src/components/model-detail/ModelImageGallery.tsx` | 모든 외부 URL `<img>` | 단, 이미 로컬 저장된 이미지(`local_path`)는 프록시 우회 |

**유틸 헬퍼 추가 권장** (`frontend/src/utils/imageProxy.ts` 신규, 5~8줄):
```typescript
export const proxify = (url: string): string =>
  url.startsWith('/') ? url : `/api/proxy/image?url=${encodeURIComponent(url)}`;
```
3 컴포넌트에서 동일 헬퍼 import → 일관성 보장. **Lightbox 패턴(ImagePreviewModal `bg-black/90`+`text-white`)은 그대로 유지** (Fix 3-5 폐기 결정 불변).

### 5.2 ImageSearchPage UX 패리티 (전면 리팩터링)

`frontend/src/pages/ImageSearchPage.tsx` — `NewsSearchPage.tsx` 패턴 **단방향 복제** (NewsSearchPage 수정 금지).

복제 항목:
1. 모델 선택 드롭다운 제거 (state + UI)
2. 검색어에서 모델명 자동 추출 함수 (`extractModelName(query, models)`)
3. 미매칭 시 모달 표시 (`ModelNameInputModal` — NewsSearchPage 동일 컴포넌트 재사용 또는 동일 디자인 신규)
4. 모달 입력값으로 `modelsAPI.create({name, model_type:'new_model'})` 호출
5. 신규/기존 model_id로 `imageSearchAPI.save(model_id, images)` 진행
6. 다크모드 클래스 동작 유지 (NewsSearchPage 기존 dark: 패턴 그대로 복제)

### 5.3 PlaceholderPage 다크 짝 보정 (1줄)

| 위치 | 현재 | 변경 후 |
|------|------|---------|
| `DashboardPage.tsx:278` | `<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">` | `<div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">` |

---

## 6. 보안 설계 (SSRF 6항목 구체 구현)

### 6.1 허용 도메인 화이트리스트 (suffix-only glob)

```python
# config.py
IMAGE_PROXY_ALLOWED_DOMAINS: list[str] = []  # .env에서 콤마 구분 파싱

# utils/security.py 신규 함수
def validate_proxy_host(hostname: str, allowed_patterns: list[str]) -> bool:
    """허용 패턴 매칭. `*.naver.net` 같은 prefix-wildcard만 지원 (suffix-only)."""
    hostname = hostname.lower().strip()
    for pat in allowed_patterns:
        pat = pat.lower().strip()
        if pat.startswith("*."):
            if hostname.endswith(pat[1:]):  # ".naver.net" suffix
                return True
        elif hostname == pat:
            return True
    return False
```

**초기 화이트리스트** (실측 도메인 + 일반 검색 후보):
```
imgnews.naver.net, *.naver.net, i1.ruliweb.com, *.ruliweb.com,
*.googleusercontent.com, *.bing.net, *.unsplash.com
```

**금지**: 정규식 매칭, 임의 glob (`?`/`[]`), URL path 매칭 — 모두 우회 위험. **suffix-only**만 허용.

### 6.2 Private IP 대역 차단 (DNS resolve 후 검증)

기존 `utils/security.py` 의 `_PRIVATE_NETWORKS`(7개 대역 + loopback + link-local) **재사용**. 신규 함수에서 호출.

```python
import ipaddress, socket

def validate_proxy_url(url: str, allowed_patterns: list[str]) -> tuple[bool, str]:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False, "허용되지 않은 프로토콜"
    host = parsed.hostname or ""
    if not host or host in ("localhost", "0.0.0.0"):
        return False, "내부 네트워크 주소는 차단되었습니다"
    if not validate_proxy_host(host, allowed_patterns):
        return False, "허용되지 않은 외부 도메인입니다"
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False, "외부 호스트를 찾을 수 없습니다"
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_unspecified:
            return False, "내부 네트워크 주소는 차단되었습니다"
        for net in _PRIVATE_NETWORKS:
            if ip in net:
                return False, "내부 네트워크 주소는 차단되었습니다"
    return True, ""
```

**DNS rebinding 방어**: getaddrinfo 결과의 IP를 그대로 httpx에 주입(`url=...`, `headers={"Host": original_host}`)하면 완벽하지만, 구현 복잡도 증가. **Phase J-8a 1차 구현은 이중 resolve 허용**(getaddrinfo 1회 + httpx 내부 1회), DNS rebinding은 잔여 위험으로 명시 후 J-8a-2(후속) 또는 별도 fix.

### 6.3 응답 크기 제한 (스트리밍 abort)

```python
async with httpx.AsyncClient(timeout=settings.IMAGE_PROXY_TIMEOUT, follow_redirects=False) as client:
    async with client.stream("GET", url) as resp:
        resp.raise_for_status()
        chunks = []
        total = 0
        async for chunk in resp.aiter_bytes(chunk_size=65536):
            total += len(chunk)
            if total > settings.IMAGE_PROXY_MAX_SIZE:
                raise HTTPException(413, "이미지 크기가 한도(10MB)를 초과했습니다")
            chunks.append(chunk)
        body = b"".join(chunks)
```

**Content-Length 사전 검사 추가**: 응답 헤더 `Content-Length`가 max_size 초과면 즉시 413, body 다운로드 회피.

### 6.4 Timeout (httpx.Timeout 분리)

```python
timeout = httpx.Timeout(
    connect=2.0,           # connect 단계 2초
    read=settings.IMAGE_PROXY_TIMEOUT,   # read 5초
    write=2.0,
    pool=2.0,
)
```

전체 합산 ≤10초로 무한 hang 방지.

### 6.5 Content-Type + 매직 바이트 이중 검증

```python
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

content_type = resp.headers.get("content-type", "").split(";")[0].strip().lower()
if content_type not in ALLOWED_CONTENT_TYPES:
    raise HTTPException(415, "지원하지 않는 이미지 형식입니다")

# 매직 바이트 — 기존 utils/security.py validate_magic_bytes 재사용
if not validate_magic_bytes(body):
    raise HTTPException(415, "이미지 파일이 손상되었거나 위조되었습니다")
```

**이중 검증 사유**: Content-Type 헤더는 외부 서버 임의 — 위조 가능. Pillow 매직 바이트가 최종 방어선.

### 6.6 캐싱 전략 — 디스크 캐시 (architect 결정)

#### 6.6.1 결정 + 사유

| 옵션 | 장점 | 단점 | 결정 |
|------|------|------|------|
| **디스크** | 영구 보존, Electron 재시작 후에도 hit, Jin 단일 PC 환경 적합 | I/O 비용, 디렉토리 관리 | ✅ **채택** |
| 메모리 (LRU) | 빠름 | 재시작 시 전부 손실, Electron 백엔드 자주 재시작 | ❌ |
| 외부 CDN 헤더 위임 | 백엔드 0 부하 | 외부 핫링크 차단(원래 문제)이 다시 발생 | ❌ (본 SPEC 의도와 충돌) |

**Jin 환경 근거**: 비개발자 1인 + 데스크톱 앱 + SQLite + 단일 PC. 디스크 캐시는 SQLite와 동일 패턴(파일시스템 영구 저장). 운영 복잡도 최소.

#### 6.6.2 구현 (image_proxy_service.py)

```python
import hashlib
from pathlib import Path
from datetime import datetime, timedelta

CACHE_DIR = Path(settings.IMAGE_PROXY_CACHE_DIR)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

def _cache_path(url: str) -> Path:
    h = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{h[:2]}" / f"{h[2:]}.bin"   # 2-level fanout

def _is_fresh(path: Path, ttl: int) -> bool:
    if not path.exists():
        return False
    age = (datetime.now().timestamp() - path.stat().st_mtime)
    return age < ttl
```

**TTL 만료 정책**:
- mtime + TTL 7일 초과 → cache miss로 처리 (재fetch)
- 만료 파일은 다음 fetch 시 덮어쓰기. 별도 cleanup 작업 불필요 (디스크 무한 증가 우려는 J-8a-2 또는 weekly 작업으로 후속).

**파일명**: SHA256 hex의 first 2 char를 디렉토리, 나머지를 파일명. 단일 디렉토리에 100,000+ 파일 누적 회피.

#### 6.6.3 클라이언트 캐싱

응답 헤더에 `Cache-Control: public, max-age=604800` 추가. 브라우저도 7일간 caching → 백엔드 부담 추가 절감.

### 6.7 추가 보안 메모

- **URL 디코딩**: `urllib.parse.unquote(url, errors='strict')` 1회만. 이중 인코딩 우회 차단
- **리다이렉트 비활성화**: `follow_redirects=False`. 3xx 응답 시 502 반환 (잠재 SSRF 우회 차단)
- **응답 헤더 sanitize**: `Set-Cookie`, `Set-Cookie2`, `Content-Disposition`, `Strict-Transport-Security` 등 제거. 새 응답 헤더는 `Content-Type`, `Content-Length`, `Cache-Control`, `Etag`(있으면) 만 통과
- **HTTP method 제한**: GET만 허용. HEAD/POST/PUT/DELETE는 405

---

## 7. 캐싱 전략 (요약)

§6.6에서 상세 결정. **디스크 캐시 + 클라이언트 Cache-Control 헤더 fallthrough** 조합.

- 1차 (브라우저): `Cache-Control: public, max-age=604800` → 같은 세션 내 재요청 0회
- 2차 (백엔드 디스크): SHA256 해시 파일명, 2-level 디렉토리 fanout, mtime 기반 TTL 7일
- 3차 (외부 fetch): cache miss 시 httpx 다운로드 + 검증 + 캐시 저장
- 무효화: 수동 `rm -rf $IMAGE_PROXY_CACHE_DIR` (Jin 작업), 또는 향후 J-8a-2에서 cleanup 스크립트

---

## 8. 통합 KPI 권고안

### 8.1 옵션 비교

| 항목 | 옵션 A: `/api/stats/dashboard` 일원화 | 옵션 B: 도메인별 분산 호출 (현 상태) |
|------|------|------|
| 호출 횟수 | 1회 | 3회 (`models.stats`, `castings.stats`, `settlements.stats`) |
| 호출 비용 (Jin 환경) | 미미 (로컬 SQLite) | 미미 (3회 × ~5ms) |
| 백엔드 캐싱 | 통합 캐싱 가능 | 도메인별 독립 캐싱 |
| 도메인 책임 분리 | 약화 (stats 라우터가 모든 도메인 알아야 함) | 강화 (각 도메인이 자신의 통계 책임) |
| J-7 라이브러리 KPI 추가 | stats 라우터만 수정 | 신규 도메인 라우터에 stats() 추가 + DashboardPage import 추가 |
| 캐시 무효화 정합성 | 통합 endpoint 1개에 영향 | 각 도메인 변경 시 자동 재호출 |
| 코드 변경 비용 | DashboardPage.tsx 3 호출 → 1 호출 통합 (~30줄 변경) | 0 |

### 8.2 권고안: **옵션 B 유지** (현 분산 호출 그대로)

#### 사유
1. **본 J-8 범위와 무관한 정책 결정이므로 별도 fix로 분리**: 통합 KPI 일원화는 이미지 검색 UX + 외부 프록시(본 SPEC 4대 범위)와 직접 의존성이 없음. 본 SPEC에 포함하면 reviewer 검증 항목과 시각 검증이 늘어남. 백엔드 도메인 책임 분리는 옵션 A/B 모두 동일(stats 라우터가 도메인 함수 호출 조합) — A/B의 실 차이는 프론트 호출 횟수뿐
2. **`/api/stats/dashboard`는 현재 미사용 endpoint — 결정 보류**: 옵션 A 채택 시 즉시 활용 가능하나 본 시점에 결정 보류. dead code 잠재 위험은 J-7 진입 시 재평가(제거 또는 옵션 A 전환)
3. **변경 비용 0**: 옵션 B는 추가 작업 없음. 현 코드(DashboardPage.tsx 106/118/134줄 도메인별 호출)가 그대로 정합

#### J-7 진입 시 재검토 트리거
- 라이브러리 관리 뷰의 KPI가 5개 이상 추가되어 분산 호출이 7회를 초과할 때
- DashboardHome 초기 로딩이 1초 이상 지연되는 회귀 발생 시
- `/api/stats/dashboard` endpoint dead code 여부 검토 — 옵션 A 채택 또는 endpoint 제거 결정

#### 구현 사항: **0건** (Worker Contract 금지 §4 준수 — 권고안 텍스트만, 코드 변경 없음)

---

## 9. 구현 Phase 분할

architect 재분할: **5단계 → 5단계 유지** (Worker Contract 명시 J-8a~J-8e 그대로 + 의존관계 명시).

| Phase | 범위 | 의존 | 적합 모델 | 예상 변경 파일 수 | 우선순위 |
|-------|------|------|-----------|-------------------|----------|
| **J-8a** | 백엔드 프록시 신규 (`routers/proxy.py` + `services/image_proxy_service.py` + `utils/security.py` 확장 + `config.py` 5 env + `main.py` 1줄 등록) | 없음 | Sonnet 4.6 (정형 패턴) | 5 | 🔴 High (J-8b 차단) |
| **J-8b** | 프론트 `<img src>` 프록시 경유 (`utils/imageProxy.ts` 신규 + `ImageResultCard` + `ImagePreviewModal` + `ModelImageGallery` 3 컴포넌트) | J-8a 완료 (URL 형식 합의 후 가능) | Sonnet 4.6 | 4 | 🔴 High |
| **J-8c** | ImageSearchPage UX 패리티 (NewsSearchPage 패턴 단방향 복제) | 없음 (병렬 가능) | Sonnet 4.6 | 1 | 🟡 Medium |
| **J-8d** | PlaceholderPage 다크 짝 1줄 | 없음 | Sonnet 4.6 (Simple) | 1 | 🟢 Low |
| **J-8e** | 통합 KPI 권고안 별도 문서화 (본 SPEC §8 인용) | 없음 | (문서만, 모델 무관) | 0 (코드 변경 없음) | 🟢 Low (J-7 진입 시 재검토) |

### 9.1 권장 진행 순서

1. **세션 1 (Opus → Sonnet)**: 본 SPEC review + planner → J-8a executor → reviewer + security-auditor (OWASP A10)
2. **세션 2 (Sonnet)**: J-8b executor (J-8a 완료 후) + J-8c 병렬 → reviewer
3. **세션 3 (Sonnet)**: J-8d 1줄 + 통합 commit + push
4. **J-8e**: J-7 진입 직전 또는 별도 회의 메모

### 9.2 commit 전략

| commit | 묶음 | 이유 |
|--------|------|------|
| Lore 1 | J-8a (backend proxy) | 보안 영역, security-auditor 검증 후 단독 push |
| Lore 2 | J-8b + J-8c | 둘 다 frontend, scope `search,ux` |
| Lore 3 | J-8d (1줄) | scope `dashboard,dark-mode` 단독 또는 다음 fix와 묶음 |

---

## 10. 테스트 항목

### 10.1 SSRF 우회 시도 시나리오 (5건+)

| # | 공격 시나리오 | 입력 | 예상 응답 |
|---|---------------|------|-----------|
| S1 | localhost 우회 | `?url=http://127.0.0.1/` | 403 "내부 네트워크" |
| S2 | Private IP 직접 | `?url=http://10.0.0.1/admin` | 403 "내부 네트워크" |
| S3 | 메타데이터 서비스 | `?url=http://169.254.169.254/latest/meta-data/` | 403 "내부 네트워크" |
| S4 | 화이트리스트 우회 (subdomain trick) | `?url=http://imgnews.naver.net.evil.com/x` | 403 "허용되지 않은 외부 도메인" (suffix 매칭 정확성 — `.naver.net` 끝나는 게 아님) |
| S5 | 이중 인코딩 | `?url=http%253A%252F%252F127.0.0.1` | 422 또는 403 (단일 디코딩만 적용) |
| S6 | 리다이렉트 SSRF | 화이트리스트 도메인이 `Location: http://127.0.0.1` 반환 | 502 "리다이렉트 허용 안 됨" |
| S7 | Content-Type 위조 | 외부 서버가 `text/html` 응답 | 415 "지원하지 않는 형식" |
| S8 | 매직 바이트 위조 | 외부 서버가 `Content-Type: image/jpeg` + HTML 본문 | 415 "이미지 손상 또는 위조" |
| S9 | 크기 초과 | `?url=...` 응답 11MB | 413 "한도 초과" |
| S10 | Timeout | 외부 서버 5초 응답 안 함 | 503 "연결 실패" |

### 10.2 정상 경로 시나리오 (3건+)

| # | 시나리오 | 검증 |
|---|----------|------|
| N1 | 화이트리스트 도메인 첫 호출 | 200 + image bytes + cache miss → 디스크 저장 확인 |
| N2 | 동일 URL 재호출 (cache hit) | 200 + image bytes + cache hit (디스크 read만, 외부 fetch 0회) |
| N3 | TTL 만료 후 재호출 | 200 + 외부 fetch + 디스크 덮어쓰기 |
| N4 | 브라우저 Cache-Control 적중 | 동일 페이지 reload 시 백엔드 호출 0회 (네트워크 탭 from disk cache 또는 304) |

### 10.3 프론트엔드 시각 회귀 항목 (자동 + 시각)

| 자동 (코드 정적) | 시각 (Jin) |
|------------------|------------|
| ImageSearchPage tsc 통과 | 이미지 검색 결과 8 카드 정상 표시 (placeholder 회색 0건) |
| `proxify()` 헬퍼 import 3 컴포넌트 | ImagePreviewModal 클릭 → 원본 이미지 정상 표시 |
| NewsSearchPage 미수정 (`git diff` 0줄) | 자동 매칭 모달 동작 (NewsSearchPage와 UX 동등) |
| PlaceholderPage 1줄 변경 (`git diff` 정확히 1) | 다크모드 토글 시 PlaceholderPage 배경/테두리 자연스러움 |

### 10.4 Definition of Done 통과 기준

- 자동 검증: 10/10 PASS (S1~S10 각 1회 + N1~N4 + 정적 4)
- 시각 검증: Jin 4건 PASS
- security-auditor (OWASP A10 SSRF) 별도 검증 PASS
- reviewer TRUST 5 PASS

---

## 11. 위험 / 잔여 가정

1. **DNS rebinding**: §6.2에서 명시. J-8a 1차 구현은 이중 resolve 허용. 후속 J-8a-2에서 IP 직접 주입 방식으로 강화 검토
2. **캐시 디스크 무한 증가**: TTL 만료 파일이 자동 삭제되지 않음. weekly cleanup 스크립트(별도 fix) 또는 Phase I-2(백업·복원) 통합
3. **화이트리스트 외 도메인 검색**: Naver/Google이 새 CDN 도메인을 사용하면 사용자에게 placeholder 표시. 운영 중 발견 시 환경변수 추가 (서버 재시작 필요)
4. **httpx asyncclient 동시 요청 폭주**: 한 페이지에 8 카드 → 8 동시 요청. asyncio.Semaphore로 동시 fetch 4개 제한 권장 (J-8a 구현 시)
5. **Naver `Referer` 정책 변동**: 본 프록시는 Referer 헤더를 외부 요청에 포함하지 않음 (httpx 기본). 특정 CDN이 Referer 강제 시 차단 가능 — 발견 시 환경변수 `IMAGE_PROXY_REFERER` 후속 추가

---

## 12. v20 인용 + Worker Contract 준수 체크리스트

| 항목 | 위치 | 확인 |
|------|------|------|
| 절(節) 1~10 모두 존재 | §1~§10 | ✅ |
| SSRF 6항목 구체 구현 | §6.1~§6.6 | ✅ |
| 환경변수 5개 명시 | §3.2 | ✅ |
| 통합 KPI 권고안 1건 | §8.2 (옵션 B) | ✅ |
| Phase 5단계 (J-8a~J-8e) | §9 | ✅ |
| NewsSearchPage 수정 금지 | §5.2 + §10.3 | ✅ |
| `imageSearchAPI` 시그니처 변경 금지 | §3 (신규 라우터만, 기존 호출 변경 0) | ✅ |
| 신규 백엔드 의존성 0건 | §3.3 | ✅ |
| 통합 KPI 구현 코드 0건 | §8.2 마지막 줄 | ✅ |
| 재정찰 무한 반복 0 (v20 인용) | §1.3 | ✅ |
| Worker Contract 외 범위 추가 0 | (J-7/K-1/SNS-1 언급은 권고/회귀 트리거에 한정) | ✅ |

---

> **다음 단계**: 본 SPEC을 아키텍트 자동 검증 6항목(`Worker Contract` §127-139) 통과 → Jin 시각 검토 → planner 진입 (J-8a Worker Contract 작성)
> **🐙 Opus 4.6 architect 산출 — Sonnet 4.6 executor로 인계 준비 완료**
