import uuid
from django.db import models


class HighlightReel(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guest = models.ForeignKey('guests.Guest', on_delete=models.CASCADE, related_name='highlight_reels')
    video_storage_key = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    music_track = models.CharField(max_length=100, default='none')
    created_at = models.DateTimeField(auto_now_add=True)
    selected_photo_ids = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Reel {self.id} ({self.status}) for guest {self.guest_id}"