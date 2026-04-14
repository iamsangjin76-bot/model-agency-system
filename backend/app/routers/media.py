# -*- coding: utf-8 -*-
"""
Project M - Media Search & Export API

이미지 검색, 뉴스 검색, 프로필 내보내기 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os
import uuid
import httpx
import asyncio
from enum import Enum

from app.models.database import get_db, Model, ModelFile
from app.config import settings
from app.routers.auth import get_current_active_user, require_permission

router = APIRouter()


# ============== 스키마 ==============

class ImageSourceEnum(str, Enum):
    UNSPLASH = "unsplash"
    BING = "bing"
    LOCAL = "local"


class ImageSearchResponse(BaseModel):
    """이미지 검색 결과"""
    id: str
    url: str
    thumbnail_url: str
    title: str
    source: str
    width: int
    height: int
    license: Optional[str] = None
    author_name: Optional[str] = None
    author_url: Optional[str] = None


class ImageSearchRequest(BaseModel):
    """이미지 검색 요청"""
    query: str
    source: ImageSourceEnum = ImageSourceEnum.UNSPLASH
    page: int = 1
    per_page: int = 20


class NewsArticleResponse(BaseModel):
    """뉴스 기사"""
    id: str
    title: str
    description: Optional[str]
    url: str
    image_url: Optional[str]
    source: str
    published_at: str


class NewsSearchRequest(BaseModel):
    """뉴스 검색 요청"""
    query: str
    language: str = "ko"
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    page: int = 1
    page_size: int = 10


class ProfileExportRequest(BaseModel):
    """프로필 내보내기 요청"""
    model_id: int
    format: str = Field(default="pptx", pattern="^(pptx|pdf)$")
    include_images: bool = True
    include_news: bool = True
    template: str = "default"


class ProfileExportResponse(BaseModel):
    """프로필 내보내기 응답"""
    export_id: str
    file_url: str
    file_name: str
    status: str
    created_at: datetime


# ============== 이미지 검색 API ==============

@router.post("/images/search", response_model=List[ImageSearchResponse])
async def search_images(
    request: ImageSearchRequest,
    current_user = Depends(require_permission("model", "read"))
):
    """
    이미지 검색
    - Unsplash API 또는 Bing Image Search 사용
    """
    if request.source == ImageSourceEnum.UNSPLASH:
        return await search_unsplash(request.query, request.page, request.per_page)
    elif request.source == ImageSourceEnum.BING:
        return await search_bing(request.query, request.page, request.per_page)
    else:
        raise HTTPException(status_code=400, detail="지원하지 않는 소스입니다")


async def search_unsplash(query: str, page: int = 1, per_page: int = 20) -> List[ImageSearchResponse]:
    """Unsplash API를 통한 이미지 검색"""
    api_key = os.getenv("UNSPLASH_ACCESS_KEY")
    
    if not api_key:
        # 데모 데이터 반환
        return generate_demo_images(query, per_page)
    
    url = "https://api.unsplash.com/search/photos"
    headers = {"Authorization": f"Client-ID {api_key}"}
    params = {
        "query": query,
        "page": page,
        "per_page": per_page,
        "orientation": "portrait"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            return [
                ImageSearchResponse(
                    id=photo["id"],
                    url=photo["urls"]["regular"],
                    thumbnail_url=photo["urls"]["thumb"],
                    title=photo.get("alt_description", f"{query} 이미지"),
                    source="Unsplash",
                    width=photo["width"],
                    height=photo["height"],
                    license=photo.get("license", "Unsplash License"),
                    author_name=photo["user"]["name"],
                    author_url=photo["user"]["links"]["html"]
                )
                for photo in data.get("results", [])
            ]
        except Exception as e:
            print(f"Unsplash API error: {e}")
            return generate_demo_images(query, per_page)


async def search_bing(query: str, page: int = 1, per_page: int = 20) -> List[ImageSearchResponse]:
    """Bing Image Search API를 통한 이미지 검색"""
    api_key = os.getenv("BING_SEARCH_API_KEY")
    
    if not api_key:
        return generate_demo_images(query, per_page)
    
    url = "https://api.bing.microsoft.com/v7.0/images/search"
    headers = {"Ocp-Apim-Subscription-Key": api_key}
    params = {
        "q": query,
        "offset": (page - 1) * per_page,
        "count": per_page,
        "imageType": "Photo",
        "license": "Public"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            return [
                ImageSearchResponse(
                    id=f"bing-{result['imageId']}" if result.get('imageId') else f"bing-{idx}",
                    url=result["contentUrl"],
                    thumbnail_url=result["thumbnailUrl"],
                    title=result.get("name", f"{query} 이미지"),
                    source="Bing",
                    width=result.get("width", 0),
                    height=result.get("height", 0),
                    license=result.get("license", "Unknown"),
                    author_name=result.get("creator", {}).get("name"),
                    author_url=result.get("creator", {}).get("url")
                )
                for idx, result in enumerate(data.get("value", [])[:per_page])
            ]
        except Exception as e:
            print(f"Bing API error: {e}")
            return generate_demo_images(query, per_page)


def generate_demo_images(query: str, count: int = 20) -> List[ImageSearchResponse]:
    """데모 이미지 데이터 생성 (API 키가 없을 때)"""
    demo_images = [
        "photo-1534528741775-53994a69daeb",
        "photo-1517841905240-472988babdf9",
        "photo-1524504388940-b1c1722653e1",
        "photo-1529626455594-4ff0802cfb7e",
        "photo-1507003211169-0a1dd7228f2d",
        "photo-1506794778202-cad84cf45f1d",
        "photo-1531746020798-e6953c6e8e04",
        "photo-1488426862026-3ee34a7d66df",
        "photo-1494790108377-be9c29b29330",
        "photo-1531123897727-8f129e1688ce",
    ]
    
    return [
        ImageSearchResponse(
            id=f"demo-{i+1}",
            url=f"https://images.unsplash.com/{demo_images[i % len(demo_images)]}?w=800&h=1200&fit=crop",
            thumbnail_url=f"https://images.unsplash.com/{demo_images[i % len(demo_images)]}?w=300&h=400&fit=crop",
            title=f"{query} 이미지 {i+1}",
            source="Unsplash (Demo)",
            width=800,
            height=1200,
            license="Unsplash License",
            author_name="Demo User"
        )
        for i in range(min(count, len(demo_images)))
    ]


# ============== 이미지 저장 API ==============

class SaveImagesRequest(BaseModel):
    """이미지 저장 요청"""
    model_id: int
    image_urls: List[str]
    is_profile: bool = False


@router.post("/images/save")
async def save_images(
    request: SaveImagesRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """
    선택한 이미지를 모델 폴더에 저장
    """
    # 모델 존재 확인
    model = db.query(Model).filter(Model.id == request.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    
    # 저장 폴더 경로
    folder_path = f"library/[{model.model_type.value if model.model_type else 'Unknown'}]_{model.name.replace(' ', '_')}"
    save_dir = os.path.join(settings.UPLOAD_DIR, folder_path)
    os.makedirs(save_dir, exist_ok=True)
    
    saved_files = []
    
    async with httpx.AsyncClient() as client:
        for idx, image_url in enumerate(request.image_urls):
            try:
                # 이미지 다운로드
                response = await client.get(image_url, timeout=30.0)
                response.raise_for_status()
                
                # 파일 저장
                ext = ".jpg"
                if "png" in response.headers.get("content-type", ""):
                    ext = ".png"
                elif "webp" in response.headers.get("content-type", ""):
                    ext = ".webp"
                
                file_name = f"image_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{idx+1}{ext}"
                file_path = os.path.join(save_dir, file_name)
                
                with open(file_path, "wb") as f:
                    f.write(response.content)
                
                # DB에 파일 정보 저장
                db_file = ModelFile(
                    model_id=request.model_id,
                    file_name=file_name,
                    file_path=f"{folder_path}/{file_name}",
                    file_type="image",
                    file_size=len(response.content),
                    is_profile_image=request.is_profile and idx == 0,
                    uploaded_by=current_user.id
                )
                db.add(db_file)
                saved_files.append(file_name)
                
            except Exception as e:
                print(f"Failed to save image {image_url}: {e}")
                continue
    
    db.commit()
    
    return {
        "message": f"{len(saved_files)}개 이미지 저장 완료",
        "saved_count": len(saved_files),
        "model_id": request.model_id
    }


# ============== 뉴스 검색 API ==============

@router.post("/news/search", response_model=List[NewsArticleResponse])
async def search_news(
    request: NewsSearchRequest,
    current_user = Depends(require_permission("model", "read"))
):
    """
    뉴스 검색
    - NewsAPI 사용
    - 기본적으로 최신순 정렬
    """
    api_key = os.getenv("NEWS_API_KEY")
    
    if not api_key:
        # 데모 데이터 반환
        return generate_demo_news(request.query, request.page_size)
    
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": request.query,
        "language": request.language,
        "sortBy": "publishedAt",  # 최신순
        "page": request.page,
        "pageSize": request.page_size,
        "apiKey": api_key
    }
    
    if request.from_date:
        params["from"] = request.from_date
    if request.to_date:
        params["to"] = request.to_date
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            return [
                NewsArticleResponse(
                    id=article["url"],
                    title=article.get("title", ""),
                    description=article.get("description"),
                    url=article["url"],
                    image_url=article.get("urlToImage"),
                    source=article["source"]["name"],
                    published_at=article.get("publishedAt", "")
                )
                for article in data.get("articles", [])[:request.page_size]
            ]
        except Exception as e:
            print(f"News API error: {e}")
            return generate_demo_news(request.query, request.page_size)


def generate_demo_news(query: str, count: int = 10) -> List[NewsArticleResponse]:
    """데모 뉴스 데이터 생성"""
    return [
        NewsArticleResponse(
            id=f"demo-news-{i+1}",
            title=f"{query} 관련 뉴스 제목 {i+1}",
            description=f"이 기사는 {query}에 관한 다양한 정보를 포함하고 있습니다.",
            url=f"https://example.com/news/{i+1}",
            image_url=None,
            source="데모 뉴스",
            published_at=datetime.now().isoformat()
        )
        for i in range(count)
    ]


# ============== 최신 뉴스 API ==============

@router.get("/news/latest", response_model=List[NewsArticleResponse])
async def get_latest_news(
    query: str = "모델",
    language: str = "ko",
    page: int = 1,
    page_size: int = 5,
    current_user = Depends(require_permission("model", "read"))
):
    """
    최신 뉴스 가져오기 (대시보드용)
    """
    return await search_news(
        NewsSearchRequest(
            query=query,
            language=language,
            page=page,
            page_size=page_size
        ),
        current_user
    )


# ============== 저장된 뉴스 API ==============

class SaveNewsRequest(BaseModel):
    """뉴스 저장 요청"""
    articles: List[NewsArticleResponse]


@router.post("/news/save")
async def save_news(
    request: SaveNewsRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """
    선택한 뉴스 기사 저장 (태블릿용)
    """
    # 실제 구현에서는 DB나 파일에 저장
    # 여기서는 성공 응답만 반환
    saved_articles = []
    
    for article in request.articles:
        saved_articles.append({
            "id": article.id,
            "title": article.title,
            "description": article.description,
            "url": article.url,
            "image_url": article.image_url,
            "source": article.source,
            "published_at": article.published_at,
            "saved_at": datetime.now().isoformat()
        })
    
    # 파일로 저장 (실제 구현에서는 DB 사용)
    save_dir = os.path.join(settings.MODEL_FILES_DIR, "saved_news")
    os.makedirs(save_dir, exist_ok=True)
    
    save_file = os.path.join(save_dir, "tablet_news.json")
    with open(save_file, "w", encoding="utf-8") as f:
        import json
        json.dump(saved_articles, f, ensure_ascii=False, indent=2)
    
    return {
        "message": f"{len(saved_articles)}개 기사 저장 완료",
        "saved_count": len(saved_articles),
        "file_url": f"/model_files/saved_news/tablet_news.json"
    }


@router.get("/news/saved", response_model=List[dict])
async def get_saved_news(
    current_user = Depends(require_permission("model", "read"))
):
    """
    저장된 뉴스 조회 (태블릿용)
    """
    save_file = os.path.join(settings.MODEL_FILES_DIR, "saved_news", "tablet_news.json")
    
    if os.path.exists(save_file):
        with open(save_file, "r", encoding="utf-8") as f:
            import json
            return json.load(f)
    
    return []


# ============== 프로필 내보내기 API ==============

@router.post("/export/profile", response_model=ProfileExportResponse)
async def export_profile(
    request: ProfileExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """
    모델 프로필 내보내기 (PPT/PDF)
    """
    # 모델 존재 확인
    model = db.query(Model).filter(Model.id == request.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    
    # 내보내기 폴더 생성
    export_dir = f"exports/{model.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    full_export_dir = os.path.join(settings.MODEL_FILES_DIR, export_dir)
    os.makedirs(full_export_dir, exist_ok=True)
    
    # 파일 이름 생성
    export_id = str(uuid.uuid4())[:8]
    file_ext = ".pptx" if request.format == "pptx" else ".pdf"
    file_name = f"profile_{model.name}_{export_id}{file_ext}"
    file_path = os.path.join(full_export_dir, file_name)
    
    # TODO: 실제 PPT/PDF 생성 로직 (python-pptx, ReportLab 등 사용)
    try:
        # 빈 파일 생성 (실제 구현 시 제거)
        with open(file_path, "wb") as f:
            f.write(b"Demo export file - To be implemented")
        
        file_url = f"/model_files/{export_dir}/{file_name}"
        
        return ProfileExportResponse(
            export_id=export_id,
            file_url=file_url,
            file_name=file_name,
            status="completed",
            created_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"내보내기 실패: {str(e)}")


# ============== 내보내기 템플릿 목록 ==============

@router.get("/export/templates")
async def get_export_templates(
    current_user = Depends(require_permission("model", "read"))
):
    """
    사용 가능한 내보내기 템플릿 목록 반환
    """
    return {
        "templates": [
            {"id": "default", "name": "기본 템플릿", "description": "표준 모델 프로필 포맷"},
            {"id": "portfolio", "name": "포트폴리오", "description": "사진 중심 포트폴리오"},
            {"id": "press", "name": "프레스Kit", "description": "미디어용 키트"},
        ],
        "formats": ["pptx", "pdf"]
    }
