from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RolViewSet, UserViewSet

router = DefaultRouter()
router.register(r'roles', RolViewSet, basename='role')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]
