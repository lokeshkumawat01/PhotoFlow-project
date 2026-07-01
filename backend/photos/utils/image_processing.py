import io
import logging
import pillow_heif
pillow_heif.register_heif_opener()
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

PREVIEW_MAX_DIMENSION = 1280
PREVIEW_JPEG_QUALITY = 70
HD_JPEG_QUALITY = 95


def load_image_corrected(file_bytes: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(file_bytes))
    original_format = img.format
    img = ImageOps.exif_transpose(img)
    img.format = original_format 
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    return img


def generate_preview(img: Image.Image) -> bytes:
    preview = img.copy()
    preview.thumbnail((PREVIEW_MAX_DIMENSION, PREVIEW_MAX_DIMENSION), Image.LANCZOS)

    buf = io.BytesIO()
    preview.save(buf, format='JPEG', quality=PREVIEW_JPEG_QUALITY, optimize=True)
    return buf.getvalue()


def prepare_hd_bytes(original_file_bytes: bytes, img: Image.Image) -> bytes:
    
    fmt = (img.format or '').upper()
    if fmt in ('JPEG', 'JPG', 'PNG', 'WEBP'):
        return original_file_bytes

    buf = io.BytesIO()
    rgb_img = img.convert('RGB') if img.mode != 'RGB' else img
    rgb_img.save(buf, format='JPEG', quality=HD_JPEG_QUALITY, optimize=True)
    return buf.getvalue()


def get_image_dimensions(img: Image.Image) -> tuple[int, int]:
    return img.size  # (width, height)


def pil_to_cv2_bgr(img: Image.Image):
    import numpy as np
    import cv2
    rgb_array = np.array(img.convert('RGB'))
    return cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)