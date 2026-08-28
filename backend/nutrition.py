"""NutriPlan — nutrition math, unit handling and food matching."""

import math
import re

from food_data import CATS, CAT_ORDER
from parser import parse_ing_line

UNIT_LABELS = {
    "g": "g", "kg": "kg", "oz": "oz", "lb": "lb", "ml": "ml", "l": "L",
    "cup": "cup", "tbsp": "tbsp", "tsp": "tsp", "piece": "pc",
    "clove": "clove", "slice": "slice", "scoop": "scoop", "can": "can",
    "glass": "glass", "plate": "plate", "bowl": "bowl", "katori": "katori",
    "pack": "pack", "pinch": "pinch",
}

GLOBAL_UNITS = {"g": 1.0, "kg": 1000.0, "oz": 28.35, "lb": 453.59, "ml": 1.0, "l": 1000.0, "pinch": 0.36}


def units_for(food):
    """food: dict-like with keys units (dict|null) and liq (bool)"""
    out = ["g", "oz", "lb"]
    if food.get("liq"):
        out = ["ml", "l"] + out
    u = food.get("units") or {}
    for k in u:
        if k not in out:
            out.append(k)
    return out


def unit_grams(food, unit):
    if not unit:
        return None
    if unit in GLOBAL_UNITS and unit != "pinch":
        return GLOBAL_UNITS[unit]
    u = food.get("units") or {}
    if unit in u:
        return float(u[unit])
    if unit == "pinch":
        return 0.36
    return None


def default_unit_for(food):
    u = food.get("units") or {}
    for k in ("tsp", "tbsp", "piece", "cup", "glass", "ml"):
        if k in u:
            return k
    return "ml" if food.get("liq") else "g"


def default_qty_for(food):
    u = default_unit_for(food)
    q = 100.0 if u == "g" else (0.5 if u == "tsp" else 1.0)
    return q, u


def ing_grams(qty, unit, food):
    g = unit_grams(food, unit)
    if g is None:
        return 0.0
    return max(0.0, (qty or 0.0) * g)


# ---------------- matching ----------------

def _tokens(s):
    return [t for t in re.sub(r"[^a-z0-9 ]+", " ", str(s).lower()).split(" ") if t]


def _norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", str(s).lower())).strip()


def best_match(name, foods):
    """foods: list of dicts {key,name,aliases,units,liq,...}. -> best dict or None."""
    q_norm = _norm(name)
    if not q_norm:
        return None
    qt = _tokens(q_norm)
    best, best_s = None, 0.0
    for f in foods:
        name_norm = _norm(f["name"])
        aliases = [a.strip().lower() for a in (f.get("aliases") or "").split(",") if a.strip()]
        toks = set(_tokens(f["name"]))
        for a in aliases:
            toks.update(_tokens(a))
        if name_norm == q_norm:
            s = 1000.0
        elif q_norm in aliases:
            s = 950.0
        else:
            s = 0.0
            if q_norm in name_norm:
                s = max(s, 760.0)
            hit = sum(1 for t in qt if t in toks)
            frac = (hit / len(qt)) if qt else 0.0
            if frac == 1:
                s = max(s, 700.0)
            elif frac > 0:
                s = max(s, 360.0 * frac)
            if any(q_norm in a for a in aliases):
                s = max(s, 640.0)
        s -= len(toks)
        if s > best_s:
            best_s, best = s, f
    return best if best_s >= 300 else None


def search_foods(q, foods, limit=10):
    q = q.strip().lower()
    q_norm = _norm(q)
    qt = _tokens(q)
    scored = []
    for f in foods:
        name_norm = _norm(f["name"])
        aliases = [a.strip().lower() for a in (f.get("aliases") or "").split(",") if a.strip()]
        s = 0.0
        if q_norm and (name_norm.startswith(q_norm) or any(a.startswith(q_norm) for a in aliases)):
            s = 900.0
        elif q_norm and q_norm in name_norm:
            s = 700.0
        elif qt:
            toks = set(_tokens(f["name"]))
            for a in aliases:
                toks.update(_tokens(a))
            hit = sum(1 for t in qt if t in toks)
            if hit == len(qt) and qt:
                s = 500.0
            elif hit:
                s = 380.0 * (hit / len(qt))
            elif len(qt) == 1 and any(t.startswith(qt[0]) for t in toks):
                s = 250.0
        if s > 0:
            scored.append((s - len(f["name"]) / 10.0, f))
    scored.sort(key=lambda x: -x[0])
    return [f for _, f in scored[:limit]]


# ---------------- nutrition aggregation ----------------

def zero_nut():
    return {"kcal": 0.0, "p": 0.0, "c": 0.0, "f": 0.0, "fib": 0.0, "sug": 0.0, "na": 0.0}


def add_nut(t, food, grams):
    k = grams / 100.0
    t["kcal"] += float(food.get("k", 0) or 0) * k
    for fld in ("p", "c", "f", "fib", "sug", "na"):
        t[fld] += float(food.get(fld, 0) or 0) * k


def round_nut(t, nd=1):
    return {k: (round(v, nd) if nd else round(v)) for k, v in t.items()}


def scale_nut(t, factor):
    return {k: v * factor for k, v in t.items()}


def fmt_amount(food, grams):
    """'472 g (≈ 4 pieces)' server-side display string (plain text)."""
    g = int(round(grams))
    s = ("%0.2f" % (g / 1000.0)).rstrip("0.").rstrip(".") + " kg" if g >= 1000 else "%d g" % g
    units = food.get("units") or {}
    for unit in ("cup", "piece", "tbsp", "tsp", "glass", "katori"):
        if unit in units:
            v = grams / float(units[unit])
            if 0.75 <= v <= 24 and abs(v * 4 - round(v * 4)) < 0.15:
                vv = ("%0.2f" % v).rstrip("0.").rstrip(".")
                s += " (approx %s %s%s)" % (vv, unit, "s" if v > 1 else "")
                break
    return s


def food_to_dict(row):
    """Food DB row -> API dict."""
    return {
        "id": row.id,
        "key": row.key,
        "name": row.name,
        "image": ("/food_images/" + row.image) if row.image else None,
        "aliases": row.aliases or "",
        "cat": row.cat,
        "cat_label": CATS.get(row.cat, row.cat),
        "per100": {"kcal": row.k, "p": row.p, "c": row.c, "f": row.f,
                   "fib": row.fib, "sug": row.sug, "na": row.na},
        "units": row.units or {},
        "units_available": units_for({"units": row.units, "liq": row.liq}),
        "liq": bool(row.liq),
        "custom": row.owner_user_id is not None,
    }


def trim_num(x):
    r = round(float(x) * 100) / 100
    if abs(r - round(r)) < 0.005:
        return int(round(r))
    return r
