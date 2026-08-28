import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../core/icon.component';
import { DragDirective } from '../../core/drag.directive';
import { Api } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import {
  PlanEntry, WeekSummary, DayAnalysis, RecipeSummary, Goals,
  DAYS, DAY_SHORT, SLOTS, fmtE, trimNum,
} from '../../core/models';

@Component({
  selector: 'app-calendar',
  imports: [FormsModule, IconComponent, DragDirective],
  template: `

<div class="page-anim">
  <div class="page-head">
    <div>
      <h1>Weekly Calendar</h1>
      <p class="sub">Tap + to schedule recipes for breakfast, lunch, dinner and snacks.</p>
    </div>
    <div class="head-actions">
      <button class="btn ghost" style="color:var(--danger);border-color:#e8c9c9" (click)="askClearWeek()">
        <app-icon name="trash" [size]="15"/> Clear week</button>
    </div>
  </div>

  @if (week) {
    <div class="stat-strip">
      <div class="stat stagger" [style.animation-delay.ms]="0">
        <div class="stat-ic"><app-icon name="cutlery" [size]="18"/></div>
        <div><small>Meals planned</small><b>{{ week.meals_planned }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="60">
        <div class="stat-ic"><app-icon name="calendar" [size]="18"/></div>
        <div><small>Days used</small><b>{{ week.days_used }} / 7</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="120">
        <div class="stat-ic"><app-icon name="chart" [size]="18"/></div>
        <div><small>Daily average</small><b>{{ fmtE(week.daily_average.kcal) }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="180">
        <div class="stat-ic"><app-icon name="target" [size]="18"/></div>
        <div><small>Goal</small><b>{{ fmtE(week.goals.kcal) }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="240">
        <div class="stat-ic"><app-icon name="zap" [size]="18"/></div>
        <div><small>Avg vs goal</small>
          <b [class.red]="week.daily_average.kcal > week.goals.kcal * 1.1">{{ pct(week.daily_average.kcal, week.goals.kcal) }}%</b></div>
      </div>
    </div>
  }

  <div class="cal-scroll">
    <div class="cal-grid">
      <div class="hint cal-corner">Meals</div>
      @for (d of DAY_SHORT; track $index) {
        <div class="cal-day-head">{{ d }}</div>
      }

      @for (slot of SLOTS; track slot.id) {
        <div class="cal-meal-label">
          <app-icon [name]="slot.icon" [size]="17"/>
          <span class="hint">{{ slot.label }}</span>
        </div>
        @for (d of [0,1,2,3,4,5,6]; track d) {
          <div class="cal-cell">
            @for (e of entriesFor(d, slot.id); track e.id) {
              <div class="entry stagger">
                <div class="entry-top">
                  <span class="entry-name">{{ e.recipe_name }}</span>
                  <button class="icon-btn" style="padding:2px" (click)="removeEntry(e)"><app-icon name="x" [size]="13"/></button>
                </div>
                <div class="entry-meta">
                  <span class="stepper">
                    <button (click)="step(e, -0.5)"><app-icon name="minus" [size]="12"/></button>
                    <span>{{ trimNum(e.servings) }} sv</span>
                    <button (click)="step(e, 0.5)"><app-icon name="plus" [size]="12"/></button>
                  </span>
                  <span class="entry-kcal">{{ fmtE(e.kcal) }}</span>
                </div>
              </div>
            }
            <button class="add-entry" (click)="openPicker(d, slot.id)"><app-icon name="plus" [size]="13"/> Add</button>
          </div>
        }
      }

      <div class="hint cal-corner" style="font-weight:800">Daily</div>
      @if (week) {
        @for (d of [0,1,2,3,4,5,6]; track d) {
          <div class="cal-total" (click)="openDay(d)">
            <b>{{ fmtE(week.days[d].kcal) }}</b>
            <div class="gbar" style="margin:6px 0 4px"><div class="gbar-fill"
              [class.over]="week.days[d].kcal > week.goals.kcal * 1.1"
              [style.width.%]="barPct(week.days[d].kcal, week.goals.kcal)"></div></div>
            <span class="hint cal-total-sub">{{ pct(week.days[d].kcal, week.goals.kcal) }}% of goal · details ›</span>
          </div>
        }
      }
    </div>
  </div>

  <!-- picker (floating window) -->
  @if (picker) {
    <div class="overlay" (mousedown)="picker = null">
      <div class="modal" (mousedown)="$event.stopPropagation()">
        <div class="m-head" appDrag>
          <h3><span class="m-ic"><app-icon name="plus" [size]="17"/></span>
            Add to {{ DAY_SHORT[picker.day] }} — {{ slotLabel(picker.slot) }}</h3>
          <button class="icon-btn" (click)="picker = null"><app-icon name="x" [size]="18"/></button>
        </div>
        <div class="fld-ico-input">
          <app-icon name="search" [size]="16"/>
          <input type="text" placeholder="Search recipes…" [(ngModel)]="picker.q" name="pq" (ngModelChange)="filterPicker()">
        </div>
        <div style="max-height:44vh;overflow-y:auto;margin-top:10px">
          @for (r of pickerFiltered; track r.id) {
            <button class="btn ghost pick-btn" (click)="selectRecipe(r)">
              <span>{{ r.name }}</span>
              <small style="color:var(--muted)">{{ fmtE(r.per_serving.kcal) }} / serving</small>
            </button>
          }
          @if (pickerFiltered.length === 0) { <div class="empty small">No recipes found.</div> }
        </div>
        @if (picker.selected) {
          <div style="display:flex;align-items:center;gap:9px;border-top:1px solid var(--line);padding-top:10px;flex-wrap:wrap">
            <span>Add <b>{{ picker.selected.name }}</b> ×</span>
            <input type="number" min="0.25" step="0.5" style="width:84px" [(ngModel)]="picker.servings" name="pserv" (keydown.enter)="addPicked()">
            <span>servings</span>
            <button class="btn primary" (click)="addPicked()"><app-icon name="check" [size]="15"/> Add</button>
          </div>
        }
      </div>
    </div>
  }

  <!-- day detail (floating window) -->
  @if (dayDetail) {
    <div class="overlay" (mousedown)="dayDetail = null">
      <div class="modal wide" (mousedown)="$event.stopPropagation()">
        <div class="m-head" appDrag>
          <h3><span class="m-ic"><app-icon name="chart" [size]="17"/></span> {{ dayName(dayDetail.day) }} — daily analysis</h3>
          <button class="icon-btn" (click)="dayDetail = null"><app-icon name="x" [size]="18"/></button>
        </div>
        <div class="stat-strip" style="margin-bottom:10px">
          <div class="stat"><div><small>Eaten</small><b>{{ fmtE(dayDetail.totals.kcal) }}</b></div></div>
          <div class="stat"><div><small>Goal</small><b>{{ fmtE(dayDetail.goals.kcal) }}</b></div></div>
          <div class="stat"><div><small>{{ dayDetail.goals.kcal - dayDetail.totals.kcal >= 0 ? 'Remaining' : 'Over by' }}</small>
            <b [class.red]="dayDetail.totals.kcal > dayDetail.goals.kcal">{{ fmtE(Math.abs(dayDetail.goals.kcal - dayDetail.totals.kcal)) }}</b></div></div>
        </div>
        <div class="ed-sec" style="margin-top:4px">
          <h4><app-icon name="target" [size]="16"/> Goal comparison</h4>
          <div class="gbar-row">
            <div class="gbar-top"><span>Calories</span>
              <span [class.over]="pct(dayDetail.totals.kcal, dayDetail.goals.kcal) > 110">
                {{ dispE(dayDetail.totals.kcal) }} / {{ dispE(dayDetail.goals.kcal) }}</span></div>
            <div class="gbar"><div class="gbar-fill" [class.over]="pct(dayDetail.totals.kcal, dayDetail.goals.kcal) > 110"
              [style.width.%]="barPct(dayDetail.totals.kcal, dayDetail.goals.kcal)"></div></div>
          </div>
          @for (m of macroList; track m.k) {
            <div class="gbar-row">
              <div class="gbar-top"><span>{{ m.label }}</span>
                <span [class.over]="pct(dayDetail.totals[m.k], dayDetail.goals[m.k]) > 110">
                  {{ trimNum(dayDetail.totals[m.k]) }} / {{ trimNum(dayDetail.goals[m.k]) }} g</span></div>
              <div class="gbar"><div class="gbar-fill" [class.over]="pct(dayDetail.totals[m.k], dayDetail.goals[m.k]) > 110"
                [style.background]="m.color" [style.width.%]="barPct(dayDetail.totals[m.k], dayDetail.goals[m.k])"></div></div>
            </div>
          }
        </div>
        <div class="ed-sec">
          <h4><app-icon name="cutlery" [size]="16"/> Meals</h4>
          @for (meal of dayDetail.meals; track meal.slot) {
            <div style="margin-top:10px">
              <div style="display:flex;justify-content:space-between;font-weight:800;font-size:13.5px;color:var(--brand-dark)">
                <span style="display:flex;align-items:center;gap:7px"><app-icon [name]="slotIcon(meal.slot)" [size]="15"/> {{ slotLabel(meal.slot) }}</span>
                <span>{{ fmtE(meal.nutrition.kcal) }}</span>
              </div>
              @for (e of meal.entries; track e.id) {
                <div style="display:flex;justify-content:space-between;gap:8px;font-size:13.5px;padding:5px 2px;border-bottom:1px dashed #e5eae1;flex-wrap:wrap">
                  <span>{{ e.recipe_name }} <small style="color:var(--muted)">× {{ trimNum(e.servings) }}</small></span>
                  <span><small style="color:var(--muted)">P {{ trimNum(e.nutrition.p) }} · C {{ trimNum(e.nutrition.c) }} · F {{ trimNum(e.nutrition.f) }}</small> <b>{{ fmtE(e.nutrition.kcal) }}</b></span>
                </div>
              }
            </div>
          }
          @if (dayDetail.meals.length === 0) { <div class="hint">Nothing planned for this day yet.</div> }
        </div>
        <div class="m-actions">
          <button class="btn ghost" style="color:var(--danger)" (click)="askClearDay()"><app-icon name="trash" [size]="15"/> Clear day</button>
          <button class="btn ghost" (click)="dayDetail = null">Close</button>
        </div>
      </div>
    </div>
  }

  @if (confirmMsg) {
    <div class="overlay" style="z-index:80" (mousedown)="confirmMsg = ''">
      <div class="modal" style="max-width:400px" (mousedown)="$event.stopPropagation()">
        <div class="m-head"><h3><span class="m-ic"><app-icon name="alert" [size]="17"/></span> {{ confirmTitle }}</h3></div>
        <p class="m-muted">{{ confirmMsg }}</p>
        <div class="m-actions">
          <button class="btn ghost" (click)="confirmMsg = ''">Cancel</button>
          <button class="btn danger" (click)="confirmYes()"><app-icon name="trash" [size]="15"/> {{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  }
</div>
  `,
})
export class CalendarComponent implements OnInit {
  readonly DAY_SHORT = DAY_SHORT;
  readonly SLOTS = SLOTS;
  readonly Math = Math;
  entries: PlanEntry[] = [];
  week: WeekSummary | null = null;
  unit: 'kcal' | 'kJ' = 'kcal';
  macroList = [
    { k: 'p' as const, label: 'Protein', color: '#3b6fd4' },
    { k: 'c' as const, label: 'Carbs', color: '#f2a13c' },
    { k: 'f' as const, label: 'Fat', color: '#9a66d2' },
  ];

