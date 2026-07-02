import uuid
from django.db import models
from events.models import Event
from pgvector.django import VectorField


class Guest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='guests')

    # Optional -- agar WhatsApp pe photos bhejni hain to zaroori hai
    phone_number = models.CharField(max_length=20, blank=True)
    name = models.CharField(max_length=100, blank=True)

    # Sirf fingerprint (numbers ki list) -- raw selfie KABHI yahan nahi aati
    selfie_embedding = VectorField(dimensions=512, null=True, blank=True)

    # Match hui photos ki list cache karke rakhte hain (baar baar search na karna pade)
    matched_photo_ids = models.JSONField(default=list, blank=True)

    is_vip = models.BooleanField(default=False)         
    vip_name = models.CharField(max_length=100, blank=True) 

    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Guest {self.id} @ {self.event.name}"


class DownloadRequest(models.Model):
    QUALITY_CHOICES = [('preview', 'Preview'), ('hd', 'HD Original')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='download_requests')
    photo = models.ForeignKey('photos.Photo', on_delete=models.CASCADE, related_name='download_requests')

    quality = models.CharField(max_length=10, choices=QUALITY_CHOICES)
    delivered_via = models.CharField(
        max_length=20,
        choices=[('ui', 'UI Download'), ('whatsapp', 'WhatsApp')],
        default='ui',
    )

    requested_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quality} request by {self.guest_id}"