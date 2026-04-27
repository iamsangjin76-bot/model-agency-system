# Tech Stack — Model Agency Management System

> 생성: 2026-04-25 (`/auto setup`, 옵션 B 마이그레이션 후 첫 동기화)
> 최종 갱신: 2026-04-26 (`/auto setup`, J-6 + J-8a 완료 후)

## 언어 및 런타임

| 계층 | 언어 | 버전 |
|------|------|------|
| Backend | Python | 3.12.10 |
| Frontend | TypeScript | 5.3.2 |
| Runtime | Node.js | v24.14.1 (현재 운영 환경, `package.json` engines 미지정·`.nvmrc` 부재) |
| Desktop | Electron | 28.0.0 |

## Backend (FastAPI)

| 구성 요소 | 기술 | 버전 |
|-----------|------|------|
| Web 프레임워크 | FastAPI | 0.109.0 |
| ASGI 서버 | uvicorn[standard] | 0.27.0 |
| ORM | SQLAlchemy | 2.0.25 |
| Database | SQLite (`model_agency.db`) | bundled |
| JWT | python-jose[cryptography] | 3.3.0 |
| 비밀번호 해싱 | passlib[bcrypt] | 1.7.4 |
| 설정 | pydantic-settings | 2.1.0 |
| 파일 업로드 | python-multipart | 0.0.6 |
| 비동기 파일 IO | aiofiles | 23.2.1 |
| HTTP 클라이언트 | httpx | 0.28.1 |
| 이미지 처리 | Pillow | ≥10.0.0 |

## Frontend (React + Electron)

| 구성 요소 | 기술 | 버전 |
|-----------|------|------|
| Framework | React | 18.2.0 |
| Build Tool | Vite | 5.0.6 |
| Routing | react-router-dom | 6.20.0 |
| HTTP | axios | 1.6.2 |
| Server State | @tanstack/react-query | 5.12.2 |
| Client State | zustand | 4.4.7 |
| Forms | react-hook-form + zod | 7.48.2 / 3.22.4 |
| Charts | recharts | 2.10.3 |
| Icons | lucide-react | 0.294.0 |
| Styling | Tailwind CSS | 3.3.6 |
| Desktop | Electron | 28.0.0 |
| Packaging | electron-builder | 24.9.1 |

## 인증 아키텍처 (SPEC-AUTH-001 ✅ completed)

- **Access token**: JWT (HS256), 15분 TTL (이전 24시간에서 단축)
- **Refresh token**: opaque UUID4, 7일 TTL, SHA-256 해시로 DB 저장
- **Single-use rotation**: 토큰 소비 시 새 토큰 발급, 이전은 revoked 표시
- **Family revocation**: 소비된 refresh token 재사용 감지 시 사용자 전체 세션 폐기
- **Startup cleanup**: 앱 시작 시 만료 토큰 자동 삭제
- **Frontend silent refresh**: `auth-api.ts` 401 인터셉터 + `refreshPromise` 싱글톤 (R13)

## 빌드 및 실행

```powershell
# Backend (PowerShell, G드라이브 기준)
cd "G:\Project M\model-agency-system\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload    # port 8000

# Frontend
cd "G:\Project M\model-agency-system\frontend"
npm install                                  # 502개 패키지 (1회, 2026-04-24 옵션 B 시점 카운트)
npm run dev                                  # Vite, port 5173
npm run build                                # tsc + vite build (production)
npm run electron:dev                         # Electron + Vite concurrent
npm run electron:build                       # NSIS (Windows .exe)
```

3개 PowerShell 창 패턴 (v17 원칙 35): Backend / Frontend / Claude Code CLI 각각 독립 창.

## 환경변수 (`.env`)

