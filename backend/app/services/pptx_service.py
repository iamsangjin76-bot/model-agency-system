# -*- coding: utf-8 -*-
"""
PPTX generation service for model profiles.
Supports 4 template types: new_model_a, new_model_b, influencer, foreign_model.
"""
from __future__ import annotations

import io
import os
from typing import Any, Optional

from pptx import Presentation
from pptx.util import Cm, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# Slide dimensions: A4 landscape 29.7 × 21.0 cm
W = Cm(29.7)
H = Cm(21.0)

WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x11, 0x18, 0x27)
GRAY = RGBColor(0x6B, 0x72, 0x80)
LGRAY = RGBColor(0xF3, 0xF4, 0xF6)

TMPL: dict[str, dict] = {
    "new_model_a": dict(
        color=RGBColor(0x7C, 0x3A, 0xED), bg=RGBColor(0xF3, 0xF0, 0xFF), layout="classic",
    ),
    "new_model_b": dict(
        color=RGBColor(0x1F, 0x29, 0x37), bg=RGBColor(0xF9, 0xFA, 0xFB), layout="bold",
    ),
    "influencer": dict(
        color=RGBColor(0xDB, 0x27, 0x77), bg=RGBColor(0xFF, 0xF0, 0xF9), layout="sns",
    ),
    "foreign_model": dict(
        color=RGBColor(0x1D, 0x4E, 0xD8), bg=RGBColor(0xEF, 0xF6, 0xFF), layout="intl",
    ),
}

MODEL_TYPE_LABELS = {
    "new_model": "신인 모델", "influencer": "인플루언서",
    "foreign_model": "외국인 모델", "celebrity": "연예인",
}
GENDER_LABELS = {"male": "남성", "female": "여성", "other": "기타"}

