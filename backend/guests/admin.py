from django.contrib import admin
from .models import Guest, DownloadRequest

@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'phone_number', 'created_at')
    exclude = ('selfie_embedding',)  # raw fingerprint admin mein kabhi mat dikhao

@admin.register(DownloadRequest)
class DownloadRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest', 'photo', 'quality', 'delivered_via', 'requested_at')