  picker: { day: number; slot: string; q: string; selected: RecipeSummary | null; servings: number } | null = null;
  pickerFiltered: RecipeSummary[] = [];
  private allRecipes: RecipeSummary[] = [];

  dayDetail: DayAnalysis | null = null;

  confirmTitle = ''; confirmMsg = ''; confirmLabel = 'Confirm';
  private confirmAction: (() => void) | null = null;

  constructor(private api: Api, private toast: ToastService) {}

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.api.get<{ entries: PlanEntry[] }>('/plan').subscribe(res => { this.entries = res.entries; });
    this.api.get<WeekSummary>('/plan/week').subscribe(w => { this.week = w; this.unit = w.goals.energy_unit; });
    this.api.get<{ recipes: RecipeSummary[] }>('/recipes').subscribe(r => { this.allRecipes = r.recipes; });
  }

  entriesFor(day: number, slot: string): PlanEntry[] {
    return this.entries.filter(e => e.day === day && e.slot === slot);
  }

  step(e: PlanEntry, delta: number): void {
    const target = Math.max(0.25, Math.round((e.servings + delta) * 2) / 2);
    if (target === e.servings) { return; }
    this.api.patch<{ entry: PlanEntry }>(`/plan/entries/${e.id}`, { servings: target }).subscribe({
      next: res => { e.servings = res.entry.servings; e.kcal = res.entry.kcal; this.reloadWeekOnly(); },
      error: () => this.toast.error('Update failed'),
    });
  }

  removeEntry(e: PlanEntry): void {
    this.api.delete(`/plan/entries/${e.id}`).subscribe({
      next: () => { this.entries = this.entries.filter(x => x.id !== e.id); this.reloadWeekOnly(); },
      error: () => this.toast.error('Remove failed'),
    });
  }

  reloadWeekOnly(): void {
    this.api.get<WeekSummary>('/plan/week').subscribe(w => { this.week = w; });
  }

  // picker
  openPicker(day: number, slot: string): void {
    this.picker = { day, slot, q: '', selected: null, servings: 1 };
    this.pickerFiltered = this.allRecipes;
  }

  filterPicker(): void {
    if (!this.picker) { return; }
    const q = this.picker.q.trim().toLowerCase();
    this.pickerFiltered = q ? this.allRecipes.filter(r => r.name.toLowerCase().includes(q)) : this.allRecipes;
  }

  selectRecipe(r: RecipeSummary): void {
    if (!this.picker) { return; }
    this.picker.selected = r;
    this.picker.servings = r.servings || 1;
  }

  addPicked(): void {
    if (!this.picker?.selected) { return; }
    const { day, slot, selected, servings } = this.picker;
    const body = { day, slot, recipe_id: selected!.id, servings: Math.max(0.25, servings || 1) };
    this.api.post('/plan/entries', body).subscribe({
      next: () => {
        this.picker = null;
        this.toast.ok(`${selected!.name} → ${DAY_SHORT[day]} ${slot}`);
        this.reload();
      },
      error: () => this.toast.error('Could not add to plan'),
    });
  }

  // day detail
  openDay(d: number): void {
    this.api.get<DayAnalysis>(`/plan/day/${d}`).subscribe(res => { this.dayDetail = res; });
  }

  askClearDay(): void {
    if (!this.dayDetail) { return; }
    const d = this.dayDetail.day;
    this.confirmTitle = `Clear ${DAYS[d]}?`;
    this.confirmMsg = 'All meals planned for this day will be removed.';
    this.confirmLabel = 'Clear';
    this.confirmAction = () => {
      this.dayDetail = null;
      const ids = this.entries.filter(e => e.day === d).map(e => e.id);
      let left = ids.length;
      if (left === 0) { return; }
      ids.forEach(id => {
        this.api.delete(`/plan/entries/${id}`).subscribe({
          complete: () => {
            left--;
            if (left <= 0) { this.toast.ok(`${DAYS[d]} cleared`); this.reload(); }
          },
        });
      });
    };
  }

  askClearWeek(): void {
    this.confirmTitle = 'Clear the whole week?';
    this.confirmMsg = 'Every planned meal for Mon–Sun will be removed.';
    this.confirmLabel = 'Clear week';
    this.confirmAction = () => {
      const ids = this.entries.map(e => e.id);
      let left = ids.length;
      if (left === 0) { return; }
      ids.forEach(id => {
        this.api.delete(`/plan/entries/${id}`).subscribe({
          complete: () => {
            left--;
            if (left <= 0) { this.toast.ok('Week cleared'); this.reload(); }
          },
        });
      });
    };
  }

  confirmYes(): void { this.confirmMsg = ''; this.confirmAction?.(); }

  slotLabel(slot: string): string { return SLOTS.find(s => s.id === slot)?.label ?? slot; }
  slotIcon(slot: string): string { return SLOTS.find(s => s.id === slot)?.icon ?? 'cutlery'; }
  dayName(d: number): string { return DAYS[d]; }
  fmtE(kcal: number): string { return fmtE(kcal, this.unit); }
  dispE(kcal: number): string { return fmtE(kcal, this.unit); }
  trimNum = trimNum;
  pct(v: number, g: number): number { return g > 0 ? Math.round((v / g) * 100) : 0; }
  barPct(v: number, g: number): number { return g > 0 ? Math.min(100, (v / g) * 100) : 0; }
}
