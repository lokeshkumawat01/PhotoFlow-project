from django.db import migrations
import pgvector.django.vector

class Migration(migrations.Migration):
    dependencies = [
        ('guests', '0002_initial'),
    ]
    operations = [
        migrations.RemoveField(
            model_name='guest',
            name='selfie_embedding',
        ),
        migrations.AddField(
            model_name='guest',
            name='selfie_embedding',
            field=pgvector.django.vector.VectorField(blank=True, dimensions=512, null=True),
        ),
    ]