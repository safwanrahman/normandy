# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-01-22 02:28
# flake8: noqa
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0008_auto_20160122_0228'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='locale',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='recipes.Locale'),
        ),
    ]