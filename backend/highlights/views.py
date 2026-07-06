from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle
from django.shortcuts import get_object_or_404
from django.core.signing import TimestampSigner
from django.conf import settings

from guests.models import Guest
from .models import HighlightReel
from .tasks import build_highlight_reel_task


def _signed_video_url(storage_key: str) -> str:
    signer = TimestampSigner()
    token = signer.sign(storage_key)
    return f"{settings.BACKEND_BASE_URL}/api/photos/serve/?token={token}&max_age=3600"


class GenerateHighlightView(APIView):
    """
    Starts building a highlight reel for a guest. Anonymous (guest-facing,
    matching the rest of the guest API), but scoped strictly to the
    guest_id the caller provides -- a guest can only ever trigger/see
    their own reel, never anyone else's.
    """
    authentication_classes = []
    permission_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'highlight_generate'

    def post(self, request):
        guest_id = request.data.get("guest_id")
        selected_photo_ids = request.data.get("photo_ids")

        if not guest_id:
            return Response({"error": "guest_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        guest = get_object_or_404(Guest, id=guest_id)

        if selected_photo_ids:
            # Guest ne manually chuni hain -- sirf unhi photos ko include karo,
            # but security ke liye verify karo ye guest ki hi matched photos hain
            valid_ids = set(guest.matched_photo_ids or [])
            photo_ids = [pid for pid in selected_photo_ids if pid in valid_ids]
        else:
            photo_ids = guest.matched_photo_ids or []

        if len(photo_ids) < 3:
            return Response({"error": "Select at least 3 photos."}, status=400)

        reel = HighlightReel.objects.create(guest=guest, status='queued', selected_photo_ids=photo_ids)
        build_highlight_reel_task.delay(str(reel.id))

        matched_count = len(guest.matched_photo_ids or [])
        if matched_count < 3:
            return Response(
                {"error": "You need at least 3 matched photos to generate a highlight reel."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent spamming the generate button -- reuse an in-flight or
        # already-finished reel instead of queuing duplicates
        existing = HighlightReel.objects.filter(guest=guest).order_by('-created_at').first()
        if existing and existing.status in ['queued', 'processing']:
            return Response({"reel_id": str(existing.id), "status": existing.status})
        if existing and existing.status == 'done':
            return Response({"reel_id": str(existing.id), "status": "done"})

        reel = HighlightReel.objects.create(guest=guest, status='queued')
        build_highlight_reel_task.delay(str(reel.id))

        return Response({"reel_id": str(reel.id), "status": "queued"}, status=status.HTTP_202_ACCEPTED)


class HighlightStatusView(APIView):
    """
    Polling endpoint for reel status. Requires BOTH reel_id and guest_id
    to match -- this prevents one guest from polling/viewing another
    guest's reel by guessing or enumerating reel_ids.
    """
    authentication_classes = []
    permission_classes = []
    throttle_classes = []  # frequent polling, same reasoning as check-new-photos

    def get(self, request, reel_id):
        guest_id = request.GET.get('guest_id')
        if not guest_id:
            return Response({"error": "guest_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        reel = get_object_or_404(HighlightReel, id=reel_id, guest_id=guest_id)

        video_url = None
        if reel.status == 'done' and reel.video_storage_key:
            video_url = _signed_video_url(reel.video_storage_key)

        return Response({
            "status": reel.status,
            "video_url": video_url,
        })