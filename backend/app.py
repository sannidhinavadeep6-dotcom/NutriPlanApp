"""NutriPlan — Flask backend: JWT auth, admin portal, recipes, planning,
nutrition analysis and grocery lists on SQLite.

Run:  python3 app.py   (serves API + built Angular app on http://0.0.0.0:8000)
"""

import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Flask, jsonify, make_response, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from food_data import CATS, CAT_ORDER
from models import (db, User, Goal, Food, Recipe, Ingredient, PlanEntry,
                    GroceryCheck, GroceryExtra)
from nutrition import (UNIT_LABELS, best_match, search_foods, units_for,
                       unit_grams, default_unit_for, default_qty_for,
                       ing_grams, zero_nut, add_nut, round_nut, fmt_amount,
                       food_to_dict)
from parser import parse_ing_line
from seed import ensure_foods, ensure_recipes, seed_if_empty

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "nutriplan.db")
STATIC_DIR = os.path.join(BASE_DIR, "static")
SECRET_FILE = os.path.join(BASE_DIR, "jwt_secret.key")

SLOTS = ["breakfast", "lunch", "dinner", "snacks"]
JWT_TTL_HOURS = 24 * 7


def get_secret():
    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE) as fh:
            return fh.read().strip()
    s = secrets.token_hex(32)
    with open(SECRET_FILE, "w") as fh:
        fh.write(s)
    return s


SECRET = get_secret()

# ------------------------------------------------------------------ app setup

def create_app():
    app = Flask(__name__, static_folder=None)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + DB_PATH
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"connect_args": {"check_same_thread": False}}
    CORS(app, supports_credentials=True)
    db.init_app(app)
    with app.app_context():
        db.create_all()
        # lightweight migration: add image column to older databases
        from sqlalchemy import text
        cols = [r[1] for r in db.session.execute(text("PRAGMA table_info(foods)"))]
        if "image" not in cols:
            db.session.execute(text("ALTER TABLE foods ADD COLUMN image VARCHAR(255)"))
            db.session.commit()
        rcols = [r[1] for r in db.session.execute(text("PRAGMA table_info(recipes)"))]
        if "image" not in rcols:
            db.session.execute(text("ALTER TABLE recipes ADD COLUMN image VARCHAR(255)"))
            db.session.commit()

        # lightweight migration: allow recipes.user_id to be NULL for global library recipes
        user_id_col = [r for r in db.session.execute(text("PRAGMA table_info(recipes)")) if r[1] == "user_id"]
        if user_id_col and user_id_col[0][3] == 1:  # notnull constraint active
            db.session.execute(text("PRAGMA foreign_keys=OFF"))
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS recipes_migrated (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    name VARCHAR(200) NOT NULL,
                    servings FLOAT NOT NULL DEFAULT 4.0,
                    steps TEXT NOT NULL DEFAULT '',
                    image VARCHAR(255),
                    FOREIGN KEY(user_id) REFERENCES users (id)
                )
            """))
            db.session.execute(text("""
                INSERT INTO recipes_migrated (id, user_id, name, servings, steps, image)
                SELECT id, user_id, name, servings, steps, image FROM recipes
            """))
            db.session.execute(text("DROP TABLE recipes"))
            db.session.execute(text("ALTER TABLE recipes_migrated RENAME TO recipes"))
            db.session.execute(text("CREATE INDEX IF NOT EXISTS ix_recipes_user_id ON recipes (user_id)"))
            db.session.execute(text("PRAGMA foreign_keys=ON"))
            db.session.commit()

    seed_if_empty(app)
    ensure_foods(app)     # add new foods to existing databases too
    ensure_recipes(app)   # add new demo recipes to existing databases too
    return app


app = create_app()

# ------------------------------------------------------------------ helpers


def make_token(user):
    payload = {
        "sub": str(user.id),  # PyJWT >= 2.10 requires string subject
        "role": user.role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_TTL_HOURS),
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def get_token():
    """JWT via whichever channel survives the environment:
    1. Authorization: Bearer header (normal browsers / localhost)
    2. X-Auth-Token header (proxies that strip Authorization)
    3. ?np_auth= query param (proxies that strip custom headers too)
    4. np_token cookie (same-origin deployments)
    """
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[7:]
    xtok = request.headers.get("X-Auth-Token", "")
    if xtok:
        return xtok
    qp = request.args.get("np_auth", "")
    if qp:
        return qp
    return request.cookies.get("np_token")


def auth_user():
    token = get_token()
    if not token:
        app.logger.warning("auth fail: no token presented (path=%s)", request.path)
        return None
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        app.logger.warning("auth fail: token expired (path=%s)", request.path)
        return None
    except Exception as e:
        app.logger.warning("auth fail: bad token (%s, path=%s)", e, request.path)
        return None
    try:
        uid = int(payload.get("sub"))
    except (TypeError, ValueError):
        return None
    user = db.session.get(User, uid)
    if not user:
        app.logger.warning("auth fail: user %s not found", uid)
    return user


def require_user(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = auth_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user.status != "active":
            return jsonify({"error": "Account is not active"}), 403
        return fn(user, *args, **kwargs)
    return wrapper


def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = auth_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user.role != "admin" or user.status != "active":
            return jsonify({"error": "Admin access required"}), 403
        return fn(user, *args, **kwargs)
    return wrapper


def bad(msg, code=400):
    return jsonify({"error": msg}), code


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def goals_of(user):
    g = db.session.get(Goal, user.id)
    if not g:
        g = Goal(user_id=user.id)
        db.session.add(g)
        db.session.commit()
    return g


def available_foods(user):
    """Global foods + this user's custom foods."""
    return Food.query.filter(
        db.or_(Food.owner_user_id.is_(None), Food.owner_user_id == user.id)
    ).all()


