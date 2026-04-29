# Project-M Instagram Data Pipeline — System Design Document

> **Version**: 1.0  
> **Date**: 2026-04-27  
> **Scope**: 국내·외 연예인/인플루언서 Instagram 메트릭 수집 시스템  
> **Status**: Architecture Proposal

---

## 1. Executive Summary

Project-M은 등록된 인플루언서의 Instagram 메트릭(팔로워, 팔로잉, 최근 게시물 인게이지먼트)을 **운영자 수동 트리거 기반**으로 수집·저장하는 시스템이다. 핵심 설계 원칙은 **합법성, 안정성, 확장성**이며, 자체 스크래핑 대신 **Instagram Graph API의 Business Discovery 엔드포인트**를 1차 데이터 소스로 사용한다.

### 1.1 Why Graph API, Not Scraping?

| 평가 기준 | 자체 크롤링 | **Graph API (선택)** |
|---|---|---|
| 합법성 | ToS 위반, 약관 회색지대 | ✅ 공식 채널 |
| 안정성 | Meta 패턴 변경마다 코드 패치 | ✅ 6개월 deprecation 사전 공지 |
| 비용 | IP 풀 + 안티봇 월 $200+ | ✅ 무료 |
| 데이터 품질 | 검증 어려움 | ✅ Meta 직접 제공 |
| B2B 납품 적합성 | 법적 리스크 클라이언트 전이 | ✅ 투명한 출처 |
| 커버리지 (국내 연예인) | 100% (단, 위 리스크 감수) | 95%+ (비즈니스/크리에이터 계정) |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Streamlit Dashboard (운영자 UI)                       │  │
│  │  - 프로필 등록/편집                                     │  │
│  │  - 단일/배치 동기화 트리거                              │  │
│  │  - 시계열 그래프 / 랭킹 뷰                             │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────┐
│                    Application Layer                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  FastAPI Backend                                      │  │
│  │  - /profiles      CRUD                                 │  │
│  │  - /sync/trigger  비동기 작업 큐잉                     │  │
│  │  - /metrics       조회 + 시계열                       │  │
│  │  - /jobs/{id}     진행률 추적                          │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ enqueue
┌────────────────────────────▼────────────────────────────────┐
│                    Worker Layer                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Celery Workers (Redis broker)                        │  │
│  │                                                       │  │
│  │  Tier 1: Graph API Business Discovery  ← 95%+        │  │
│  │     ↓ fail                                            │  │
│  │  Tier 2: Apify Instagram Profile Scraper  ← 5%       │  │
│  │     ↓ fail                                            │  │
│  │  Tier 3: Manual Flag (운영자 알림)                     │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ persist
┌────────────────────────────▼────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  PostgreSQL      │  │  Redis                            │ │
│  │  - profiles      │  │  - Celery queue                  │ │
│  │  - snapshots     │  │  - Cache (24h TTL)              │ │
│  │  - media_metrics │  │  - Rate limit counter           │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack

| Layer | Choice | 이유 |
|---|---|---|
| Language | **Python 3.12** | 데이터 분석 생태계, 폴백 라이브러리 풍부 |
| Web Framework | **FastAPI** | 비동기 네이티브, OpenAPI 자동 생성 |
| Task Queue | **Celery + Redis** | 검증된 패턴, 모니터링 도구 다양 |
| Database | **PostgreSQL 16** | JSONB로 raw response 저장, 시계열 쿼리 강함 |
| UI | **Streamlit** | 1주일 내 운영자 대시보드 구축 가능 |
| Hosting | **Railway / Render** | 단순 배포, PostgreSQL/Redis 통합 제공 |
| Monitoring | **Sentry + Slack webhook** | 에러 추적 + 작업 실패 알림 |

---

## 3. Data Model

### 3.1 Core Tables

