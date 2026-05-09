from django.db import models

class Customer(models.Model):
    rut = models.CharField(max_length=12, unique=True)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} - ({self.rut})"