| 키 | 상태 | 용도 |
|----|------|------|
| `APP_NAME` | 설정됨 | 앱 이름 |
| `APP_VERSION=1.0.0` | 설정됨 | 버전 |
| `DEBUG=true` | 설정됨 | 디버그 모드 |
| `HOST=0.0.0.0` | 설정됨 | 바인드 주소 |
| `PORT=8000` | 설정됨 | API 포트 |
| `DATABASE_URL` | 설정됨 | `sqlite:///./model_agency.db` |
| `SECRET_KEY` | 설정됨 | JWT 비밀키 (운영 시 교체 필요) |
| `ALGORITHM=HS256` | 설정됨 | JWT 알고리즘 |
| `ACCESS_TOKEN_EXPIRE_MINUTES=15` | 설정됨 | SPEC-AUTH-001 |
| `REFRESH_TOKEN_EXPIRE_DAYS=7` | 설정됨 | SPEC-AUTH-001 |
| `CORS_ORIGINS` | ⚠️ list 직접 정의 (`config.py:34`, 아래 알려진 환경 이슈 참조) | Vite 5173 + Electron + 192.168 LAN |
| `UPLOAD_DIR=./uploads` | 설정됨 | 파일 업로드 |
| `MODEL_FILES_DIR=./model_files` | 설정됨 | 모델 파일 |
| **`NAVER_CLIENT_ID`** | ✅ **활성** | 뉴스/이미지 검색 (25,000 req/일 무료) |
| **`NAVER_CLIENT_SECRET`** | ✅ 활성 | Naver API 시크릿 |
| `GOOGLE_API_KEY` | ❌ **비활성 (403)** | Google Custom Search |
| `GOOGLE_CX` | ❌ 비활성 | Google CSE ID |
| `SEARCH_REQUEST_TIMEOUT=5` | 설정됨 | httpx 타임아웃 |
| `SEARCH_IMAGE_MAX_SIZE` | 설정됨 | 10MB |
| **`IMAGE_PROXY_ALLOWED_DOMAINS`** | ✅ **활성 (J-8a)** | suffix 화이트리스트 (초기 9개 도메인: imgnews.naver.net, naver.net, blogfiles.naver.net, postfiles.pstatic.net, ssl.pstatic.net, i1~i3.ruliweb.com, image.fmkorea.com, img.insight.co.kr) |
| **`IMAGE_PROXY_MAX_SIZE=10485760`** | ✅ 활성 (J-8a) | 응답 크기 한계 10MB |
| **`IMAGE_PROXY_TIMEOUT=5.0`** | ✅ 활성 (J-8a) | 외부 fetch 타임아웃 (초) |
| **`IMAGE_PROXY_CACHE_DIR=proxy_cache`** | ✅ 활성 (J-8a) | 디스크 캐시 루트 (.gitignore 등재) |
| **`IMAGE_PROXY_CACHE_TTL=604800`** | ✅ 활성 (J-8a) | 7일 (SPEC §3.2) |
| `UNSPLASH_ACCESS_KEY` | 미설정 | 이미지 검색 후보 |
| `BING_SEARCH_API_KEY` | 미설정 | 이미지 검색 후보 |
| `AZURE_COMPUTER_VISION_KEY` | 미설정 | 이미지 분석 |
| **`OPENAI_API_KEY`** | 미설정 | **Phase K-1 프로필 내보내기 대비** |
| **`GEMINI_API_KEY`** | 미설정 | **Autopus `--multi` 멀티프로바이더 활용 대비** |

> **삭제됨**: `NEWS_API_KEY` (옵션 B 마이그레이션 시 Pydantic 충돌 해결을 위해 .env에서 삭제. config.py에 정의 없음).

### ⚠️ 알려진 환경 이슈

- **`.env` line 29 파싱 경고**: `python-dotenv could not parse statement starting at line 29`. 서버 동작 영향 없음. 형식 점검 권장.
- **`CORS_ORIGINS` 분리 권장**: `config.py:34` 의 list 직접 정의 + `case_sensitive=True` 가 .env 파싱과 충돌 가능. 향후 SPEC으로 환경변수 분리 검토.
- **`SECRET_KEY` 디폴트값**: `your-secret-key-change-in-production-model-agency-2025` 가 박혀 있음. 배포 전 반드시 교체.

## 헬스체크 엔드포인트

```python
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
```

`backend/app/main.py` 정의. `/auto canary` H3 헬스 체크가 이 엔드포인트를 사용.

## 테스트 / 린팅 (현재 상태)

| 항목 | 상태 | 비고 |
|------|------|------|
| Backend 테스트 (pytest) | 🟡 **부분 도입** | `backend/tests/test_image_proxy_mismatch.py` 1건 (J-8a S11). pytest+pytest-asyncio 시스템 Python 설치됨, Poetry venv에 `pydantic_settings` 의존. **Poetry 환경에서만 실행 가능** |
| Frontend 테스트 (vitest) | **미구성** | Phase I-3 에서 도입 예정 |
| E2E (Playwright) | **미구성** | Phase I-3 또는 Frontend Specialist 에이전트 사용 시 |
| ESLint | **미구성** | Phase I-3 검토 |
| Prettier | **미구성** | Phase I-3 검토 |
| TypeScript strict | ✅ 활성 | `tsconfig.json` |

검증은 현재 다음 수단으로 수행:
- `auto test run` — `.autopus/project/scenarios.md` 기반 E2E 시나리오
- 수동 curl + 브라우저 확인
- reviewer 에이전트의 코드 직접 읽기 (R15)

## 배포 환경 (현재 미구성)

| 항목 | 상태 |
|------|------|
| Dockerfile / docker-compose | ❌ 없음 |
| GitHub Actions | ❌ 없음 |
| Railway/Vercel/Fly | ❌ 없음 |
| K8s/Helm | ❌ 없음 |
| 로컬 실행 | ✅ Vite 5173 + uvicorn 8000 |
| 목표 | Electron 단일 .exe (Phase I-1) |

## 주요 라이브러리 의사결정

- **httpx 동기 + 비동기 클라이언트**: 외부 검색 API 호출 시 타임아웃·SSL 검증 일관성 확보.
- **Pillow 이미지 검증**: 매직 바이트 + 디코딩 가능 여부로 이미지 신뢰성 검증 (`utils/security.py`).
- **Naver API 우선**: 한국어 검색 품질 + 무료 한도 풍부 (25,000 req/일). Google 키는 향후 옵션.
- **zustand vs Redux**: 단순 상태 + 비개발자 운영 → 보일러플레이트 적은 zustand 선택.
- **react-query v5**: 서버 상태 캐싱 + 자동 재요청. 알림 30초 폴링에 활용.

## 파일 크기 정책

- 모든 소스 파일은 **300줄 이하** 유지 (목표 200 이하).
- 현재 10개 파일이 한도 초과 (ARCHITECTURE.md `Known Issues #9` 참조 — `seed.py` 311줄은 시드 모음으로 의도된 길이라 제외).
- 제외: *.md, *.yaml, *.json 설정 파일.
