"""Forecast API endpoints.

GET  /api/forecast/             -> per-product suggestions (auto-trains if needed)
POST /api/forecast/train/       -> force retrain and return suggestions + status
GET  /api/forecast/status/      -> current model status
GET  /api/forecast/diagnostics/ -> confusion matrix + confidence table
"""

from __future__ import annotations

import time

import pandas as pd
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import (
    ForecastDiagnosticsSerializer,
    ForecastSerializer,
    ForecastStatusSerializer,
)
from .services.model import diagnostics, get_state, predict_tomorrow, reset_state
from .services.policy import apply_policy


def _serialize_status(state) -> dict:
    if state is None:
        return {
            "trained": False,
            "last_trained_at": None,
            "last_trained_iso": None,
            "n_rows": 0,
            "n_products": 0,
            "n_estimators": 0,
            "max_depth": 0,
            "test_mae": 0.0,
            "test_r2": 0.0,
            "test_mape": 0.0,
            "lookback_days": 0,
            "top_features": [],
            "classification_metrics": [],
        }
    meta = state.meta
    importances = sorted(meta.feature_importances.items(), key=lambda kv: kv[1], reverse=True)
    return {
        "trained": True,
        "last_trained_at": meta.finished_at,
        "last_trained_iso": pd.Timestamp(meta.finished_at, unit="s").isoformat(),
        "n_rows": meta.n_rows,
        "n_products": meta.n_products,
        "n_estimators": meta.n_estimators,
        "max_depth": meta.max_depth,
        "test_mae": meta.test_mae,
        "test_r2": meta.test_r2,
        "test_mape": meta.test_mape,
        "lookback_days": meta.lookback_days,
        "top_features": [{"name": k, "importance": v} for k, v in importances[:8]],
        "classification_metrics": [],
    }


def _suggestions() -> list[dict]:
    state = get_state()
    predictions, _ = predict_tomorrow()
    return apply_policy(predictions)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_forecasts(request):
    try:
        suggestions = _suggestions()
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - generic catch
        return Response({"detail": f"Error generando pronósticos: {exc}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(ForecastSerializer(suggestions, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def train_model(request):
    reset_state()
    started = time.time()
    try:
        state = get_state(force_retrain=True)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover
        return Response({"detail": f"Error entrenando: {exc}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    suggestions = _suggestions()
    return Response({
        "status": _serialize_status(state),
        "suggestions": ForecastSerializer(suggestions, many=True).data,
        "elapsed_seconds": time.time() - started,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def model_status(request):
    state = None
    try:
        state = get_state()
    except Exception:
        state = None
    return Response(ForecastStatusSerializer(_serialize_status(state)).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def model_diagnostics(request):
    try:
        get_state()
        payload = diagnostics()
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover
        return Response({"detail": f"Error generando diagnóstico: {exc}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(ForecastDiagnosticsSerializer(payload).data)
