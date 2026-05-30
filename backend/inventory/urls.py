from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RawStockMovementViewSet

router = DefaultRouter()
router.register(r'movements', RawStockMovementViewSet, basename='rawstockmovement')

urlpatterns = [
    path('', include(router.urls)),
]