def available_recipes(user):
    """Global library recipes (user_id is None) + this user's custom recipes."""
    return Recipe.query.filter(
        db.or_(Recipe.user_id.is_(None), Recipe.user_id == user.id)
    ).order_by(Recipe.name).all()


def recipe_nutrition(recipe):
    t = zero_nut()
    for ing in recipe.ingredients:
        if ing.food is None:
            continue
        add_nut(t, ing.food.as_food_dict(), ing_grams(ing.qty, ing.unit, ing.food.as_food_dict()))
    return t


def recipe_image_url(recipe):
    """Photo URL only when the file exists on disk (graceful partial coverage)."""
    if not recipe.image:
        return None
    if os.path.isfile(os.path.join(STATIC_DIR, "recipe_images", recipe.image)):
        return "/recipe_images/" + recipe.image
    return None


def recipe_to_summary(recipe, user=None):
    t = recipe_nutrition(recipe)
    sv = recipe.servings or 1
    is_custom = recipe.user_id is not None
    is_owner = (recipe.user_id == user.id) if (user and is_custom) else False
    return {
        "id": recipe.id,
        "name": recipe.name,
        "image": recipe_image_url(recipe),
        "servings": recipe.servings,
        "ingredient_count": len(recipe.ingredients),
        "total": round_nut(t),
        "per_serving": round_nut({k: v / sv for k, v in t.items()}),
        "custom": is_custom,
        "is_owner": is_owner,
    }


def recipe_to_detail(recipe, user=None):
    d = recipe_to_summary(recipe, user)
    d["steps"] = recipe.steps or ""
    d["ingredients"] = []
    for ing in recipe.ingredients:
        item = {
            "id": ing.id,
            "food_id": ing.food_id,
            "qty": ing.qty,
            "unit": ing.unit,
            "unit_label": UNIT_LABELS.get(ing.unit, ing.unit),
            "raw": ing.raw,
            "grams": 0.0,
        }
        if ing.food is not None:
            fd = ing.food.as_food_dict()
            item["food_name"] = ing.food.name
            item["food"] = food_to_dict(ing.food)
            item["grams"] = round(ing_grams(ing.qty, ing.unit, fd), 1)
            item["units_available"] = units_for(fd)
        else:
            item["food_name"] = None
        d["ingredients"].append(item)
    return d


