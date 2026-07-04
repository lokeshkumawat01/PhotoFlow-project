import logging
import zipfile
from pathlib import Path

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'}
MAX_PHOTO_BYTES = 50 * 1024 * 1024  # 50MB per photo safety cap


@shared_task(bind=True, max_retries=2)
def process_event_zip(self, event_id: str, zip_path: str):
    from events.models import Event
    from photos.models import Photo
    import hashlib

    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        logger.error(f"process_event_zip: event {event_id} not found")
        return {'error': 'event_not_found'}

    queued_count = 0
    skipped_duplicates = 0
    skipped_invalid = 0

    # Temporary folder where we'll write each extracted photo to disk,
    # instead of passing its raw bytes through the Celery/Redis broker.
    extract_dir = Path(settings.MEDIA_ROOT) / 'tmp_extracted' / event_id
    extract_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, 'r') as zf:
        for name in zf.namelist():
            ext = Path(name).suffix.lower()
            if ext not in ALLOWED_EXTENSIONS:
                continue

            try:
                file_bytes = zf.read(name)
            except Exception as e:
                logger.warning(f"Could not read {name} from zip: {e}")
                skipped_invalid += 1
                continue

            if len(file_bytes) == 0 or len(file_bytes) > MAX_PHOTO_BYTES:
                skipped_invalid += 1
                continue

            file_hash = hashlib.sha256(file_bytes).hexdigest()

            if Photo.objects.filter(event=event, file_hash=file_hash).exists():
                skipped_duplicates += 1
                continue

            photo = Photo.objects.create(
                event=event,
                file_hash=file_hash,
                original_filename=Path(name).name,
                status='queued',
            )

            # Write the extracted photo to a temp file on disk -- only
            # its PATH (a tiny string) goes through Redis, not the
            # multi-megabyte image itself. This is what keeps Redis
            # memory usage flat no matter how many photos are queued.
            temp_photo_path = extract_dir / f"{photo.id}{ext}"
            with open(temp_photo_path, 'wb') as f:
                f.write(file_bytes)

            process_single_photo.delay(str(photo.id), str(temp_photo_path))
            queued_count += 1

    try:
        Path(zip_path).unlink()
    except OSError:
        pass

    logger.info(
        f"Event {event_id}: queued={queued_count}, duplicates={skipped_duplicates}, invalid={skipped_invalid}"
    )
    return {
        'queued': queued_count,
        'duplicates_skipped': skipped_duplicates,
        'invalid_skipped': skipped_invalid,
    }

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_single_photo(self, photo_id: str, temp_file_path: str):
    from photos.models import Photo, FaceEmbedding
    from photos.utils.image_processing import (
        load_image_corrected, generate_preview, prepare_hd_bytes,
        get_image_dimensions, pil_to_cv2_bgr,
    )
    from aiengine.face_engine import detect_and_embed_faces

    try:
        photo = Photo.objects.get(id=photo_id)
    except Photo.DoesNotExist:
        logger.error(f"Photo {photo_id} not found")
        return

    photo.status = 'processing'
    photo.save(update_fields=['status'])

    try:
        # Read the actual image bytes from the temp file path -- this
        # is the only place file_bytes gets defined now.
        with open(temp_file_path, 'rb') as f:
            file_bytes = f.read()

        img = load_image_corrected(file_bytes)
        width, height = get_image_dimensions(img)

        preview_bytes = generate_preview(img)
        hd_bytes = prepare_hd_bytes(file_bytes, img)

        media_root = Path(settings.MEDIA_ROOT)
        preview_dir = media_root / 'events' / str(photo.event_id) / 'preview'
        hd_dir = media_root / 'events' / str(photo.event_id) / 'hd'
        preview_dir.mkdir(parents=True, exist_ok=True)
        hd_dir.mkdir(parents=True, exist_ok=True)

        preview_path = preview_dir / f"{photo.id}.jpg"
        hd_path = hd_dir / f"{photo.id}.jpg"

        with open(preview_path, 'wb') as f:
            f.write(preview_bytes)
        with open(hd_path, 'wb') as f:
            f.write(hd_bytes)

        cv2_image = pil_to_cv2_bgr(img)
        detected_faces = detect_and_embed_faces(cv2_image)

        for face in detected_faces:
            FaceEmbedding.objects.create(
                photo=photo,
                embedding=face.embedding.tolist(),
                bbox_x=face.bbox[0], bbox_y=face.bbox[1],
                bbox_w=face.bbox[2], bbox_h=face.bbox[3],
                detection_confidence=face.confidence,
            )

        photo.storage_key_preview = preview_path.relative_to(media_root).as_posix()
        photo.storage_key_hd = hd_path.relative_to(media_root).as_posix()
        photo.width = width
        photo.height = height
        photo.preview_size_kb = round(len(preview_bytes) / 1024, 2)
        photo.hd_size_kb = round(len(hd_bytes) / 1024, 2)
        photo.faces_detected_count = len(detected_faces)
        photo.status = 'done'
        photo.processed_at = timezone.now()
        photo.save()

        from aiengine.matcher import match_guests_for_new_photo, add_photo_to_matched_guests

        face_embeddings = [fe.embedding for fe in detected_faces]  # jo bhi variable-name aapke code mein embeddings ka hai
        if face_embeddings:
            matched_guest_ids = match_guests_for_new_photo(str(photo.event_id), face_embeddings)
            if matched_guest_ids:
                add_photo_to_matched_guests(str(photo.id), matched_guest_ids)

        logger.info(f"Photo {photo_id}: done, {len(detected_faces)} face(s) found")

        # Clean up the temp extracted file now that it's been read and
        # permanently saved into preview/HD storage.
        try:
            Path(temp_file_path).unlink()
        except OSError:
            pass

        return {'status': 'done', 'faces_found': len(detected_faces)}

    except Exception as e:
        logger.exception(f"Photo {photo_id} failed on attempt {self.request.retries + 1}: {e}")
        
        try:
            raise self.retry(exc=e)
        except self.MaxRetriesExceededError:
            photo.status = 'failed'
            if hasattr(photo, 'failure_reason'):
                photo.failure_reason = str(e)[:255]
                photo.save(update_fields=['status', 'failure_reason'])
            else:
                photo.save(update_fields=['status'])

@shared_task
def retry_failed_event_photos(event_id: str):
    from events.models import Event
    from photos.models import Photo
    
    failed_photos = Photo.objects.filter(event_id=event_id, status='failed')
    count = failed_photos.count()
    
    if count == 0:
        logger.info(f"No failed photos to retry for event {event_id}.")
        return {"requeued": 0, "missing_files": 0}

    extract_dir = Path(settings.MEDIA_ROOT) / 'tmp_extracted' / str(event_id)
    
    requeued_count = 0
    missing_count = 0
    
    for photo in failed_photos:
        ext = Path(photo.original_filename).suffix.lower()
        temp_photo_path = extract_dir / f"{photo.id}{ext}"
        
        if temp_photo_path.exists():
            photo.status = 'queued'
            photo.save(update_fields=['status'])
            
            process_single_photo.delay(str(photo.id), str(temp_photo_path))
            requeued_count += 1
        else:
            logger.error(f"Cannot retry photo {photo.id}: Temp file not found on disk.")
            missing_count += 1
            
    logger.info(f"Event {event_id}: Requeued {requeued_count} failed photos. {missing_count} missing.")
    return {
        "requeued": requeued_count,
        "missing_files": missing_count
    }