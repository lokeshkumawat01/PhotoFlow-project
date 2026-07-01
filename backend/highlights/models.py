import uuid 
from django.db import models
from guests.models import Guest

# Create your models here.
class HighlightReel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    video_storage_key = models.CharField(max_length=255, null=True)
    status = models.CharField(choices=[('queued','queued'),('processing','processing'),
                                        ('done','done'),('failed','failed')], default='queued')
    music_track = models.CharField(max_length=100, default='default')
    created_at = models.DateTimeField(auto_now_add=True)