import logging
import uuid
import tempfile
from pathlib import Path
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions 
from rest_framework.parsers import MultiPartParser
from rest_framework.throttling import ScopedRateThrottle
from django.shortcuts import get_object_or_404

from events.models import Event
from photos.models import Photo
from .tasks import process_event_zip
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import HttpResponse, Http404
from .tasks import process_single_photo

logger = logging.getLogger(__name__)

MAX_ZIP_BYTES = 200 * 1024 * 1024 * 1024
MAX_SINGLE_PHOTO_BYTES = 50 * 1024 * 1024

VALID_MAGIC_BYTES = {
    b'\xff\xd8\xff': 'jpg',
    b'\x89PNG\r\n\x1a\n': 'png',
    b'RIFF': 'heic_container',  # some HEIC containers start with RIFF-like headers
}

def _looks_like_image(file_bytes: bytes) -> bool:
    header = file_bytes[:12]
    for magic in VALID_MAGIC_BYTES:
        if header.startswith(magic):
            return True
    # HEIC files often have 'ftyp' a few bytes in rather than at byte 0
    return b'ftyp' in header

class EventUploadStatusView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    def get(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        photos = Photo.objects.filter(event=event)
        return Response({
            'total': photos.count(),
            'done': photos.filter(status='done').count(),
            'processing': photos.filter(status='processing').count(),
            'queued': photos.filter(status='queued').count(),
            'failed': photos.filter(status='failed').count(),
        })
    
class ServeSignedFileView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    def get(self, request):
        token = request.query_params.get('token')
        max_age = int(request.query_params.get('max_age', 600))  # default 10 min

        if not token:
            raise Http404("Missing token")

        signer = TimestampSigner()
        try:
            storage_key = signer.unsign(token, max_age=max_age)
        except SignatureExpired:
            return Response({'error': 'Link expired, please refresh.'}, status=status.HTTP_410_GONE)
        except BadSignature:
            raise Http404("Invalid token")

        from django.conf import settings
        from pathlib import Path

        full_path = Path(settings.MEDIA_ROOT) / storage_key
        if not full_path.exists():
            raise Http404("File not found")

        with open(full_path, 'rb') as f:
            file_bytes = f.read()

        content_type = 'image/jpeg'
        if storage_key.lower().endswith('.png'):
            content_type = 'image/png'

        response = HttpResponse(file_bytes, content_type=content_type)
        response['Cache-Control'] = 'private, no-store'  # browser cache na kare
        return response
    
class ChunkedUploadView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser]
    throttle_classes = []

    def post(self, request, event_id):
        from events.models import Event

        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)

        chunk = request.FILES.get("chunk")
        chunk_index = request.data.get("chunk_index")
        total_chunks = request.data.get("total_chunks")
        upload_id = request.data.get("upload_id")
        filename = request.data.get("filename", "album.zip")

        if not all([chunk, chunk_index is not None, total_chunks, upload_id]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chunk_index = int(chunk_index)
            total_chunks = int(total_chunks)
        except (ValueError, TypeError):
            return Response({"error": "chunk_index and total_chunks must be numbers"}, status=status.HTTP_400_BAD_REQUEST)

        if chunk_index < 0 or total_chunks <= 0 or chunk_index >= total_chunks:
            return Response({"error": "Invalid chunk index"}, status=status.HTTP_400_BAD_REQUEST)

        chunk_dir = Path(settings.MEDIA_ROOT) / "chunked_uploads" / upload_id
        try:
            chunk_dir.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            logger.error(f"Could not create chunk directory for upload {upload_id}: {e}")
            return Response(
                {"error": "Server storage error. Please try again or contact support."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        chunk_path = chunk_dir / f"chunk_{chunk_index:06d}"
        try:
            with open(chunk_path, "wb") as f:
                for piece in chunk.chunks():
                    f.write(piece)
        except OSError as e:
            logger.error(f"Failed to write chunk {chunk_index} for upload {upload_id}: {e}")
            return Response(
                {"error": "Could not save this piece of the upload. The server may be out of disk space."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        existing_chunks = len(list(chunk_dir.glob("chunk_*")))

        if existing_chunks < total_chunks:
            return Response({
                "status": "chunk_received",
                "received": existing_chunks,
                "total": total_chunks,
            })

        final_path = Path(settings.MEDIA_ROOT) / "tmp_uploads" / f"{event.id}_{filename}"
        final_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(final_path, "wb") as outfile:
                for i in range(total_chunks):
                    piece_path = chunk_dir / f"chunk_{i:06d}"
                    if not piece_path.exists():
                        raise FileNotFoundError(f"Missing chunk {i}")
                    with open(piece_path, "rb") as infile:
                        outfile.write(infile.read())
        except (OSError, FileNotFoundError) as e:
            logger.error(f"Failed to join chunks for upload {upload_id}: {e}")
            return Response(
                {"error": "Could not assemble the uploaded file. Please try uploading again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        for piece_path in chunk_dir.glob("chunk_*"):
            piece_path.unlink()
        chunk_dir.rmdir()

        from .tasks import process_event_zip
        process_event_zip.delay(str(event.id), str(final_path))

        return Response({
            "status": "upload_complete",
            "message": "All chunks received, processing started in background.",
        })

class SinglePhotoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'live_photo_upload'
 
    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
 
        photo_file = request.FILES.get('photo')
        if not photo_file:
            return Response({"error": "No photo provided."}, status=status.HTTP_400_BAD_REQUEST)
 
        if photo_file.size > MAX_SINGLE_PHOTO_BYTES:
            return Response({"error": "Photo file too large."}, status=status.HTTP_400_BAD_REQUEST)
 
        file_bytes = photo_file.read()
 
        if not _looks_like_image(file_bytes):
            return Response(
                {"error": "This file doesn't look like a valid image."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        suffix = Path(photo_file.name).suffix or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            temp_file_path = tmp.name
 
        photo = Photo.objects.create(
            id=uuid.uuid4(),
            event=event,
            original_filename=photo_file.name,
            status='queued',
        )
 
        process_single_photo.delay(str(photo.id), temp_file_path)
 
        return Response({
            "photo_id": str(photo.id),
            "status": "queued",
        }, status=status.HTTP_202_ACCEPTED)