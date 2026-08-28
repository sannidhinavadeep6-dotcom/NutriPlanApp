import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent, recipeIcon } from '../../core/icon.component';
import { DragDirective } from '../../core/drag.directive';
import { Api } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { AuthService } from '../../core/auth.service';
import {
  RecipeSummary, RecipeDetail, FoodItem, ParseRow,
  ingGrams, emptyNut, trimNum, fmtE, fmtG,
  UNIT_LABELS, Nut,
} from '../../core/models';

interface IngDraft {
  food_id: number | null;
  qty: number;
  unit: string;
  raw: string | null;
  food: FoodItem | null;
}

interface EditorState {
  id: number | null;
  name: string;
  servings: number;
  steps: string;
  ings: IngDraft[];
  viewServings: number;
  custom?: boolean;
  is_owner?: boolean;
}

@Component({
  selector: 'app-recipes',
  imports: [FormsModule, IconComponent, DragDirective],
  template: `

<div class="page-anim">
  <div class="page-head">
    <div>
      <h1>Recipes</h1>
      <p class="sub">Build recipes, paste ingredient lists, scale portions — macros computed per serving.</p>
    </div>
    <div class="head-actions">
      <button class="btn ghost" (click)="openPasteNew()"><app-icon name="clipboard" [size]="16"/> Paste list</button>
      <button class="btn primary" (click)="openEditor(null)"><app-icon name="plus" [size]="16"/> New recipe</button>
    </div>
  </div>

  @if (loading && recipes.length === 0) {
    <div class="card-grid">
      @for (i of [1,2,3]; track i) {
        <div class="card"><div class="skel" style="height:64px;margin-bottom:12px"></div>
          <div class="skel" style="height:10px;width:60%;margin-bottom:8px"></div>
          <div class="skel" style="height:10px;width:40%"></div></div>
      }
    </div>
  }

  @if (recipes.length === 0 && !loading) {
    <div class="empty">No recipes yet — create your first one!</div>
  }
  <div class="card-grid">
    @for (r of recipes; track r.id; let i = $index) {
      <div class="card lift recipe-card stagger" [style.animation-delay.ms]="i * 50" (click)="openEditor(r.id)">
        <div class="recipe-photo">
          @if (r.image) {
            <img [src]="r.image" [alt]="r.name" loading="lazy">
          } @else {
            <span class="food-tile"><app-icon [name]="icon(r.name)" [size]="26"/></span>
          }
        </div>
        <h3 style="font-size:15.5px;line-height:1.3">{{ r.name }}</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          @if (r.custom) {
            <span class="chip" style="background:#e8f4ed;color:#1e7e48;font-weight:700">Custom</span>
          }
          <span class="chip">{{ trimNum(r.servings) }} serving{{ r.servings === 1 ? '' : 's' }}</span>
          <span class="chip">{{ r.ingredient_count }} ingredients</span>
        </div>
        <div class="mstack">
          <div [style.width.%]="stackPct(r.per_serving)[0]" style="background:#3b6fd4"></div>
          <div [style.width.%]="stackPct(r.per_serving)[1]" style="background:#f2a13c"></div>
          <div [style.width.%]="stackPct(r.per_serving)[2]" style="background:#9a66d2"></div>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">
          <b style="font-size:17px">{{ fmtE(r.per_serving.kcal) }}</b>
          <span class="macro-dots">
            <span style="color:#3b6fd4">P {{ trimNum(r.per_serving.p) }}g</span>
            <span style="color:#e08b1d">C {{ trimNum(r.per_serving.c) }}g</span>
            <span style="color:#9a66d2">F {{ trimNum(r.per_serving.f) }}g</span>
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:5px;color:var(--brand);font-weight:700;font-size:13px;margin-top:auto">
          Open recipe <app-icon name="chevron-right" [size]="14"/>
        </div>
      </div>
    }
  </div>

  <button class="fab" (click)="openEditor(null)" aria-label="New recipe"><app-icon name="plus" [size]="24"/></button>

  <!-- ================= EDITOR (floating window) ================= -->
  @if (ed) {
    <div class="overlay" (mousedown)="closeIfOverlay($event)">
      <div class="modal wide">
        <div class="m-head" appDrag>
          <h3><span class="m-ic"><app-icon [name]="ed.id ? 'edit' : 'chef-hat'" [size]="17"/></span>
            {{ ed.id ? 'Edit recipe' : 'New recipe' }}</h3>
          <button class="icon-btn" (click)="ed = null"><app-icon name="x" [size]="18"/></button>
        </div>
        <div class="m-body">
          <div class="ed-grid">
            <label class="fld" style="grid-column:1/-1">Recipe name
              <input type="text" [(ngModel)]="ed.name" name="edName" placeholder="e.g. Chicken Pulao">
            </label>
            <label class="fld" style="grid-column:1/-1">Base servings (ingredient list is written for this many)
              <input type="number" min="1" name="edServ" [ngModel]="ed.servings" (ngModelChange)="setBaseServings($event)">
            </label>
          </div>

          <div class="ed-sec">
            <div class="ed-sec-head">
              <h4><app-icon name="list" [size]="16"/> Ingredients</h4>
              <div style="display:flex;gap:6px">
                <button class="btn small ghost" (click)="openPasteInEditor()"><app-icon name="clipboard" [size]="14"/> Paste</button>
                <button class="btn small" (click)="addRow()"><app-icon name="plus" [size]="14"/> Add row</button>
              </div>
            </div>

            @for (ing of ed.ings; track $index; let i = $index) {
              <div class="ing-row" [class.unmatched]="!ing.food">
                <input type="number" step="any" min="0" [ngModel]="ing.qty" (ngModelChange)="ing.qty = num($event)" name="q{{ i }}" title="Quantity">
                <select [ngModel]="ing.unit" (ngModelChange)="setUnit(i, $event)" name="u{{ i }}">
                  @for (u of unitOptions(ing); track u) {
                    <option [value]="u" [selected]="u === ing.unit">{{ unitLabel(u) }}</option>
                  }
                </select>
                <div class="ac-wrap">
                  <input type="text" placeholder="Type a food… (e.g. rice)"
                    [ngModel]="ing.food ? ing.food.name : (ing.raw || '')"
                    (ngModelChange)="foodQuery(i, $event)" name="f{{ i }}"
                    (keydown)="acKey($event, i)"
                    [ngModelOptions]="{ standalone: true }" autocomplete="off">
                  @if (acRow === i && acItems.length > 0) {
                    <div class="ac-dd">
                      @for (f of acItems; track f.id; let ai = $index) {
                        <div class="ac-item" [class.active]="ai === 0" (mousedown)="pickFood(i, f)">
                          <span style="display:flex;align-items:center;gap:9px">
                            @if (f.image) { <img class="ac-thumb" [src]="f.image" [alt]="f.name"> }
                            {{ f.name }}</span>
                          <span class="ac-sub">{{ f.per100.kcal }} kcal / 100 g</span>
                        </div>
                      }
                    </div>
                  }
                </div>
                <span class="hint ing-g">{{ fmtG(rowGrams(ing)) }}</span>
                <button class="icon-btn danger" (click)="ed.ings.splice(i, 1)" title="Remove">
                  <app-icon name="trash" [size]="16"/></button>
              </div>
            }
            @if (ed.ings.length === 0) {
              <div class="hint" style="padding:8px 2px">No ingredients yet — add rows or paste a whole ingredient list.</div>
            }
          </div>

          <div class="ed-sec">
            <h4><app-icon name="chef-hat" [size]="16"/> Steps</h4>
            <textarea rows="5" [(ngModel)]="ed.steps" name="edSteps" placeholder="One step per line…"></textarea>
          </div>

          <div class="ed-sec">
            <h4><app-icon name="sliders" [size]="16"/> Portion scaler (preview)</h4>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:13.5px;flex-wrap:wrap">
              <button class="btn small" (click)="scaleBy(-0.5)"><app-icon name="minus" [size]="14"/></button>
              <input type="number" min="0.25" step="0.5" style="width:84px"
                [ngModel]="ed.viewServings" (ngModelChange)="ed.viewServings = Math.max(0.25, num($event) || 1)" name="scServ">
              <button class="btn small" (click)="scaleBy(0.5)"><app-icon name="plus" [size]="14"/></button>
              <span>servings — amounts below scale live</span>
            </div>
            <table class="tbl">
              <thead><tr><th>Ingredient</th><th>Amount for {{ trimNum(ed.viewServings) }} serving{{ ed.viewServings === 1 ? '' : 's' }}</th></tr></thead>
              <tbody>
                @for (ing of ed.ings; track $index) {
                  <tr>
                    <td>{{ ing.food ? ing.food.name : (ing.raw || 'unmatched') }}</td>
                    <td><b>{{ scaledAmount(ing) }}</b></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:13px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
            <div><small class="hint" style="display:block">Total recipe</small><b style="font-size:18px">{{ fmtE(total().kcal) }}</b></div>
            <div>
              <small class="hint" style="display:block">Per serving ({{ trimNum(ed.servings) }})</small>
              <b style="font-size:18px">{{ fmtE(perServing().kcal) }}</b>
              <div class="macro-dots">
                <span style="color:#3b6fd4">P {{ trimNum(perServing().p) }}g</span>
                <span style="color:#e08b1d">C {{ trimNum(perServing().c) }}g</span>
                <span style="color:#9a66d2">F {{ trimNum(perServing().f) }}g</span>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:9px;align-items:center">
            @if (ed.id && (ed.is_owner || auth.user?.role === 'admin')) { <button class="btn ghost danger" (click)="askDelete()"><app-icon name="trash" [size]="15"/> Delete</button> }
            <button class="btn ghost" (click)="ed = null">Cancel</button>
            <button class="btn primary" (click)="save()" [disabled]="busy">
              @if (busy) { <span class="spin"><app-icon name="refresh" [size]="15"/></span> Saving… }
              @else { <app-icon name="check" [size]="15"/> Save recipe }
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ================= PASTE (floating window) ================= -->
  @if (pasteOpen) {
    <div class="overlay" (mousedown)="closeIfOverlay($event)">
      <div class="modal wide" style="z-index:70">
        <div class="m-head" appDrag>
          <h3><span class="m-ic"><app-icon name="clipboard" [size]="17"/></span> Paste ingredient list</h3>
          <button class="icon-btn" (click)="pasteOpen = false"><app-icon name="x" [size]="18"/></button>
        </div>
        <p class="m-muted">One ingredient per line — quantities and units are detected and matched to the food database automatically.</p>
        <textarea rows="7" [(ngModel)]="pasteText" name="pasteText"
          placeholder="1 1/2 cups basmati rice&#10;200g chicken breast&#10;2 tbsp olive oil&#10;salt to taste"></textarea>
        <div class="m-actions" style="justify-content:flex-start">
          <button class="btn primary" (click)="parsePaste()"><app-icon name="search" [size]="15"/> Parse</button>
        </div>
        @if (parseRows.length > 0) {
          <h4>Matched {{ matchedCount() }} of {{ parseRows.length }} lines</h4>
          <div style="max-height:38vh;overflow-y:auto">
            @for (r of parseRows; track $index; let i = $index) {
              <div class="parse-row" [class.unmatched]="!r.food">
                <input type="checkbox" [(ngModel)]="r.keep" name="keep{{ i }}">
                <div>
                  <div style="color:var(--muted)">{{ r.line }}</div>
                  @if (r.food) {
                    <div style="display:flex;align-items:center;gap:6px">
                      <app-icon name="check-circle" [size]="15" style="color:var(--brand-dark)"/>
                      <b>{{ r.food.name }}</b> · {{ trimNum(r.qty) }} {{ unitLabel(r.unit) }} · {{ fmtG(r.grams) }}
                    </div>
                  } @else {
                    <div style="display:flex;align-items:center;gap:6px;color:var(--amber)">
                      <app-icon name="alert" [size]="15"/> <i>no match — search a food below or keep as plain row</i>
                    </div>
                    <div class="ac-wrap" style="margin-top:5px">
                      <input type="text" placeholder="Search food…" (input)="fixQuery(i, $event)" (keydown)="fixKey($event, i)" name="fix{{ i }}" autocomplete="off">
                      @if (fixRow === i && fixItems.length > 0) {
                        <div class="ac-dd">
                          @for (f of fixItems; track f.id) {
                            <div class="ac-item" (mousedown)="pickFix(i, f)">
                              <span style="display:flex;align-items:center;gap:9px">
                                @if (f.image) { <img class="ac-thumb" [src]="f.image" [alt]="f.name"> }
                                {{ f.name }}</span>
                              <span class="ac-sub">{{ f.per100.kcal }} kcal / 100 g</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="m-actions">
            <button class="btn primary" (click)="applyPaste()"><app-icon name="plus" [size]="15"/> Add to recipe</button>
          </div>
        }
      </div>
    </div>
  }

  <!-- ================= CONFIRM ================= -->
  @if (confirmMsg) {
    <div class="overlay" style="z-index:80" (mousedown)="closeIfOverlay($event)">
      <div class="modal" style="max-width:400px">
        <div class="m-head"><h3><span class="m-ic"><app-icon name="alert" [size]="17"/></span> {{ confirmTitle }}</h3></div>
        <p class="m-muted">{{ confirmMsg }}</p>
        <div class="m-actions">
          <button class="btn ghost" (click)="confirmMsg = null">Cancel</button>
          <button class="btn danger" (click)="confirmYes()"><app-icon name="trash" [size]="15"/> {{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    .recipe-card { cursor: pointer; transition: .16s; display: flex; flex-direction: column; gap: 10px; }
    .recipe-card:hover { transform: translateY(-3px); box-shadow: 0 4px 8px rgba(30,60,40,.06), 0 16px 34px -14px rgba(30,60,40,.3); }
  `],
})
export class RecipesComponent implements OnInit {
  recipes: RecipeSummary[] = [];
  loading = true;
  unit: 'kcal' | 'kJ' = 'kcal';
  busy = false;

