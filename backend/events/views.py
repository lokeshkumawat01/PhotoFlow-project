from datetime import datetime, timedelta
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle

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