```sql
-- 프로필 마스터
CREATE TABLE profiles (
    id              SERIAL PRIMARY KEY,
    ig_username     VARCHAR(100) UNIQUE NOT NULL,
    ig_user_id      VARCHAR(50),                  -- Graph API 응답 시 저장
    display_name    VARCHAR(200),
    category        VARCHAR(50),                  -- 배우/가수/모델/스포츠/외국인
    nationality     VARCHAR(2),                   -- ISO country code
    is_verified     BOOLEAN DEFAULT FALSE,
    account_type    VARCHAR(20),                  -- BUSINESS/CREATOR/PERSONAL
    registered_at   TIMESTAMP DEFAULT NOW(),
    last_synced_at  TIMESTAMP,
    sync_status     VARCHAR(20),                  -- pending/success/failed/manual
    notes           TEXT
);

CREATE INDEX idx_profiles_category ON profiles(category);
CREATE INDEX idx_profiles_last_synced ON profiles(last_synced_at);

-- 팔로워/메트릭 시계열 (트리거마다 새 row)
CREATE TABLE follower_snapshots (
    id                SERIAL PRIMARY KEY,
    profile_id        INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    snapshot_at       TIMESTAMP DEFAULT NOW(),
    followers_count   BIGINT NOT NULL,
    follows_count     BIGINT,
    media_count       INTEGER,
    source            VARCHAR(20) NOT NULL,        -- graph_api/apify/manual
    raw_response      JSONB,                        -- 전체 응답 보존 (디버깅/감사)
    sync_duration_ms  INTEGER
);

CREATE INDEX idx_snapshots_profile_time 
    ON follower_snapshots(profile_id, snapshot_at DESC);

-- 게시물별 인게이지먼트 (최근 N개)
CREATE TABLE media_metrics (
    id              SERIAL PRIMARY KEY,
    profile_id      INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    snapshot_at     TIMESTAMP DEFAULT NOW(),
    media_id        VARCHAR(50),
    media_type      VARCHAR(20),                   -- IMAGE/VIDEO/CAROUSEL_ALBUM
    posted_at       TIMESTAMP,
    like_count      INTEGER,
    comment_count   INTEGER,
    caption_excerpt TEXT,                          -- 전문 저장은 저작권 회색지대
    permalink       TEXT
);

CREATE INDEX idx_media_profile_posted 
    ON media_metrics(profile_id, posted_at DESC);

-- 작업 추적 (UI 진행률 표시용)
CREATE TABLE sync_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by    VARCHAR(100),
    triggered_at    TIMESTAMP DEFAULT NOW(),
    profile_count   INTEGER,
    completed_count INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,
    status          VARCHAR(20),                   -- queued/running/completed/failed
    completed_at    TIMESTAMP
);
```

### 3.2 Why Time-Series, Not Just Current Value?

**비즈니스 가치는 "현재 100만"이 아니라 "최근 3개월 +15% 성장"에 있음.** 캐스팅·광고 단가 산정의 핵심 지표는 추세이며, 이는 시계열 저장 없이는 만들 수 없다.

---

## 4. Data Flow: Sync Trigger

### 4.1 Single Profile Sync (Synchronous, < 5s)

```
운영자 클릭
   │
   ▼
FastAPI: POST /sync/trigger {profile_id: 42}
   │
   ▼
Celery: enqueue task
   │
   ▼
Worker:
  1. Profile 조회 → ig_username 확보
  2. Graph API 호출:
     GET /{ig-user-id}?fields=business_discovery.username({username})
         {followers_count,follows_count,media_count,
          media.limit(10){like_count,comments_count,timestamp,permalink}}
  3. 응답 파싱 → snapshot + media_metrics insert
  4. Profile.last_synced_at, sync_status 업데이트
   │
   ▼
WebSocket / Polling으로 UI에 결과 통보
```

### 4.2 Batch Sync (Async, 5,000명 가정)

```
운영자: "전체 갱신" 클릭
   │
   ▼
FastAPI: POST /sync/trigger {scope: "all"}
   │
   ▼
Job 생성 + 5,000개 작업 큐잉
   │
   ▼
Worker pool (예: 4 workers, 토큰 4개 회전)
  - Token A: 200 calls/hour
  - Token B: 200 calls/hour
  - Token C: 200 calls/hour
  - Token D: 200 calls/hour
  → 800 calls/hour 처리 가능 → 5,000명 ≈ 6.5시간
   │
   ▼
실시간 진행률 표시 (Streamlit / WebSocket)
   │
   ▼
완료 시 Slack 알림 + 실패 리스트 정리
```

---

## 5. Instagram Graph API: Business Discovery 사용법

### 5.1 사전 준비