def entry_nutrition(entry):
    r = entry.recipe
    if not r or not r.servings:
        return zero_nut()
    t = recipe_nutrition(r)
    factor = entry.servings / r.servings
    return {k: v * factor for k, v in t.items()}


def add_dicts(a, b):
    for k, v in b.items():
        a[k] = a.get(k, 0.0) + v
    return a


# ------------------------------------------------------------------ auth API

@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    data = request.get_json(force=True, silent=True) or {}
    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")
    if len(name) < 2:
        return bad("Please enter your full name")
    if not EMAIL_RE.match(email):
        return bad("Please enter a valid email address")
    if len(password) < 6:
        return bad("Password must be at least 6 characters")
    if User.query.filter(db.func.lower(User.email) == email).first():
        return bad("An account with this email already exists")
    db.session.add(User(email=email, name=name,
                        password_hash=generate_password_hash(password),
                        role="user", status="pending"))
    db.session.commit()
    return jsonify({"message": "Request received. An administrator will approve your account — then you can log in."}), 201


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(force=True, silent=True) or {}
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")
    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return bad("Invalid email or password", 401)
    if user.status == "pending":
        return jsonify({"error": "Your account is awaiting admin approval", "code": "pending"}), 403
    if user.status != "active":
        return jsonify({"error": "This account has been disabled by an administrator", "code": "disabled"}), 403
    token = make_token(user)
    resp = make_response(jsonify({"token": token, "user": user.to_dict()}))
    resp.set_cookie("np_token", token, max_age=JWT_TTL_HOURS * 3600,
                    samesite="Lax", httponly=False, path="/")
    return resp


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    resp = make_response(jsonify({"message": "Signed out"}))
    resp.delete_cookie("np_token", path="/")
    return resp


@app.route("/api/auth/me", methods=["GET"])
@require_user
def auth_me(user):
    return jsonify({"user": user.to_dict()})


# ------------------------------------------------------------------ foods API

@app.route("/api/foods/all", methods=["GET"])
@require_user
def foods_catalog(user):
    foods = available_foods(user)
    return jsonify({"foods": [food_to_dict(f) for f in foods]})


@app.route("/api/foods", methods=["GET"])
@require_user
def foods_list(user):
    q = request.args.get("q", "").strip()
    limit = min(20, int(request.args.get("limit", 10) or 10))
    foods = available_foods(user)
    if q:
        dicts = [f.as_food_dict() for f in foods]
        matched = search_foods(q, dicts, limit)
        by_key = {f["key"]: f for f in dicts}
        foods = [next(f for f in foods if f.key == by_key[m["key"]]["key"]) for m in matched]
    else:
        foods = foods[:limit]
    return jsonify({"foods": [food_to_dict(f) for f in foods]})


@app.route("/api/foods", methods=["POST"])
@require_user
def foods_create(user):
    data = request.get_json(force=True, silent=True) or {}
    name = str(data.get("name") or "").strip()
    if len(name) < 2:
        return bad("Please enter a food name")

    def num(key):
        try:
            return max(0.0, float(data.get(key) or 0.0))
        except (TypeError, ValueError):
            return 0.0

    units = {}
    if num("piece_g") > 0:
        units["piece"] = num("piece_g")
    if num("cup_g") > 0:
        units["cup"] = num("cup_g")
    f = Food(key="cf_" + secrets.token_hex(5), name=name,
             aliases=name.lower(), cat="MY",
             k=num("k"), p=num("p"), c=num("c"), f=num("f"),
             fib=num("fib"), sug=num("sug"), na=num("na"),
             units=(units or None), liq=False, skip=False,
             owner_user_id=user.id)
    db.session.add(f)
    db.session.commit()
    return jsonify({"food": food_to_dict(f)}), 201


@app.route("/api/foods/mine", methods=["GET"])
@require_user
def foods_mine(user):
    foods = Food.query.filter_by(owner_user_id=user.id).order_by(Food.name).all()
    return jsonify({"foods": [food_to_dict(f) for f in foods]})


