import json
import statistics
from typing import Any


class KpiService:
    @staticmethod
    def auto_detect_kpis(data: list[dict], columns: list[dict]) -> list[dict]:
        kpis = []
        numeric_cols = [c for c in columns if c.get("type") == "numeric"]

        for col in numeric_cols:
            col_name = col["name"]
            values = []
            for row in data:
                try:
                    val = float(row.get(col_name, 0))
                    values.append(val)
                except (ValueError, TypeError):
                    continue

            if not values:
                continue

            avg_val = statistics.mean(values)
            max_val = max(values)
            min_val = min(values)
            total = sum(values)

            kpis.append({
                "name": f"Average {col_name}",
                "column_name": col_name,
                "current_value": round(avg_val, 2),
                "target_value": round(avg_val * 1.1, 2),
                "threshold_green": 90,
                "threshold_yellow": 70,
                "unit": "value",
                "trend": "stable",
            })

            if len(values) > 1:
                first_half = values[: len(values) // 2]
                second_half = values[len(values) // 2 :]
                trend_val = (
                    (statistics.mean(second_half) - statistics.mean(first_half))
                    / statistics.mean(first_half)
                    * 100
                    if statistics.mean(first_half) != 0
                    else 0
                )
                kpis[-1]["trend"] = "up" if trend_val > 5 else ("down" if trend_val < -5 else "stable")

        return kpis[:8]

    @staticmethod
    def compute_kpi_status(current: float, target: float, threshold_green: float, threshold_yellow: float) -> str:
        if target == 0:
            return "pending"
        ratio = (current / target) * 100
        if ratio >= threshold_green:
            return "green"
        elif ratio >= threshold_yellow:
            return "yellow"
        return "red"

    @staticmethod
    def analyze_data_quality(data: list[dict], columns: list[dict]) -> dict:
        total_rows = len(data)
        issues = []

        for col in columns:
            col_name = col["name"]
            null_count = sum(1 for row in data if not row.get(col_name) or str(row.get(col_name, "")).strip() == "")
            if null_count > 0:
                pct = (null_count / total_rows) * 100
                if pct > 10:
                    issues.append(f"Column '{col_name}': {pct:.1f}% missing values")

            if col["type"] == "numeric":
                values = []
                for row in data:
                    try:
                        v = float(row.get(col_name, 0))
                        values.append(v)
                    except:
                        pass

                if values:
                    mean = statistics.mean(values)
                    stdev = statistics.stdev(values) if len(values) > 1 else 0
                    if stdev > 0:
                        outliers = sum(1 for v in values if abs(v - mean) > 3 * stdev)
                        if outliers > 0:
                            issues.append(f"Column '{col_name}': {outliers} outlier(s) detected")

        return {"total_rows": total_rows, "issues": issues, "quality_score": max(0, 100 - len(issues) * 10)}

    @staticmethod
    def get_field_suggestions(columns: list[dict]) -> dict:
        suggestions = {"revenue": [], "cost": [], "growth": [], "profit": [], "count": []}
        revenue_kw = ["revenue", "income", "sales", "إيراد", "مبيعات", "دخل"]
        cost_kw = ["cost", "expense", "تكلفة", "مصروف"]
        growth_kw = ["growth", "increase", "نمو", "زيادة"]
        profit_kw = ["profit", "margin", "ربح", "هامش"]
        count_kw = ["count", "quantity", "عدد", "كمية"]

        for col in columns:
            name_lower = col["name"].lower()
            if any(k in name_lower for k in revenue_kw):
                suggestions["revenue"].append(col["name"])
            if any(k in name_lower for k in cost_kw):
                suggestions["cost"].append(col["name"])
            if any(k in name_lower for k in growth_kw):
                suggestions["growth"].append(col["name"])
            if any(k in name_lower for k in profit_kw):
                suggestions["profit"].append(col["name"])
            if any(k in name_lower for k in count_kw):
                suggestions["count"].append(col["name"])

        return suggestions


kpi_service = KpiService()
