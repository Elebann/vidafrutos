"""Builds the daily sales time series and feature matrix used by the
Random Forest model.

The "sales" signal is the sum of OrderDetail.quantity per (product, date)
filtered to orders whose state is at least "Validado" (state_id >= 2).
We only consider orders placed in the last ``lookback_days`` days.
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable

import pandas as pd
from django.db.models import Sum
from django.utils import timezone as djtz

from orders.models import Order, OrderDetail
from products.models import Category, PackagedStock, Product


LAG_WINDOWS = (1, 2, 3, 7, 14, 30)
ROLL_WINDOWS = (7, 14, 30)
ROLL_STD_WINDOWS = (7, 30)
SALES_FLOOR_STATE_ID = 2  # "Validado" en adelante
FORECAST_HORIZON_DAYS = int(os.environ.get("FORECAST_HORIZON_DAYS", "5"))
DISPATCH_WEEKDAYS_ENV = os.environ.get("FORECAST_DISPATCH_WEEKDAYS", "")


@dataclass(frozen=True)
class AggregatorResult:
    frame: pd.DataFrame
    feature_columns: list[str]
    start_date: date
    end_date: date
    n_products: int
    dispatch_weekdays: list[int]


def _bounds_utc(lookback_days: int) -> tuple[datetime, date]:
    """Return the (start_dt, end_date) used to query orders.

    We always end "yesterday" so the model is asked to predict "tomorrow".
    """
    today = djtz.now().astimezone(timezone.utc).date()
    end = today - timedelta(days=1)
    start = end - timedelta(days=lookback_days - 1)
    start_dt = datetime.combine(start, time.min, tzinfo=timezone.utc)
    return start_dt, end


def _build_sales_frame(lookback_days: int) -> tuple[pd.DataFrame, date, date]:
    start_dt, end_date = _bounds_utc(lookback_days)
    start_date = end_date - timedelta(days=lookback_days - 1)
    rows = (
        OrderDetail.objects
        .filter(
            order__date__gte=start_dt,
            order__state_id__gte=SALES_FLOOR_STATE_ID,
        )
        .values("order__date", "product_id")
        .annotate(units=Sum("quantity"))
    )

    if not rows:
        return pd.DataFrame(columns=["date", "product_id", "units"]), start_date, end_date

    records = []
    for r in rows:
        d = r["order__date"]
        if hasattr(d, "date"):
            d = d.date()
        records.append({"date": d, "product_id": r["product_id"], "units": int(r["units"] or 0)})

    df = pd.DataFrame.from_records(records)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    return df, start_date, end_date


def _parse_dispatch_weekdays() -> list[int]:
    weekdays: list[int] = []
    for raw in DISPATCH_WEEKDAYS_ENV.split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            value = int(raw)
        except ValueError:
            continue
        if 0 <= value <= 6 and value not in weekdays:
            weekdays.append(value)
    return weekdays


def _infer_dispatch_weekdays(sales: pd.DataFrame) -> list[int]:
    configured = _parse_dispatch_weekdays()
    if configured:
        return configured
    if sales.empty:
        return []

    dated = sales.copy()
    dated["date"] = pd.to_datetime(dated["date"])
    nonzero = dated[dated["units"] > 0].copy()
    if nonzero.empty:
        return []

    counts = nonzero.groupby(nonzero["date"].dt.dayofweek)["units"].count()
    weekday_counts = counts.reindex(range(5), fill_value=0)
    positive = weekday_counts[weekday_counts > 0]
    if positive.empty:
        return []

    avg = float(positive.mean())
    threshold = max(1.0, avg * 1.15)
    inferred = [int(day) for day, count in weekday_counts.items() if count >= threshold]
    if inferred:
        return inferred

    # If the signal is sparse, keep the two strongest weekdays as the best
    # proxy for dispatch days instead of assuming every business day is equal.
    return [int(day) for day in weekday_counts.sort_values(ascending=False).head(2).index if weekday_counts[day] > 0]


def _weekday_sales_scores(sales: pd.DataFrame) -> dict[int, float]:
    if sales.empty:
        return {}
    dated = sales.copy()
    dated["date"] = pd.to_datetime(dated["date"])
    totals = dated.groupby(dated["date"].dt.dayofweek)["units"].sum()
    max_units = float(totals.max() or 0.0)
    if max_units <= 0:
        return {}
    return {int(day): float(units / max_units) for day, units in totals.items()}


def _build_product_grid(products: Iterable[Product]) -> pd.DataFrame:
    rows = []
    for p in products:
        try:
            cat_id = p.category_id
        except Exception:
            cat_id = 0
        rows.append({
            "product_id": p.id,
            "category_id": cat_id or 0,
            "active": bool(p.active),
            "name": p.name,
        })
    return pd.DataFrame(rows)


def _attach_stock_features(grid: pd.DataFrame, end_date: date) -> pd.DataFrame:
    stocks = {
        s.product_id: s
        for s in PackagedStock.objects.select_related("product").all()
    }
    grid = grid.copy()
    grid["available_stock"] = grid["product_id"].map(
        lambda pid: int(getattr(stocks.get(pid), "available_stock", 0) or 0)
    )
    grid["allocated_stock"] = grid["product_id"].map(
        lambda pid: int(getattr(stocks.get(pid), "allocated_stock", 0) or 0)
    )
    grid["minimum_stock"] = grid["product_id"].map(
        lambda pid: int(getattr(stocks.get(pid), "minimum_stock", 0) or 0)
    )
    grid["stock_snapshot_date"] = end_date
    return grid


def _ensure_daily_grid(products: pd.DataFrame, dates: list[date], sales: pd.DataFrame) -> pd.DataFrame:
    grid = (
        products.assign(_k=1)
        .merge(pd.DataFrame({"date": dates}).assign(_k=1), on="_k")
        .drop(columns="_k")
    )
    if sales.empty:
        grid["units"] = 0
        return grid
    merged = grid.merge(
        sales.groupby(["product_id", "date"], as_index=False)["units"].sum(),
        on=["product_id", "date"],
        how="left",
    )
    merged["units"] = merged["units"].fillna(0).astype(int)
    return merged


def _add_temporal_features(
    df: pd.DataFrame,
    dispatch_weekdays: list[int] | None = None,
    weekday_scores: dict[int, float] | None = None,
) -> pd.DataFrame:
    out = df.copy()
    dispatch_weekdays = dispatch_weekdays or []
    weekday_scores = weekday_scores or {}
    out["date"] = pd.to_datetime(out["date"])
    out["day_of_week"] = out["date"].dt.dayofweek
    out["day_of_month"] = out["date"].dt.day
    out["month"] = out["date"].dt.month
    out["is_weekend"] = (out["day_of_week"] >= 5).astype(int)
    out["is_business_day"] = (out["day_of_week"] < 5).astype(int)
    out["is_dispatch_day"] = out["day_of_week"].isin(dispatch_weekdays).astype(int)

    def _days_to_next_dispatch(day: int) -> int:
        if not dispatch_weekdays:
            return 0
        return min((dispatch_day - day) % 7 for dispatch_day in dispatch_weekdays)

    out["days_to_next_dispatch"] = out["day_of_week"].map(_days_to_next_dispatch).astype(int)
    out["weekday_sales_score"] = out["day_of_week"].map(lambda day: weekday_scores.get(int(day), 0.0)).astype(float)
    return out


def _add_lag_roll_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    df = df.sort_values(["product_id", "date"]).reset_index(drop=True)
    grouped = df.groupby("product_id", group_keys=False)

    for lag in LAG_WINDOWS:
        df[f"lag_{lag}"] = grouped["units"].shift(lag).fillna(0).astype(int)

    for w in ROLL_WINDOWS:
        df[f"roll_mean_{w}"] = (
            grouped["units"].shift(1).rolling(w, min_periods=1).mean().reset_index(level=0, drop=True)
        ).fillna(0.0)

    for w in ROLL_STD_WINDOWS:
        df[f"roll_std_{w}"] = (
            grouped["units"].shift(1).rolling(w, min_periods=2).std().reset_index(level=0, drop=True)
        ).fillna(0.0)

    # Days since last non-zero sale (per product). When there's no history,
    # we cap at the lookback window to avoid infinite values.
    def _days_since_nonzero(series: pd.Series) -> pd.Series:
        last_nonzero_idx = -1
        result = []
        for i, value in enumerate(series.tolist()):
            result.append(i - last_nonzero_idx if last_nonzero_idx >= 0 else i + 1)
            if value and value > 0:
                last_nonzero_idx = i
        return pd.Series(result, index=series.index)

    df["days_since_last_sale"] = (
        grouped["units"].apply(_days_since_nonzero).reset_index(level=0, drop=True)
    )

    # Count of non-zero days inside the last 1, 3, 7, 14, 30 days
    # (excluding today). Gives the model a hint about purchase cadence
    # without the binary split that "days_since_last_sale" tends to cause.
    for w in (1, 3, 7, 14, 30):
        col = f"active_days_{w}"
        shifted = grouped["units"].shift(1)
        df[col] = (
            shifted.groupby(df["product_id"]).rolling(w, min_periods=1).apply(
                lambda s: float((s > 0).sum()), raw=True
            ).reset_index(level=0, drop=True)
        )
        # When there is no history (shifted is NaN), fill with 0.
        df[col] = df[col].fillna(0).astype(float)

    df["sale_rate_30"] = (df["active_days_30"] / 30.0).clip(0.0, 1.0)

    # Per-product historical means using only rows before the target day.
    # This keeps training aligned with inference: the model never sees the
    # same day's units when building features for that day.
    shifted_units = grouped["units"].shift(1)
    df["product_mean"] = (
        shifted_units.groupby(df["product_id"])
        .expanding(min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
        .fillna(0.0)
    )
    df["product_recent_mean"] = (
        shifted_units.groupby(df["product_id"])
        .rolling(30, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
        .fillna(0.0)
    )

    shifted_nonzero = shifted_units.where(shifted_units > 0)
    df["product_nonzero_mean"] = (
        shifted_nonzero.groupby(df["product_id"])
        .expanding(min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
        .fillna(0.0)
    )
    df["target_units"] = df["units"].astype(float)

    df[["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_30"]] = (
        df[["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_30"]].fillna(0).astype(int)
    )

    feature_columns = (
        [f"lag_{w}" for w in LAG_WINDOWS]
        + [f"roll_mean_{w}" for w in ROLL_WINDOWS]
        + [f"roll_std_{w}" for w in ROLL_STD_WINDOWS]
        + [f"active_days_{w}" for w in (1, 3, 7, 14, 30)]
        + [
            "day_of_week",
            "day_of_month",
            "month",
            "is_weekend",
            "is_business_day",
            "is_dispatch_day",
            "days_to_next_dispatch",
            "weekday_sales_score",
            "days_since_last_sale",
            "product_id",
            "category_id",
            "product_mean",
            "product_recent_mean",
            "sale_rate_30",
            "product_nonzero_mean",
        ]
    )
    return df, feature_columns


def build_training_frame(lookback_days: int = 90) -> AggregatorResult:
    """Build a feature DataFrame for the last ``lookback_days`` days."""
    sales, start_date, end_date = _build_sales_frame(lookback_days)
    dispatch_weekdays = _infer_dispatch_weekdays(sales)
    weekday_scores = _weekday_sales_scores(sales)
    products = list(Product.objects.select_related("category").all())
    products_df = _build_product_grid(products)
    products_df = _attach_stock_features(products_df, end_date)

    dates = [start_date + timedelta(days=offset) for offset in range(lookback_days)]
    daily = _ensure_daily_grid(products_df, dates, sales)
    daily = _add_temporal_features(daily, dispatch_weekdays, weekday_scores)
    daily, feature_columns = _add_lag_roll_features(daily)
    daily = daily[daily["active"]]  # only active products are trained on

    return AggregatorResult(
        frame=daily,
        feature_columns=feature_columns,
        start_date=start_date,
        end_date=end_date,
        n_products=int(products_df["product_id"].nunique()),
        dispatch_weekdays=dispatch_weekdays,
    )


def build_latest_features(lookback_days: int = 90) -> tuple[pd.DataFrame, list[str], list[Product]]:
    """Build the feature row for "tomorrow" using the most recent history."""
    result = build_training_frame(lookback_days)
    frame = result.frame
    if frame.empty:
        return frame, result.feature_columns, list(Product.objects.all())

    products = list(Product.objects.select_related("category").all())
    last_date = frame["date"].max()
    tomorrow = (pd.Timestamp(last_date) + pd.Timedelta(days=1)).date()
    tomorrow_df = pd.DataFrame([{"date": tomorrow}])
    products_grid = (
        pd.DataFrame([{
            "product_id": p.id,
            "category_id": getattr(p, "category_id", 0) or 0,
            "active": bool(p.active),
        } for p in products])
    )
    if products_grid.empty:
        return pd.DataFrame(columns=result.feature_columns), result.feature_columns, products

    grid = tomorrow_df.assign(_k=1).merge(products_grid.assign(_k=1), on="_k").drop(columns="_k")
    grid = _attach_stock_features(grid, tomorrow)
    sales, _, _ = _build_sales_frame(lookback_days)
    weekday_scores = _weekday_sales_scores(sales)
    grid = _add_temporal_features(grid, result.dispatch_weekdays, weekday_scores)

    combined = pd.concat([frame, grid], ignore_index=True, sort=False)
    combined = combined.sort_values(["product_id", "date"]).reset_index(drop=True)

    combined, feature_columns = _add_lag_roll_features(combined)
    tomorrow_rows = combined[combined["date"] == pd.Timestamp(tomorrow)].copy()
    return tomorrow_rows, feature_columns, products


def _business_dates(start: date, horizon_days: int) -> list[date]:
    dates: list[date] = []
    cursor = start
    while len(dates) < horizon_days:
        if cursor.weekday() < 5:
            dates.append(cursor)
        cursor += timedelta(days=1)
    return dates


def build_future_features(
    lookback_days: int = 90,
    horizon_days: int = FORECAST_HORIZON_DAYS,
) -> tuple[pd.DataFrame, list[str], list[Product]]:
    """Build feature rows for the next business days for every active product."""
    result = build_training_frame(lookback_days)
    frame = result.frame
    if frame.empty:
        return frame, result.feature_columns, list(Product.objects.all())

    products = list(Product.objects.select_related("category").all())
    products_grid = pd.DataFrame([{
        "product_id": p.id,
        "category_id": getattr(p, "category_id", 0) or 0,
        "active": bool(p.active),
    } for p in products if p.active])
    if products_grid.empty:
        return pd.DataFrame(columns=result.feature_columns), result.feature_columns, products

    sales, _, _ = _build_sales_frame(lookback_days)
    weekday_scores = _weekday_sales_scores(sales)
    first_date = (pd.Timestamp(frame["date"].max()) + pd.Timedelta(days=1)).date()
    future_dates = _business_dates(first_date, horizon_days)
    future_rows: list[pd.DataFrame] = []

    for future_date in future_dates:
        day_df = pd.DataFrame({"date": [future_date]}).assign(_k=1)
        grid = day_df.merge(products_grid.assign(_k=1), on="_k").drop(columns="_k")
        grid = _attach_stock_features(grid, future_date)
        grid["units"] = 0
        grid = _add_temporal_features(grid, result.dispatch_weekdays, weekday_scores)
        combined = pd.concat([frame, grid], ignore_index=True, sort=False)
        combined = combined.sort_values(["product_id", "date"]).reset_index(drop=True)
        combined, feature_columns = _add_lag_roll_features(combined)
        future_rows.append(combined[combined["date"] == pd.Timestamp(future_date)].copy())

    return pd.concat(future_rows, ignore_index=True, sort=False), result.feature_columns, products


__all__ = [
    "AggregatorResult",
    "build_training_frame",
    "build_latest_features",
    "build_future_features",
    "FORECAST_HORIZON_DAYS",
    "LAG_WINDOWS",
    "ROLL_WINDOWS",
]