@app.route("/api/foods/<int:food_id>", methods=["DELETE"])
@require_user
def foods_delete(user, food_id):
    f = db.session.get(Food, food_id)
    if not f or f.owner_user_id != user.id:
        return bad("Custom food not found", 404)
    Ingredient.query.filter_by(food_id=f.id).update({"food_id": None, "raw": f.name})
    db.session.delete(f)
    db.session.commit()
    return jsonify({"message": "Custom food deleted"})


# ------------------------------------------------------------------ parse API

@app.route("/api/parse", methods=["POST"])
@require_user
def parse_lines(user):
    data = request.get_json(force=True, silent=True) or {}
    text = str(data.get("text") or "")
    lines = [l.strip() for l in re.split(r"\r?\n", text) if l.strip()]
    if len(lines) > 200:
        return bad("Too many lines (max 200)")
    dicts = [f.as_food_dict() for f in available_foods(user)]
    rows = []
    for line in lines:
        parsed = parse_ing_line(line)
        if not parsed:
            continue
        food = best_match(parsed["name"], dicts) if parsed["name"] else None
        if food and parsed["qty"] is None:
            dq, du = default_qty_for(food)
        else:
            dq = parsed["qty"] if parsed["qty"] is not None else 1.0
            du = parsed["unit"] or ("g" if not food else default_unit_for(food))
        grams = 0.0
        food_out = None
        if food:
            grams = round(ing_grams(dq, du, food), 1)
            match = next(f for f in dicts if f["key"] == food["key"])
            food_out = food_to_dict(next(f for f in available_foods(user) if f.key == match["key"]))
        rows.append({
            "line": line, "qty": dq, "unit": du,
            "unit_label": UNIT_LABELS.get(du, du),
            "name": parsed["name"], "note": parsed["note"],
            "food": food_out, "grams": grams,
        })
    return jsonify({"rows": rows})


# ------------------------------------------------------------------ recipes API

def load_recipe_payload(user, recipe):
    data = request.get_json(force=True, silent=True) or {}
    name = str(data.get("name") or "").strip()
    if len(name) < 2:
        return None, bad("Please enter a recipe name")
    try:
        servings = float(data.get("servings") or 0)
    except (TypeError, ValueError):
        servings = 0.0
    if servings <= 0:
        return None, bad("Servings must be greater than zero")
    ings = data.get("ingredients")
    if not isinstance(ings, list) or not ings:
        return None, bad("Add at least one ingredient")

    valid_food_ids = {f.id for f in available_foods(user)}
    cleaned = []
    for i, item in enumerate(ings):
        food_id = item.get("food_id")
        try:
            qty = float(item.get("qty") or 0)
        except (TypeError, ValueError):
            qty = 0.0
        unit = str(item.get("unit") or "g")
        raw = str(item.get("raw") or "").strip() or None
        if food_id is not None and int(food_id) not in valid_food_ids:
            return None, bad("Ingredient %d uses a food you can't access" % (i + 1))
        cleaned.append({"food_id": (int(food_id) if food_id is not None else None),
                        "qty": qty, "unit": unit, "raw": raw})

    recipe.name = name
    recipe.servings = servings
    recipe.steps = str(data.get("steps") or "")
    Ingredient.query.filter_by(recipe_id=recipe.id).delete()
    for pos, c in enumerate(cleaned):
        db.session.add(Ingredient(recipe_id=recipe.id, food_id=c["food_id"],
                                  qty=c["qty"], unit=c["unit"], raw=c["raw"],
                                  position=pos))
    return recipe, None


@app.route("/api/recipes", methods=["GET"])
@require_user
def recipes_list(user):
    recipes = available_recipes(user)
    return jsonify({"recipes": [recipe_to_summary(r, user) for r in recipes]})


@app.route("/api/recipes", methods=["POST"])
@require_user
def recipes_create(user):
    recipe = Recipe(user_id=user.id, name="New recipe", servings=1)
    db.session.add(recipe)
    db.session.flush()  # assign id before attaching ingredients
    _, err = load_recipe_payload(user, recipe)
    if err:
        db.session.rollback()
        return err
    db.session.commit()
    return jsonify({"recipe": recipe_to_detail(recipe, user)}), 201