1. **Meta Developer 계정** 생성 (https://developers.facebook.com/)
2. **Facebook 페이지** 생성 (운영용 — 노출 안 됨)
3. **Instagram Business 계정** 생성 + Facebook 페이지 연동
4. **Meta App** 생성 → Instagram Graph API 권한 추가
5. **Long-lived Access Token** 발급 (60일 유효 → 자동 갱신 cron 필수)

### 5.2 핵심 엔드포인트

```http
GET https://graph.facebook.com/v22.0/{my-ig-user-id}
    ?fields=business_discovery.username(TARGET_USERNAME){
        followers_count,
        follows_count,
        media_count,
        username,
        name,
        biography,
        profile_picture_url,
        media.limit(10){
            id,
            media_type,
            like_count,
            comments_count,
            timestamp,
            permalink,
            caption
        }
    }
    &access_token=LONG_LIVED_TOKEN
```

**제약사항:**
- 대상 계정이 **Business 또는 Creator 타입**이어야 함
- Personal 계정은 응답 X → Apify 폴백
- Rate limit: **200 calls / token / hour**
- Token 만료: 60일 (refresh API로 자동 갱신)

### 5.3 응답 예시

```json
{
  "business_discovery": {
    "followers_count": 12450000,
    "follows_count": 234,
    "media_count": 1892,
    "username": "example_celeb",
    "name": "Example Celebrity",
    "media": {
      "data": [
        {
          "id": "17891234567890",
          "media_type": "IMAGE",
          "like_count": 856421,
          "comments_count": 12453,
          "timestamp": "2026-04-25T08:30:00+0000",
          "permalink": "https://www.instagram.com/p/Cxxxxxx/"
        }
        // ...
      ]
    }
  },
  "id": "MY_IG_USER_ID"
}
```

---

## 6. Operational Concerns

### 6.1 Token Lifecycle Management

```python
# 매주 일요일 새벽 3시 실행
@celery_app.task
def refresh_long_lived_token():
    response = requests.get(
        "https://graph.facebook.com/v22.0/refresh_access_token",
        params={
            "grant_type": "ig_refresh_token",
            "access_token": current_token,
        }
    )
    # 50일 시점에 자동 갱신 (60일 만료 전 안전 마진)
```

### 6.2 Rate Limit Handling

```python
# Redis 기반 슬라이딩 윈도우
def check_rate_limit(token_id):
    key = f"rate_limit:{token_id}:{current_hour}"
    count = redis.incr(key)
    if count == 1:
        redis.expire(key, 3600)
    if count > 195:  # 5 buffer
        raise RateLimitException(retry_after=3600 - elapsed)
```

### 6.3 Multi-Token Rotation

5,000명 배치 갱신 시 단일 토큰으로는 25시간 소요. 4개 토큰 운영 시 6.5시간으로 단축.
- 각 토큰은 별도 Meta App + IG Business 계정
- Worker pool에서 라운드로빈 분배

### 6.4 Failure Handling

| 실패 유형 | 대응 |
|---|---|
| Rate limit (429) | 재시도 (지수 백오프, max 3회) |
| Personal 계정 (no business_discovery) | Apify 폴백 → 그래도 실패 시 manual flag |
| 비공개 전환 | sync_status = 'private', 알림 |
| 계정 삭제 | sync_status = 'not_found', 운영자 확인 |
| Token 만료 | 즉시 refresh + 재시도 |
| Apify 실패 | 운영자 수동 입력 UI 제공 |

---

## 7. UI Specifications (Streamlit)

### 7.1 메인 대시보드

- **프로필 그리드**: 카테고리별 탭 (배우/가수/모델/스포츠/외국)
- 각 카드: 사진, 이름, 팔로워 수, 마지막 갱신 시각, 상태 배지
- 클릭 시 상세 페이지 (시계열 그래프, 최근 게시물 인게이지먼트)

### 7.2 등록 페이지

- IG URL 입력 → username 자동 파싱
- "검증" 버튼 → Graph API로 즉시 호출, account_type 확인
- 카테고리 선택, 노트 입력
- "등록 + 즉시 동기화" 또는 "등록만"

### 7.3 동기화 트리거

- **단일**: 카드 우클릭 → "지금 갱신"
- **배치**: 상단 버튼 → 카테고리 필터 + 마지막 갱신 N일 이상
- 진행률 바 + 실패 리스트

### 7.4 분석 뷰

- 카테고리별 팔로워 랭킹
- 성장률 TOP 10 / 하락률 TOP 10
- 인게이지먼트 비율 (likes / followers)
- CSV 익스포트

---

## 8. Cost Analysis (5,000 profiles 기준)

### 8.1 변동비

| 항목 | 단가 | 월간 사용량 (가정) | 월 비용 |
|---|---|---|---|
| Graph API | $0 | 5,000 × 4회 갱신 | $0 |
| Apify (5% 폴백) | $0.0005 | 250 × 4회 = 1,000 | ~$5 |

### 8.2 고정비

| 항목 | 월 비용 |
|---|---|
| Railway / Render (FastAPI + Worker + Streamlit) | $20~30 |
| PostgreSQL Managed (10GB) | $10~15 |
| Redis Managed (256MB) | $0~10 |
| Sentry (Free tier) | $0 |
| 도메인 + SSL | $1 |

**예상 총 운영비: $35~60 / 월**

### 8.3 일회성 비용

- Meta App 검증 심사 (Business Discovery 사용은 Standard Tier에서 가능 → 무료)
- 개발 인건비: 4주 × 1 FTE

---

## 9. Roadmap

### Week 1: Foundation
- [ ] Meta Developer 계정 + 4개 IG Business 계정 셋업
- [ ] Long-lived token 발급 + 자동 갱신 PoC
- [ ] PostgreSQL 스키마 마이그레이션
- [ ] FastAPI 프로젝트 스캐폴딩 (alembic, pydantic, dotenv)
- [ ] 단일 프로필 동기화 PoC (CLI)

### Week 2: Core Pipeline
- [ ] Celery + Redis 인프라
- [ ] Graph API Business Discovery 통합
- [ ] Multi-token rotation
- [ ] 재시도 / 에러 분류 / 폴백 체인
- [ ] 시계열 + media_metrics 저장

### Week 3: UI + Operations
- [ ] Streamlit 대시보드 (등록/그리드/상세)
- [ ] 단일/배치 트리거
- [ ] 진행률 표시 (WebSocket 또는 polling)
- [ ] Apify 폴백 통합
- [ ] CSV 익스포트

### Week 4: Stabilization
- [ ] Token refresh cron
- [ ] Sentry 통합
- [ ] Slack webhook (실패 알림)
- [ ] 시계열 그래프 (성장률, 추세선)
- [ ] DB 자동 백업 (S3)
- [ ] 운영 문서 + Runbook

---

## 10. Risk Register

| 리스크 | 영향 | 가능성 | 대응 |
|---|---|---|---|
| Meta API 정책 변경 | 高 | 中 | 6개월 deprecation 모니터링, Apify 폴백 강화 |
| 운영용 IG 계정 차단 | 中 | 低 | 4개 토큰 분산, 백업 계정 준비 |
| 대상 계정 Personal 전환 | 低 | 高 | Apify 자동 폴백 |
| 토큰 만료 미갱신 | 高 | 低 | cron + 만료 14일 전 알림 |
| 5,000명 배치 시간 초과 | 中 | 中 | Multi-token rotation, 우선순위 큐 |
| 저작권 (게시물 사진/캡션) | 中 | 低 | URL만 저장, 캡션 100자 제한 |
| 개인정보보호 | 低 | 低 | 공인 + 공개 정보 → 기본 OK, ToS 준수 |

---

## 11. Out of Scope (Phase 2 후보)

- TikTok / YouTube / X 동시 수집
- 팔로워 인구통계 분석 (별도 라이선스 필요)
- 광고 단가 자동 산정 모델
- 인플루언서 매칭 추천 시스템
- 클라이언트 직접 접근 가능한 API 외부 공개

---

## 12. References

- [Instagram Graph API - Business Discovery](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery)
- [Long-Lived Access Tokens](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/overview/access-tokens-and-permissions)
- [Apify Instagram Profile Scraper](https://apify.com/apify/instagram-profile-scraper)
- [Celery Best Practices](https://docs.celeryq.dev/en/stable/userguide/tasks.html)

---

**Document Owner**: [TBD]  
**Next Review**: Week 4 종료 시점
