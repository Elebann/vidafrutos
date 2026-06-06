from django.urls import path

from . import views


urlpatterns = [
    path("", views.list_forecasts, name="forecast-list"),
    path("train/", views.train_model, name="forecast-train"),
    path("status/", views.model_status, name="forecast-status"),
    path("diagnostics/", views.model_diagnostics, name="forecast-diagnostics"),
]