@app.route("/api/recipes/<int:rid>", methods=["GET"])
@require_user
def recipes_get(user, rid):
    r = db.session.get(Recipe, rid)
    if not r or (r.user_id is not None and r.user_id != user.id):
        return bad("Recipe not found", 404)
    return jsonify({"recipe": recipe_to_detail(r, user)})


@app.route("/api/recipes/<int:rid>", methods=["PUT"])
@require_user
def recipes_update(user, rid):
    r = db.session.get(Recipe, rid)
    if not r or (r.user_id is not None and r.user_id != user.id and user.role != "admin"):
        return bad("Recipe not found", 404)
    if r.user_id is None and user.role != "admin":
        # Non-admin editing a global recipe -> save as a new personal custom recipe for this user
        custom_r = Recipe(user_id=user.id, name=r.name, servings=r.servings, steps=r.steps, image=r.image)
        db.session.add(custom_r)
        db.session.flush()
        _, err = load_recipe_payload(user, custom_r)
        if err:
            db.session.rollback()
            return err
        db.session.commit()
        return jsonify({"recipe": recipe_to_detail(custom_r, user)}), 201
    _, err = load_recipe_payload(user, r)
    if err:
        return err
    db.session.commit()
    return jsonify({"recipe": recipe_to_detail(r, user)})


@app.route("/api/recipes/<int:rid>", methods=["DELETE"])
@require_user
def recipes_delete(user, rid):
    r = db.session.get(Recipe, rid)
    if not r:
        return bad("Recipe not found", 404)
    if r.user_id is None:
        if user.role != "admin":
            return bad("Global library recipes cannot be deleted", 403)
    elif r.user_id != user.id and user.role != "admin":
        return bad("Recipe not found", 404)
    PlanEntry.query.filter_by(recipe_id=r.id).delete()
    db.session.delete(r)
    db.session.commit()
    return jsonify({"message": "Recipe deleted"})


# ------------------------------------------------------------------ plan API

@app.route("/api/plan", methods=["GET"])
@require_user
def plan_get(user):
    entries = PlanEntry.query.filter_by(user_id=user.id).order_by(PlanEntry.day, PlanEntry.id).all()
    out = []
    for e in entries:
        out.append({
            "id": e.id, "day": e.day, "slot": e.slot,
            "recipe_id": e.recipe_id, "recipe_name": (e.recipe.name if e.recipe else "?"),
            "servings": e.servings,
            "kcal": round(entry_nutrition(e)["kcal"], 0),
        })
    return jsonify({"entries": out})


@app.route("/api/plan/entries", methods=["POST"])
@require_user
def plan_add(user):
    data = request.get_json(force=True, silent=True) or {}
    try:
        day = int(data.get("day"))
        recipe_id = int(data.get("recipe_id"))
        servings = float(data.get("servings") or 1)
    except (TypeError, ValueError):
        return bad("day, recipe_id and servings are required")
    if not 0 <= day <= 6:
        return bad("day must be 0 (Mon) .. 6 (Sun)")
    if data.get("slot") not in SLOTS:
        return bad("slot must be one of breakfast/lunch/dinner/snacks")
    if servings <= 0:
        return bad("servings must be > 0")
    r = db.session.get(Recipe, recipe_id)
    if not r or (r.user_id is not None and r.user_id != user.id):
        return bad("Recipe not found", 404)
    e = PlanEntry(user_id=user.id, day=day, slot=data["slot"],
                  recipe_id=recipe_id, servings=servings)
    db.session.add(e)
    db.session.commit()
    return jsonify({"entry": {"id": e.id, "day": e.day, "slot": e.slot,
                              "recipe_id": e.recipe_id,
                              "recipe_name": r.name, "servings": e.servings,
                              "kcal": round(entry_nutrition(e)["kcal"], 0)}}), 201


