from django.contrib import admin
from .models import User, Rol

admin.site.register([
    User,
    Rol
])