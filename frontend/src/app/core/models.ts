/* Shared types, constants and helpers */

export type Role = 'admin' | 'user';
export type Status = 'pending' | 'active' | 'disabled';

export interface AppUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  status: Status;
  created_at?: string;
  recipe_count?: number;
  plan_entries?: number;
}

export interface Nut { kcal: number; p: number; c: number; f: number; fib: number; sug: number; na: number; }

export interface FoodItem {
  id: number;
  key: string;
  name: string;
  image: string | null;
  aliases: string;
  cat: string;
  cat_label: string;
  per100: Nut;
  units: Record<string, number>;
  units_available: string[];
  liq: boolean;
  custom: boolean;
}

export interface RecipeSummary {
  id: number; name: string; image?: string | null; servings: number; ingredient_count: number;
  total: Nut; per_serving: Nut;
  custom?: boolean; is_owner?: boolean;
}

export interface IngredientRow {
  id?: number;
  food_id: number | null;
  food_name: string | null;
  food?: FoodItem | null;
  qty: number;
  unit: string;
  unit_label?: string;
  raw: string | null;
  grams: number;
  units_available?: string[];
}

export interface RecipeDetail extends RecipeSummary {
  steps: string;
  ingredients: IngredientRow[];
}

export interface PlanEntry {
  id: number; day: number; slot: string;
  recipe_id: number; recipe_name: string; servings: number; kcal: number;
}

export interface Goals { kcal: number; p: number; c: number; f: number; energy_unit: 'kcal' | 'kJ'; }

export interface DayMealEntry { id: number; recipe_id: number; recipe_name: string; servings: number; nutrition: Nut; }
export interface DayMeal { slot: string; nutrition: Nut; entries: DayMealEntry[]; }
export interface DayAnalysis { day: number; meals: DayMeal[]; totals: Nut; goals: Goals; }

export interface WeekSummary {
  days: Nut[]; week_total: Nut; daily_average: Nut;
  meals_planned: number; days_used: number; goals: Goals;
}

export interface GroceryItem { key: string; name: string; grams: number; display: string; recipes_count: number; checked: boolean; image?: string | null; }
export interface GroceryCategory { key: string; label: string; items: GroceryItem[]; }
export interface GroceryExtra { id: number; name: string; checked: boolean; }
export interface GroceryData { categories: GroceryCategory[]; extras: GroceryExtra[]; progress: { done: number; total: number }; }

export interface ParseRow {
  line: string; qty: number; unit: string; unit_label: string;
  name: string; note: string; food: FoodItem | null; grams: number;
  keep?: boolean;
}

export interface AdminStats {
  users_total: number; users_pending: number; users_active: number; users_disabled: number;
  recipes_total: number; plan_entries_total: number; foods_total: number; custom_foods_total: number;
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const SLOTS = [
  { id: 'breakfast', label: 'Breakfast', icon: 'coffee' },
  { id: 'lunch', label: 'Lunch', icon: 'sun' },
  { id: 'dinner', label: 'Dinner', icon: 'moon' },
  { id: 'snacks', label: 'Snacks', icon: 'apple' },
];

export const MACROS = [
  { k: 'p', label: 'Protein', color: '#3b6fd4', dot: '#3b6fd4' },
  { k: 'c', label: 'Carbs', color: '#f2a13c', dot: '#e08b1d' },
  { k: 'f', label: 'Fat', color: '#9a66d2', dot: '#9a66d2' },
];

export const GLOBAL_UNITS: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.35, lb: 453.59, ml: 1, l: 1000, pinch: 0.36,
};

export const UNIT_LABELS: Record<string, string> = {
  g: 'g', kg: 'kg', oz: 'oz', lb: 'lb', ml: 'ml', l: 'L',
  cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', piece: 'pc', clove: 'clove',
  slice: 'slice', scoop: 'scoop', can: 'can', glass: 'glass', plate: 'plate',
  bowl: 'bowl', katori: 'katori', pack: 'pack', pinch: 'pinch',
};

export function unitGrams(food: FoodItem | null | undefined, unit: string): number | null {
  if (!unit) { return null; }
  if (unit in GLOBAL_UNITS && unit !== 'pinch') { return GLOBAL_UNITS[unit]; }
  if (food && food.units && unit in food.units) { return food.units[unit]; }
  if (unit === 'pinch') { return 0.36; }
  return null;
}

export function ingGrams(qty: number, unit: string, food: FoodItem | null | undefined): number {
  const g = unitGrams(food, unit);
  if (g === null) { return 0; }
  return Math.max(0, (qty || 0) * g);
}

export function emptyNut(): Nut { return { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, na: 0 }; }

export function trimNum(x: number): string {
  const r = Math.round(x * 100) / 100;
  return Math.abs(r - Math.round(r)) < 0.005 ? String(Math.round(r)) : String(r);
}

export function fmtE(kcal: number, unit: 'kcal' | 'kJ'): string {
  return unit === 'kJ' ? `${Math.round(kcal * 4.184)} kJ` : `${Math.round(kcal)} kcal`;
}

export function fmtG(g: number): string { return trimNum(Math.round(g * 10) / 10) + ' g'; }

export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7; // Monday = 0
}

export function macroStack(n: Nut): { kcal: number; color: string; pct: number }[] {
  const kc = { p: n.p * 4, c: n.c * 4, f: n.f * 9 };
  const tot = kc.p + kc.c + kc.f;
  return MACROS.map(m => ({ kcal: kc[m.k as 'p' | 'c' | 'f'], color: m.color, pct: tot > 0 ? (kc[m.k as 'p' | 'c' | 'f'] / tot) * 100 : 0 }));
}