  ed: EditorState | null = null;

  acRow = -1;
  acItems: FoodItem[] = [];
  private acTimer: ReturnType<typeof setTimeout> | null = null;

  pasteOpen = false;
  pasteText = '';
  parseRows: ParseRow[] = [];
  fixRow = -1;
  fixItems: FoodItem[] = [];
  private fixTimer: ReturnType<typeof setTimeout> | null = null;

  confirmTitle = '';
  confirmMsg = '';
  confirmLabel = 'Confirm';
  private confirmAction: (() => void) | null = null;

  constructor(private api: Api, private toast: ToastService, public auth: AuthService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.api.get<{ recipes: RecipeSummary[] }>('/recipes').subscribe({
      next: res => { this.recipes = res.recipes; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.api.get<{ goals: { energy_unit: 'kcal' | 'kJ' } }>('/goals').subscribe(g => { this.unit = g.goals.energy_unit; });
  }

  // ---------------- helpers ----------------
  num(v: unknown): number { return parseFloat(String(v)) || 0; }
  trimNum = trimNum;
  fmtE(kcal: number): string { return fmtE(kcal, this.unit); }
  fmtG = fmtG;
  icon = recipeIcon;
  unitLabel(u: string): string { return UNIT_LABELS[u] ?? u; }
  closeIfOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) { this.ed = null; this.pasteOpen = false; this.confirmMsg = ''; } }

  stackPct(n: Nut): number[] {
    const kc = [n.p * 4, n.c * 4, n.f * 9];
    const tot = kc[0] + kc[1] + kc[2];
    if (tot <= 0) { return [33, 33, 34]; }
    return kc.map(x => (x / tot) * 100);
  }

  // ---------------- editor ----------------
  openEditor(id: number | null): void {
    if (id === null) {
      this.ed = { id: null, name: '', servings: 4, steps: '', ings: [], viewServings: 4, custom: true, is_owner: true };
      return;
    }
    this.api.get<{ recipe: RecipeDetail }>('/recipes/' + id).subscribe({
      next: res => {
        const r = res.recipe;
        this.ed = {
          id: r.id, name: r.name, servings: r.servings, steps: r.steps,
          viewServings: r.servings,
          custom: r.custom,
          is_owner: r.is_owner,
          ings: r.ingredients.map(i => ({
            food_id: i.food_id, qty: i.qty, unit: i.unit,
            raw: i.raw ?? null, food: i.food ?? null,
          })),
        };
      },
      error: () => this.toast.error('Could not load recipe'),
    });
  }

  addRow(): void {
    this.ed?.ings.push({ food_id: null, qty: 100, unit: 'g', raw: '', food: null });
  }

  setBaseServings(v: unknown): void {
    if (!this.ed) { return; }
    this.ed.servings = Math.max(1, this.num(v) || 1);
    this.ed.viewServings = this.ed.servings;
  }

  setUnit(i: number, u: string): void {
    if (!this.ed) { return; }
    this.ed.ings[i].unit = u;
  }

  unitOptions(ing: IngDraft): string[] {
    return ing.food ? ing.food.units_available : ['g'];
  }

  rowGrams(ing: IngDraft): number { return ingGrams(ing.qty, ing.unit, ing.food); }

  total(): Nut {
    const t = emptyNut();
    this.ed?.ings.forEach(ing => {
      if (!ing.food) { return; }
      const k = this.rowGrams(ing) / 100;
      (Object.keys(t) as (keyof Nut)[]).forEach(key => { t[key] += ing.food!.per100[key] * k; });
    });
    return t;
  }

  perServing(): Nut {
    const t = this.total();
    const sv = Math.max(1, this.ed?.servings ?? 1);
    (Object.keys(t) as (keyof Nut)[]).forEach(k => { t[k] /= sv; });
    return t;
  }

  scale(): number {
    if (!this.ed || !this.ed.servings) { return 1; }
    return this.ed.viewServings / this.ed.servings;
  }

  scaleBy(delta: number): void {
    if (!this.ed) { return; }
    this.ed.viewServings = Math.max(0.25, this.ed.viewServings + delta);
  }

  scaledAmount(ing: IngDraft): string {
    if (!ing.food) { return ing.raw || '?'; }
    const g = this.rowGrams(ing) * this.scale();
    if (ing.unit === 'g') { return fmtG(g); }
    return `${trimNum(ing.qty * this.scale())} ${this.unitLabel(ing.unit)} (${fmtG(g)})`;
  }

  save(): void {
    if (!this.ed) { return; }
    const name = this.ed.name.trim();
    if (name.length < 2) { this.toast.error('Please give the recipe a name'); return; }
    if (this.ed.ings.length === 0) { this.toast.error('Add at least one ingredient'); return; }
    const unmatched = this.ed.ings.filter(i => !i.food).length;
    const body = {
      name, servings: this.ed.servings, steps: this.ed.steps,
      ingredients: this.ed.ings.map(i => ({ food_id: i.food_id, qty: i.qty, unit: i.unit, raw: i.raw })),
    };
    this.busy = true;
    const done = () => {
      this.busy = false;
      this.ed = null;
      this.reload();
    };
    if (this.ed.id) {
      this.api.put(`/recipes/${this.ed.id}`, body).subscribe({
        next: () => { done(); this.toast.ok('Recipe saved ✓'); if (unmatched) { this.toast.show(`${unmatched} unmatched row(s) saved without nutrition`, true); } },
        error: () => { this.busy = false; this.toast.error('Save failed'); },
      });
    } else {
      this.api.post('/recipes', body).subscribe({
        next: () => { done(); this.toast.ok('Recipe created 🎉'); },
        error: () => { this.busy = false; this.toast.error('Save failed'); },
      });
    }
  }

  askDelete(): void {
    if (!this.ed?.id) { return; }
    this.confirmTitle = 'Delete recipe?';
    this.confirmMsg = `"${this.ed.name}" and its calendar entries will be removed.`;
    this.confirmLabel = 'Delete';
    this.confirmAction = () => {
      const id = this.ed!.id!;
      this.api.delete(`/recipes/${id}`).subscribe({
        next: () => { this.ed = null; this.reload(); this.toast.ok('Recipe deleted'); },
        error: () => this.toast.error('Delete failed'),
      });
    };
  }

  confirmYes(): void {
    this.confirmMsg = '';
    this.confirmAction?.();
  }

  // ---------------- autocomplete (editor rows) ----------------
  foodQuery(i: number, value: string): void {
    const ing = this.ed?.ings[i];
    if (!ing) { return; }
    ing.food = null;
    ing.food_id = null;
    ing.raw = value;
    this.acRow = i;
    if (this.acTimer) { clearTimeout(this.acTimer); }
    this.acTimer = setTimeout(() => {
      const q = value.trim();
      if (!q) { this.acItems = []; return; }
      this.api.get<{ foods: FoodItem[] }>('/foods', { q, limit: 10 }).subscribe(res => {
        if (this.acRow === i) { this.acItems = res.foods; }
      });
    }, 180);
  }

  pickFood(i: number, f: FoodItem): void {
    const ing = this.ed?.ings[i];
    if (!ing) { return; }
    const firstTime = !ing.food && ing.food_id === null;
    ing.food = f;
    ing.food_id = f.id;
    ing.raw = null;
    if (firstTime) {
      const u = f.units_available.includes('piece') ? 'piece' : (f.units_available.includes('g') ? 'g' : f.units_available[0]);
      ing.unit = u;
      if (!ing.qty) { ing.qty = 1; }
    } else if (!f.units_available.includes(ing.unit)) {
      ing.unit = f.units_available[0] ?? 'g';
    }
    this.acItems = [];
    this.acRow = -1;
  }

  acKey(event: KeyboardEvent, i: number): void {
    if (event.key === 'Enter' && this.acRow === i && this.acItems.length > 0) {
      event.preventDefault();
      this.pickFood(i, this.acItems[0]);
    } else if (event.key === 'Escape') {
      this.acItems = [];
      this.acRow = -1;
    }
  }

  // ---------------- paste ----------------
  openPasteNew(): void {
    this.parseRows = [];
    this.pasteText = '';
    this.pasteOpen = true;
    this.ed = null;
  }

  openPasteInEditor(): void {
    this.parseRows = [];
    this.pasteText = '';
    this.pasteOpen = true;
  }

  parsePaste(): void {
    if (!this.pasteText.trim()) { this.toast.error('Paste some lines first'); return; }
    this.api.post<{ rows: ParseRow[] }>('/parse', { text: this.pasteText }).subscribe({
      next: res => { this.parseRows = res.rows.map(r => ({ ...r, keep: true })); },
      error: () => this.toast.error('Parse failed'),
    });
  }

  matchedCount(): number { return this.parseRows.filter(r => r.food).length; }

  fixQuery(i: number, ev: Event): void {
    const value = (ev.target as HTMLInputElement).value;
    this.fixRow = i;
    if (this.fixTimer) { clearTimeout(this.fixTimer); }
    this.fixTimer = setTimeout(() => {
      const q = value.trim();
      if (!q) { this.fixItems = []; return; }
      this.api.get<{ foods: FoodItem[] }>('/foods', { q, limit: 8 }).subscribe(res => {
        if (this.fixRow === i) { this.fixItems = res.foods; }
      });
    }, 180);
  }

  fixKey(event: KeyboardEvent, i: number): void {
    if (event.key === 'Enter' && this.fixRow === i && this.fixItems.length > 0) {
      event.preventDefault();
      this.pickFix(i, this.fixItems[0]);
    }
  }

  pickFix(i: number, f: FoodItem): void {
    this.parseRows[i].food = f;
    this.fixItems = [];
    this.fixRow = -1;
  }

  applyPaste(): void {
    const kept = this.parseRows.filter(r => r.keep);
    if (!kept.length) { this.toast.error('Nothing selected to add'); return; }
    const rows: IngDraft[] = kept.map(r => ({
      food_id: r.food ? r.food.id : null,
      qty: r.qty, unit: r.unit,
      raw: r.food ? null : r.name,
      food: r.food,
    }));
    if (!this.ed) {
      this.ed = { id: null, name: '', servings: 4, steps: '', viewServings: 4, ings: rows };
    } else {
      this.ed.ings = this.ed.ings.concat(rows);
    }
    this.pasteOpen = false;
    this.toast.ok(`Added ${rows.length} ingredient${rows.length > 1 ? 's' : ''} — review highlighted rows`);
  }
}
