# Generated by Django 3.2.7 on 2021-09-05 13:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='admin',
            new_name='superuser',
        ),
        migrations.RemoveField(
            model_name='user',
            name='is_superuser',
        ),
    ]
