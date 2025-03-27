from django.db import models

# Create your models here.

class Section(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    course_id = models.IntegerField()
    total_students = models.IntegerField()
    nonxlist_course_id = models.IntegerField()