CAREER_FIELDS = [
    ("방송", "career_broadcast"), ("영화", "career_movie"),
    ("광고", "career_commercial"), ("지면광고", "career_print_ad"),
    ("패션쇼", "career_fashion_show"), ("뮤지컬", "career_musical"),
    ("기타", "career_other"),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _rect(slide: Any, l: Any, t: Any, w: Any, h: Any, color: RGBColor) -> None:
    shape = slide.shapes.add_shape(1, l, t, w, h)  # 1 = rectangle
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def _text(
    slide: Any, text: str, l: Any, t: Any, w: Any, h: Any,
    size: int = 10, bold: bool = False,
    color: RGBColor = DARK, align: Any = PP_ALIGN.LEFT,
) -> None:
    if not text:
        return
    txb = slide.shapes.add_textbox(l, t, w, h)
    tf = txb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = str(text)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color


def _section_title(slide: Any, label: str, l: Any, y: Any, color: RGBColor) -> None:
    _text(slide, label.upper(), l, y, Cm(20), Cm(0.5),
          size=8, bold=True, color=color)
    _rect(slide, l, y + Cm(0.48), Cm(12), Cm(0.04), color)


def _info_row(slide: Any, label: str, value: str,
              y: Any, l: Any, w: Any) -> None:
    _text(slide, label, l, y, Cm(3.0), Cm(0.5), size=9, color=GRAY)
    _text(slide, value, l + Cm(3.2), y, w - Cm(3.2), Cm(0.5), size=9, color=DARK)


def _fmt_num(n: Optional[int]) -> str:
    if not n:
        return ""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def _add_photo(
    slide: Any, image_path: Optional[str],
    l: Any, t: Any, w: Any, h: Any,
    color: RGBColor,
) -> None:
    """Add model photo; draw placeholder rectangle if image missing."""
    if image_path and os.path.exists(image_path):
        try:
            slide.shapes.add_picture(image_path, l, t, w, h)
            return
        except Exception:
            pass
    _rect(slide, l, t, w, h, LGRAY)
    _text(slide, "사진 없음", l, t + h // 2 - Cm(0.3), w, Cm(0.6),
          size=9, color=GRAY, align=PP_ALIGN.CENTER)


def _resolve_path(url: Optional[str], upload_dir: str, model_files_dir: str) -> Optional[str]:
    if not url:
        return None
    for prefix, directory in [("/uploads/", upload_dir), ("/model_files/", model_files_dir)]:
        if url.startswith(prefix):
            p = os.path.join(directory, url[len(prefix):])
            if os.path.exists(p):
                return p
    # Raw filesystem path (fallback)
    if os.path.exists(url):
        return url
    return None


# ---------------------------------------------------------------------------
# Model data extraction
# ---------------------------------------------------------------------------

def _build_data(model: Any) -> dict:
    def _str(v: Any) -> str:
        return str(v) if v else ""

    return {
        "name": _str(model.name),
        "name_english": _str(model.name_english),
        "model_type": str(model.model_type.value) if model.model_type else "",
        "gender": str(model.gender.value) if model.gender else "",
        "birth_date": str(model.birth_date) if model.birth_date else "",
        "nationality": _str(model.nationality),
        "school": _str(model.school),
        "debut": _str(model.debut),
        "hobby": _str(model.hobby),
        "languages": _str(model.languages),
        "height": model.height,
        "weight": model.weight,
        "bust": model.bust,
        "waist": model.waist,
        "hip": model.hip,
        "shoe_size": model.shoe_size,
        "agency_name": _str(model.agency_name),
        "agency_phone": _str(model.agency_phone),
        "contact1": _str(model.contact1),
        "instagram_id": _str(model.instagram_id),
        "instagram_followers": model.instagram_followers,
        "youtube_id": _str(model.youtube_id),
        "youtube_subscribers": model.youtube_subscribers,
        "tiktok_id": _str(model.tiktok_id),
        "tiktok_followers": model.tiktok_followers,
        "career_broadcast": _str(model.career_broadcast),
        "career_movie": _str(model.career_movie),
        "career_commercial": _str(model.career_commercial),
        "career_print_ad": _str(model.career_print_ad),
        "career_fashion_show": _str(model.career_fashion_show),
        "career_musical": _str(model.career_musical),
        "career_other": _str(model.career_other),
        "visa_type": _str(model.visa_type) if hasattr(model, "visa_type") else "",
        "entry_date": str(model.entry_date) if hasattr(model, "entry_date") and model.entry_date else "",
        "memo": _str(model.memo),
        "profile_image": _str(getattr(model, "profile_image", "")),
        # Resolved via files relationship
        "image_path": None,  # filled in build_pptx
    }


# ---------------------------------------------------------------------------
# Slide builder
# ---------------------------------------------------------------------------

def _add_slide(
    prs: Presentation, data: dict, tmpl_key: str,
    upload_dir: str, model_files_dir: str,
) -> None:
    cfg = TMPL.get(tmpl_key, TMPL["new_model_a"])
    color: RGBColor = cfg["color"]
    bg: RGBColor = cfg["bg"]
    layout: str = cfg["layout"]

    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank layout

    # White background
    _rect(slide, 0, 0, W, H, WHITE)

    # Accent bg for sns layout (left info zone)
    if layout == "sns":
        _rect(slide, 0, 0, Cm(18.5), H, bg)

    # Header bar
    _rect(slide, 0, 0, W, Cm(1.5), color)
    header_name = (data.get("name_english") or data.get("name", "")) if layout == "intl" else data.get("name", "")
    _text(slide, header_name, Cm(0.5), Cm(0.05), Cm(17), Cm(1.4), 17, True, WHITE)
    type_label = MODEL_TYPE_LABELS.get(data.get("model_type", ""), "")
    _text(slide, type_label, Cm(20.8), Cm(0.05), Cm(8.4), Cm(1.4), 9, False, WHITE, PP_ALIGN.RIGHT)

    # Photo zone — A4 landscape gives more height (21cm) so photo can be taller
    ph_w = Cm(8.0)
    ph_h = Cm(14.0)
    ph_t = Cm(2.0)
    ph_l = W - ph_w - Cm(0.5) if layout == "sns" else Cm(0.5)

    # Resolve profile image
    img_path = _resolve_path(data.get("image_path") or data.get("profile_image"),
                              upload_dir, model_files_dir)
    _add_photo(slide, img_path, ph_l, ph_t, ph_w, ph_h, color)

    # Info zone
    if layout == "sns":
        info_l = Cm(0.5)
        info_w = W - ph_w - Cm(1.5)
    else:
        info_l = ph_l + ph_w + Cm(0.7)
        info_w = W - info_l - Cm(0.5)

    y = Cm(2.0)

    # Name block
    if layout == "intl":
        en = data.get("name_english") or ""
        _text(slide, en, info_l, y, info_w, Cm(1.6), 22, True, color)
        y += Cm(1.5)
        _text(slide, data.get("name", ""), info_l, y, info_w, Cm(0.8), 11, False, GRAY)
        y += Cm(0.8)
    elif layout == "bold":
        _text(slide, data.get("name", ""), info_l, y, info_w, Cm(1.8), 24, True, DARK)
        y += Cm(1.6)
        en = data.get("name_english") or ""
        if en:
            _text(slide, en, info_l, y, info_w, Cm(0.75), 10, False, GRAY)
            y += Cm(0.7)
    else:  # classic / sns
        _text(slide, data.get("name", ""), info_l, y, info_w, Cm(1.4), 20, True, DARK)
        y += Cm(1.2)
        en = data.get("name_english") or ""
        if en:
            _text(slide, en, info_l, y, info_w, Cm(0.75), 10, False, GRAY)
            y += Cm(0.7)

    # Measurements pill
    meas = []
    if data.get("height"): meas.append(f"키 {data['height']}cm")
    if data.get("weight"): meas.append(f"몸무게 {data['weight']}kg")
    if data.get("bust"): meas.append(f"가슴 {data['bust']}")
    if data.get("waist"): meas.append(f"허리 {data['waist']}")
    if data.get("hip"): meas.append(f"힙 {data['hip']}")
    if meas:
        _rect(slide, info_l, y, info_w, Cm(0.65), bg)
        _text(slide, "  ·  ".join(meas), info_l + Cm(0.2), y + Cm(0.05),
              info_w - Cm(0.4), Cm(0.55), 9, False, color)
        y += Cm(0.75)
    y += Cm(0.2)

    # SNS stats (influencer template → prominent)
    if layout == "sns":
        _section_title(slide, "SNS", info_l, y, color)
        y += Cm(0.65)
        for id_key, cnt_key, prefix in [
            ("instagram_id", "instagram_followers", "@"),
            ("youtube_id", "youtube_subscribers", ""),
            ("tiktok_id", "tiktok_followers", "@"),
        ]:
            val = data.get(id_key) or ""
            if val:
                cnt = _fmt_num(data.get(cnt_key))
                platform = id_key.replace("_id", "").capitalize()
                row = f"{platform}  {prefix}{val}" + (f"  ({cnt})" if cnt else "")
                _text(slide, row, info_l, y, info_w, Cm(0.65), 11, True, color)
                y += Cm(0.65)
        y += Cm(0.2)

    # Basic info
    _section_title(slide, "기본 정보", info_l, y, color)
    y += Cm(0.65)
    basic = []
    if data.get("gender"): basic.append(("성별", GENDER_LABELS.get(data["gender"], data["gender"])))
    if data.get("birth_date"): basic.append(("생년월일", data["birth_date"]))
    if data.get("nationality"): basic.append(("국적", data["nationality"]))
    if layout == "intl":
        if data.get("visa_type"): basic.append(("비자", data["visa_type"]))
        if data.get("entry_date"): basic.append(("입국일", data["entry_date"]))
        if data.get("languages"): basic.append(("언어", data["languages"]))
    if data.get("school"): basic.append(("출신학교", data["school"]))
    if data.get("debut"): basic.append(("데뷔", data["debut"]))
    for lbl, val in basic:
        _info_row(slide, lbl, val, y, info_l, info_w)
        y += Cm(0.52)
    y += Cm(0.2)

    # Career
    career = [(lbl, data.get(fld, "")) for lbl, fld in CAREER_FIELDS if data.get(fld)]
    if career and y < H - Cm(4):
        _section_title(slide, "경력", info_l, y, color)
        y += Cm(0.65)
        for lbl, val in career:
            if y > H - Cm(2.5):
                break
            _info_row(slide, lbl, val, y, info_l, info_w)
            y += Cm(0.52)
        y += Cm(0.15)

    # SNS (non-influencer templates)
    if layout != "sns" and y < H - Cm(2.5):
        sns_rows = []
        if data.get("instagram_id"):
            cnt = _fmt_num(data.get("instagram_followers"))
            sns_rows.append(("Instagram", f"@{data['instagram_id']}" + (f" ({cnt})" if cnt else "")))
        if data.get("youtube_id"):
            cnt = _fmt_num(data.get("youtube_subscribers"))
            sns_rows.append(("YouTube", data["youtube_id"] + (f" ({cnt})" if cnt else "")))
        if data.get("tiktok_id"):
            cnt = _fmt_num(data.get("tiktok_followers"))
            sns_rows.append(("TikTok", f"@{data['tiktok_id']}" + (f" ({cnt})" if cnt else "")))
        if sns_rows:
            _section_title(slide, "SNS", info_l, y, color)
            y += Cm(0.65)
            for lbl, val in sns_rows:
                if y > H - Cm(2.5):
                    break
                _info_row(slide, lbl, val, y, info_l, info_w)
                y += Cm(0.52)

    # Footer
    _rect(slide, 0, H - Cm(0.9), W, Cm(0.9), color)
    _text(slide, "CONFIDENTIAL — 본 자료는 외부 공개를 금합니다",
          Cm(1), H - Cm(0.85), W - Cm(2), Cm(0.8),
          size=7, color=WHITE, align=PP_ALIGN.CENTER)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_pptx(
    models: list[Any],
    template: str = "new_model_a",
    upload_dir: str = "./uploads",
    model_files_dir: str = "./model_files",
) -> bytes:
    """Build a PPTX bytes blob for the given model ORM objects."""
    if template not in TMPL:
        template = "new_model_a"

    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H

    for model in models:
        data = _build_data(model)
        # Resolve profile image from files relationship
        profile_file = next(
            (f for f in getattr(model, "files", []) if f.is_profile_image), None
        )
        if profile_file:
            data["image_path"] = _resolve_path(
                "/" + profile_file.file_path.lstrip("/"),
                upload_dir, model_files_dir,
            )
        _add_slide(prs, data, template, upload_dir, model_files_dir)

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)
    return buf.read()
