"""NutriPlan Database Package — SQLAlchemy models, SQLite db path, and initial seed data."""

import os
import sys

DB_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(DB_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if DB_DIR not in sys.path:
    sys.path.insert(0, DB_DIR)

DB_PATH = os.path.join(DB_DIR, "nutriplan.db")

from .models import (
    db, User, Goal, Food, Recipe, Ingredient, PlanEntry,
    GroceryCheck, GroceryExtra, ActivityLog, utcnow
)
from .food_data import CATS, CAT_ORDER, FOODS
from .seed_recipes import RECIPES_100
from .seed import ensure_foods, ensure_recipes, seed_if_empty

__all__ = [
    "db", "User", "Goal", "Food", "Recipe", "Ingredient", "PlanEntry",
    "GroceryCheck", "GroceryExtra", "ActivityLog", "utcnow",
    "CATS", "CAT_ORDER", "FOODS", "RECIPES_100",
    "ensure_foods", "ensure_recipes", "seed_if_empty",
    "DB_PATH", "DB_DIR"
]
