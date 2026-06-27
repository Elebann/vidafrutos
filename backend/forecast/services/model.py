"""Random Forest model for daily product demand forecasting.

Single global model that uses product_id (and category_id) as features
so the same forest can share signal across products of similar shape.
The model is persisted to disk with joblib and reloaded on demand.
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from django.conf import settings
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import f1_score, mean_absolute_error, precision_score, r2_score, recall_score

from .aggregator import AggregatorResult, build_future_features, build_training_frame


MODEL_DIR: Path = Path(getattr(settings, "BASE_DIR")) / "forecast_models"
MODEL_FILENAME = "rf_v3.joblib"
META_FILENAME = "rf_v3_meta.joblib"
SERVICE_LEVEL_Z = 1.65  # ~95%
OVERSTOCK_HEADROOM = 0.6
SALES_LOOKBACK_DAYS = int(os.environ.get("FORECAST_LOOKBACK_DAYS", "90"))
MIN_TRAINING_ROWS = 30
TRAIN_TEST_SPLIT = 0.2
RANDOM_STATE = 42
SALE_PROBABILITY_THRESHOLD = float(os.environ.get("FORECAST_SALE_PROBABILITY_THRESHOLD", "0.35"))
HIGH_DEMAND_CLASS_THRESHOLD = int(os.environ.get("FORECAST_HIGH_DEMAND_CLASS_THRESHOLD", "200"))


@dataclass
class TrainReport:
    n_rows: int
    n_features: int
    n_products: int
    n_estimators: int
    max_depth: int
    test_mae: float
    test_r2: float
    test_mape: float
    feature_importances: dict[str, float]
    started_at: float
    finished_at: float
    lookback_days: int


@dataclass(frozen=True)
class Calibration:
    """Histogram-based calibration of the model's tree-agreement score.

    For each training row we compute ``ratio = std / max(mean, 1)`` where
    ``std`` and ``mean`` come from the 300 individual decision trees. We bin
    these ratios and record, for each bin, the empirical coverage of the
    95% prediction interval ``mean ± 1.96 * std``. At inference time we look
    up a new row's ratio in the same bins and return the matching coverage as
    a "confidence" score (scaled 0-100). This is a much more honest number
    than ``100 - ratio*50`` because it is calibrated against actual
    training-time performance: a row whose ratio is in bin B is assigned
    the historical coverage that rows with the same ratio achieved in
    training.

    Bins with too few training samples fall back to the global coverage so
    the lookup stays well-defined even with sparse data.
    """

    bin_edges: np.ndarray
    bin_coverage: np.ndarray
    bin_counts: np.ndarray
    global_coverage: float
    n_bins: int
    ratio_max: float


@dataclass
class ModelState:
    model: RandomForestRegressor
    feature_columns: list[str]
    meta: TrainReport
    last_trained_at: float
    calibration: Calibration | None = None


_STATE: ModelState | None = None
CALIBRATION_MIN_BIN_COUNT = 5
CALIBRATION_N_BINS = 20
CALIBRATION_RATIO_MAX = 5.0
CONFIDENCE_METHOD = "calibrated_error_agreement"


def _ensure_model_dir() -> Path:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    return MODEL_DIR


def _model_path() -> Path:
    return _ensure_model_dir() / MODEL_FILENAME


def _meta_path() -> Path:
    return _ensure_model_dir() / META_FILENAME


def _split_train_test(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    if frame.empty:
        return frame, frame
    sorted_dates = sorted(frame["date"].unique())
    cutoff_idx = max(int(len(sorted_dates) * (1 - TRAIN_TEST_SPLIT)), 1)
    cutoff = sorted_dates[cutoff_idx - 1]
    train = frame[frame["date"] <= cutoff]
    test = frame[frame["date"] > cutoff]
    if test.empty:
        # Fall back to last 20% rows
        cutoff_row = int(len(frame) * (1 - TRAIN_TEST_SPLIT))
        train = frame.iloc[:cutoff_row]
        test = frame.iloc[cutoff_row:]
    return train, test


def _train_model(frame: pd.DataFrame, feature_columns: list[str]) -> tuple[RandomForestRegressor, TrainReport]:
    train, test = _split_train_test(frame)
    target_col = "target_units" if "target_units" in frame.columns else "units"
    X_train = train[feature_columns].astype(float).to_numpy()
    y_train = train[target_col].astype(float).to_numpy()
    X_test = test[feature_columns].astype(float).to_numpy()
    y_test = test[target_col].astype(float).to_numpy()

    rf = RandomForestRegressor(
        n_estimators=300,
        max_depth=14,
        min_samples_leaf=4,
        max_features="sqrt",
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )
    rf.fit(X_train, y_train)

    y_pred_raw = rf.predict(X_test) if len(X_test) else np.array([])
    y_pred = _expected_units(y_pred_raw, test) if len(X_test) else np.array([])

    def _mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        if len(y_true) == 0:
            return 0.0
        mask = y_true > 0
        if not mask.any():
            return 0.0
        return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0)

    if len(y_test):
        mae = float(mean_absolute_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        mape = _mape(y_test, y_pred)
    else:
        mae = mape = 0.0
        r2 = 0.0

    importances = dict(zip(feature_columns, [float(v) for v in rf.feature_importances_]))
    finished = time.time()
    report = TrainReport(
        n_rows=len(frame),
        n_features=len(feature_columns),
        n_products=int(frame["product_id"].nunique()) if not frame.empty else 0,
        n_estimators=rf.n_estimators,
        max_depth=int(rf.max_depth or 0),
        test_mae=mae,
        test_r2=r2,
        test_mape=mape,
        feature_importances=importances,
        started_at=finished - 0.0,  # populated by caller
        finished_at=finished,
        lookback_days=SALES_LOOKBACK_DAYS,
    )
    return rf, report


def _persist(model: RandomForestRegressor, report: TrainReport, feature_columns: list[str]) -> None:
    _ensure_model_dir()
    joblib.dump(model, _model_path())
    joblib.dump({
        "meta": report,
        "feature_columns": feature_columns,
    }, _meta_path())


def _try_load() -> ModelState | None:
    p = _model_path()
    m = _meta_path()
    if not p.exists() or not m.exists():
        return None
    try:
        model = joblib.load(p)
        meta_blob = joblib.load(m)
        return ModelState(
            model=model,
            feature_columns=meta_blob["feature_columns"],
            meta=meta_blob["meta"],
            last_trained_at=meta_blob["meta"].finished_at,
        )
    except Exception:
        return None


def _is_stale(state: ModelState, max_age_hours: float = 24.0) -> bool:
    return (time.time() - state.last_trained_at) > max_age_hours * 3600


def get_state(*, force_retrain: bool = False) -> ModelState:
    """Return the current model state, training on demand if missing/stale."""
    global _STATE
    if force_retrain:
        _STATE = None

    if _STATE is None:
        loaded = None if force_retrain else _try_load()
        if loaded is not None and not _is_stale(loaded):
            _STATE = loaded
            return _STATE

    if _STATE is None:
        result: AggregatorResult = build_training_frame(SALES_LOOKBACK_DAYS)
        if len(result.frame) < MIN_TRAINING_ROWS:
            raise ValueError(
                f"Datos insuficientes para entrenar ({len(result.frame)} filas). "
                "Se requieren al menos 30 filas的历史."
            )
        started = time.time()
        model, report = _train_model(result.frame, result.feature_columns)
        report.started_at = started
        _persist(model, report, result.feature_columns)
        _STATE = ModelState(
            model=model,
            feature_columns=result.feature_columns,
            meta=report,
            last_trained_at=report.finished_at,
        )

    return _STATE


def reset_state() -> None:
    """Forget in-memory state and remove the on-disk model."""
    global _STATE
    _STATE = None
    for path in (_model_path(), _meta_path()):
        if path.exists():
            try:
                path.unlink()
            except OSError:
                pass


def _compute_calibration(
    state: ModelState,
    train_frame: pd.DataFrame,
) -> Calibration:
    """Build a histogram mapping tree-agreement ratios to coverage."""
    target_col = "target_units" if "target_units" in train_frame.columns else "units"
    X_train = train_frame[state.feature_columns].astype(float).to_numpy()
    y_train = train_frame[target_col].astype(float).to_numpy()

    tree_preds = np.stack([est.predict(X_train) for est in state.model.estimators_], axis=0)
    mean = tree_preds.mean(axis=0)
    std = tree_preds.std(axis=0)

    ratio = np.divide(std, np.maximum(mean, 1.0))
    lower = np.maximum(0.0, mean - 1.96 * std)
    upper = mean + 1.96 * std
    inside = (y_train >= lower) & (y_train <= upper)
    global_coverage = float(inside.mean()) if len(inside) else 0.0

    n_bins = CALIBRATION_N_BINS
    ratio_max = CALIBRATION_RATIO_MAX
    bin_edges = np.linspace(0.0, ratio_max, n_bins + 1)
    bin_idx = np.clip(np.digitize(ratio, bin_edges) - 1, 0, n_bins - 1)
    bin_coverage = np.full(n_bins, global_coverage, dtype=float)
    bin_counts = np.zeros(n_bins, dtype=int)
    for b in range(n_bins):
        mask = bin_idx == b
        cnt = int(mask.sum())
        bin_counts[b] = cnt
        if cnt >= CALIBRATION_MIN_BIN_COUNT:
            bin_coverage[b] = float(inside[mask].mean())

    return Calibration(
        bin_edges=bin_edges,
        bin_coverage=bin_coverage,
        bin_counts=bin_counts,
        global_coverage=global_coverage,
        n_bins=n_bins,
        ratio_max=ratio_max,
    )


def _calibrated_confidence_vec(
    ratios: np.ndarray,
    calibration: Calibration,
) -> np.ndarray:
    """Look up a confidence score (0-100) for an array of tree ratios."""
    if calibration is None or len(calibration.bin_edges) == 0:
        return np.full(len(ratios), 50.0)
    bin_idx = np.clip(
        np.digitize(ratios, calibration.bin_edges) - 1,
        0,
        calibration.n_bins - 1,
    )
    return calibration.bin_coverage[bin_idx] * 100.0


def _calibrated_confidence_scalar(ratio: float, calibration: Calibration | None) -> float:
    if calibration is None:
        return 50.0
    return float(_calibrated_confidence_vec(np.array([ratio]), calibration)[0])


def _ensure_calibration(
    state: ModelState,
    frame: pd.DataFrame,
) -> Calibration:
    """Return the cached calibration, computing it from train rows on first use."""
    if state.calibration is not None:
        return state.calibration
    train, _ = _split_train_test(frame)
    if train.empty:
        return Calibration(
            bin_edges=np.array([0.0, CALIBRATION_RATIO_MAX]),
            bin_coverage=np.array([0.5]),
            bin_counts=np.array([0]),
            global_coverage=0.5,
            n_bins=1,
            ratio_max=CALIBRATION_RATIO_MAX,
        )
    state.calibration = _compute_calibration(state, train)
    return state.calibration


def _sale_probability(frame: pd.DataFrame) -> np.ndarray:
    sale_rate = frame.get("sale_rate_30", pd.Series([0.0] * len(frame))).astype(float).to_numpy()
    weekday_score = frame.get("weekday_sales_score", pd.Series([0.0] * len(frame))).astype(float).to_numpy()
    dispatch = frame.get("is_dispatch_day", pd.Series([0] * len(frame))).astype(float).to_numpy()
    probability = (0.72 * sale_rate) + (0.18 * weekday_score) + (0.10 * dispatch)
    return np.clip(probability, 0.0, 1.0)


def _expected_units(mean: np.ndarray, frame: pd.DataFrame) -> np.ndarray:
    probability = _sale_probability(frame)
    conditional_mean = frame.get("product_nonzero_mean", pd.Series([0.0] * len(frame))).astype(float).to_numpy()
    recent_mean = frame.get("product_recent_mean", pd.Series([0.0] * len(frame))).astype(float).to_numpy()
    baseline = (0.70 * conditional_mean * probability) + (0.30 * recent_mean)
    blended = (0.65 * mean) + (0.35 * baseline)
    expected = np.maximum(0.0, blended)
    return np.where(probability >= SALE_PROBABILITY_THRESHOLD, expected, 0.0)


def _confidence_score(
    ratios: np.ndarray,
    calibration: Calibration,
    frame: pd.DataFrame,
) -> np.ndarray:
    coverage = _calibrated_confidence_vec(ratios, calibration) / 100.0
    agreement = np.exp(-np.clip(ratios, 0.0, CALIBRATION_RATIO_MAX) * 0.35)
    support = 0.85 + 0.15 * _sale_probability(frame)
    score = ((0.7 * coverage) + (0.3 * agreement)) * support * 100.0
    return np.clip(score, 5.0, 95.0)


def predict_tomorrow() -> tuple[pd.DataFrame, list[Any]]:
    """Return the daily per-product predictions and (product, name) tuples."""
    state = get_state()
    training_result = build_training_frame(SALES_LOOKBACK_DAYS)
    calibration = _ensure_calibration(state, training_result.frame)
    latest, feature_columns, products = build_future_features(SALES_LOOKBACK_DAYS)
    if latest.empty:
        return latest, [(p.id, p.name) for p in products]

    missing = set(state.feature_columns) - set(latest.columns)
    if missing:
        # Rebuild features if columns drift
        latest, _, _ = build_future_features(SALES_LOOKBACK_DAYS)
    model_input = latest[state.feature_columns].astype(float)
    tree_preds = np.stack([est.predict(model_input.to_numpy()) for est in state.model.estimators_], axis=0)
    mean = tree_preds.mean(axis=0)
    std = tree_preds.std(axis=0)

    products_index = {p.id: p.name for p in products}
    out = model_input.copy()
    out["product_id"] = latest["product_id"].astype(int) if "product_id" in latest.columns else latest.index
    out["date"] = pd.to_datetime(latest["date"]).dt.strftime("%Y-%m-%d") if "date" in latest.columns else ""
    for stock_col in ("available_stock", "allocated_stock", "minimum_stock"):
        if stock_col in latest.columns:
            out[stock_col] = latest[stock_col].fillna(0).astype(int).to_numpy()
        else:
            out[stock_col] = 0
    expected = _expected_units(mean, latest)
    out["expected_sales_float"] = expected
    out["expected_sales"] = np.where(_sale_probability(latest) >= 0.65, np.ceil(expected), np.round(expected)).astype(int)
    out["prediction_std"] = std
    if "roll_std_30" in latest.columns:
        out["roll_std_30"] = latest["roll_std_30"].astype(float).to_numpy()
    if "roll_mean_30" in latest.columns:
        out["roll_mean_30"] = latest["roll_mean_30"].astype(float).to_numpy()
    out["product_name"] = out["product_id"].map(products_index).fillna("(sin nombre)")
    ratio = np.divide(std, np.maximum(mean, 1.0))
    out["confidence"] = np.round(_confidence_score(ratio, calibration, latest), 1)
    return out, [(p.id, p.name) for p in products]


def _confidence_from_std(out: pd.DataFrame) -> pd.Series:
    """Kept for backwards compatibility; prefer the calibrated lookup."""
    expected = out["expected_sales"].astype(float).to_numpy()
    std = out["prediction_std"].astype(float).to_numpy()
    ratio = np.divide(std, np.maximum(expected, 1.0))
    confidence = 100.0 - np.clip(ratio * 50.0, 0.0, 100.0)
    return pd.Series(np.round(confidence, 1), index=out.index)


def diagnostics() -> dict[str, Any]:
    """Return a confusion matrix and confidence table from a hold-out set."""
    state = get_state()
    result = build_training_frame(SALES_LOOKBACK_DAYS)
    frame = result.frame
    feature_columns = state.feature_columns
    target_col = "target_units" if "target_units" in frame.columns else "units"
    calibration = _ensure_calibration(state, frame)

    # Build a hold-out split identical to training
    train, test = _split_train_test(frame)
    if test.empty:
        _, labels = _demand_class_definition(np.array([]))
        empty_matrix = {
            "labels": labels,
            "matrix": [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        }
        return {
            "summary": _summary_dict(state),
            "confusion_matrix": empty_matrix,
            "raw_confusion_matrix": empty_matrix,
            "final_confusion_matrix": empty_matrix,
            "confidence_table": [],
            "message": "Datos insuficientes para calcular diagnóstico.",
        }

    X_test = test[feature_columns].astype(float).to_numpy()
    y_test = test[target_col].astype(float).to_numpy()
    tree_preds = np.stack([est.predict(X_test) for est in state.model.estimators_], axis=0)
    y_pred_raw = tree_preds.mean(axis=0)
    y_std = tree_preds.std(axis=0)
    y_pred = _expected_units(y_pred_raw, test)

    edges, labels = _demand_class_definition(train[target_col].astype(float).to_numpy())
    actual_bins = np.digitize(y_test, edges)
    raw_pred_bins = np.digitize(np.maximum(0, y_pred_raw), edges)
    final_pred_bins = np.digitize(np.maximum(0, y_pred), edges)
    raw_matrix = _confusion_matrix(actual_bins, raw_pred_bins, len(labels))
    final_matrix = _confusion_matrix(actual_bins, final_pred_bins, len(labels))

    confidence_table = _build_confidence_table(test, y_pred, y_std, edges, labels, calibration)

    summary = _summary_dict(state)
    summary["confidence_method"] = CONFIDENCE_METHOD
    summary["calibration_global_coverage"] = calibration.global_coverage
    summary["classification_metrics"] = _classification_metrics(actual_bins, final_pred_bins, labels)
    summary["raw_classification_metrics"] = _classification_metrics(actual_bins, raw_pred_bins, labels)
    summary["final_classification_metrics"] = summary["classification_metrics"]

    raw_confusion_matrix = {
        "labels": labels,
        "edges": [float(e) for e in edges],
        "matrix": raw_matrix.tolist(),
    }
    final_confusion_matrix = {
        "labels": labels,
        "edges": [float(e) for e in edges],
        "matrix": final_matrix.tolist(),
    }
    return {
        "summary": summary,
        "confusion_matrix": final_confusion_matrix,
        "raw_confusion_matrix": raw_confusion_matrix,
        "final_confusion_matrix": final_confusion_matrix,
        "confidence_table": confidence_table,
    }


def _confusion_matrix(
    actual_bins: np.ndarray,
    pred_bins: np.ndarray,
    n_labels: int,
) -> np.ndarray:
    matrix = np.zeros((n_labels, n_labels), dtype=int)
    for actual, predicted in zip(actual_bins, pred_bins):
        if 0 <= actual < n_labels and 0 <= predicted < n_labels:
            matrix[actual, predicted] += 1
    return matrix


def _summary_dict(state: ModelState) -> dict[str, Any]:
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


def _demand_class_definition(values: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """Return practical classes for intermittent demand.

    Keep stable business classes so the confusion matrix does not change
    meaning every time the lookback window changes.
    """
    high_threshold = max(1, HIGH_DEMAND_CLASS_THRESHOLD)
    edges = np.array([0.5, high_threshold + 0.5], dtype=float)
    middle_label = f"1-{high_threshold} unidades" if high_threshold > 1 else "1 unidad"
    high_label = f"{high_threshold + 1}+ unidades"
    return edges, ["Sin venta", middle_label, high_label]


def _build_confidence_table(
    test: pd.DataFrame,
    y_pred: np.ndarray,
    y_std: np.ndarray,
    edges: np.ndarray,
    labels: list[str],
    calibration: Calibration,
) -> list[dict[str, Any]]:
    expected = np.maximum(0, np.round(y_pred)).astype(int)
    lower = np.maximum(0, np.round(y_pred - 1.96 * y_std)).astype(int)
    upper = np.round(y_pred + 1.96 * y_std).astype(int)
    target_col = "target_units" if "target_units" in test.columns else "units"
    actual = test[target_col].astype(int).to_numpy()
    ratio = np.divide(y_std, np.maximum(y_pred, 1.0))
    confidence = np.round(_confidence_score(ratio, calibration, test), 1)
    inside = (actual >= lower) & (actual <= upper)

    actual_bins = np.digitize(actual, edges)
    pred_bins = np.digitize(expected, edges)
    safe_bins = lambda b: labels[b] if 0 <= b < len(labels) else "-"

    # One row per product: pick the most recent test date for that product.
    test_indexed = test.reset_index(drop=True)
    if test_indexed.empty:
        return []
    idx_per_product = test_indexed.groupby("product_id")["date"].idxmax()
    sample_idx = sorted(int(i) for i in idx_per_product.dropna().tolist())
    rows: list[dict[str, Any]] = []
    for i in sample_idx:
        rows.append({
            "date": pd.Timestamp(test["date"].iloc[i]).strftime("%Y-%m-%d"),
            "product_id": int(test["product_id"].iloc[i]),
            "product_name": str(test.get("name", pd.Series(dtype=object)).iloc[i])
                if "name" in test.columns else "",
            "actual": int(actual[i]),
            "predicted": int(expected[i]),
            "lower": int(lower[i]),
            "upper": int(upper[i]),
            "confidence": float(confidence[i]),
            "actual_class": safe_bins(actual_bins[i]),
            "predicted_class": safe_bins(pred_bins[i]),
            "inside_interval": bool(inside[i]),
            "confidence_method": CONFIDENCE_METHOD,
        })
    return rows


def _classification_metrics(
    actual_bins: np.ndarray,
    pred_bins: np.ndarray,
    labels: list[str],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if len(actual_bins) == 0:
        return rows

    per_class_accuracy: list[float] = []
    total = len(actual_bins)
    for idx, label in enumerate(labels):
        y_true = (actual_bins == idx).astype(int)
        y_pred = (pred_bins == idx).astype(int)
        support = int(y_true.sum())
        true_positive = int(((actual_bins == idx) & (pred_bins == idx)).sum())
        true_negative = int(((actual_bins != idx) & (pred_bins != idx)).sum())
        class_accuracy = (
            float((true_positive + true_negative) / total)
            if total > 0
            else 0.0
        )
        per_class_accuracy.append(class_accuracy)
        rows.append({
            "class": label,
            "accuracy": class_accuracy,
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
            "support": support,
        })
    rows.append({
        "class": "Promedio macro",
        "accuracy": float(np.mean(per_class_accuracy)) if per_class_accuracy else 0.0,
        "recall": float(recall_score(actual_bins, pred_bins, average="macro", zero_division=0)),
        "precision": float(precision_score(actual_bins, pred_bins, average="macro", zero_division=0)),
        "f1_score": float(f1_score(actual_bins, pred_bins, average="macro", zero_division=0)),
        "support": int(len(actual_bins)),
    })
    return rows


__all__ = [
    "get_state",
    "reset_state",
    "predict_tomorrow",
    "diagnostics",
    "SERVICE_LEVEL_Z",
    "OVERSTOCK_HEADROOM",
]
