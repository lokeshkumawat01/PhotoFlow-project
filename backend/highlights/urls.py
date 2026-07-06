from django.urls import path
from .views import GenerateHighlightView, HighlightStatusView

urlpatterns = [
    path('generate/', GenerateHighlightView.as_view(), name='generate-highlight'),
    path('<uuid:reel_id>/status/', HighlightStatusView.as_view(), name='highlight-status'),
]