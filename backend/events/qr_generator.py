import io
from PIL import Image, ImageDraw, ImageFont, ImageOps

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import (
    RoundedModuleDrawer,
    CircleModuleDrawer,
    SquareModuleDrawer,
)
from qrcode.image.styles.colormasks import SolidFillColorMask, RadialGradiantColorMask


WHITE = (255, 255, 255)

DRAWER_PRESETS = {
    "classic": SquareModuleDrawer(),
    "rounded_coral": RoundedModuleDrawer(),
    "dots": CircleModuleDrawer(),
    "coral_gradient": RoundedModuleDrawer(),
}

# Minimum final pixel size -- guarantees a crisp, print-ready image no
# matter how "small" the QR data makes the raw module grid.
MIN_OUTPUT_SIZE = 1200


def _hex_to_rgb(hex_color: str, fallback=(31, 31, 31)):
    try:
        hex_color = hex_color.strip().lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join(c * 2 for c in hex_color)
        return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
    except Exception:
        return fallback


def _make_base_qr(data: str, style: str, fg_color: str, bg_color: str) -> Image.Image:
    drawer = DRAWER_PRESETS.get(style, DRAWER_PRESETS["classic"])
    fg_rgb = _hex_to_rgb(fg_color, fallback=(31, 31, 31))
    bg_rgb = _hex_to_rgb(bg_color, fallback=WHITE)

    if style == "coral_gradient":
        edge_rgb = tuple(max(0, c - 45) for c in fg_rgb)  # slightly darker shade for the edge
        color_mask = RadialGradiantColorMask(back_color=bg_rgb, center_color=fg_rgb, edge_color=edge_rgb)
    else:
        color_mask = SolidFillColorMask(front_color=fg_rgb, back_color=bg_rgb)

    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # highest correction --
        box_size=24,                                          # needed since the center
        border=3,                                              # may be covered by a logo/badge
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=drawer,
        color_mask=color_mask,
    ).convert("RGBA")

    # Upscale to a guaranteed HD floor so it stays crisp when printed or
    # opened in an image editor, regardless of the QR's raw module count.
    if img.width < MIN_OUTPUT_SIZE:
        scale = MIN_OUTPUT_SIZE / img.width
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.LANCZOS)

    return img


def _circular_crop(image: Image.Image, size: int) -> Image.Image:
    """
    Fits any image (square, rectangle, tall, wide) into a perfect circle:
    1. Cover-fit (scale + center-crop) so there's no stretching/distortion
    2. Clip to a circular alpha mask
    This guarantees a clean circular badge regardless of the source image's
    original aspect ratio -- fixes logos rendering as an awkward rectangle.
    """
    fitted = ImageOps.fit(image.convert("RGBA"), (size, size), method=Image.LANCZOS)

    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)

    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(fitted, (0, 0), mask)
    return result


def _paste_center_logo(qr_img: Image.Image, logo_bytes: bytes) -> Image.Image:
    logo = Image.open(io.BytesIO(logo_bytes))

    qr_w, qr_h = qr_img.size
    badge_size = int(qr_w * 0.26)
    white_ring = int(badge_size * 1.12)  # slightly larger white circle behind the logo for contrast

    # White circular backdrop first (so the logo pops against busy QR patterns)
    backdrop = Image.new("RGBA", (white_ring, white_ring), (0, 0, 0, 0))
    ImageDraw.Draw(backdrop).ellipse((0, 0, white_ring, white_ring), fill=WHITE)

    circular_logo = _circular_crop(logo, badge_size)
    logo_offset = (white_ring - badge_size) // 2
    backdrop.paste(circular_logo, (logo_offset, logo_offset), circular_logo)

    pos = ((qr_w - white_ring) // 2, (qr_h - white_ring) // 2)
    qr_img.paste(backdrop, pos, backdrop)
    return qr_img


def _paste_center_text(qr_img: Image.Image, text: str, fg_color: str) -> Image.Image:
    qr_w, qr_h = qr_img.size
    badge_size = int(qr_w * 0.26)
    fg_rgb = _hex_to_rgb(fg_color, fallback=(198, 90, 61))

    badge = Image.new("RGBA", (badge_size, badge_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)
    draw.ellipse((0, 0, badge_size, badge_size), fill=fg_rgb)

    display_text = text.strip()[:3].upper() or "PF"

    try:
        font = ImageFont.truetype("arialbd.ttf", int(badge_size * 0.34))
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), display_text, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        ((badge_size - text_w) / 2 - bbox[0], (badge_size - text_h) / 2 - bbox[1]),
        display_text,
        fill=WHITE,
        font=font,
    )

    pos = ((qr_w - badge_size) // 2, (qr_h - badge_size) // 2)
    qr_img.paste(badge, pos, badge)
    return qr_img


def generate_styled_qr_png(
    data: str,
    style: str = "classic",
    fg_color: str = "#1f1f1f",
    bg_color: str = "#ffffff",
    logo_bytes: bytes | None = None,
    center_text: str | None = None,
) -> bytes:
    """
    Builds an HD-resolution QR code PNG with custom colors and an optional
    center logo (always circle-cropped, never stretched) or text badge.
    """
    qr_img = _make_base_qr(data, style, fg_color, bg_color)

    if logo_bytes:
        qr_img = _paste_center_logo(qr_img, logo_bytes)
    elif center_text:
        qr_img = _paste_center_text(qr_img, center_text, fg_color)

    buffer = io.BytesIO()
    qr_img.convert("RGB").save(buffer, format="PNG", optimize=False)
    return buffer.getvalue()