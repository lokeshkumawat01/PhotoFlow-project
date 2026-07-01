from django.urls import path
from .views import EventQRCodeView, EventCreateView, VIPProfileUploadView, VIPProfileListView, VIPProfileDeleteView

urlpatterns = [
    path('<uuid:event_id>/qr/', EventQRCodeView.as_view(), name='event-qr'),
    path('create/', EventCreateView.as_view(), name='event-create'),
    path('<uuid:event_id>/vip/', VIPProfileUploadView.as_view(), name='vip-upload'),
    path('<uuid:event_id>/vip/list/', VIPProfileListView.as_view(), name='vip-list'),
    path('<uuid:event_id>/vip/<uuid:vip_id>/', VIPProfileDeleteView.as_view(), name='vip-delete'),
]