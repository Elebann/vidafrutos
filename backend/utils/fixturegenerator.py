import json
import math
import random
from collections import defaultdict
from datetime import datetime, time, timedelta, timezone

# =====================================================
# CONFIGURACION
# =====================================================

SEED = 42
random.seed(SEED)

TODAY = datetime.now(timezone.utc).date()
HISTORY_DAYS = 180
OUTPUT_FILE = f"new_orders_data_{TODAY:%Y%m%d}.json"

CUSTOMERS = [1, 2, 3, 4, 5, 6]

STATE_REGISTRADO = 1
STATE_VALIDADO = 2
STATE_EN_PRODUCCION = 3
STATE_LISTO_DESPACHO = 4
STATE_ENVIADO = 5
STATE_PAGO_CONFIRMADO = 6

RECENT_STATES = [
    STATE_EN_PRODUCCION,
    STATE_LISTO_DESPACHO,
    STATE_ENVIADO,
    STATE_PAGO_CONFIRMADO,
]

DISPATCH_WEEKDAYS = [1, 3]  # martes y jueves

HIGH_DEMAND = [7, 8, 9, 16, 17]
LOW_DEMAND = [11]
NORMAL_DEMAND = [1, 2, 3, 5, 6, 10, 12, 13, 14, 15, 18]
OPTIONAL_DEMAND = [4]  # Nueces: producto inactivo en mock_data.json.
ACTIVE_PRODUCTS = HIGH_DEMAND + LOW_DEMAND + NORMAL_DEMAND

PRODUCT_PRICES = {
    1: 600,
    2: 600,
    3: 700,
    4: 700,
    5: 1200,
    6: 1200,
    7: 800,
    8: 800,
    9: 1000,
    10: 900,
    11: 1200,
    12: 1400,
    13: 1200,
    14: 1000,
    15: 1400,
    16: 1000,
    17: 1000,
    18: 1000,
}

# Produccion semanal objetivo aproximada. El generador reparte cada semana
# entre martes y jueves y luego divide en pedidos de clientes.
WEEKLY_TARGET_UNITS = {
    7: 390,   # Mani Frambuesa
    8: 400,   # Confitado Sesamo
    9: 420,   # Cholito
    16: 380,  # Mani Japones Natural
    17: 390,  # Mani Japones Merken
    11: 70,   # Mango
    1: 180,
    2: 170,
    3: 150,
    5: 120,
    6: 160,
    10: 140,
    12: 170,
    13: 150,
    14: 165,
    15: 130,
    18: 155,
}

MONTHLY_FACTORS = {
    1: 0.92,
    2: 0.95,
    3: 1.00,
    4: 1.04,
    5: 1.08,
    6: 1.03,
    7: 0.98,
    8: 1.00,
    9: 1.05,
    10: 1.08,
    11: 1.12,
    12: 1.18,
}

PAYMENT_METHODS = ["TRANSFER", "CASH", "DEBIT_CARD", "CREDIT_CARD"]
PAYMENT_WEIGHTS = [40, 10, 25, 25]


# =====================================================
# FECHAS Y ESTADOS
# =====================================================

def dispatch_dates(start_date, end_date):
    current = start_date
    dates = []
    while current <= end_date:
        if current.weekday() in DISPATCH_WEEKDAYS:
            dates.append(current)
        current += timedelta(days=1)
    return dates


def order_state_for(day):
    age_days = (TODAY - day).days
    if age_days > 30:
        return STATE_PAGO_CONFIRMADO
    return random.choice(RECENT_STATES)


def random_delivery_datetime(day):
    return datetime.combine(
        day,
        time(
            hour=random.randint(8, 18),
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
        ),
        tzinfo=timezone.utc,
    )


# =====================================================
# DEMANDA
# =====================================================

def week_start(day):
    return day - timedelta(days=day.weekday())


