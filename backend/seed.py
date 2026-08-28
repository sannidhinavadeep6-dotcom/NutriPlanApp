"""NutriPlan — first-run seeding: admin account, global foods, demo data."""

from food_data import FOODS
from models import db, User, Goal, Food, Recipe, Ingredient, PlanEntry
from werkzeug.security import generate_password_hash
from seed_recipes import RECIPES_100

ADMIN_EMAIL = "admin@nutriplan.app"
ADMIN_PASSWORD = "Admin@123"
DEMO_EMAIL = "demo@nutriplan.app"
DEMO_PASSWORD = "Demo@123"

DEMO_RECIPES = RECIPES_100  # 100 recipes: South Indian focus + North classics

# day -> [(slot, recipe_index, servings)]
DEMO_PLAN = [
    [("breakfast", 0, 1), ("lunch", 1, 2), ("dinner", 3, 3), ("snacks", 5, 1)],
    [("breakfast", 4, 1), ("lunch", 7, 2), ("dinner", 2, 3), ("snacks", 5, 1)],
    [("breakfast", 0, 1), ("lunch", 1, 2), ("dinner", 6, 4), ("snacks", 5, 1)],
    [("breakfast", 4, 1), ("lunch", 7, 2), ("dinner", 2, 3), ("snacks", 5, 1)],
    [("breakfast", 0, 1), ("lunch", 1, 2), ("dinner", 3, 3), ("snacks", 5, 1)],
    [("breakfast", 4, 1), ("lunch", 6, 4), ("dinner", 2, 3), ("snacks", 5, 1)],
    [("breakfast", 0, 1), ("lunch", 1, 2), ("dinner", 7, 2), ("snacks", 5, 1)],
]


def ensure_foods(app):
    """Add newly introduced foods to an EXISTING database (idempotent),
    and refresh image paths from the reference data."""
    with app.app_context():
        existing = {f.key: f for f in Food.query.all()}
        added = 0
        for row in FOODS:
            (key, name, aliases, cat, k, p, c, f, fib, sug, na, units, liq, skip, image) = row
            if key not in existing:
                db.session.add(Food(key=key, name=name, aliases=aliases, cat=cat,
                                    k=k, p=p, c=c, f=f, fib=fib, sug=sug, na=na,
                                    units=units, liq=liq, skip=skip,
                                    image=(image or None), owner_user_id=None))
                added += 1
            else:
                food = existing[key]
                food.image = image or None
                food.cat = cat
        db.session.commit()
        return added


def ensure_recipes(app):
    """Add any missing global library recipes and migrate legacy demo recipes (idempotent migration)."""
    with app.app_context():
        demo_recipe_names = {name for name, _, _, _ in DEMO_RECIPES}
        # Migrate any legacy demo-user assigned recipes to global library recipes
        demo = User.query.filter_by(email=DEMO_EMAIL).first()
        if demo:
            legacy_recipes = Recipe.query.filter_by(user_id=demo.id).all()
            for r in legacy_recipes:
                if r.name in demo_recipe_names:
                    r.user_id = None
            db.session.commit()

        existing = {r.name: r for r in Recipe.query.filter(db.or_(Recipe.user_id.is_(None), Recipe.user_id == (demo.id if demo else -1))).all()}
        food_by_key = {f.key: f for f in Food.query.all()}
        added = 0
        for idx, (name, servings, ings, steps) in enumerate(DEMO_RECIPES, start=1):
            if name in existing:
                # keep the global library in sync (ingredients, servings, steps, images)
                r = existing[name]
                r.user_id = None
                r.servings = float(servings)
                r.steps = steps
                r.image = "r%d.jpg" % idx
                Ingredient.query.filter_by(recipe_id=r.id).delete()
                for pos, (fkey, qty, unit) in enumerate(ings):
                    if fkey in food_by_key:
                        db.session.add(Ingredient(recipe_id=r.id, food_id=food_by_key[fkey].id,
                                                  qty=float(qty), unit=unit, raw=None, position=pos))
                continue
            r = Recipe(user_id=None, name=name, servings=float(servings), steps=steps,
                       image="r%d.jpg" % idx)
            db.session.add(r)
            db.session.flush()
            for pos, (fkey, qty, unit) in enumerate(ings):
                if fkey in food_by_key:
                    db.session.add(Ingredient(recipe_id=r.id, food_id=food_by_key[fkey].id,
                                              qty=float(qty), unit=unit, raw=None, position=pos))
            added += 1
        db.session.commit()
        return added


def seed_if_empty(app):
    with app.app_context():
        if User.query.first() is not None:
            return False

        # --- admin & demo user ---
        admin = User(email=ADMIN_EMAIL, name="Administrator",
                     password_hash=generate_password_hash(ADMIN_PASSWORD),
                     role="admin", status="active")
        demo = User(email=DEMO_EMAIL, name="Demo User",
                    password_hash=generate_password_hash(DEMO_PASSWORD),
                    role="user", status="active")
        db.session.add_all([admin, demo])
        db.session.flush()

        db.session.add(Goal(user_id=admin.id, kcal=2200, p=140, c=220, f=73, energy_unit="kcal"))
        db.session.add(Goal(user_id=demo.id, kcal=2000, p=100, c=250, f=67, energy_unit="kcal"))

        # --- global food database ---
        for row in FOODS:
            (key, name, aliases, cat, k, p, c, f, fib, sug, na, units, liq, skip, image) = row
            db.session.add(Food(key=key, name=name, aliases=aliases, cat=cat,
                                k=k, p=p, c=c, f=f, fib=fib, sug=sug, na=na,
                                units=units, liq=liq, skip=skip, image=(image or None),
                                owner_user_id=None))
        db.session.flush()

        # --- global starter recipes + demo user weekly plan ---
        food_by_key = {f.key: f for f in Food.query.all()}
        recipe_ids = []
        for idx, (name, servings, ings, steps) in enumerate(DEMO_RECIPES, start=1):
            r = Recipe(user_id=None, name=name, servings=float(servings), steps=steps,
                       image="r%d.jpg" % idx)
            db.session.add(r)
            db.session.flush()
            recipe_ids.append(r.id)
            for pos, (fkey, qty, unit) in enumerate(ings):
                if fkey in food_by_key:
                    db.session.add(Ingredient(recipe_id=r.id, food_id=food_by_key[fkey].id,
                                              qty=float(qty), unit=unit, raw=None, position=pos))
        for day, entries in enumerate(DEMO_PLAN):
            for slot, rix, servings in entries:
                db.session.add(PlanEntry(user_id=demo.id, day=day, slot=slot,
                                         recipe_id=recipe_ids[rix], servings=float(servings)))

        db.session.commit()
        return True
