import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Event(models.Model):
    PLAN_CHOICES = {
        'free': 7,
        'starter': 30,
        'pro': 30,
        'premium': 30,
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')

    name = models.CharField(max_length=255)
    event_date = models.DateField()

    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)

    # NAYA: token ko manually revoke/regenerate karne ka option
    qr_token_active = models.BooleanField(default=True)

    # NAYA: optional expiry — event ke X din baad link auto-expire ho jaye
    qr_token_expires_at = models.DateTimeField(null=True, blank=True)

    # NAYA: optional PIN protection (sensitive events ke liye)
    access_pin = models.CharField(max_length=6, null=True, blank=True)

    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')

    storage_used_mb = models.FloatField(default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.event_date})"

    def save(self, *args, **kwargs):
        # Agar expiry set nahi hai, default event_date se 30 din baad expire karo
        if not self.qr_token_expires_at:
            self.qr_token_expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    def regenerate_qr_token(self):
        """Agar link leak ho jaye, organizer isse call kare naya token banane ke liye"""
        self.qr_token = uuid.uuid4()
        self.save(update_fields=['qr_token'])

    def is_qr_token_valid(self):
        if not self.qr_token_active or not self.is_active:
            return False
        if self.qr_token_expires_at and timezone.now() > self.qr_token_expires_at:
            return False
        return True
    
    def upgrade_plan(self, new_plan_type):
        if new_plan_type not in dict(self.PLAN_CHOICES):
            raise ValueError("Invalid plan type")

        self.plan_type = new_plan_type
        new_expiry_days = self.PLAN_EXPIRY_DAYS.get(new_plan_type, 30)
        new_expiry = self.event_date and timezone.now() + timedelta(days=new_expiry_days)

        if not self.qr_token_expires_at or new_expiry > self.qr_token_expires_at:
            self.qr_token_expires_at = new_expiry

        self.save(update_fields=['plan_type', 'qr_token_expires_at'])

    @property
    def guest_access_url(self):
        from django.conf import settings
        return f"{settings.FRONTEND_BASE_URL}/event/{self.qr_token}"