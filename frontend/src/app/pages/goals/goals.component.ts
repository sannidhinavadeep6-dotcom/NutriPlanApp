import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../core/icon.component';
import { Api } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Goals, FoodItem } from '../../core/models';

@Component({
  selector: 'app-goals',
  imports: [FormsModule, IconComponent],
  template: `

<div class="page-anim">
  <div class="page-head">
    <div>
      <h1>Goals &amp; Settings</h1>
      <p class="sub">Daily targets, TDEE calculator and your custom foods.</p>
    </div>
  </div>

  <div class="goal-grid">
    <div class="card lift stagger">
      <div class="sec-title"><h3><span class="m-ic"><app-icon name="flame" [size]="16"/></span> Daily targets</h3></div>
      <div class="ed-grid" style="margin-top:12px">
        <label class="fld">Calorie goal (kcal)<input type="number" min="0" [(ngModel)]="g.kcal" name="gkcal"></label>
        <label class="fld">Energy display
          <select [(ngModel)]="g.energy_unit" name="gunit">
            <option value="kcal">kcal</option><option value="kJ">kJ</option>
          </select>
        </label>
        <label class="fld">Protein (g)<input type="number" min="0" [(ngModel)]="g.p" name="gp"></label>
        <label class="fld">Carbs (g)<input type="number" min="0" [(ngModel)]="g.c" name="gc"></label>
        <label class="fld">Fat (g)<input type="number" min="0" [(ngModel)]="g.f" name="gf"></label>
      </div>
      <p class="hint">Current macros ≈ {{ macroKcal() }} kcal ({{ splitPct(0) }}%P / {{ splitPct(1) }}%C / {{ splitPct(2) }}%F)</p>
      <div class="m-actions" style="justify-content:flex-start">
        <button class="btn primary" (click)="saveGoals()"><app-icon name="check" [size]="15"/> Save targets</button>
      </div>

      <h4 class="mt">Quick macro splits (from {{ g.kcal }} kcal)</h4>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        @for (s of splits; track s.k) {
          <button class="btn ghost split-btn" (click)="applySplit(s.k)">
            {{ s.label }}
            <small style="color:var(--muted);font-weight:600">P {{ splitFor(s.k)[0] }}g · C {{ splitFor(s.k)[1] }}g · F {{ splitFor(s.k)[2] }}g</small>
          </button>
        }
      </div>
    </div>

    <div class="card lift stagger" [style.animation-delay.ms]="'80'">
      <div class="sec-title"><h3><span class="m-ic"><app-icon name="calculator" [size]="16"/></span> TDEE &amp; calorie calculator</h3></div>
      <p class="hint">Mifflin-St Jeor estimate — fill in your details, then apply to goals.</p>
      <div class="ed-grid" style="margin-top:10px">
        <label class="fld">Sex
          <select [(ngModel)]="calc.sex" name="csex"><option value="m">Male</option><option value="f">Female</option></select>
        </label>
        <label class="fld">Age<input type="number" [(ngModel)]="calc.age" name="cage"></label>
        <label class="fld">Weight (kg)<input type="number" [(ngModel)]="calc.w" name="cw"></label>
        <label class="fld">Height (cm)<input type="number" [(ngModel)]="calc.h" name="ch"></label>
        <label class="fld">Activity
          <select [(ngModel)]="calc.act" name="cact">
            <option value="1.2">Sedentary (desk job)</option>
            <option value="1.375">Light (1-3 days/wk)</option>
            <option value="1.55">Moderate (3-5 days/wk)</option>
            <option value="1.725">Active (6-7 days/wk)</option>
            <option value="1.9">Very active (physical job)</option>
          </select>
        </label>
        <label class="fld">Goal
          <select [(ngModel)]="calc.goal" name="cgoal">
            <option value="-500">Lose 0.5 kg/week</option>
            <option value="-250">Lose slowly</option>
            <option value="0">Maintain</option>
            <option value="250">Gain slowly</option>
            <option value="500">Gain 0.5 kg/week</option>
          </select>
        </label>
      </div>
      @if (calcOut) {
        <div class="stat-strip" style="margin-top:12px">
          <div class="stat stagger"><div><small>BMR</small><b>{{ calcOut.bmr }}</b></div></div>
          <div class="stat stagger" [style.animation-delay.ms]="'60'"><div><small>TDEE</small><b>{{ calcOut.tdee }}</b></div></div>
          <div class="stat stagger" [style.animation-delay.ms]="'120'"><div><small>Suggested target</small><b class="hl">{{ calcOut.target }} kcal</b></div></div>
        </div>
      }
      <div class="m-actions" style="justify-content:flex-start">
        <button class="btn" (click)="runCalc()"><app-icon name="calculator" [size]="15"/> Calculate</button>
        @if (calcOut) { <button class="btn primary" (click)="applyCalc()"><app-icon name="check" [size]="15"/> Apply to goals</button> }
      </div>
    </div>

    <div class="card lift stagger" [style.animation-delay.ms]="'160'">
      <div class="sec-title"><h3><span class="m-ic"><app-icon name="apple" [size]="16"/></span> My custom foods</h3></div>
      <p class="hint">Anything the database doesn't have — add it once with per-100 g values and use it everywhere.</p>
      @if (myFoods.length > 0) {
        <ul style="list-style:none;margin:12px 0;padding:0">
          @for (f of myFoods; track f.id) {
            <li class="cf-row">
              <b style="flex:1">{{ f.name }}</b>
              <small class="hint">{{ f.per100.kcal }} kcal · P {{ f.per100.p }} · C {{ f.per100.c }} · F {{ f.per100.f }} / 100g</small>
              <button class="icon-btn danger" (click)="delFood(f)"><app-icon name="trash" [size]="16"/></button>
            </li>
          }
        </ul>
      } @else {
        <div class="empty small">No custom foods yet.</div>
      }

      @if (addingFood) {
        <div class="ed-grid" style="margin-top:10px">
          <label class="fld" style="grid-column:1/-1">Food name<input type="text" [(ngModel)]="nf.name" name="nfName" placeholder="e.g. Grandma's laddoo"></label>
          <label class="fld">Calories /100g<input type="number" min="0" [(ngModel)]="nf.k" name="nfK"></label>
          <label class="fld">Protein (g)<input type="number" min="0" [(ngModel)]="nf.p" name="nfP"></label>
          <label class="fld">Carbs (g)<input type="number" min="0" [(ngModel)]="nf.c" name="nfC"></label>
          <label class="fld">Fat (g)<input type="number" min="0" [(ngModel)]="nf.f" name="nfF"></label>
          <label class="fld">Grams per piece (optional)<input type="number" min="0" [(ngModel)]="nf.piece" name="nfPiece"></label>
          <label class="fld">Grams per cup (optional)<input type="number" min="0" [(ngModel)]="nf.cup" name="nfCup"></label>
        </div>
        <div class="m-actions" style="justify-content:flex-start">
          <button class="btn primary" (click)="saveFood()"><app-icon name="check" [size]="15"/> Save food</button>
          <button class="btn ghost" (click)="addingFood = false">Cancel</button>
        </div>
      } @else {
        <button class="btn" style="margin-top:10px" (click)="addingFood = true"><app-icon name="plus" [size]="15"/> Add custom food</button>
      }
    </div>
  </div>
</div>
  `,
})
export class GoalsComponent implements OnInit {
  g: Goals = { kcal: 2000, p: 100, c: 250, f: 67, energy_unit: 'kcal' };
  splits = [
    { k: 'balanced', label: 'Balanced 50/20/30' },
    { k: 'protein', label: 'High protein 40/30/30' },
    { k: 'lowcarb', label: 'Low carb 25/35/40' },
    { k: 'keto', label: 'Keto 10/25/65' },
  ];
  calc = { sex: 'm', age: 30, w: 70, h: 170, act: '1.55', goal: '0' };
  calcOut: { bmr: number; tdee: number; target: number } | null = null;

