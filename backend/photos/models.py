import uuid
from django.db import models
from events.models import Event
from pgvector.django import VectorField


class Photo(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='photos')

    # Dono versions ke storage paths -- raw file yahan nahi, sirf address
    storage_key_preview = models.CharField(max_length=512, blank=True)
    storage_key_hd = models.CharField(max_length=512, blank=True)

    # Duplicate uploads pakadne ke liye (same photo dobara upload na ho)
    file_hash = models.CharField(max_length=64, db_index=True)

    original_filename = models.CharField(max_length=255, blank=True)
    width = models.IntegerField(default=0)
    height = models.IntegerField(default=0)

    preview_size_kb = models.FloatField(default=0)
    hd_size_kb = models.FloatField(default=0)

    # Background processing ka status -- Celery ye field update karega
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    faces_detected_count = models.IntegerField(default=0)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Same event mein same photo dobara save nahi hogi
        constraints = [
            models.UniqueConstraint(fields=['event', 'file_hash'], name='unique_photo_per_event_hash')
        ]

    def __str__(self):
        return f"Photo {self.id} ({self.status})"


class FaceEmbedding(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='faces')

    # 2. JSONField KO HATA KAR YAHAN VECTORFIELD LAGAYEIN (512 dimensions ke sath)
    embedding = VectorField(dimensions=512)

    # Photo ke andar chehra kaha hai (bounding box coordinates)
    bbox_x = models.IntegerField()
    bbox_y = models.IntegerField()
    bbox_w = models.IntegerField()
    bbox_h = models.IntegerField()

    detection_confidence = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Face in {self.photo_id}"