from django.urls import path
from .views import SelfieMatchView, RequestHDView, LivenessCheckView, DownloadAllPhotosView, LivenessFrameCheckView

urlpatterns = [
    path('event/<uuid:qr_token>/match/', SelfieMatchView.as_view(), name='guest-selfie-match'),
    path('photo/<uuid:photo_id>/request-hd/', RequestHDView.as_view(), name='guest-request-hd'),
    path('liveness-check/', LivenessCheckView.as_view(), name='liveness-check'),
    path('download-all/', DownloadAllPhotosView.as_view(), name='download-all-photos'),
    path('liveness-frame/', LivenessFrameCheckView.as_view(), name='liveness-frame-check'),
]