# Project M - 백엔드 실행 가이드

## Windows에서 백엔드 실행する方法

### 1. 의존성 설치

명령 프롬프트(CMD)에서:

```bash
cd E:\Project M\model-agency-system\backend

pip install -r requirements.txt
```

### 2. 서버 실행

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. API 테스트

브라우저에서:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/api/health (헬스 체크)

## 테스트할 API 엔드포인트

### 이미지 검색
```
POST /api/media/images/search
Body: {
  "query": "모델이름",
  "source": "unsplash",
  "page": 1,
  "per_page": 20
}
```

### 뉴스 검색
```
POST /api/media/news/search
Body: {
  "query": "모델이름",
  "language": "ko",
  "page": 1,
  "page_size": 10
}
```

### 프로필 내보내기
```
POST /api/media/export/profile
Body: {
  "model_id": 1,
  "format": "pptx"
}
```

## 참고
- API 키가 없으면 데모 데이터 반환
- Unsplash API 키: .env 파일에 UNSPLASH_ACCESS_KEY 추가
- NewsAPI 키: .env 파일에 NEWS_API_KEY 추가
