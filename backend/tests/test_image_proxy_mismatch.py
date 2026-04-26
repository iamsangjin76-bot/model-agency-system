# -*- coding: utf-8 -*-
"""
S11: Content-Type header vs magic bytes mismatch test.

Verifies that fetch_proxied_image() raises HTTP 415 when the upstream
Content-Type header claims image/jpeg but the response body contains PNG
magic bytes — i.e., the server is spoofing the content type.
"""
from unittest.mock import AsyncMock, MagicMock, patch
import pytest


@pytest.mark.asyncio
async def test_content_type_magic_mismatch_raises_415():
    """S11: jpeg header + PNG body → 415 Content-Type 헤더와 실제 이미지 형식 불일치"""
    from fastapi import HTTPException
    from app.services.image_proxy_service import fetch_proxied_image

    # PNG magic bytes (first 8 bytes of a valid PNG)
    png_magic = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

    # Mock httpx streaming response that claims image/jpeg but delivers PNG bytes
    mock_resp = MagicMock()
    mock_resp.is_redirect = False
    mock_resp.raise_for_status = MagicMock()
    mock_resp.headers = {"content-type": "image/jpeg"}

    async def fake_aiter_bytes(chunk_size=8192):
        yield png_magic

    mock_resp.aiter_bytes = fake_aiter_bytes
    mock_resp.__aenter__ = AsyncMock(return_value=mock_resp)
    mock_resp.__aexit__ = AsyncMock(return_value=False)

    mock_client = MagicMock()
    mock_client.stream = MagicMock(return_value=mock_resp)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.image_proxy_service.validate_proxy_host", return_value=True), \
         patch("app.services.image_proxy_service._cache_valid", return_value=False), \
         patch("app.services.image_proxy_service.httpx.AsyncClient", return_value=mock_client):

        with pytest.raises(HTTPException) as exc_info:
            await fetch_proxied_image("https://imgnews.naver.net/fake.jpg")

    assert exc_info.value.status_code == 415
    assert "Content-Type 헤더와 실제 이미지 형식 불일치" in exc_info.value.detail
