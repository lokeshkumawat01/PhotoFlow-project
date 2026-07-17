import logging
from django.conf import settings
from django.core.signing import TimestampSigner
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.core.exceptions import ValidationError

from events.models import Event, EventVideo
from photos.models import Photo
from .models import Guest
from aiengine.matcher import match_vip, find_matching_photos, match_video_access


logger = logging.getLogger(__name__)

MAX_SELFIE_BYTES = 10 * 1024 * 1024


def _signed_preview_url(storage_key: str, expires_in_seconds: int = 600) -> str:
    signer = TimestampSigner()
    payload = f"{storage_key}::{expires_in_seconds}"
    token = signer.sign(payload)
    return f"{settings.BACKEND_BASE_URL}/api/photos/serve/?token={token}"


class SelfieMatchView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser]

    def post(self, request, qr_token):
        event = Event.objects.filter(qr_token=qr_token, is_active=True).first()
        if not event:
            return Response({"error": "Event not found or inactive"}, status=status.HTTP_404_NOT_FOUND)
        
        if event.is_expired():
            return Response(
                {"error": "This event's subscription has expired. Please contact the organizer."},
                status=status.HTTP_403_FORBIDDEN,
            )

        selfie_file = request.FILES.get("selfie")
        if not selfie_file:
            return Response({"error": "No selfie provided"}, status=status.HTTP_400_BAD_REQUEST)

        if selfie_file.size == 0:
            return Response(
                {"error": "The selfie file appears to be empty. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if selfie_file.size > MAX_SELFIE_BYTES:
            return Response({"error": "Selfie file too large"}, status=status.HTTP_400_BAD_REQUEST)

        selfie_bytes = selfie_file.read()

        from photos.utils.image_processing import load_image_corrected, pil_to_cv2_bgr
        from aiengine.face_engine import embed_single_face

        try:
            img = load_image_corrected(selfie_bytes)
            cv2_image = pil_to_cv2_bgr(img)
        except Exception as e:
            logger.warning(f"Could not decode selfie image for event {qr_token}: {e}")
            return Response(
                {"error": "We couldn't read that image. Please try taking the selfie again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            embedding = embed_single_face(cv2_image)
        except Exception as e:
            logger.exception(f"Face detection failed for event {qr_token}: {e}")
            return Response(
                {"error": "We had trouble processing your selfie. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        del selfie_bytes, img, cv2_image

        if embedding is None:
            return Response(
                {"error": "No clear face detected. Please try again with better lighting."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def _video_payload(queryset, downloadable):
            expiry = 600 if downloadable else 1200
            return [
                {
                    "video_id": str(v.id),
                    "title": v.title,
                    "video_url": _signed_preview_url(v.storage_key, expires_in_seconds=expiry),
                    "downloadable": downloadable,
                }
                for v in queryset
            ]

        vip_match = match_vip(embedding, str(event.id))

        if vip_match is not None:
            guest = Guest.objects.create(
                event=event,
                selfie_embedding=embedding.tolist(),
                is_vip=True,
                vip_name=vip_match.name,
            )

            all_photos = Photo.objects.filter(
                event=event, status="done"
            ).exclude(storage_key_preview="")

            guest.matched_photo_ids = [str(p.id) for p in all_photos]
            guest.save(update_fields=["matched_photo_ids"])

            results = [
                {
                    "photo_id": str(p.id),
                    "preview_url": _signed_preview_url(p.storage_key_preview),
                    "similarity": None,
                }
                for p in all_photos
            ]

            all_videos = EventVideo.objects.filter(event=event)

            return Response({
                "guest_id": str(guest.id),
                "is_vip": True,
                "has_video_access": True,
                "vip_name": vip_match.name,
                "matched_count": len(results),
                "photos": results,
                "videos": _video_payload(all_videos, downloadable=True),
            })

        video_access_match = match_video_access(embedding, str(event.id))

        if video_access_match is not None:
            guest = Guest.objects.create(
                event=event,
                selfie_embedding=embedding.tolist(),
                has_video_access=True,
            )

            matches = find_matching_photos(str(event.id), embedding)
            guest.matched_photo_ids = [m["photo_id"] for m in matches]
            guest.save(update_fields=["matched_photo_ids"])

            photo_map = {str(p.id): p for p in Photo.objects.filter(id__in=guest.matched_photo_ids)}
            results = []
            for m in matches:
                photo = photo_map.get(m["photo_id"])
                if not photo or not photo.storage_key_preview:
                    continue
                results.append({
                    "photo_id": m["photo_id"],
                    "preview_url": _signed_preview_url(photo.storage_key_preview),
                    "similarity": round(m["similarity"], 3),
                })

            all_videos = EventVideo.objects.filter(event=event)

            return Response({
                "guest_id": str(guest.id),
                "is_vip": False,
                "has_video_access": True,
                "matched_count": len(results),
                "photos": results,
                "videos": _video_payload(all_videos, downloadable=False),
            })

        guest = Guest.objects.create(event=event, selfie_embedding=embedding.tolist())

        matches = find_matching_photos(str(event.id), embedding)
        guest.matched_photo_ids = [m["photo_id"] for m in matches]
        guest.save(update_fields=["matched_photo_ids"])

        photo_map = {str(p.id): p for p in Photo.objects.filter(id__in=guest.matched_photo_ids)}
        results = []
        for m in matches:
            photo = photo_map.get(m["photo_id"])
            if not photo or not photo.storage_key_preview:
                continue
            results.append({
                "photo_id": m["photo_id"],
                "preview_url": _signed_preview_url(photo.storage_key_preview),
                "similarity": round(m["similarity"], 3),
            })

        public_videos = EventVideo.objects.filter(event=event, visibility='public')

        return Response({
            "guest_id": str(guest.id),
            "is_vip": False,
            "has_video_access": False,
            "matched_count": len(results),
            "photos": results,
            "videos": _video_payload(public_videos, downloadable=True),
        })
class RequestHDView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, photo_id):
        guest_id = request.data.get("guest_id")

        if not guest_id:
            return Response({"error": "guest_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            guest = Guest.objects.filter(id=guest_id).first()
        except (ValueError, ValidationError):
            # guest_id wasn't even a valid UUID format
            return Response({"error": "Invalid guest session"}, status=status.HTTP_400_BAD_REQUEST)

        if not guest:
            return Response({"error": "Invalid guest session"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            photo = Photo.objects.filter(id=photo_id, event_id=guest.event_id).first()
        except (ValueError, ValidationError):
            return Response({"error": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)

        if not photo or not photo.storage_key_hd:
            return Response({"error": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)

        if str(photo_id) not in (guest.matched_photo_ids or []):
            return Response({"error": "This photo is not in your matched set"}, status=status.HTTP_403_FORBIDDEN)

        hd_url = _signed_preview_url(photo.storage_key_hd)
        return Response({"hd_url": hd_url, "expires_in_seconds": 600})


class LivenessCheckView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser]

    def post(self, request):
        from photos.utils.image_processing import load_image_corrected, pil_to_cv2_bgr
        from aiengine.liveness import check_blink_liveness

        frames = []
        for key in sorted(request.FILES.keys()):
            file_bytes = request.FILES[key].read()
            try:
                img = load_image_corrected(file_bytes)
                frames.append(pil_to_cv2_bgr(img))
            except Exception:
                continue

        if len(frames) < 3:
            return Response(
                {"is_live": False, "reason": "Not enough frames captured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = check_blink_liveness(frames)
        return Response(result)


class DownloadAllPhotosView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        import io
        import zipfile
        from pathlib import Path
        from django.conf import settings
        from django.http import HttpResponse

        guest_id = request.data.get("guest_id")
        quality = request.data.get("quality", "preview")

        guest = Guest.objects.filter(id=guest_id).first()
        if not guest:
            return Response({"error": "Invalid guest session"}, status=status.HTTP_400_BAD_REQUEST)

        photo_ids = guest.matched_photo_ids or []
        if not photo_ids:
            return Response({"error": "No matched photos to download"}, status=status.HTTP_400_BAD_REQUEST)

        photos = Photo.objects.filter(id__in=photo_ids, event_id=guest.event_id)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for photo in photos:
                storage_key = photo.storage_key_hd if quality == "hd" else photo.storage_key_preview
                if not storage_key:
                    continue

                full_path = Path(settings.MEDIA_ROOT) / storage_key
                if not full_path.exists():
                    continue

                arcname = f"{photo.id}.jpg"
                zip_file.write(full_path, arcname=arcname)

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.getvalue(), content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="my-photos.zip"'
        return response


class LivenessFrameCheckView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser]
    throttle_classes = []

    def post(self, request):
        from photos.utils.image_processing import load_image_corrected, pil_to_cv2_bgr
        from aiengine.liveness import get_ear_for_frame

        frame_file = request.FILES.get("frame")
        if not frame_file:
            return Response({"error": "No frame provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            img = load_image_corrected(frame_file.read())
            cv2_image = pil_to_cv2_bgr(img)
        except Exception:
            return Response({"ear": None})

        ear = get_ear_for_frame(cv2_image)
        return Response({"ear": ear})
    
class CheckNewPhotosView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []
 
    def get(self, request, guest_id):
        guest = Guest.objects.filter(id=guest_id).first()
        if not guest:
            return Response({"error": "Invalid guest session"}, status=status.HTTP_400_BAD_REQUEST)
 
        try:
            known_count = int(request.GET.get('known_count', 0))
        except ValueError:
            known_count = 0
 
        if guest.is_vip:
            all_photos = list(
                Photo.objects.filter(event_id=guest.event_id, status='done')
                .exclude(storage_key_preview='')
                .order_by('uploaded_at')
            )
            current_ids = [str(p.id) for p in all_photos]
 
            if len(current_ids) <= known_count:
                return Response({"has_new": False})
 
            # Keep the VIP's cached matched_photo_ids in sync as the
            # album grows throughout the event.
            guest.matched_photo_ids = current_ids
            guest.save(update_fields=['matched_photo_ids'])
 
            new_photos = all_photos[known_count:]
        else:
            current_ids = guest.matched_photo_ids or []
            if len(current_ids) <= known_count:
                return Response({"has_new": False})
 
            new_ids = current_ids[known_count:]
            new_photos = Photo.objects.filter(id__in=new_ids)
 
        results = [
            {
                "photo_id": str(p.id),
                "preview_url": _signed_preview_url(p.storage_key_preview),
            }
            for p in new_photos if p.storage_key_preview
        ]
 
        return Response({
            "has_new": len(results) > 0,
            "new_photos": results,
            "total_count": len(guest.matched_photo_ids or []),
        })