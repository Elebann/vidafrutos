"""Business rules that translate the regression forecast into a production
suggestion that avoids stockouts and overstock.
"""

from __future__ import annotations

import math
from typing import Any

import pandas as pd

from .model import SERVICE_LEVEL_Z

# Days of cover thresholds used to flag overstock risk. If a product's
# final stock after today's production is more than OVERSTOCK_DAYS_COVER
# times the expected daily demand, we consider it "Alto" riesgo.
OVERSTOCK_DAYS_COVER = 21


def apply_policy(predictions: pd.DataFrame) -> list[dict[str, Any]]:
    """Return the list of Forecast dicts the API will serialize."""
    if predictions.empty:
        return []

    working = predictions.copy().reset_index(drop=True)
    daily_rows: list[dict[str, Any]] = []
    sort_cols = ["product_id"] + (["date"] if "date" in working.columns else [])
    working = working.sort_values(sort_cols).reset_index(drop=True)
    for product_id, group in working.groupby("product_id", sort=False):
        group = group.sort_values("date") if "date" in group.columns else group
        first = group.iloc[0]
        starting_available = float(first.get("available_stock", 0) or 0)
        allocated = float(first.get("allocated_stock", 0) or 0)
        projected_stock = max(0.0, starting_available - allocated)

        for _, row in group.iterrows():
            expected = float(row.get("expected_sales", 0) or 0)
            minimum = float(row.get("minimum_stock", 0) or 0)
            roll_std = float(row.get("roll_std_30", 0.0) or 0.0)
            roll_mean = float(row.get("roll_mean_30", 0.0) or 0.0)
            confidence = float(row.get("confidence", 50.0) or 0.0)
            safety = max(0.0, math.ceil(SERVICE_LEVEL_Z * roll_std))
            target_stock_before_sale = expected + safety + minimum
            suggested = max(0, int(math.ceil(target_stock_before_sale - projected_stock)))
            projected_stock = projected_stock + suggested - expected

            daily_demand = max(roll_mean, expected, 1.0)
            overstock_threshold = OVERSTOCK_DAYS_COVER * daily_demand + minimum
            if projected_stock < minimum or projected_stock < 0:
                risk = "Alto"
            elif projected_stock > overstock_threshold:
                risk = "Alto"
            elif confidence < 70.0:
                risk = "Medio"
            else:
                risk = "Bajo"

            daily_rows.append({
                "productId": int(product_id),
                "productName": str(row.get("product_name", "")),
                "date": str(row.get("date", "")),
                "expectedSales": int(expected),
                "suggestedProduction": int(suggested),
                "confidence": confidence,
                "risk": risk,
                "availableStock": int(starting_available),
                "allocatedStock": int(allocated),
                "minimumStock": int(minimum),
            })

    rows: list[dict[str, Any]] = []
    for product_id, group in pd.DataFrame(daily_rows).groupby("productId", sort=False):
        plan = group.sort_values("date").to_dict("records")
        first = plan[0]
        confidence_values = [float(row["confidence"]) for row in plan]
        confidence_weights = [
            max(1, int(row["expectedSales"]) + int(row["suggestedProduction"]))
            for row in plan
        ]
        weighted_confidence = (
            sum(value * weight for value, weight in zip(confidence_values, confidence_weights))
            / sum(confidence_weights)
            if confidence_values and sum(confidence_weights) > 0
            else 0.0
        )
        risk_values = [str(row["risk"]) for row in plan]
        risk = "Alto" if "Alto" in risk_values else "Medio" if "Medio" in risk_values else "Bajo"
        rows.append({
            "productId": int(product_id),
            "productName": str(first["productName"]),
            "expectedSales": int(sum(int(row["expectedSales"]) for row in plan)),
            "suggestedProduction": int(sum(int(row["suggestedProduction"]) for row in plan)),
            "confidence": float(round(weighted_confidence, 1)),
            "risk": risk,
            "availableStock": int(first["availableStock"]),
            "allocatedStock": int(first["allocatedStock"]),
            "minimumStock": int(first["minimumStock"]),
            "productionPlan": [
                {
                    "date": str(row["date"]),
                    "expectedSales": int(row["expectedSales"]),
                    "suggestedProduction": int(row["suggestedProduction"]),
                    "confidence": float(row["confidence"]),
                    "risk": str(row["risk"]),
                }
                for row in plan
            ],
        })
    return rows


__all__ = ["apply_policy"]
