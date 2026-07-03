from django.urls import path
from .views import EventUploadStatusView, ServeSignedFileView, ChunkedUploadView, SinglePhotoUploadView

urlpatterns = [
    path('<uuid:event_id>/upload-status/', EventUploadStatusView.as_view(), name='event-upload-status'),
    path('serve/', ServeSignedFileView.as_view(), name='serve-signed-file'),
    path('<uuid:event_id>/upload-chunk/', ChunkedUploadView.as_view(), name='event-upload-chunk'),
    path('<uuid:event_id>/upload-single/', SinglePhotoUploadView.as_view(), name='upload-single')
]