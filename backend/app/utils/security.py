# -*- coding: utf-8 -*-
"""
Security helpers for external URL validation and file content verification.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse


# ---------------------------------------------------------------------------
# SSRF defence
# ---------------------------------------------------------------------------

_PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


def validate_image_url(url: str) -> bool:
    """
    Return True if the URL is safe to fetch (public http/https, no private IP).
    Blocks localhost, 0.0.0.0, and RFC-1918 ranges via DNS resolution.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    hostname = parsed.hostname or ""
    if hostname in ("localhost", "0.0.0.0", ""):
        return False
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            return False
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_unspecified:
            return False
        for net in _PRIVATE_NETWORKS:
            if ip in net:
                return False
    return True


# ---------------------------------------------------------------------------
# Magic-byte validation
# ---------------------------------------------------------------------------

_MAGIC: list[tuple[bytes, bytes | None]] = [
    (b"\xff\xd8", None),                          # JPEG
    (b"\x89PNG", None),                           # PNG
    (b"GIF8", None),                              # GIF
    (b"RIFF", b"WEBP"),                           # WebP: bytes[0:4] + bytes[8:12]
]


def validate_magic_bytes(data: bytes) -> bool:
    """Return True if the file header matches a supported image format."""
    if len(data) < 12:
        return False
    for magic, suffix in _MAGIC:
        if data[:len(magic)] == magic:
            if suffix is None:
                return True
            if data[8:8 + len(suffix)] == suffix:
                return True
    return False


# ---------------------------------------------------------------------------
# Image Proxy SSRF defense (added for J-8a)
# ---------------------------------------------------------------------------

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
    Return True only if all resolved IPs are non-private (SSRF defense).

    When allowed_suffixes is non-empty, the hostname must also match at least
    one suffix (suffix-only matching, no glob wildcard abuse).
    Pass an empty list to allow any public-internet host.

    Caller converts False → HTTP 403.
    """
    # Step 1: suffix whitelist — skipped when list is empty (allow-all-public mode)
    if allowed_suffixes:
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
