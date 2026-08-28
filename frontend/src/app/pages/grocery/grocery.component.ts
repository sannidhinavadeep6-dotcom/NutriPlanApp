import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../core/icon.component';
import { Api } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { GroceryData, GroceryCategory } from '../../core/models';

@Component({
  selector: 'app-grocery',
  imports: [FormsModule, IconComponent],
  template: `

<div class="page-anim">
  <div class="page-head">
    <div>
      <h1>Grocery List</h1>
      <p class="sub">Auto-generated from your week — amounts already scaled to the servings you planned.</p>
    </div>
    <div class="head-actions no-print">
      <button class="btn ghost" (click)="copyList()"><app-icon name="copy" [size]="15"/> Copy</button>
      <button class="btn ghost" (click)="print()"><app-icon name="printer" [size]="15"/> Print</button>
    </div>
  </div>

  @if (data && data.categories.length === 0 && data.extras.length === 0) {
    <div class="empty">Your week is empty — plan some meals in the Calendar first, and the shopping list will build itself.</div>
  }

  @if (data) {
    @for (cat of data.categories; track cat.key) {
      <div class="card g-cat stagger">
        <h3 style="display:flex;align-items:center;gap:8px">{{ cat.label }} <span class="count">{{ cat.items.length }}</span></h3>
        <ul style="list-style:none;margin:6px 0 0;padding:0">
          @for (item of cat.items; track item.key) {
            <li (click)="toggle(item.key, !item.checked)" class="g-item">
              <span class="g-check" [class.on]="item.checked">
                <app-icon [name]="item.checked ? 'check-square' : 'square'" [size]="19"/></span>
              @if (item.image) { <img class="g-thumb" [src]="item.image" [alt]="item.name"> }
              <span class="g-name">{{ item.name }}</span>
              <span class="g-amt">
                <b>{{ item.display }}</b> <small class="hint">· {{ item.recipes_count }} recipe{{ item.recipes_count > 1 ? 's' : '' }}</small>
              </span>
            </li>
          }
        </ul>
      </div>
    }

    @if (data.extras.length > 0) {
      <div class="card g-cat stagger">
        <h3 style="display:flex;align-items:center;gap:8px">Extras <span class="count">{{ data.extras.length }}</span></h3>
        <ul style="list-style:none;margin:6px 0 0;padding:0">
          @for (x of data.extras; track x.id) {
            <li (click)="toggle('x_' + x.id, !x.checked)" class="g-item">
              <span class="g-check" [class.on]="x.checked">
                <app-icon [name]="x.checked ? 'check-square' : 'square'" [size]="19"/></span>
              <span class="g-name">{{ x.name }}</span>
              <button class="icon-btn danger no-print" (click)="delExtra(x.id, $event)"><app-icon name="trash" [size]="15"/></button>
            </li>
          }
        </ul>
      </div>
    }

    <div style="display:flex;gap:9px;margin:6px 0 14px" class="no-print">
      <input type="text" style="flex:1" placeholder="Add anything else… dish soap, snacks…"
             [(ngModel)]="extraName" name="extraName" (keydown.enter)="addExtra()">
      <button class="btn" (click)="addExtra()"><app-icon name="plus" [size]="15"/> Add</button>
    </div>

    <div style="display:flex;align-items:center;gap:12px" class="no-print">
      <div class="gbar" style="flex:1;height:10px">
        <div class="gbar-fill" [style.width.%]="progressPct()"></div>
      </div>
      <span class="hint" style="font-weight:600">{{ data.progress.done }} of {{ data.progress.total }} collected</span>
    </div>
  }
</div>
  `,
})
export class GroceryComponent implements OnInit {
  data: GroceryData | null = null;
  extraName = '';

  constructor(private api: Api, private toast: ToastService) {}

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.api.get<GroceryData>('/grocery').subscribe(res => { this.data = res; });
  }

  toggle(key: string, checked: boolean): void {
    if (!this.data) { return; }
    this.api.post('/grocery/check', { key, checked }).subscribe(() => {
      let found = false;
      this.data!.categories.forEach((c: GroceryCategory) => c.items.forEach(i => {
        if (i.key === key) { i.checked = checked; found = true; }
      }));
      if (!found) {
        this.data!.extras.forEach(x => { if ('x_' + x.id === key) { x.checked = checked; } });
      }
      this.data!.progress.done += checked ? 1 : -1;
    });
  }

  addExtra(): void {
    const name = this.extraName.trim();
    if (!name) { this.toast.error('Type something to add'); return; }
    this.api.post('/grocery/extras', { name }).subscribe(() => {
      this.extraName = '';
      this.reload();
    });
  }

  delExtra(id: number, ev: Event): void {
    ev.stopPropagation();
    this.api.delete(`/grocery/extras/${id}`).subscribe(() => this.reload());
  }

  progressPct(): number {
    if (!this.data || this.data.progress.total === 0) { return 0; }
    return (this.data.progress.done / this.data.progress.total) * 100;
  }

  print(): void { window.print(); }

  copyList(): void {
    if (!this.data) { return; }
    const lines = ['NUTRIPLAN GROCERY LIST', ''];
    this.data.categories.forEach(c => {
      lines.push(`— ${c.label.toUpperCase()} —`);
      c.items.forEach(i => lines.push(`[ ] ${i.name} — ${i.display}`));
      lines.push('');
    });
    this.data.extras.forEach(x => lines.push(`[ ] ${x.name} (extra)`));
    const text = lines.join('\n');
    const done = () => this.toast.ok('List copied to clipboard 📋');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () => this.fallbackCopy(text, done));
    } else {
      this.fallbackCopy(text, done);
    }
  }

  private fallbackCopy(text: string, done: () => void): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch { this.toast.error('Copy not allowed here'); }
    ta.remove();
  }
}
