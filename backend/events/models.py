import uuid
from django.db import models
from pgvector.django import VectorField


class Event(models.Model):
    PLAN_EXPIRY_DAYS = {
        'free': 7,
        'starter': 30,
        'pro': 30,
        'premium': 30,
    }
    PLAN_CHOICES = [(k, k.capitalize()) for k in PLAN_EXPIRY_DAYS]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='events')
    name = models.CharField(max_length=200)
    event_date = models.DateField()
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    storage_used_mb = models.FloatField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def upgrade_plan(self, new_plan_type):
        self.plan_type = new_plan_type
        self.save(update_fields=['plan_type'])

    def __str__(self):
        return f"{self.name} ({self.plan_type})"


class PlanLimit(models.Model):
    plan_type = models.CharField(max_length=20, unique=True)
    max_photos = models.IntegerField()
    max_storage_mb = models.IntegerField()
    hd_downloads_included = models.IntegerField()
    price_inr = models.IntegerField()

    def __str__(self):
        return self.plan_type


class VIPProfile(models.Model):
    """
    Organizer-registered VIP/family members. Access is granted by face
    match, not by phone number or any other guessable identifier.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='vip_profiles')
    name = models.CharField(max_length=100, blank=True)
    reference_embedding = VectorField(dimensions=512)
    thumbnail_key = models.CharField(max_length=255, blank=True)
    added_by_organizer_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'events_vipprofile'
        indexes = [models.Index(fields=['event'])]

    def __str__(self):
        return f"VIP: {self.name} ({self.event.name})"