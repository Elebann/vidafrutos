from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import HistoryViewSet, OrderDetailViewSet, OrderStateViewSet, OrderViewSet

router = DefaultRouter()
router.register(r'states', OrderStateViewSet, basename='order-state')
router.register(r'history', HistoryViewSet, basename='order-history')
router.register(r'details', OrderDetailViewSet, basename='order-detail')
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]