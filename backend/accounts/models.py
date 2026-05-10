from django.contrib.auth.models import AbstractUser
from django.db import models

class Rol(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'accounts_rol'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name

class User(AbstractUser):
    rut = models.CharField(max_length=12, unique=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        db_table = 'accounts_usuario'

    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} - {self.rut}"