from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('highlights', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='highlightreel',
            name='selected_photo_ids',
            field=models.JSONField(default=list, blank=True),
        ),
    ]