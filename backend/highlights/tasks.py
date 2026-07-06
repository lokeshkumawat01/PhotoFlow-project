import logging, cv2
import numpy as np
from celery import shared_task
from django.conf import settings
from pathlib import Path

from .models import HighlightReel
from photos.models import Photo, FaceEmbedding
from .utils.video_builder import create_face_aware_video

logger = logging.getLogger(__name__)

MAX_REEL_PHOTOS = 15  # keeps the reel short (highlight, not a full album) and render-time reasonable


def _find_guest_face(photo, guest_embedding):
    if guest_embedding is None:
        return None

    faces = FaceEmbedding.objects.filter(photo=photo)
    if not faces:
        return None

    guest_vec = np.array(guest_embedding)
    best_face, best_distance = None, float('inf')

    for face in faces:
        face_vec = np.array(face.embedding)
        distance = 1 - float(np.dot(guest_vec, face_vec))
        if distance < best_distance:
            best_distance, best_face = distance, face

    return best_face

def _is_good_quality(photo_path: str, min_sharpness: float = 100.0) -> bool:
    try:
        img = cv2.imread(photo_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return False
        variance = cv2.Laplacian(img, cv2.CV_64F).var()
        return variance >= min_sharpness
    except Exception:
        return True 


def _select_photos_for_reel(photo_ids: list) -> list:
    if len(photo_ids) <= MAX_REEL_PHOTOS:
        return photo_ids

    step = len(photo_ids) / MAX_REEL_PHOTOS
    return [photo_ids[int(i * step)] for i in range(MAX_REEL_PHOTOS)]


@shared_task
def build_highlight_reel_task(reel_id: str):
    try:
        reel = HighlightReel.objects.get(id=reel_id)
    except HighlightReel.DoesNotExist:
        return

    reel.status = 'processing'
    reel.save(update_fields=['status'])

    guest = reel.guest
    photo_ids = reel.selected_photo_ids or guest.matched_photo_ids or []

    if len(photo_ids) < 3:
        reel.status = 'failed'
        reel.save(update_fields=['status'])
        return

    frame_data = []
    for pid in photo_ids:
        try:
            photo = Photo.objects.get(id=pid)
        except Photo.DoesNotExist:
            continue

        if not photo.storage_key_hd:
            continue

        photo_path = str(Path(settings.MEDIA_ROOT) / photo.storage_key_hd)
        if not Path(photo_path).exists():
            continue

        face = _find_guest_face(photo, guest.selfie_embedding)
        bbox = (face.bbox_x, face.bbox_y, face.bbox_w, face.bbox_h) if face else None

        frame_data.append({"path": photo_path, "bbox": bbox})

    if len(frame_data) < 3:
        reel.status = 'failed'
        reel.save(update_fields=['status'])
        return

    try:
        out_filename = f"reels/{reel.id}.mp4"
        out_path = Path(settings.MEDIA_ROOT) / out_filename
        out_path.parent.mkdir(parents=True, exist_ok=True)

        create_face_aware_video(frame_data, str(out_path))

        reel.video_storage_key = out_filename
        reel.status = 'done'
        reel.save(update_fields=['video_storage_key', 'status'])

    except Exception as e:
        logger.exception(f"Failed to generate highlight reel {reel_id}: {e}")
        reel.status = 'failed'
        reel.save(update_fields=['status'])