@app.route("/api/plan/entries/<int:eid>", methods=["PATCH"])
@require_user
def plan_patch(user, eid):
    e = db.session.get(PlanEntry, eid)
    if not e or e.user_id != user.id:
        return bad("Plan entry not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    try:
        e.servings = max(0.25, round(float(data.get("servings") or e.servings) * 2) / 2)
    except (TypeError, ValueError):
        return bad("servings must be a number")
    db.session.commit()
    return jsonify({"entry": {"id": e.id, "day": e.day, "slot": e.slot,
                              "recipe_id": e.recipe_id,
                              "recipe_name": e.recipe.name if e.recipe else "?",
                              "servings": e.servings,
                              "kcal": round(entry_nutrition(e)["kcal"], 0)}})


@app.route("/api/plan/entries/<int:eid>", methods=["DELETE"])
@require_user
def plan_delete(user, eid):
    e = db.session.get(PlanEntry, eid)
    if not e or e.user_id != user.id:
        return bad("Plan entry not found", 404)
    db.session.delete(e)
    db.session.commit()
    return jsonify({"message": "Removed"})


@app.route("/api/plan/day/<int:day>", methods=["GET"])
@require_user
def plan_day(user, day):
    if not 0 <= day <= 6:
        return bad("day must be 0..6")
    g = goals_of(user)
    meals = []
    totals = zero_nut()
    for slot in SLOTS:
        entries = PlanEntry.query.filter_by(user_id=user.id, day=day, slot=slot).all()
        if not entries:
            continue
        slot_nut = zero_nut()
        items = []
        for e in entries:
            n = entry_nutrition(e)
            add_dicts(slot_nut, n)
            items.append({"id": e.id, "recipe_id": e.recipe_id,
                          "recipe_name": e.recipe.name if e.recipe else "?",
                          "servings": e.servings, "nutrition": round_nut(n)})
        add_dicts(totals, slot_nut)
        meals.append({"slot": slot, "nutrition": round_nut(slot_nut), "entries": items})
    return jsonify({
        "day": day, "meals": meals, "totals": round_nut(totals),
        "goals": g.to_dict(),
    })


@app.route("/api/plan/week", methods=["GET"])
@require_user
def plan_week(user):
    g = goals_of(user)
    entries = PlanEntry.query.filter_by(user_id=user.id).all()
    by_day = {d: zero_nut() for d in range(7)}
    planned = 0
    for e in entries:
        add_dicts(by_day[e.day], entry_nutrition(e))
        planned += 1
    days_used = sum(1 for d in by_day if by_day[d]["kcal"] > 0)
    week_total = zero_nut()
    for d in by_day:
        add_dicts(week_total, by_day[d])
    return jsonify({
        "days": [round_nut(by_day[d]) for d in range(7)],
        "week_total": round_nut(week_total),
        "daily_average": round_nut({k: (v / days_used if days_used else 0) for k, v in week_total.items()}),
        "meals_planned": planned, "days_used": days_used,
        "goals": g.to_dict(),
    })


# ------------------------------------------------------------------ goals API

@app.route("/api/goals", methods=["GET"])
@require_user
def goals_get(user):
    return jsonify({"goals": goals_of(user).to_dict()})


@app.route("/api/goals", methods=["PUT"])
@require_user
def goals_put(user):
    g = goals_of(user)
    data = request.get_json(force=True, silent=True) or {}

    def num(key, cur):
        try:
            return max(0.0, float(data.get(key, cur)))
        except (TypeError, ValueError):
            return cur

    g.kcal = num("kcal", g.kcal)
    g.p = num("p", g.p)
    g.c = num("c", g.c)
    g.f = num("f", g.f)
    if data.get("energy_unit") in ("kcal", "kJ"):
        g.energy_unit = data["energy_unit"]
    db.session.commit()
    return jsonify({"goals": g.to_dict()})


# ------------------------------------------------------------------ grocery API

@app.route("/api/grocery", methods=["GET"])
@require_user
def grocery_get(user):
    agg = {}
    for e in PlanEntry.query.filter_by(user_id=user.id).all():
        r = e.recipe
        if not r or not r.servings:
            continue
        factor = e.servings / r.servings
        for ing in r.ingredients:
            food = ing.food
            if food is None or food.skip:
                continue
            grams = ing_grams(ing.qty, ing.unit, food.as_food_dict()) * factor
            if grams <= 0.4:
                continue
            slot = agg.setdefault(food.id, {"grams": 0.0, "recipes": set()})
            slot["grams"] += grams
            slot["recipes"].add(r.name)

    foods = {f.id: f for f in Food.query.all()}
    checks = {c.item_key: c.checked for c in GroceryCheck.query.filter_by(user_id=user.id).all()}
    extras = GroceryExtra.query.filter_by(user_id=user.id).all()

    by_cat = {}
    for fid, slot in agg.items():
        food = foods.get(fid)
        if not food:
            continue
        by_cat.setdefault(food.cat, []).append({
            "key": str(fid),
            "image": ("/food_images/" + food.image) if food.image else None,
            "name": food.name,
            "grams": round(slot["grams"], 1),
            "display": fmt_amount(food.as_food_dict(), slot["grams"]),
            "recipes_count": len(slot["recipes"]),
            "checked": bool(checks.get(str(fid), False)),
        })

    categories = []
    for cat in CAT_ORDER + [c for c in by_cat if c not in CAT_ORDER]:
        if cat not in by_cat:
            continue
        items = sorted(by_cat[cat], key=lambda x: x["name"])
        categories.append({"key": cat, "label": CATS.get(cat, cat), "items": items})

    extras_out = [{"id": x.id, "name": x.name,
                   "checked": bool(checks.get("x_%d" % x.id, False))}
                  for x in extras]

    total = sum(len(c["items"]) for c in categories) + len(extras_out)
    done = sum(1 for c in categories for i in c["items"] if i["checked"]) + \
           sum(1 for x in extras_out if x["checked"])
    return jsonify({"categories": categories, "extras": extras_out,
                    "progress": {"done": done, "total": total}})


@app.route("/api/grocery/check", methods=["POST"])
@require_user
def grocery_check(user):
    data = request.get_json(force=True, silent=True) or {}
    key = str(data.get("key") or "")[:64]
    if not key:
        return bad("key is required")
    checked = bool(data.get("checked"))
    row = GroceryCheck.query.filter_by(user_id=user.id, item_key=key).first()
    if not row:
        row = GroceryCheck(user_id=user.id, item_key=key)
        db.session.add(row)
    row.checked = checked
    db.session.commit()
    return jsonify({"key": key, "checked": checked})


@app.route("/api/grocery/extras", methods=["POST"])
@require_user
def grocery_extra_add(user):
    data = request.get_json(force=True, silent=True) or {}
    name = str(data.get("name") or "").strip()
    if not name:
        return bad("Name is required")
    x = GroceryExtra(user_id=user.id, name=name)
    db.session.add(x)
    db.session.commit()
    return jsonify({"extra": {"id": x.id, "name": x.name}}), 201


@app.route("/api/grocery/extras/<int:xid>", methods=["DELETE"])
@require_user
def grocery_extra_del(user, xid):
    x = db.session.get(GroceryExtra, xid)
    if not x or x.user_id != user.id:
        return bad("Extra not found", 404)
    db.session.delete(x)
    db.session.commit()
    return jsonify({"message": "Removed"})


# ------------------------------------------------------------------ admin API

def admin_user_dict(u):
    return {
        **u.to_dict(),
        "recipe_count": Recipe.query.filter_by(user_id=u.id).count(),
        "plan_entries": PlanEntry.query.filter_by(user_id=u.id).count(),
    }


@app.route("/api/admin/stats", methods=["GET"])
@require_admin
def admin_stats(admin):
    return jsonify({
        "users_total": User.query.count(),
        "users_pending": User.query.filter_by(status="pending").count(),
        "users_active": User.query.filter_by(status="active").count(),
        "users_disabled": User.query.filter_by(status="disabled").count(),
        "recipes_total": Recipe.query.count(),
        "global_recipes_total": Recipe.query.filter(Recipe.user_id.is_(None)).count(),
        "custom_recipes_total": Recipe.query.filter(Recipe.user_id.isnot(None)).count(),
        "plan_entries_total": PlanEntry.query.count(),
        "foods_total": Food.query.filter(Food.owner_user_id.is_(None)).count(),
        "custom_foods_total": Food.query.filter(Food.owner_user_id.isnot(None)).count(),
    })


@app.route("/api/admin/users", methods=["GET"])
@require_admin
def admin_users(admin):
    users = User.query.order_by(User.status, User.created_at.desc()).all()
    return jsonify({"users": [admin_user_dict(u) for u in users]})


@app.route("/api/admin/users", methods=["POST"])
@require_admin
def admin_create_user(admin):
    data = request.get_json(force=True, silent=True) or {}
    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")
    role = data.get("role") if data.get("role") in ("admin", "user") else "user"
    if len(name) < 2 or not EMAIL_RE.match(email):
        return bad("Valid name and email are required")
    if len(password) < 6:
        return bad("Password must be at least 6 characters")
    if User.query.filter(db.func.lower(User.email) == email).first():
        return bad("An account with this email already exists")
    u = User(email=email, name=name, role=role, status="active",
             password_hash=generate_password_hash(password))
    db.session.add(u)
    db.session.commit()
    return jsonify({"user": admin_user_dict(u)}), 201


@app.route("/api/admin/users/<int:uid>/status", methods=["POST"])
@require_admin
def admin_set_status(admin, uid):
    u = db.session.get(User, uid)
    if not u:
        return bad("User not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    status = data.get("status")
    if status not in ("pending", "active", "disabled"):
        return bad("status must be pending/active/disabled")
    if u.id == admin.id and status != "active":
        return bad("You cannot change your own status")
    u.status = status
    db.session.commit()
    return jsonify({"user": admin_user_dict(u)})


@app.route("/api/admin/users/<int:uid>/role", methods=["POST"])
@require_admin
def admin_set_role(admin, uid):
    u = db.session.get(User, uid)
    if not u:
        return bad("User not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    role = data.get("role")
    if role not in ("admin", "user"):
        return bad("role must be admin/user")
    if u.id == admin.id:
        return bad("You cannot change your own role")
    if u.role == "admin" and role == "user" and \
            User.query.filter_by(role="admin", status="active").count() <= 1:
        return bad("At least one active admin must remain")
    u.role = role
    db.session.commit()
    return jsonify({"user": admin_user_dict(u)})


@app.route("/api/admin/users/<int:uid>/password", methods=["POST"])
@require_admin
def admin_reset_password(admin, uid):
    u = db.session.get(User, uid)
    if not u:
        return bad("User not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    password = str(data.get("password") or "")
    if len(password) < 6:
        return bad("Password must be at least 6 characters")
    u.password_hash = generate_password_hash(password)
    db.session.commit()
    return jsonify({"message": "Password updated"})


@app.route("/api/admin/users/<int:uid>", methods=["DELETE"])
@require_admin
def admin_delete_user(admin, uid):
    u = db.session.get(User, uid)
    if not u:
        return bad("User not found", 404)
    if u.id == admin.id:
        return bad("You cannot delete your own account")
    if u.role == "admin" and User.query.filter_by(role="admin", status="active").count() <= 1:
        return bad("At least one active admin must remain")
    Food.query.filter_by(owner_user_id=u.id).delete()
    db.session.delete(u)
    db.session.commit()
    return jsonify({"message": "User deleted"})


# ------------------------------------------------------------------ SPA + errors

def _spa_index():
    if os.path.isfile(os.path.join(STATIC_DIR, "index.html")):
        return send_from_directory(STATIC_DIR, "index.html")
    return jsonify({"message": "NutriPlan API is running. Angular frontend not built yet - "
                               "run 'npm install && npm run build' in frontend/ and copy "
                               "dist/frontend/browser/* to backend/static/."}), 200


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Not found"}), 404
    return _spa_index()


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    full = os.path.join(STATIC_DIR, path)
    if path and os.path.isfile(full):
        return send_from_directory(STATIC_DIR, path)
    return _spa_index()


if __name__ == "__main__":
    print("NutriPlan backend running on http://0.0.0.0:8000")
    app.run(host="0.0.0.0", port=8000, debug=False)
