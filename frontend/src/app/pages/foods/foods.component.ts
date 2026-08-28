import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api.service';
import { IconComponent } from '../../core/icon.component';
import { FoodItem, trimNum } from '../../core/models';

const CAT_ICONS: Record<string, string> = {
  FR: 'apple', VG: 'salad', GR: 'bowl', FL: 'bread', DY: 'egg', MF: 'meat',
  DN: 'bowl', OF: 'zap', SC: 'list', DR: 'cup', PF: 'cutlery', SI: 'bowl', MY: 'cutlery',
};

@Component({
  selector: 'app-foods',
  imports: [FormsModule, IconComponent],
  template: `
    <div class="page-anim">
      <div class="page-head">
        <div>
          <h1>Food Gallery</h1>
          <p class="sub">Browse the {{ foods.length }}-item food database — South Indian tiffins, biryanis, staples &amp; more.</p>
        </div>
      </div>

      <div class="fld-ico-input" style="max-width:440px;margin-bottom:14px">
        <app-icon name="search" [size]="17"/>
        <input type="text" placeholder="Search foods… (biryani, dosa, paneer, dal)" [(ngModel)]="q" name="fq">
      </div>

      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px">
        <button class="chip-btn" [class.on]="cat === null" (click)="cat = null">
          <b>All</b> <small>{{ foods.length }}</small>
        </button>
        @for (c of cats; track c.key) {
          <button class="chip-btn" [class.on]="cat === c.key" (click)="cat = c.key">
            {{ c.label }} <small>{{ countCat(c.key) }}</small>
          </button>
        }
      </div>

      <div class="food-grid">
        @for (f of filtered; track f.id; let i = $index) {
          <div class="food-card stagger" [style.animation-delay.ms]="Math.min(i, 24) * 35">
            <div class="food-photo">
              @if (f.image) {
                <img [src]="f.image" [alt]="f.name" loading="lazy">
              } @else {
                <div class="food-photo-fallback"><app-icon [name]="catIcon(f.cat)" [size]="30"/></div>
              }
              <span class="food-kcal">{{ Math.round(f.per100.kcal) }}<small>kcal/100g</small></span>
            </div>
            <div class="food-info">
              <b>{{ f.name }}</b>
              <small class="hint">{{ f.cat_label }}</small>
              <div class="macro-dots">
                <span style="color:#3b6fd4">P {{ trimNum(f.per100.p) }}g</span>
                <span style="color:#e08b1d">C {{ trimNum(f.per100.c) }}g</span>
                <span style="color:#9a66d2">F {{ trimNum(f.per100.f) }}g</span>
              </div>
            </div>
          </div>
        }
      </div>
      @if (filtered.length === 0) {
        <div class="empty">No foods match “{{ q }}”. You can add custom foods from the Goals page.</div>
      }
    </div>
  `,
})
export class FoodsComponent implements OnInit {
  readonly Math = Math;
  foods: FoodItem[] = [];
  q = '';
  cat: string | null = null;
  cats: { key: string; label: string }[] = [];

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.api.get<{ foods: FoodItem[] }>('/foods/all').subscribe(res => {
      this.foods = res.foods;
      const seen = new Map<string, string>();
      this.foods.forEach(f => { if (!seen.has(f.cat)) { seen.set(f.cat, f.cat_label); } });
      this.cats = [...seen.entries()]
        .map(([key, label]) => ({ key, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    });
  }

  get filtered(): FoodItem[] {
    const q = this.q.trim().toLowerCase();
    return this.foods.filter(f =>
      (this.cat === null || f.cat === this.cat) &&
      (!q || f.name.toLowerCase().includes(q) || f.aliases.toLowerCase().includes(q)));
  }

  countCat(key: string): number { return this.foods.filter(f => f.cat === key).length; }
  catIcon(cat: string): string { return CAT_ICONS[cat] ?? 'cutlery'; }
  trimNum = trimNum;
}
