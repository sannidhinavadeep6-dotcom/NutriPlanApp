"""NutriPlan — SQLAlchemy models (SQLite)."""

from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")       # admin | user
    status = db.Column(db.String(20), nullable=False, default="active")   # active | pending | disabled
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)
    last_active_at = db.Column(db.DateTime, nullable=True)

    plan_entries = db.relationship("PlanEntry", backref="user", cascade="all, delete-orphan")
    recipes = db.relationship("Recipe", backref="user", cascade="all, delete-orphan")
    extras = db.relationship("GroceryExtra", backref="user", cascade="all, delete-orphan")
    checks = db.relationship("GroceryCheck", backref="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "last_active_at": self.last_active_at.isoformat() if self.last_active_at else None,
        }


class Goal(db.Model):
    __tablename__ = "goals"
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    kcal = db.Column(db.Float, nullable=False, default=2000.0)
    p = db.Column(db.Float, nullable=False, default=100.0)
    c = db.Column(db.Float, nullable=False, default=250.0)
    f = db.Column(db.Float, nullable=False, default=67.0)
    energy_unit = db.Column(db.String(4), nullable=False, default="kcal")

    def to_dict(self):
        return {"kcal": self.kcal, "p": self.p, "c": self.c, "f": self.f,
                "energy_unit": self.energy_unit}


class Food(db.Model):
    __tablename__ = "foods"
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(40), unique=True, nullable=False)   # stable seed key or cf_xxx
    name = db.Column(db.String(160), nullable=False)
    aliases = db.Column(db.String(255), nullable=False, default="")
    cat = db.Column(db.String(4), nullable=False, default="MY")
    k = db.Column(db.Float, nullable=False, default=0.0)
    p = db.Column(db.Float, nullable=False, default=0.0)
    c = db.Column(db.Float, nullable=False, default=0.0)
    f = db.Column(db.Float, nullable=False, default=0.0)
    fib = db.Column(db.Float, nullable=False, default=0.0)
    sug = db.Column(db.Float, nullable=False, default=0.0)
    na = db.Column(db.Float, nullable=False, default=0.0)
    units = db.Column(db.JSON, nullable=True)          # {"cup": 158, "piece": 120, ...}
    liq = db.Column(db.Boolean, nullable=False, default=False)
    skip = db.Column(db.Boolean, nullable=False, default=False)  # exclude from grocery (e.g. water)
    image = db.Column(db.String(255), nullable=True)             # photo file name (static/food_images/)
    owner_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    def as_food_dict(self):
        """shape used by nutrition helpers"""
        return {
            "key": self.key, "name": self.name, "aliases": self.aliases,
            "k": self.k, "p": self.p, "c": self.c, "f": self.f,
            "fib": self.fib, "sug": self.sug, "na": self.na,
            "units": self.units or {}, "liq": self.liq, "skip": self.skip,
        }


class Recipe(db.Model):
    __tablename__ = "recipes"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    servings = db.Column(db.Float, nullable=False, default=4.0)
    steps = db.Column(db.Text, nullable=False, default="")
    image = db.Column(db.String(255), nullable=True)

    ingredients = db.relationship("Ingredient", backref="recipe",
                                  cascade="all, delete-orphan",
                                  order_by="Ingredient.position")


class Ingredient(db.Model):
    __tablename__ = "ingredients"
    id = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey("recipes.id"), nullable=False, index=True)
    food_id = db.Column(db.Integer, db.ForeignKey("foods.id"), nullable=True)
    qty = db.Column(db.Float, nullable=False, default=0.0)
    unit = db.Column(db.String(20), nullable=False, default="g")
    raw = db.Column(db.String(255), nullable=True)
    position = db.Column(db.Integer, nullable=False, default=0)

    food = db.relationship("Food")


class PlanEntry(db.Model):
    __tablename__ = "plan_entries"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    day = db.Column(db.Integer, nullable=False, default=0)          # 0 = Monday .. 6 = Sunday
    slot = db.Column(db.String(20), nullable=False, default="breakfast")
    recipe_id = db.Column(db.Integer, db.ForeignKey("recipes.id"), nullable=False)
    servings = db.Column(db.Float, nullable=False, default=1.0)

    recipe = db.relationship("Recipe")


class GroceryCheck(db.Model):
    __tablename__ = "grocery_checks"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    item_key = db.Column(db.String(64), nullable=False)
    checked = db.Column(db.Boolean, nullable=False, default=False)

    __table_args__ = (db.UniqueConstraint("user_id", "item_key", name="uq_check_user_item"),)


class GroceryExtra(db.Model):
    __tablename__ = "grocery_extras"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)


class ActivityLog(db.Model):
    __tablename__ = "activity_logs"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category = db.Column(db.String(40), nullable=False, default="general", index=True)  # planner, goals, recipes, foods, grocery, auth, parser
    action = db.Column(db.String(80), nullable=False)
    details = db.Column(db.String(500), nullable=False, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow, index=True)

    user = db.relationship("User", backref=db.backref("activity_logs", cascade="all, delete-orphan", order_by="ActivityLog.created_at.desc()"))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "category": self.category,
            "action": self.action,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

