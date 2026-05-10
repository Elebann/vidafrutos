from django.urls import path, include
from rest_framework.routers import DefaultRouter

# from .views import ClientsViewSet

router = DefaultRouter()
# router.register(r'', ClientsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]