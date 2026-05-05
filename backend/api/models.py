from django.db import models

# Create your models here.
class Rol(models.Model):
    nombre_rol = models.CharField(max_length=50)

    class Meta:
        db_table = 'rol'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre_rol