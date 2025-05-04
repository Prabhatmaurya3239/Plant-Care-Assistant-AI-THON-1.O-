from django.db import models

class PlantImage(models.Model):
    image = models.ImageField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    plant_name = models.CharField(max_length=255, blank=True)
    care_instructions = models.TextField(blank=True)
   