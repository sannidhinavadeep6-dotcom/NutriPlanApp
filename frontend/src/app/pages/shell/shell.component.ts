import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Api } from '../../core/api.service';
import { IconComponent } from '../../core/icon.component';
import { AboutModalComponent } from '../../core/about-modal.component';
import { AdminStats } from '../../core/models';

interface NavItem { path: string; icon: string; label: string; short: string; }

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AboutModalComponent],
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

      <div style="display: flex; align-items: center; gap: 8px;">
        <button 
          type="button" 
          class="btn ghost" 
          style="padding: 6px 12px; font-size: 13px; font-weight: 650; gap: 5px; border-radius: 10px; color: #0c7a43; background: #eef8f2;"
          (click)="showAbout = true"
          title="About NutriPlan & Developer">
          <app-icon name="info" [size]="15"/>
          <span class="desktop-only">About</span>
        </button>

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
      </div>
    </header>

    <main class="page">
      <router-outlet />
    </main>

    <footer class="foot" style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
      <span>NutriPlan · Angular + Flask + SQLite · USDA reference data</span>
      <span>·</span>
      <button type="button" class="link-btn" style="background: none; border: none; color: #0c7a43; font-weight: 700; cursor: pointer; text-decoration: underline; padding: 0; font-size: inherit;" (click)="showAbout = true">
        About NutriPlan &amp; Creator (S. Navadeep)
      </button>
    </footer>

    <nav class="bottom-nav">
      @for (item of nav; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active">
          <span class="bn-icon"><app-icon [name]="item.icon" [size]="19"/></span>
          {{ item.short }}
          @if (item.path === '/admin' && pending > 0) { <span class="badge-red">{{ pending }}</span> }
        </a>
      }
      <a href="javascript:void(0)" (click)="showAbout = true">
        <span class="bn-icon"><app-icon name="info" [size]="19"/></span>
        About
      </a>
    </nav>

    <!-- About Modal -->
    @if (showAbout) {
      <app-about-modal (close)="showAbout = false" />
    }
  `,
})
export class ShellComponent implements OnInit {
  pending = 0;
  showAbout = false;
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

