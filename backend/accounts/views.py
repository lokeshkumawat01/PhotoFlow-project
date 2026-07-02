from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import ScopedRateThrottle

from .serializers import RegisterSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Public endpoint -- anyone can create an organizer account.
    Login itself is handled separately by simplejwt's TokenObtainPairView.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        return Response(
            {
                "message": "Account created successfully. Please log in.",
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """
    GET /api/auth/me/
    Lets the frontend check who the logged-in organizer is, and whether
    their access token is still valid, without hitting any other endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined,
        })