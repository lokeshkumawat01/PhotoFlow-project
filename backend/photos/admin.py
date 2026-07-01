from django.contrib import admin
from .models import Photo, FaceEmbedding

class FaceEmbeddingInline(admin.TabularInline):
    model = FaceEmbedding
    extra = 0
    exclude = ('embedding',)  # raw fingerprint admin mein kabhi mat dikhao

@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'status', 'faces_detected_count', 'preview_size_kb', 'hd_size_kb')
    inlines = [FaceEmbeddingInline]