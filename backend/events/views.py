from datetime import datetime, timedelta
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions 
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Event, VIPProfile

from .models import Event
from .qr_generator import generate_event_qr_bytes


class EventCreateView(APIView):
    permission_classes = [IsAuthenticated]  # login zaroori — request.user se organizer milega
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'event_create'

    def post(self, request):
        event_name = request.data.get("event_name", "").strip()
        event_date_str = request.data.get("event_date", "").strip()
        plan_type = request.data.get("plan_type", "free").strip()

        if not event_name or not event_date_str:
            return Response(
                {"error": "event_name and event_date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            event_date = datetime.strptime(event_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "event_date must be in YYYY-MM-DD format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_plans = [choice[0] for choice in Event.PLAN_CHOICES]
        if plan_type not in valid_plans:
            plan_type = 'free'

        event = Event.objects.create(
            organizer=request.user,          # login se aaya hua real user
            name=event_name,
            event_date=event_date,
            plan_type=plan_type,
        )

        return Response({
            "event_id": str(event.id),
            "qr_token": str(event.qr_token),
            "guest_access_url": event.guest_access_url,
            "expires_at": event.qr_token_expires_at,
        }, status=status.HTTP_201_CREATED)


class EventQRCodeView(APIView):
    """GET /api/events/<event_id>/qr/ -- sirf event ka organizer hi QR nikal sakta hai."""
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        event = Event.objects.filter(id=event_id, organizer=request.user).first()
        if not event:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)

        qr_bytes = generate_event_qr_bytes(event.guest_access_url)
        return HttpResponse(qr_bytes, content_type="image/png")
    
class EventUpgradePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = Event.objects.filter(id=event_id, organizer=request.user).first()
        if not event:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)

        new_plan = request.data.get("plan_type", "").strip()
        try:
            event.upgrade_plan(new_plan)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "plan_type": event.plan_type,
            "expires_at": event.qr_token_expires_at,
            "guest_access_url": event.guest_access_url,  # same rehta hai
        })
    
class VIPProfileUploadView(APIView):
    """
    Organizer ek reference photo upload karta hai VIP family member ki.
    Face embedding nikal ke VIPProfile table mein store hota hai.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)

        name = request.data.get('name')
        photo_file = request.FILES.get('reference_photo')

        if not name or not photo_file:
            return Response(
                {"error": "name aur reference_photo dono required hain"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # existing face_engine function reuse — jaisa guest selfie ke liye use hota hai
        embedding_result = embed_single_face(photo_file)

        if embedding_result is None:
            return Response(
                {"error": "Photo mein clear face detect nahi hua, dusri photo try karo"},
                status=status.HTTP_400_BAD_REQUEST
            )

        vip = VIPProfile.objects.create(
            id=uuid.uuid4(),
            event=event,
            name=name,
            reference_embedding=embedding_result['embedding']
        )

        return Response(
            {"id": str(vip.id), "name": vip.name, "message": "VIP profile added"},
            status=status.HTTP_201_CREATED
        )
class VIPProfileListView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        vips = event.vip_profiles.all().values('id', 'name', 'added_by_organizer_at')
        return Response(list(vips))


class VIPProfileDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, event_id, vip_id):
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        vip = get_object_or_404(VIPProfile, id=vip_id, event=event)
        vip.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)