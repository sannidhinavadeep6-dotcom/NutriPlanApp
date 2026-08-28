import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Api } from '../../core/api.service';
import { IconComponent } from '../../core/icon.component';
import { AdminStats } from '../../core/models';

interface NavItem { path: string; icon: string; label: string; short: string; }

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <header class="topbar">
      <div class="brand">
        <div class="logo"><app-icon name="logo" [size]="24"/></div>
        <div class="brand-txt">
          <b>NutriPlan</b>
          <span>RECIPE PLANNER &amp; CALORIE ANALYZER</span>
        </div>
      </div>

      <nav class="tabs">
        @for (item of nav; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active">
            <app-icon [name]="item.icon" [size]="17"/>
            {{ item.label }}
            @if (item.path === '/admin' && pending > 0) { <span class="badge-red">{{ pending }}</span> }
          </a>
        }
      </nav>

      <div class="user-chip">
        <div class="who">
          <b>{{ auth.user()?.name }}</b>
          <small>{{ auth.user()?.role === 'admin' ? 'Administrator' : 'Member' }}</small>
        </div>
        <div class="avatar">{{ initials() }}</div>
        <button class="icon-btn" (click)="auth.logout()" title="Sign out">
          <app-icon name="logout" [size]="18"/>
        </button>
      </div>
    </header>

    <main class="page">
      <router-outlet />
    </main>

    <footer class="foot">
      NutriPlan · Angular + Flask + SQLite · nutrition estimates from public reference data (USDA averages)
    </footer>

    <nav class="bottom-nav">
      @for (item of nav; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active">
          <span class="bn-icon"><app-icon [name]="item.icon" [size]="19"/></span>
          {{ item.short }}
          @if (item.path === '/admin' && pending > 0) { <span class="badge-red">{{ pending }}</span> }
        </a>
      }
    </nav>
  `,
})
export class ShellComponent implements OnInit {
  pending = 0;
  nav: NavItem[] = [
    { path: '/today', icon: 'chart', label: 'Today', short: 'Today' },
    { path: '/recipes', icon: 'book', label: 'Recipes', short: 'Recipes' },
    { path: '/foods', icon: 'apple', label: 'Foods', short: 'Foods' },
    { path: '/calendar', icon: 'calendar', label: 'Calendar', short: 'Plan' },
    { path: '/grocery', icon: 'cart', label: 'Grocery', short: 'Grocery' },
    { path: '/goals', icon: 'target', label: 'Goals', short: 'Goals' },
  ];

  constructor(public auth: AuthService, private api: Api) {}

  ngOnInit(): void {
    if (this.auth.isAdmin) {
      this.nav = [...this.nav, { path: '/admin', icon: 'shield', label: 'Admin', short: 'Admin' }];
      this.api.get<AdminStats>('/admin/stats').subscribe({
        next: s => { this.pending = s.users_pending; },
        error: () => { this.pending = 0; },
      });
    }
  }

  initials(): string {
    const name = this.auth.user()?.name ?? '?';
    return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }
}
