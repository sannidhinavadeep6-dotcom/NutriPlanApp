import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../core/icon.component';
import { Api } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DayAnalysis, WeekSummary, DAYS, DAY_SHORT, SLOTS, MACROS, fmtE, trimNum, todayIndex } from '../../core/models';

@Component({
  selector: 'app-today',
  imports: [RouterLink, IconComponent],
  template: `

<div class="page-anim">
  <div class="page-head">
    <div>
      <h1>Today — {{ dayName }}</h1>
      <p class="sub">Your live calorie &amp; macro analysis versus daily goals.</p>
    </div>
    <div class="head-actions">
      <a class="btn ghost" routerLink="/calendar"><app-icon name="calendar" [size]="16"/> Plan meals</a>
    </div>
  </div>

  @if (day) {
    <div class="stat-strip">
      <div class="stat stagger" [style.animation-delay.ms]="0">
        <div class="stat-ic"><app-icon name="zap" [size]="19"/></div>
        <div><small>Eaten</small><b>{{ fmtE(day.totals.kcal) }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="60">
        <div class="stat-ic"><app-icon name="target" [size]="19"/></div>
        <div><small>Goal</small><b>{{ fmtE(day.goals.kcal) }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="120">
        <div class="stat-ic"><app-icon name="clock" [size]="19"/></div>
        <div><small>{{ remaining >= 0 ? 'Remaining' : 'Over by' }}</small>
          <b [class.red]="remaining < 0">{{ fmtE(Math.abs(remaining)) }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="180">
        <div class="stat-ic"><app-icon name="cutlery" [size]="19"/></div>
        <div><small>Meals planned</small><b>{{ mealCount }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="240">
        <div class="stat-ic"><app-icon name="flame" [size]="19"/></div>
        <div><small>Protein / goal</small><b>{{ trimNum(day.totals.p) }} / {{ trimNum(day.goals.p) }} g</b></div>
      </div>
    </div>

    <div class="card lift page-anim" style="margin-bottom:16px">
      <div class="sec-title"><h3>Goal comparison</h3></div>
      <div class="mt">
        <div class="gbar-row">
          <div class="gbar-top"><span>Calories</span><span [class.over]="pct(day.totals.kcal, day.goals.kcal) > 110">
            {{ dispE(day.totals.kcal) }} / {{ dispE(day.goals.kcal) }} · {{ pct(day.totals.kcal, day.goals.kcal) }}%</span></div>
          <div class="gbar"><div class="gbar-fill" [class.over]="pct(day.totals.kcal, day.goals.kcal) > 110"
            [style.width.%]="barPct(day.totals.kcal, day.goals.kcal)"></div></div>
        </div>
        @for (m of macros; track m.k) {
          <div class="gbar-row">
            <div class="gbar-top"><span>{{ m.label }}</span>
              <span [class.over]="pct(day.totals[m.k], day.goals[m.k]) > 110">
                {{ trimNum(day.totals[m.k]) }} / {{ trimNum(day.goals[m.k]) }} g · {{ pct(day.totals[m.k], day.goals[m.k]) }}%</span></div>
            <div class="gbar"><div class="gbar-fill" [class.over]="pct(day.totals[m.k], day.goals[m.k]) > 110"
              [style.background]="m.color" [style.width.%]="barPct(day.totals[m.k], day.goals[m.k])"></div></div>
          </div>
        }
      </div>
      <p class="hint" style="margin-bottom:0">
        Also today: fiber {{ trimNum(day.totals.fib) }} g · sugar {{ trimNum(day.totals.sug) }} g · sodium {{ trimNum(day.totals.na) }} mg
      </p>
    </div>

    <div class="card lift page-anim">
      <div class="sec-title"><h3>Meals</h3></div>
      @if (mealCount === 0) {
        <div class="empty small" style="margin-top:10px">Nothing planned for today yet — add meals in the Calendar.</div>
      }
      @for (meal of day.meals; track meal.slot) {
        <div class="stagger" style="margin-top:12px">
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:13.5px;color:var(--brand-dark)">
            <span style="display:flex;align-items:center;gap:7px">
              <app-icon [name]="slotIcon(meal.slot)" [size]="16"/> {{ slotLabel(meal.slot) }}</span>
            <span>{{ fmtE(meal.nutrition.kcal) }}</span>
          </div>
          @for (e of meal.entries; track e.id) {
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:13.5px;padding:6px 2px;border-bottom:1px dashed #e5eae1">
              <span>{{ e.recipe_name }} <small style="color:#66735f">× {{ trimNum(e.servings) }}</small></span>
              <span><small style="color:#66735f">P {{ trimNum(e.nutrition.p) }} · C {{ trimNum(e.nutrition.c) }} · F {{ trimNum(e.nutrition.f) }}</small>
                &nbsp;<b>{{ fmtE(e.nutrition.kcal) }}</b></span>
            </div>
          }
        </div>
      }
    </div>
  } @else {
    <div class="stat-strip">
      @for (i of [0,1,2,3,4]; track i) { <div class="stat"><div class="skel" style="width:100%;height:44px"></div></div> }
    </div>
    <div class="skel" style="height:180px;margin-bottom:16px"></div>
  }

  @if (week) {
    <div class="card lift mt page-anim">
      <div class="sec-title"><h3>Week at a glance</h3></div>
      <div class="stat-strip" style="margin-top:12px">
        @for (d of week.days; track $index) {
          <div class="stat stagger" [style.animation-delay.ms]="$index * 50"
               [style.border-color]="$index === dayIdx ? '#14a05a' : null">
            <div><small>{{ DAY_SHORT[$index] }}{{ $index === dayIdx ? ' · today' : '' }}</small>
              <b [class.red]="d.kcal > week.goals.kcal * 1.1">{{ fmtE(d.kcal) }}</b>
              <div class="gbar" style="margin-top:5px"><div class="gbar-fill"
                [class.over]="d.kcal > week.goals.kcal * 1.1"
                [style.width.%]="barPct(d.kcal, week.goals.kcal)"></div></div>
            </div>
          </div>
        }
      </div>
    </div>
  }
</div>
  `,
})
export class TodayComponent implements OnInit {
  readonly DAY_SHORT = DAY_SHORT;
  readonly Math = Math;
  dayIdx = todayIndex();
  dayName = DAYS[todayIndex()];
  day: DayAnalysis | null = null;
  week: WeekSummary | null = null;
  macros = MACROS;
  unit: 'kcal' | 'kJ' = 'kcal';
  mealCount = 0;

  constructor(private api: Api, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.get<DayAnalysis>('/plan/day/' + this.dayIdx).subscribe(d => {
      this.day = d;
      this.unit = d.goals.energy_unit;
      this.mealCount = d.meals.reduce((a, m) => a + m.entries.length, 0);
    });
    this.api.get<WeekSummary>('/plan/week').subscribe(w => { this.week = w; });
  }

  get remaining(): number {
    if (!this.day) { return 0; }
    return this.day.goals.kcal - this.day.totals.kcal;
  }

  fmtE(kcal: number, u: 'kcal' | 'kJ' = this.unit): string { return fmtE(kcal, u); }
  dispE(kcal: number): string { return fmtE(kcal, this.unit); }
  trimNum(x: number): string { return trimNum(x); }
  slotLabel(slot: string): string { return SLOTS.find(s => s.id === slot)?.label ?? slot; }
  slotIcon(slot: string): string { return SLOTS.find(s => s.id === slot)?.icon ?? 'cutlery'; }
  pct(v: number, g: number): number { return g > 0 ? Math.round((v / g) * 100) : 0; }
  barPct(v: number, g: number): number { return g > 0 ? Math.min(100, (v / g) * 100) : 0; }
}
