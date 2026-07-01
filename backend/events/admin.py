from django.contrib import admin
from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'organizer', 'event_date', 'plan_type', 'is_active')
    readonly_fields = ('qr_token',)