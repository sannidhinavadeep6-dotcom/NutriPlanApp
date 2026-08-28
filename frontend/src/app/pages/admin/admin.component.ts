import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../core/icon.component';
import { DragDirective } from '../../core/drag.directive';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { AppUser, AdminStats } from '../../core/models';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, IconComponent, DragDirective],
  template: `

<div class="page-anim">
  <div class="page-head">
    <div>
      <h1>Admin Portal</h1>
      <p class="sub">Approve access requests, manage users and monitor the platform.</p>
    </div>
    <div class="head-actions">
      <button class="btn ghost" (click)="reload()"><app-icon name="refresh" [size]="15"/> Refresh</button>
      <button class="btn primary" (click)="openCreate()"><app-icon name="user-plus" [size]="15"/> Create user</button>
    </div>
  </div>

  @if (stats) {
    <div class="stat-strip">
      <div class="stat stagger" [style.animation-delay.ms]="0">
        <div class="stat-ic"><app-icon name="users" [size]="18"/></div>
        <div><small>Total users</small><b>{{ stats.users_total }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="60">
        <div class="stat-ic" style="background:#fff3d6;color:#93690b"><app-icon name="clock" [size]="18"/></div>
        <div><small>Pending approval</small><b class="red">{{ stats.users_pending }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="120">
        <div class="stat-ic"><app-icon name="check-circle" [size]="18"/></div>
        <div><small>Active</small><b class="hl">{{ stats.users_active }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="180">
        <div class="stat-ic" style="background:#fde3e3;color:var(--danger)"><app-icon name="ban" [size]="18"/></div>
        <div><small>Disabled</small><b>{{ stats.users_disabled }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="240">
        <div class="stat-ic"><app-icon name="book" [size]="18"/></div>
        <div><small>Recipes</small><b>{{ stats.recipes_total }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="300">
        <div class="stat-ic"><app-icon name="cutlery" [size]="18"/></div>
        <div><small>Planned meals</small><b>{{ stats.plan_entries_total }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="360">
        <div class="stat-ic"><app-icon name="list" [size]="18"/></div>
        <div><small>Food database</small><b>{{ stats.foods_total }}</b></div>
      </div>
    </div>
  }

  <div class="card lift">
    <div class="sec-title"><h3>Users &amp; access requests</h3></div>
    <div style="overflow-x:auto;margin-top:10px">
      <table class="tbl">
        <thead>
          <tr><th>User</th><th>Status</th><th>Role</th><th>Recipes</th><th>Joined</th><th>Actions</th></tr>
        </thead>
        <tbody>
          @for (u of users; track u.id) {
            <tr class="stagger">
              <td>
                <b>{{ u.name }}</b> @if (u.id === me?.id) { <span class="count">you</span> }<br>
                <small class="hint">{{ u.email }}</small>
              </td>
              <td><span class="pill" [class.pending]="u.status === 'pending'"
                    [class.active]="u.status === 'active'"
                    [class.disabled]="u.status === 'disabled'">{{ u.status }}</span></td>
              <td><span class="pill" [class.admin]="u.role === 'admin'">{{ u.role }}</span></td>
              <td>{{ u.recipe_count ?? 0 }}</td>
              <td><small class="hint">{{ fmtDate(u.created_at) }}</small></td>
              <td>
                <div class="row-actions">
                  @if (u.status === 'pending') {
                    <button class="btn small" (click)="setStatus(u, 'active')"><app-icon name="check" [size]="13"/> Approve</button>
                    <button class="btn small ghost" (click)="setStatus(u, 'disabled')"><app-icon name="ban" [size]="13"/> Reject</button>
                  }
                  @if (u.status === 'active' && u.id !== me?.id) {
                    <button class="btn small ghost" (click)="setStatus(u, 'disabled')"><app-icon name="ban" [size]="13"/> Disable</button>
                  }
                  @if (u.status === 'disabled' && u.id !== me?.id) {
                    <button class="btn small" (click)="setStatus(u, 'active')"><app-icon name="refresh" [size]="13"/> Re-enable</button>
                  }
                  <button class="btn small ghost" (click)="openReset(u)" [disabled]="u.id === me?.id">
                    <app-icon name="key" [size]="13"/> Password</button>
                  <button class="btn small ghost" (click)="toggleRole(u)"
                    [disabled]="u.id === me?.id || changing(u.id)">
                    <app-icon [name]="u.role === 'admin' ? 'arrow-down' : 'arrow-up'" [size]="13"/>
                    {{ u.role === 'admin' ? 'Demote' : 'Make admin' }}
                  </button>
                  <button class="btn small ghost" style="color:var(--danger)" (click)="askDelete(u)" [disabled]="u.id === me?.id">
                    <app-icon name="trash" [size]="13"/></button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>

  <!-- create user (floating window) -->
  @if (creating) {
    <div class="overlay" (mousedown)="creating = false">
      <div class="modal" style="max-width:440px" (mousedown)="$event.stopPropagation()">
        <div class="m-head" appDrag>
          <h3><span class="m-ic"><app-icon name="user-plus" [size]="17"/></span> Create user</h3>
          <button class="icon-btn" (click)="creating = false"><app-icon name="x" [size]="18"/></button>
        </div>
        <div style="display:flex;flex-direction:column;gap:11px">
          <label class="fld">Full name<input type="text" [(ngModel)]="nu.name" name="nuName"></label>
          <label class="fld">Email<input type="email" [(ngModel)]="nu.email" name="nuEmail"></label>
          <label class="fld">Password (min 6 chars)<input type="text" [(ngModel)]="nu.password" name="nuPass"></label>
          <label class="fld">Role
            <select [(ngModel)]="nu.role" name="nuRole"><option value="user">User</option><option value="admin">Admin</option></select>
          </label>
        </div>
        <div class="m-actions">
          <button class="btn ghost" (click)="creating = false">Cancel</button>
          <button class="btn primary" (click)="createUser()" [disabled]="busy">
            @if (busy) { <span class="spin"><app-icon name="refresh" [size]="15"/></span> Creating… }
            @else { <app-icon name="check" [size]="15"/> Create }
          </button>
        </div>
      </div>
    </div>
  }

  <!-- reset password (floating window) -->
  @if (resetting) {
    <div class="overlay" (mousedown)="resetting = null">
      <div class="modal" style="max-width:400px" (mousedown)="$event.stopPropagation()">
        <div class="m-head" appDrag>
          <h3><span class="m-ic"><app-icon name="key" [size]="17"/></span> Reset password</h3>
          <button class="icon-btn" (click)="resetting = null"><app-icon name="x" [size]="18"/></button>
        </div>
        <p class="m-muted">Set a new password for <b>{{ resetting.name }}</b> ({{ resetting.email }}). Share it with the user securely.</p>
        <label class="fld">New password (min 6 chars)
          <input type="text" [(ngModel)]="newPass" name="newPass">
        </label>
        <div class="m-actions">
          <button class="btn ghost" (click)="resetting = null">Cancel</button>
          <button class="btn primary" (click)="resetPassword()" [disabled]="busy">
            @if (busy) { <span class="spin"><app-icon name="refresh" [size]="15"/></span> Saving… }
            @else { <app-icon name="check" [size]="15"/> Set password }
          </button>
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
export class AdminComponent implements OnInit {
  stats: AdminStats | null = null;
  users: AppUser[] = [];
  busy = false;
  private busyIds = new Set<number>();

  creating = false;
  nu = { name: '', email: '', password: '', role: 'user' };

  resetting: AppUser | null = null;
  newPass = '';

  confirmTitle = ''; confirmMsg = ''; confirmLabel = 'Confirm';
  private confirmAction: (() => void) | null = null;

  constructor(private api: Api, public auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void { this.reload(); }

  get me(): AppUser | null { return this.auth.user(); }

  reload(): void {
    this.api.get<AdminStats>('/admin/stats').subscribe(s => { this.stats = s; });
    this.api.get<{ users: AppUser[] }>('/admin/users').subscribe(res => { this.users = res.users; });
  }

  changing(id: number): boolean { return this.busyIds.has(id); }

  fmtDate(iso?: string): string {
    if (!iso) { return '—'; }
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  setStatus(u: AppUser, status: 'active' | 'disabled'): void {
    this.busyIds.add(u.id);
    this.api.post<AppUser>(`/admin/users/${u.id}/status`, { status }).subscribe({
      next: res => {
        this.busyIds.delete(u.id);
        Object.assign(u, res);
        this.toast.ok(status === 'active'
          ? `${u.name} approved — they can now sign in ✓`
          : `${u.name} ${status === 'disabled' ? 'disabled' : 'updated'}`);
        this.reload();
      },
      error: (e: HttpErrorResponse) => {
        this.busyIds.delete(u.id);
        this.toast.error(e.error?.error ?? 'Action failed');
      },
    });
  }

  toggleRole(u: AppUser): void {
    const role = u.role === 'admin' ? 'user' : 'admin';
    this.busyIds.add(u.id);
    this.api.post<AppUser>(`/admin/users/${u.id}/role`, { role }).subscribe({
      next: res => {
        this.busyIds.delete(u.id);
        Object.assign(u, res);
        this.toast.ok(`${u.name} is now ${role === 'admin' ? 'an administrator' : 'a regular user'}`);
        this.reload();
      },
      error: (e: HttpErrorResponse) => {
        this.busyIds.delete(u.id);
        this.toast.error(e.error?.error ?? 'Action failed');
      },
    });
  }

  openReset(u: AppUser): void {
    this.resetting = u;
    this.newPass = '';
  }

  resetPassword(): void {
    if (!this.resetting) { return; }
    if (this.newPass.length < 6) { this.toast.error('Password must be at least 6 characters'); return; }
    this.busy = true;
    this.api.post(`/admin/users/${this.resetting.id}/password`, { password: this.newPass }).subscribe({
      next: () => {
        this.busy = false;
        this.toast.ok(`Password updated for ${this.resetting!.name}`);
        this.resetting = null;
      },
      error: () => { this.busy = false; this.toast.error('Reset failed'); },
    });
  }

  openCreate(): void {
    this.nu = { name: '', email: '', password: '', role: 'user' };
    this.creating = true;
  }

  createUser(): void {
    this.busy = true;
    this.api.post<{ user: AppUser }>('/admin/users', this.nu).subscribe({
      next: () => {
        this.busy = false;
        this.creating = false;
        this.toast.ok(`User ${this.nu.email} created ✓`);
        this.reload();
      },
      error: (e: HttpErrorResponse) => { this.busy = false; this.toast.error(e.error?.error ?? 'Create failed'); },
    });
  }

  askDelete(u: AppUser): void {
    this.confirmTitle = 'Delete user?';
    this.confirmMsg = `${u.name} (${u.email}) and all their recipes, plans and custom foods will be permanently deleted.`;
    this.confirmLabel = 'Delete user';
    this.confirmAction = () => {
      this.api.delete(`/admin/users/${u.id}`).subscribe({
        next: () => { this.toast.ok('User deleted'); this.reload(); },
        error: (e: HttpErrorResponse) => this.toast.error(e.error?.error ?? 'Delete failed'),
      });
    };
  }

  confirmYes(): void { this.confirmMsg = ''; this.confirmAction?.(); }
}
