"""NutriPlan — ingredient line parser.

Parses pasted lines such as "1 1/2 cups basmati rice", "100g chicken breast",
"Salt to taste" into (qty, unit, cleaned_name, note).
"""

import re

FRAC_CHARS = {"½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
              "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875}

UNIT_SYNONYMS = {
    "g": ["g", "gm", "gms", "gram", "grams"],
    "kg": ["kg", "kgs", "kilogram", "kilograms"],
    "oz": ["oz", "ounce", "ounces"],
    "lb": ["lb", "lbs", "pound", "pounds"],
    "ml": ["ml", "mls", "milliliter", "millilitre", "milliliters", "millilitres"],
    "l": ["l", "ltr", "liter", "litre", "liters", "litres"],
    "cup": ["cup", "cups"],
    "tbsp": ["tbsp", "tbsps", "tbs", "tbspn", "tablespoon", "tablespoons"],
    "tsp": ["tsp", "tsps", "tspn", "teaspoon", "teaspoons"],
    "piece": ["pc", "pcs", "piece", "pieces", "no", "nos", "whole", "medium", "large", "small", "big"],
    "clove": ["clove", "cloves"],
    "slice": ["slice", "slices"],
    "scoop": ["scoop", "scoops"],
    "can": ["can", "cans"],
    "glass": ["glass", "glasses"],
    "plate": ["plate", "plates"],
    "bowl": ["bowl", "bowls"],
    "katori": ["katori", "katoris"],
    "pack": ["pack", "packs", "packet", "packets"],
    "pinch": ["pinch", "pinches", "dash"],
}

UNIT_LOOKUP = {}
for _canon, _syms in UNIT_SYNONYMS.items():
    for _s in _syms:
        UNIT_LOOKUP[_s] = _canon

STRIP_WORDS = {
    "chopped", "sliced", "diced", "minced", "grated", "cubed", "finely",
    "roughly", "thinly", "washed", "soaked", "boiled", "peeled", "deboned",
    "boneless", "skinless", "optional", "to", "taste", "for", "garnish",
    "room", "temperature", "extra",
}

_QTY_RE = re.compile(
    r"^(\d+(?:\.\d+)?)"
    r"(?:\s+(\d+)\s*/\s*(\d+)|\s*/\s*(\d+)|\s*([½¼¾⅓⅔⅛⅜⅝⅞]))?"
    r"\s*"
)


def _parse_qty(s):
    """returns (qty or None, rest)"""
    m = re.match(r"^([½¼¾⅓⅔⅛⅜⅝⅞])\s+", s)
    if m:
        return FRAC_CHARS[m.group(1)], s[m.end():]
    m = _QTY_RE.match(s)
    if m:
        v = float(m.group(1))
        if m.group(2) is not None:
            d = float(m.group(3) or 1)
            v += float(m.group(2)) / (d if d else 1)
        elif m.group(4) is not None:
            d = float(m.group(4))
            v = v / (d if d else 1)
        elif m.group(5) is not None:
            v += FRAC_CHARS[m.group(5)]
        return v, s[m.end():]
    if s.startswith("half "):
        return 0.5, s[5:]
    m = re.match(r"^(a|an)\s+", s)
    if m:
        return 1, s[m.end():]
    return None, s


def parse_ing_line(line):
    """-> dict(qty, unit, name, note) or None for empty lines."""
    s = str(line or "").strip()
    if not s:
        return None

    note = ""
    def _paren(m):
        nonlocal note
        note = m.group(1).strip()
        return "  "

    s = re.sub(r"\(([^)]*)\)", _paren, s)
    s = re.sub(r"\s+", " ", s.lower()).strip()
    s = re.sub(r"\bto taste\b", " ", s)
    s = re.sub(r"[.,;]+$", "", s).strip()
    if not s:
        return None

    qty, rest = _parse_qty(s)

    unit = None
    name = rest
    parts = rest.split(" ")
    first_raw = parts[0] if parts else ""
    first_stripped = first_raw[:-1] if first_raw.endswith("s") and len(first_raw) > 1 else first_raw
    if first_raw in UNIT_LOOKUP:
        unit = UNIT_LOOKUP[first_raw]
    elif first_stripped in UNIT_LOOKUP:
        unit = UNIT_LOOKUP[first_stripped]
    if unit and " " in rest:
        name = rest[rest.index(" ") + 1:]
    elif unit:
        name = ""

    words = [w for w in name.split(" ") if w and w not in STRIP_WORDS]
    name = re.sub(r"[.,;:]+$", "", " ".join(words)).strip()

    if not name and note:
        name = note.lower()

    return {"qty": qty, "unit": unit, "name": name, "note": note}
