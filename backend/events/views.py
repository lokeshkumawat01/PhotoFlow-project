import uuid
import cv2
from pathlib import Path

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.throttling import ScopedRateThrottle
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.http import HttpResponse, FileResponse, Http404

from .models import Event, VIPProfile
from .qr_generator import generate_styled_qr_png
from photos.utils.image_processing import load_image_corrected, pil_to_cv2_bgr
from aiengine.face_engine import detect_and_embed_faces


# ============================================================
# EVENT CREATION
# ============================================================

class EventCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'event_create'

    def post(self, request):
        event_name = request.data.get('event_name', '').strip()
        event_date = request.data.get('event_date')
        plan_type = request.data.get('plan_type', 'free')

        if not event_name or not event_date:
            return Response(
                {"error": "event_name and event_date are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_plans = [choice[0] for choice in Event.PLAN_CHOICES]
        if plan_type not in valid_plans:
            return Response(
                {"error": f"Invalid plan_type. Must be one of {valid_plans}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = Event.objects.create(
            organizer=request.user,
            name=event_name,
            event_date=event_date,
            plan_type=plan_type,
        )

        return Response({
            "event_id": str(event.id),
            "name": event.name,
            "qr_token": str(event.qr_token),
        }, status=status.HTTP_201_CREATED)


# ============================================================
# QR CODE
# ============================================================

def _build_guest_url(request, event) -> str:
    """
    Builds the guest-facing link that the QR code should point to.
    Adjust FRONTEND_BASE_URL in settings.py if your frontend runs on a
    different host/port than the default Next.js dev server.
    """
    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://127.0.0.1:3000')
    return f"{frontend_base}/event/{event.qr_token}"


class EventQRCodeView(APIView):
    """
    Returns a plain (unstyled) QR code PNG for the event's guest link.
    Kept for any place that just needs a quick, no-frills QR image.
    For the customizable version (styles, logo, center text), see
    QRStyleView below.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        guest_url = _build_guest_url(request, event)

        png_bytes = generate_styled_qr_png(data=guest_url, style="classic")
        return HttpResponse(png_bytes, content_type="image/png")


class QRStyleView(APIView):
    """
    Generates a styled QR code PNG on the fly based on the organizer's
    chosen style, optional center logo, or optional center text badge.
    Nothing is stored on disk -- styling is purely presentational.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)

        style = request.data.get("style", "classic")
        fg_color = request.data.get("fg_color", "#1f1f1f")
        bg_color = request.data.get("bg_color", "#ffffff")
        center_text = request.data.get("center_text", "").strip()
        logo_file = request.FILES.get("logo")

        guest_url = _build_guest_url(request, event)
        logo_bytes = logo_file.read() if logo_file else None

        try:
            png_bytes = generate_styled_qr_png(
                data=guest_url,
                style=style,
                fg_color=fg_color,
                bg_color=bg_color,
                logo_bytes=logo_bytes,
                center_text=center_text or None,
            )
        except Exception:
            return Response(
                {"error": "Could not generate this QR style. Try a different logo image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return HttpResponse(png_bytes, content_type="image/png")


# ============================================================
# VIP / FAMILY ACCESS
# ============================================================

def _closest_face_to_center(faces, image_shape):
    img_height, img_width = image_shape[:2]
    center_x, center_y = img_width / 2, img_height / 2

    def distance(face):
        x, y, w, h = face.bbox
        fx, fy = x + w / 2, y + h / 2
        return ((fx - center_x) ** 2 + (fy - center_y) ** 2) ** 0.5

    return min(faces, key=distance)


def _save_face_thumbnail(cv2_image, bbox, vip_id) -> str:
    x, y, w, h = bbox
    pad = int(0.35 * max(w, h))

    img_h, img_w = cv2_image.shape[:2]
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(img_w, x + w + pad)
    y2 = min(img_h, y + h + pad)

    face_crop = cv2_image[y1:y2, x1:x2]
    if face_crop.size == 0:
        return ""

    success, encoded = cv2.imencode('.jpg', face_crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not success:
        return ""

    storage_key = f"vip_thumbnails/{vip_id}.jpg"
    full_path = Path(settings.MEDIA_ROOT) / storage_key
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_bytes(encoded.tobytes())
    return storage_key


class VIPProfileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)

        name = request.data.get('name', '').strip()
        photo_file = request.FILES.get('reference_photo')

        if not name or not photo_file:
            return Response(
                {"error": "name and reference_photo are both required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_bytes = photo_file.read()
        try:
            img = load_image_corrected(file_bytes)
            cv2_image = pil_to_cv2_bgr(img)
        except Exception:
            return Response(
                {"error": "We couldn't read that image. Try a different photo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        faces = detect_and_embed_faces(cv2_image)
        if not faces:
            return Response(
                {"error": "No clear face detected in this photo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        best_face = _closest_face_to_center(faces, cv2_image.shape)

        vip_id = uuid.uuid4()
        thumbnail_key = _save_face_thumbnail(cv2_image, best_face.bbox, vip_id)

        vip = VIPProfile.objects.create(
            id=vip_id,
            event=event,
            name=name,
            reference_embedding=best_face.embedding.tolist(),
            thumbnail_key=thumbnail_key,
        )
        return Response({"id": str(vip.id), "name": vip.name}, status=status.HTTP_201_CREATED)


class VIPGroupUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)

        group_photo = request.FILES.get('group_photo')
        if not group_photo:
            return Response(
                {"error": "Please upload a group photo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_bytes = group_photo.read()
        try:
            img = load_image_corrected(file_bytes)
            cv2_image = pil_to_cv2_bgr(img)
        except Exception:
            return Response(
                {"error": "We couldn't read that image. Try a different photo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        faces = detect_and_embed_faces(cv2_image)
        if not faces:
            return Response(
                {"error": "No faces were detected in this photo. Try a clearer, well-lit group photo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_count = VIPProfile.objects.filter(event=event).count()

        created_vips = []
        for i, face in enumerate(faces, start=1):
            vip_id = uuid.uuid4()
            thumbnail_key = _save_face_thumbnail(cv2_image, face.bbox, vip_id)

            vip = VIPProfile.objects.create(
                id=vip_id,
                event=event,
                name=f"VIP {existing_count + i}",
                reference_embedding=face.embedding.tolist(),
                thumbnail_key=thumbnail_key,
            )
            created_vips.append({"id": str(vip.id), "name": vip.name})

        return Response({
            "message": f"{len(created_vips)} people added as VIPs from this photo.",
            "vips": created_vips,
        }, status=status.HTTP_201_CREATED)


class VIPProfileListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        vips = event.vip_profiles.all().values('id', 'name', 'added_by_organizer_at')
        return Response(list(vips))


class VIPThumbnailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, event_id, vip_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        vip = get_object_or_404(VIPProfile, id=vip_id, event=event)

        if not vip.thumbnail_key:
            raise Http404("No thumbnail available for this VIP.")

        full_path = Path(settings.MEDIA_ROOT) / vip.thumbnail_key
        if not full_path.exists():
            raise Http404("Thumbnail file not found.")

        return FileResponse(open(full_path, 'rb'), content_type='image/jpeg')


class VIPRenameView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, event_id, vip_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        vip = get_object_or_404(VIPProfile, id=vip_id, event=event)

        new_name = request.data.get('name', '').strip()
        if not new_name:
            return Response({"error": "Name cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        vip.name = new_name
        vip.save(update_fields=['name'])
        return Response({"id": str(vip.id), "name": vip.name})


class VIPProfileDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, event_id, vip_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        vip = get_object_or_404(VIPProfile, id=vip_id, event=event)
        vip.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)