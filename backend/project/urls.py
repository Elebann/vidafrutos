"""
URL configuration for project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomTokenObtainPairView
from .views import api_index

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Apps
    path('api/accounts/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/forecast/', include('forecast.urls')),
    # API index - list available endpoints under /api/
    path('api/', api_index, name='api-index'),
]
