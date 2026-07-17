import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('photoflow')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'delete-expired-event-photos-daily': {
        'task': 'photos.tasks.delete_expired_event_photos',
        'schedule': crontab(hour=6, minute=0),
    },
}