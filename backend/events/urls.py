from django.urls import path
from .views import EventQRCodeView, EventCreateView

urlpatterns = [
    path('<uuid:event_id>/qr/', EventQRCodeView.as_view(), name='event-qr'),
    path('create/', EventCreateView.as_view(), name='event-create'),
]