def week_factor(week):
    # Tendencia suave + ruido semanal reproducible. Le da al Random Forest
    # patrones menos planos sin romper las magnitudes del negocio.
    weeks_from_start = max(0, (week - START_DATE).days // 7)
    trend = 1.0 + min(0.18, weeks_from_start * 0.006)
    seasonal = MONTHLY_FACTORS[week.month]
    noise = random.uniform(0.88, 1.14)
    return trend * seasonal * noise


def product_day_factor(product_id, day):
    # Algunos productos cargan mas el martes o el jueves. Esto crea una senal
    # realista para day_of_week sin inventar ventas fuera de despacho.
    if product_id in {7, 9, 16}:
        return 0.56 if day.weekday() == 1 else 0.44
    if product_id in {8, 17}:
        return 0.46 if day.weekday() == 1 else 0.54
    return 0.50 + random.uniform(-0.06, 0.06)


def planned_units(product_id, day, factor):
    weekly_target = WEEKLY_TARGET_UNITS[product_id]
    day_units = weekly_target * product_day_factor(product_id, day) * factor

    if product_id in LOW_DEMAND:
        day_units *= random.uniform(0.70, 1.15)
    elif product_id in HIGH_DEMAND:
        day_units *= random.uniform(0.88, 1.12)
    else:
        day_units *= random.uniform(0.75, 1.25)

    return max(0, int(round(day_units)))


def split_units_into_lines(total_units):
    if total_units <= 0:
        return []

    lines = []
    remaining = total_units
    while remaining > 0:
        if remaining <= 15:
            lines.append(remaining)
            break
        quantity = random.randint(6, 15)
        lines.append(quantity)
        remaining -= quantity
    random.shuffle(lines)
    return lines


def build_day_plan(day, factor):
    plan = []
    for product_id in ACTIVE_PRODUCTS:
        units = planned_units(product_id, day, factor)
        for quantity in split_units_into_lines(units):
            plan.append((product_id, quantity))

    # Muy ocasionalmente se registra venta de Nueces. Si el producto sigue
    # inactivo en mock_data.json, el forecast lo ignorara al entrenar.
    if day.month != 3 and random.random() < 0.18:
        units = random.randint(8, 35)
        for quantity in split_units_into_lines(units):
            plan.append((OPTIONAL_DEMAND[0], quantity))

    random.shuffle(plan)
    return plan


def chunk_day_plan(day_plan):
    # Agrupa lineas en pedidos manteniendo variedad de productos por cliente.
    chunks = []
    pending = list(day_plan)
    while pending:
        max_lines = min(len(pending), random.randint(5, 10))
        chunk = pending[:max_lines]
        pending = pending[max_lines:]
        chunks.append(chunk)
    return chunks


# =====================================================
# GENERACION
# =====================================================

END_DATE = TODAY - timedelta(days=1)
START_DATE = TODAY - timedelta(days=HISTORY_DAYS)

orders = []
details = []
invoices = []
daily_totals = defaultdict(int)
product_totals = defaultdict(int)
state_counts = defaultdict(int)

order_pk = 1
detail_pk = 1
invoice_pk = 1

for week in sorted({week_start(day) for day in dispatch_dates(START_DATE, END_DATE)}):
    factor = week_factor(week)
    for day in dispatch_dates(week, week + timedelta(days=6)):
        if day < START_DATE or day > END_DATE:
            continue

        day_plan = build_day_plan(day, factor)
        for chunk in chunk_day_plan(day_plan):
            customer = random.choice(CUSTOMERS)
            order_date = random_delivery_datetime(day)
            state = order_state_for(day)
            order_total = 0

            orders.append({
                "model": "orders.order",
                "pk": order_pk,
                "fields": {
                    "customer": customer,
                    "state": state,
                    "date": order_date.strftime("%Y-%m-%d"),
                },
            })
            state_counts[state] += 1

            for product_id, quantity in chunk:
                price = PRODUCT_PRICES[product_id]
                line_total = price * quantity
                order_total += line_total
                daily_totals[day] += quantity
                product_totals[product_id] += quantity

                details.append({
                    "model": "orders.orderdetail",
                    "pk": detail_pk,
                    "fields": {
                        "order": order_pk,
                        "product": product_id,
                        "quantity": quantity,
                        "price": line_total,
                    },
                })
                detail_pk += 1

            payment_method = random.choices(
                PAYMENT_METHODS,
                weights=PAYMENT_WEIGHTS,
                k=1,
            )[0]

            invoices.append({
                "model": "billing.invoice",
                "pk": invoice_pk,
                "fields": {
                    "order": order_pk,
                    "user": 1,
                    "date": order_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "total": str(order_total),
                    "payment_method": payment_method,
                },
            })

            invoice_pk += 1
            order_pk += 1


# =====================================================
# EXPORTAR
# =====================================================

fixture = orders + details + invoices

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(fixture, f, indent=2, ensure_ascii=False)


# =====================================================
# ESTADISTICAS
# =====================================================

weeks = max(1, math.ceil((END_DATE - START_DATE).days / 7))

print("=" * 50)
print("FIXTURE GENERADO")
print("=" * 50)
print(f"Seed: {SEED}")
print(f"Rango: {START_DATE} -> {END_DATE}")
print(f"Despachos: {len(daily_totals)}")
print(f"Pedidos: {len(orders)}")
print(f"Detalles: {len(details)}")
print(f"Facturas: {len(invoices)}")
print(f"Total registros: {len(fixture)}")
print(f"Archivo: {OUTPUT_FILE}")
print("-" * 50)
print("Estados:")
for state_id in sorted(state_counts):
    print(f"  estado {state_id}: {state_counts[state_id]}")
print("-" * 50)
print("Promedio semanal por producto:")
for product_id in sorted(product_totals):
    weekly_avg = product_totals[product_id] / weeks
    print(f"  producto {product_id}: {weekly_avg:.1f} unidades/semana")
print("=" * 50)
