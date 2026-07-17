from django.urls import path
from .views import (
    EventCreateView,
    EventQRCodeView,
    QRStyleView,
    VIPProfileUploadView,
    VIPGroupUploadView,
    VIPProfileListView,
    VIPProfileDeleteView,
    VIPRenameView,
    VIPThumbnailView,
    EventStatusView,
    VideoAccessProfileUploadView,
    VideoAccessProfileListView,
    VideoAccessProfileDeleteView,
    EventVideoUploadView,
    EventVideoListView,
    EventVideoDeleteView,
)

urlpatterns = [
    path('create/', EventCreateView.as_view(), name='event-create'),
    path('<uuid:event_id>/qr/', EventQRCodeView.as_view(), name='event-qr'),
    path('<uuid:event_id>/qr/style/', QRStyleView.as_view(), name='qr-style'),

    path('<uuid:event_id>/vip/', VIPProfileUploadView.as_view(), name='vip-upload'),
    path('<uuid:event_id>/vip/group/', VIPGroupUploadView.as_view(), name='vip-group-upload'),
    path('<uuid:event_id>/vip/list/', VIPProfileListView.as_view(), name='vip-list'),
    path('<uuid:event_id>/vip/<uuid:vip_id>/', VIPProfileDeleteView.as_view(), name='vip-delete'),
    path('<uuid:event_id>/vip/<uuid:vip_id>/rename/', VIPRenameView.as_view(), name='vip-rename'),
    path('<uuid:event_id>/vip/<uuid:vip_id>/thumbnail/', VIPThumbnailView.as_view(), name='vip-thumbnail'),

    path('<uuid:event_id>/status/', EventStatusView.as_view(), name='event-status'),

    path('<uuid:event_id>/video-access/', VideoAccessProfileUploadView.as_view(), name='video-access-upload'),
    path('<uuid:event_id>/video-access/list/', VideoAccessProfileListView.as_view(), name='video-access-list'),
    path('<uuid:event_id>/video-access/<uuid:va_id>/', VideoAccessProfileDeleteView.as_view(), name='video-access-delete'),

    path('<uuid:event_id>/videos/', EventVideoUploadView.as_view(), name='event-video-upload'),
    path('<uuid:event_id>/videos/list/', EventVideoListView.as_view(), name='event-video-list'),
    path('<uuid:event_id>/videos/<uuid:video_id>/', EventVideoDeleteView.as_view(), name='event-video-delete'),
]