  myFoods: FoodItem[] = [];
  addingFood = false;
  nf = { name: '', k: 0, p: 0, c: 0, f: 0, piece: 0, cup: 0 };

  constructor(private api: Api, private toast: ToastService) {}

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.api.get<{ goals: Goals }>('/goals').subscribe(res => { this.g = res.goals; });
    this.api.get<{ foods: FoodItem[] }>('/foods/mine').subscribe(res => { this.myFoods = res.foods; });
  }

  macroKcal(): number { return Math.round(this.g.p * 4 + this.g.c * 4 + this.g.f * 9); }
  splitPct(i: number): number {
    const tot = this.macroKcal();
    if (!tot) { return 0; }
    const vals = [this.g.p * 4, this.g.c * 4, this.g.f * 9];
    return Math.round((vals[i] / tot) * 100);
  }

  splitFor(k: string): number[] {
    const map: Record<string, number[]> = {
      balanced: [0.2, 0.5, 0.3], protein: [0.3, 0.4, 0.3],
      lowcarb: [0.35, 0.25, 0.4], keto: [0.25, 0.1, 0.65],
    };
    const s = map[k] ?? [0.2, 0.5, 0.3];
    const kc = this.g.kcal || 0;
    return [Math.round((kc * s[0]) / 4), Math.round((kc * s[1]) / 4), Math.round((kc * s[2]) / 9)];
  }

  applySplit(k: string): void {
    const [p, c, f] = this.splitFor(k);
    this.g.p = p; this.g.c = c; this.g.f = f;
    this.saveGoals('Macro split applied');
  }

  saveGoals(msg = 'Goals saved ✓'): void {
    this.api.put<{ goals: Goals }>('/goals', this.g).subscribe({
      next: res => { this.g = res.goals; this.toast.ok(msg); },
      error: () => this.toast.error('Save failed'),
    });
  }

  runCalc(): void {
    const bmr = 10 * this.calc.w + 6.25 * this.calc.h - 5 * this.calc.age + (this.calc.sex === 'm' ? 5 : -161);
    const tdee = bmr * parseFloat(this.calc.act);
    const target = Math.max(1000, tdee + parseFloat(this.calc.goal));
    this.calcOut = { bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target) };
  }

  applyCalc(): void {
    if (!this.calcOut) { return; }
    this.g.kcal = this.calcOut.target;
    this.g.p = Math.round((this.calcOut.target * 0.2) / 4);
    this.g.c = Math.round((this.calcOut.target * 0.5) / 4);
    this.g.f = Math.round((this.calcOut.target * 0.3) / 9);
    this.saveGoals(`Goals updated to ${this.calcOut.target} kcal`);
  }

  saveFood(): void {
    if (this.nf.name.trim().length < 2) { this.toast.error('Give the food a name'); return; }
    const body = { name: this.nf.name.trim(), k: this.nf.k, p: this.nf.p, c: this.nf.c, f: this.nf.f,
                   piece_g: this.nf.piece, cup_g: this.nf.cup };
    this.api.post('/foods', body).subscribe({
      next: () => {
        this.toast.ok('Custom food added ✓');
        this.addingFood = false;
        this.nf = { name: '', k: 0, p: 0, c: 0, f: 0, piece: 0, cup: 0 };
        this.reload();
      },
      error: () => this.toast.error('Save failed'),
    });
  }

  delFood(f: FoodItem): void {
    this.api.delete(`/foods/${f.id}`).subscribe({
      next: () => { this.toast.ok('Custom food deleted'); this.reload(); },
      error: () => this.toast.error('Delete failed'),
    });
  }
}
