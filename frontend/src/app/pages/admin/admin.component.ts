import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../core/icon.component';
import { DragDirective } from '../../core/drag.directive';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import {
  AppUser,
  AdminStats,
  UserActivitySummary,
  UserActivityLog,
  DAYS,
  DAY_SHORT,
  SLOTS,
  MACROS,
  fmtE,
  trimNum,
} from '../../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DragDirective],
  template: `

<div class="page-anim">
  <div class="page-head">
    <div>
      <h1>Admin Portal &amp; User Monitoring</h1>
      <p class="sub">Monitor user progress, feature adoption, platform activities and manage access.</p>
    </div>
    <div class="head-actions">
      <button class="btn ghost" [class.active-btn]="showGlobalFeed" (click)="toggleGlobalFeed()">
        <app-icon name="activity" [size]="15"/> {{ showGlobalFeed ? 'Hide Activity Feed' : 'Live Activity Feed' }}
      </button>
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
      <div class="stat stagger" [style.animation-delay.ms]="50">
        <div class="stat-ic" style="background:#fff3d6;color:#93690b"><app-icon name="clock" [size]="18"/></div>
        <div><small>Pending approval</small><b class="red">{{ stats.users_pending }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="100">
        <div class="stat-ic"><app-icon name="check-circle" [size]="18"/></div>
        <div><small>Active users</small><b class="hl">{{ stats.users_active }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="150">
        <div class="stat-ic" style="background:#fde3e3;color:var(--danger)"><app-icon name="ban" [size]="18"/></div>
        <div><small>Disabled</small><b>{{ stats.users_disabled }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="200">
        <div class="stat-ic"><app-icon name="book" [size]="18"/></div>
        <div><small>Recipes</small><b>{{ stats.recipes_total }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="250">
        <div class="stat-ic"><app-icon name="cutlery" [size]="18"/></div>
        <div><small>Planned meals</small><b>{{ stats.plan_entries_total }}</b></div>
      </div>
      <div class="stat stagger" [style.animation-delay.ms]="300">
        <div class="stat-ic"><app-icon name="activity" [size]="18"/></div>
        <div><small>Activity events</small><b>{{ stats.activity_logs_total || 0 }}</b></div>
      </div>
    </div>
  }

  <!-- Live Global Activity Stream (Collapsible) -->
  @if (showGlobalFeed) {
    <div class="card lift page-anim" style="margin-bottom:18px;border-left:4px solid var(--brand)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="sec-title" style="margin:0">
          <h3 style="display:flex;align-items:center;gap:8px">
            <span class="live-dot"></span> Live Platform Activity Stream
          </h3>
        </div>
        <button class="btn small ghost" (click)="loadGlobalFeed()"><app-icon name="refresh" [size]="13"/> Refresh stream</button>
      </div>

      @if (loadingGlobal) {
        <div class="empty small">Loading recent events…</div>
      } @else if (globalLogs.length === 0) {
        <div class="empty small">No activity events recorded yet.</div>
      } @else {
        <div class="activity-timeline-scroll">
          @for (log of globalLogs; track log.id) {
            <div class="log-item stagger">
              <div class="log-badge" [attr.data-cat]="log.category">
                <app-icon [name]="getCatIcon(log.category)" [size]="14"/>
              </div>
              <div class="log-body">
                <div class="log-header">
                  <span class="log-user"><b>{{ log.user_name || 'User #' + log.user_id }}</b> <small>({{ log.user_email }})</small></span>
                  <span class="pill small" [attr.data-cat]="log.category">{{ log.category }}</span>
                  <span class="log-time">{{ timeAgo(log.created_at) }}</span>
                </div>
                <div class="log-text">{{ log.details || log.action }}</div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  }

  <!-- Users Table with Progress & Feature Usage -->
  <div class="card lift">
    <div class="sec-title">
      <h3>User Management, Progress &amp; Features</h3>
    </div>
    <div style="overflow-x:auto;margin-top:10px">
      <table class="tbl">
        <thead>
          <tr>
            <th>User</th>
            <th>Status</th>
            <th>Role</th>
            <th>Features Used</th>
            <th>Weekly Progress</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users; track u.id) {
            <tr class="stagger">
              <td>
                <div style="display:flex;align-items:center;gap:9px">
                  <div class="u-avatar">{{ u.name ? u.name[0].toUpperCase() : 'U' }}</div>
                  <div>
                    <b>{{ u.name }}</b> @if (u.id === me?.id) { <span class="count">you</span> }<br>
                    <small class="hint">{{ u.email }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="pill" [class.pending]="u.status === 'pending'"
                      [class.active]="u.status === 'active'"
                      [class.disabled]="u.status === 'disabled'">{{ u.status }}</span>
              </td>
              <td><span class="pill" [class.admin]="u.role === 'admin'">{{ u.role }}</span></td>
              <td>
                <div class="feat-adoption-cell">
                  <div class="feat-badge" [class.high]="(u.features_used_count || 0) >= 4"
                       [class.mid]="(u.features_used_count || 0) >= 2 && (u.features_used_count || 0) < 4">
                    {{ u.features_used_count || 0 }}/6 Features
                  </div>
                  <div class="feat-mini-tags">
                    @if ((u.plan_entries || 0) > 0) {
                      <span class="mini-tag" title="Meal Plan"><app-icon name="calendar" [size]="11"/> {{ u.plan_entries }}</span>
                    }
                    @if (u.recipe_count && u.recipe_count > 0) {
                      <span class="mini-tag" title="Custom Recipes"><app-icon name="book" [size]="11"/> {{ u.recipe_count }}</span>
                    }
                    @if (u.grocery_progress && u.grocery_progress.total > 0) {
                      <span class="mini-tag" title="Grocery Progress"><app-icon name="cart" [size]="11"/> {{ u.grocery_progress.pct }}%</span>
                    }
                  </div>
                </div>
              </td>
              <td>
                <div class="progress-cell">
                  <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                    <span><b>{{ u.weekly_avg_kcal || 0 }}</b> <small>/ {{ u.goal_kcal || 2000 }} kcal</small></span>
                    <span class="hint">{{ getCalPct(u) }}%</span>
                  </div>
                  <div class="mini-bar">
                    <div class="mini-bar-fill" [style.width.%]="Math.min(100, getCalPct(u))"
                         [class.over]="getCalPct(u) > 110"></div>
                  </div>
                </div>
              </td>
              <td>
                <div style="font-size:12.5px">
                  <b>{{ timeAgo(u.last_active_at || u.last_login_at || u.created_at) }}</b><br>
                  <small class="hint">Joined {{ fmtDate(u.created_at) }}</small>
                </div>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn small primary" (click)="inspectUser(u)" title="Inspect progress and used features">
                    <app-icon name="eye" [size]="13"/> Inspect
                  </button>
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
                    <app-icon name="key" [size]="13"/> Pass
                  </button>
                  <button class="btn small ghost" (click)="toggleRole(u)"
                    [disabled]="u.id === me?.id || changing(u.id)">
                    <app-icon [name]="u.role === 'admin' ? 'arrow-down' : 'arrow-up'" [size]="13"/>
                    {{ u.role === 'admin' ? 'Demote' : 'Make admin' }}
                  </button>
                  <button class="btn small ghost" style="color:var(--danger)" (click)="askDelete(u)" [disabled]="u.id === me?.id">
                    <app-icon name="trash" [size]="13"/>
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>

  <!-- USER ACTIVITY & PROGRESS INSPECTOR MODAL -->
  @if (inspectingUser) {
    <div class="overlay" (mousedown)="closeInspector()">
      <div class="modal inspector-modal" (mousedown)="$event.stopPropagation()">
        
        <!-- Inspector Header -->
        <div class="m-head" appDrag style="padding-bottom:12px;border-bottom:1px solid var(--line)">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="u-avatar large">{{ inspectingUser.name ? inspectingUser.name[0].toUpperCase() : 'U' }}</div>
            <div>
              <h3 style="display:flex;align-items:center;gap:8px;font-size:18px">
                {{ inspectingUser.name }}
                <span class="pill" [class.active]="inspectingUser.status === 'active'"
                      [class.pending]="inspectingUser.status === 'pending'"
                      [class.disabled]="inspectingUser.status === 'disabled'">{{ inspectingUser.status }}</span>
                <span class="pill" [class.admin]="inspectingUser.role === 'admin'">{{ inspectingUser.role }}</span>
              </h3>
              <p class="sub" style="margin-top:2px;font-size:13px">
                {{ inspectingUser.email }} · Joined {{ fmtDate(inspectingUser.created_at) }} · Last active: <b>{{ timeAgo(inspectingUser.last_active_at || inspectingUser.last_login_at || inspectingUser.created_at) }}</b>
              </p>
            </div>
          </div>
          <button class="icon-btn" (click)="closeInspector()"><app-icon name="x" [size]="20"/></button>
        </div>

        <!-- Inspector Navigation Tabs -->
        <div class="inspector-tabs">
          <button class="itab" [class.active]="activeTab === 'features'" (click)="activeTab = 'features'">
            <app-icon name="pie-chart" [size]="15"/> Features Used
          </button>
          <button class="itab" [class.active]="activeTab === 'progress'" (click)="activeTab = 'progress'">
            <app-icon name="trending-up" [size]="15"/> Nutrition Progress
          </button>
          <button class="itab" [class.active]="activeTab === 'schedule'" (click)="activeTab = 'schedule'">
            <app-icon name="calendar" [size]="15"/> Planned Meals (7-Day)
          </button>
          <button class="itab" [class.active]="activeTab === 'grocery'" (click)="activeTab = 'grocery'">
            <app-icon name="cart" [size]="15"/> Grocery Progress
          </button>
          <button class="itab" [class.active]="activeTab === 'custom'" (click)="activeTab = 'custom'">
            <app-icon name="book" [size]="15"/> Custom Recipes &amp; Foods
          </button>
          <button class="itab" [class.active]="activeTab === 'logs'" (click)="activeTab = 'logs'">
            <app-icon name="activity" [size]="15"/> Activity Log Timeline
          </button>
        </div>

        <!-- Inspector Body -->
        <div class="inspector-body">
          @if (loadingSummary) {
            <div style="padding:40px;text-align:center">
              <div class="spin" style="display:inline-block;margin-bottom:10px"><app-icon name="refresh" [size]="26"/></div>
              <p class="hint">Loading user progress and activity data…</p>
            </div>
          } @else if (summary) {

            <!-- TAB 1: FEATURES BREAKDOWN -->
            @if (activeTab === 'features') {
              <div class="page-anim">
                <div class="adoption-banner">
                  <div class="banner-left">
                    <h4>Platform Adoption Score</h4>
                    <p class="sub">User is actively utilizing <b>{{ summary.features.adoption_score }} of 6</b> core platform capabilities.</p>
                  </div>
                  <div class="banner-right">
                    <div class="score-pill">{{ summary.features.adoption_pct }}% Active</div>
                  </div>
                </div>

                <div class="features-grid">
                  <!-- Feature 1: Meal Planner -->
                  <div class="feat-card" [class.used]="summary.features.meal_planner.used">
                    <div class="feat-head">
                      <div class="feat-icon"><app-icon name="calendar" [size]="18"/></div>
                      <span class="feat-status" [class.ok]="summary.features.meal_planner.used">
                        {{ summary.features.meal_planner.used ? 'Active' : 'Not Used' }}
                      </span>
                    </div>
                    <h4>Meal Planner</h4>
                    <p class="feat-desc">7-day schedule &amp; slot meal distribution</p>
                    <div class="feat-metrics">
                      <div><small>Planned meals</small><b>{{ summary.features.meal_planner.total_meals }}</b></div>
                      <div><small>Days covered</small><b>{{ summary.features.meal_planner.days_covered }}/7</b></div>
                      <div><small>Weekly average</small><b>{{ summary.features.meal_planner.daily_avg_kcal }} kcal/day</b></div>
                    </div>
                  </div>

                  <!-- Feature 2: Goals -->
                  <div class="feat-card used">
                    <div class="feat-head">
                      <div class="feat-icon"><app-icon name="target" [size]="18"/></div>
                      <span class="feat-status ok">
                        {{ summary.features.nutrition_goals.is_customized ? 'Customized' : 'Default' }}
                      </span>
                    </div>
                    <h4>Nutrition Targets</h4>
                    <p class="feat-desc">Daily calorie, protein, carb &amp; fat targets</p>
                    <div class="feat-metrics">
                      <div><small>Calorie Goal</small><b>{{ summary.features.nutrition_goals.targets.kcal }} kcal</b></div>
                      <div><small>Protein Target</small><b>{{ summary.features.nutrition_goals.targets.p }}g</b></div>
                      <div><small>Adherence</small><b>{{ summary.features.nutrition_goals.adherence.kcal.pct }}%</b></div>
                    </div>
                  </div>

                  <!-- Feature 3: Recipes -->
                  <div class="feat-card" [class.used]="summary.features.recipes.used">
                    <div class="feat-head">
                      <div class="feat-icon"><app-icon name="book" [size]="18"/></div>
                      <span class="feat-status" [class.ok]="summary.features.recipes.used">
                        {{ summary.features.recipes.used ? 'Active' : 'Not Used' }}
                      </span>
                    </div>
                    <h4>Recipe Management</h4>
                    <p class="feat-desc">Recipe library &amp; custom recipe creations</p>
                    <div class="feat-metrics">
                      <div><small>Custom recipes</small><b>{{ summary.features.recipes.custom_recipes_count }}</b></div>
                      <div><small>Status</small><b>{{ summary.features.recipes.custom_recipes_count > 0 ? 'Created Custom' : 'Library Only' }}</b></div>
                    </div>
                  </div>

                  <!-- Feature 4: Foods -->
                  <div class="feat-card" [class.used]="summary.features.food_database.used">
                    <div class="feat-head">
                      <div class="feat-icon"><app-icon name="list" [size]="18"/></div>
                      <span class="feat-status" [class.ok]="summary.features.food_database.used">
                        {{ summary.features.food_database.used ? 'Active' : 'No Custom Foods' }}
                      </span>
                    </div>
                    <h4>Food Database</h4>
                    <p class="feat-desc">Custom ingredient entries with macros</p>
                    <div class="feat-metrics">
                      <div><small>Custom foods</small><b>{{ summary.features.food_database.custom_foods_count }}</b></div>
                      <div><small>Database</small><b>{{ summary.features.food_database.custom_foods_count > 0 ? 'Extended' : 'Standard' }}</b></div>
                    </div>
                  </div>

                  <!-- Feature 5: Grocery -->
                  <div class="feat-card" [class.used]="summary.features.grocery.used">
                    <div class="feat-head">
                      <div class="feat-icon"><app-icon name="cart" [size]="18"/></div>
                      <span class="feat-status" [class.ok]="summary.features.grocery.used">
                        {{ summary.features.grocery.used ? summary.features.grocery.completion_pct + '% Done' : 'Empty' }}
                      </span>
                    </div>
                    <h4>Smart Grocery List</h4>
                    <p class="feat-desc">Auto-aggregated shopping list &amp; checklist</p>
                    <div class="feat-metrics">
                      <div><small>Total items</small><b>{{ summary.features.grocery.total_items }}</b></div>
                      <div><small>Checked off</small><b>{{ summary.features.grocery.checked_items }}</b></div>
                      <div><small>Completion</small><b>{{ summary.features.grocery.completion_pct }}%</b></div>
                    </div>
                  </div>

                  <!-- Feature 6: Parser -->
                  <div class="feat-card" [class.used]="summary.features.smart_parser.used">
                    <div class="feat-head">
                      <div class="feat-icon"><app-icon name="zap" [size]="18"/></div>
                      <span class="feat-status" [class.ok]="summary.features.smart_parser.used">
                        {{ summary.features.smart_parser.used ? 'Used' : 'Idle' }}
                      </span>
                    </div>
                    <h4>Smart NLP Parser</h4>
                    <p class="feat-desc">Natural language recipe &amp; ingredient importer</p>
                    <div class="feat-metrics">
                      <div><small>Parse operations</small><b>{{ summary.features.smart_parser.parse_events_count }}</b></div>
                      <div><small>Status</small><b>{{ summary.features.smart_parser.used ? 'Active User' : 'Not Tried' }}</b></div>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 2: NUTRITION PROGRESS & GOALS ADHERENCE -->
            @if (activeTab === 'progress') {
              <div class="page-anim">
                <div class="sec-title"><h4>Target Goals vs. Actual Weekly Average</h4></div>
                
                <div class="progress-cards-grid">
                  <!-- Calories -->
                  <div class="pcard">
                    <div class="pcard-top">
                      <span>Calories</span>
                      <span class="adh-status" [attr.data-status]="summary.progress.macro_adherence.kcal.status">
                        {{ fmtStatus(summary.progress.macro_adherence.kcal.status) }}
                      </span>
                    </div>
                    <div class="pcard-val">
                      <b>{{ summary.progress.daily_average.kcal }}</b> <small>/ {{ summary.progress.goals.kcal }} kcal</small>
                    </div>
                    <div class="mini-bar large">
                      <div class="mini-bar-fill" [style.width.%]="Math.min(100, summary.progress.macro_adherence.kcal.pct)"
                           [class.over]="summary.progress.macro_adherence.kcal.pct > 110"></div>
                    </div>
                    <div class="pcard-sub">
                      <span>{{ summary.progress.macro_adherence.kcal.pct }}% achieved</span>
                      <span>{{ summary.progress.macro_adherence.kcal.diff >= 0 ? '+' : '' }}{{ summary.progress.macro_adherence.kcal.diff }} kcal</span>
                    </div>
                  </div>

                  <!-- Protein -->
                  <div class="pcard">
                    <div class="pcard-top">
                      <span>Protein</span>
                      <span class="adh-status" [attr.data-status]="summary.progress.macro_adherence.p.status">
                        {{ fmtStatus(summary.progress.macro_adherence.p.status) }}
                      </span>
                    </div>
                    <div class="pcard-val">
                      <b>{{ summary.progress.daily_average.p }}g</b> <small>/ {{ summary.progress.goals.p }}g</small>
                    </div>
                    <div class="mini-bar large">
                      <div class="mini-bar-fill" style="background:#3b6fd4"
                           [style.width.%]="Math.min(100, summary.progress.macro_adherence.p.pct)"></div>
                    </div>
                    <div class="pcard-sub">
                      <span>{{ summary.progress.macro_adherence.p.pct }}% achieved</span>
                      <span>{{ summary.progress.macro_adherence.p.diff >= 0 ? '+' : '' }}{{ summary.progress.macro_adherence.p.diff }}g</span>
                    </div>
                  </div>

                  <!-- Carbs -->
                  <div class="pcard">
                    <div class="pcard-top">
                      <span>Carbohydrates</span>
                      <span class="adh-status" [attr.data-status]="summary.progress.macro_adherence.c.status">
                        {{ fmtStatus(summary.progress.macro_adherence.c.status) }}
                      </span>
                    </div>
                    <div class="pcard-val">
                      <b>{{ summary.progress.daily_average.c }}g</b> <small>/ {{ summary.progress.goals.c }}g</small>
                    </div>
                    <div class="mini-bar large">
                      <div class="mini-bar-fill" style="background:#f2a13c"
                           [style.width.%]="Math.min(100, summary.progress.macro_adherence.c.pct)"></div>
                    </div>
                    <div class="pcard-sub">
                      <span>{{ summary.progress.macro_adherence.c.pct }}% achieved</span>
                      <span>{{ summary.progress.macro_adherence.c.diff >= 0 ? '+' : '' }}{{ summary.progress.macro_adherence.c.diff }}g</span>
                    </div>
                  </div>

                  <!-- Fat -->
                  <div class="pcard">
                    <div class="pcard-top">
                      <span>Fats</span>
                      <span class="adh-status" [attr.data-status]="summary.progress.macro_adherence.f.status">
                        {{ fmtStatus(summary.progress.macro_adherence.f.status) }}
                      </span>
                    </div>
                    <div class="pcard-val">
                      <b>{{ summary.progress.daily_average.f }}g</b> <small>/ {{ summary.progress.goals.f }}g</small>
                    </div>
                    <div class="mini-bar large">
                      <div class="mini-bar-fill" style="background:#9a66d2"
                           [style.width.%]="Math.min(100, summary.progress.macro_adherence.f.pct)"></div>
                    </div>
                    <div class="pcard-sub">
                      <span>{{ summary.progress.macro_adherence.f.pct }}% achieved</span>
                      <span>{{ summary.progress.macro_adherence.f.diff >= 0 ? '+' : '' }}{{ summary.progress.macro_adherence.f.diff }}g</span>
                    </div>
                  </div>
                </div>

                <div class="sec-title mt"><h4>7-Day Weekly Calorie &amp; Macro Breakdown</h4></div>
                <div class="days-summary-grid">
                  @for (d of summary.progress.days_summary; track d.day) {
                    <div class="day-sum-card" [class.active-day]="d.is_planned">
                      <div class="dsum-head">
                        <b>{{ d.day_name }}</b>
                        <span class="pill small" [class.active]="d.is_planned">{{ d.meal_count }} meals</span>
                      </div>
                      <div class="dsum-kcal"><b>{{ d.totals.kcal }}</b> <small>kcal</small></div>
                      <div class="dsum-macros">
                        <span>P: {{ trimNum(d.totals.p) }}g</span>
                        <span>C: {{ trimNum(d.totals.c) }}g</span>
                        <span>F: {{ trimNum(d.totals.f) }}g</span>
                      </div>
                    </div>
                  }
                </div>

                <p class="hint mt">
                  Average micronutrients: Fiber <b>{{ summary.progress.macro_adherence.fib }}g</b> · Sugar <b>{{ summary.progress.macro_adherence.sug }}g</b> · Sodium <b>{{ summary.progress.macro_adherence.na }}mg</b>
                </p>
              </div>
            }

            <!-- TAB 3: PLANNED MEALS SCHEDULE -->
            @if (activeTab === 'schedule') {
              <div class="page-anim">
                <div class="sec-title"><h4>User's 7-Day Meal Schedule</h4></div>
                <div class="schedule-days-container">
                  @for (day of summary.schedule; track day.day) {
                    <div class="sched-day-block">
                      <div class="sday-header">
                        <div>
                          <b>{{ day.day_name }}</b>
                          <span class="hint" style="margin-left:8px">{{ day.meal_count }} meal(s) planned · {{ day.totals.kcal }} kcal</span>
                        </div>
                      </div>

                      @if (day.meal_count === 0) {
                        <div class="empty small" style="padding:10px">No meals planned for this day.</div>
                      } @else {
                        <div class="slots-list">
                          @for (slotKey of ['breakfast', 'lunch', 'dinner', 'snacks']; track slotKey) {
                            @if (day.slots[slotKey] && day.slots[slotKey].length > 0) {
                              <div class="slot-row">
                                <div class="slot-tag"><app-icon [name]="getSlotIcon(slotKey)" [size]="14"/> {{ slotKey }}</div>
                                <div class="slot-items">
                                  @for (item of day.slots[slotKey]; track item.id) {
                                    <div class="sched-item">
                                      <span class="item-name"><b>{{ item.recipe_name }}</b> <small class="hint">× {{ trimNum(item.servings) }}</small></span>
                                      <span class="item-macros"><small>P {{ trimNum(item.p) }}g · C {{ trimNum(item.c) }}g · F {{ trimNum(item.f) }}g</small> &nbsp;<b>{{ item.kcal }} kcal</b></span>
                                    </div>
                                  }
                                </div>
                              </div>
                            }
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- TAB 4: GROCERY PROGRESS -->
            @if (activeTab === 'grocery') {
              <div class="page-anim">
                <div class="grocery-summary-banner">
                  <div>
                    <h4>Checklist Completion: {{ summary.grocery.done }} / {{ summary.grocery.total }} items ({{ summary.grocery.pct }}%)</h4>
                    <div class="mini-bar large" style="margin-top:6px">
                      <div class="mini-bar-fill" [style.width.%]="summary.grocery.pct"></div>
                    </div>
                  </div>
                </div>

                @if (summary.grocery.categories.length === 0 && summary.grocery.extras.length === 0) {
                  <div class="empty" style="margin-top:16px">No grocery items generated yet (no meals planned or items added).</div>
                } @else {
                  <div class="grocery-grid">
                    @for (cat of summary.grocery.categories; track cat.key) {
                      <div class="cat-card">
                        <h5>{{ cat.label }}</h5>
                        <div class="g-items-list">
                          @for (item of cat.items; track item.key) {
                            <div class="g-item" [class.checked]="item.checked">
                              <span class="chk-box"><app-icon [name]="item.checked ? 'check-square' : 'square'" [size]="15"/></span>
                              <span class="g-name">{{ item.name }}</span>
                              <span class="g-qty">{{ item.display }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    @if (summary.grocery.extras.length > 0) {
                      <div class="cat-card">
                        <h5>Custom Extras</h5>
                        <div class="g-items-list">
                          @for (x of summary.grocery.extras; track x.id) {
                            <div class="g-item" [class.checked]="x.checked">
                              <span class="chk-box"><app-icon [name]="x.checked ? 'check-square' : 'square'" [size]="15"/></span>
                              <span class="g-name">{{ x.name }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- TAB 5: CUSTOM RECIPES & FOODS -->
            @if (activeTab === 'custom') {
              <div class="page-anim">
                <div class="sec-title"><h4>Custom Recipes Created by {{ inspectingUser.name }} ({{ summary.custom_recipes.length }})</h4></div>
                @if (summary.custom_recipes.length === 0) {
                  <div class="empty small" style="margin-bottom:20px">No custom recipes created yet.</div>
                } @else {
                  <div class="custom-recipes-grid">
                    @for (r of summary.custom_recipes; track r.id) {
                      <div class="crecipe-card">
                        <div class="cr-top">
                          <b>{{ r.name }}</b>
                          <span class="pill small">{{ r.servings }} servings</span>
                        </div>
                        <div class="cr-nut">
                          <b>{{ r.per_serving.kcal }} kcal / serving</b> · P: {{ r.per_serving.p }}g · C: {{ r.per_serving.c }}g · F: {{ r.per_serving.f }}g
                        </div>
                        <div class="cr-ings">
                          <small class="hint">{{ r.ingredient_count }} ingredients: {{ getIngNames(r) }}</small>
                        </div>
                      </div>
                    }
                  </div>
                }

                <div class="sec-title mt"><h4>Custom Foods Added to Database ({{ summary.custom_foods.length }})</h4></div>
                @if (summary.custom_foods.length === 0) {
                  <div class="empty small">No custom foods added.</div>
                } @else {
                  <div class="custom-foods-grid">
                    @for (f of summary.custom_foods; track f.id) {
                      <div class="cfood-card">
                        <b>{{ f.name }}</b>
                        <div class="cf-nut">
                          <span><b>{{ f.per100.kcal }}</b> kcal/100g</span> ·
                          <span>P: {{ f.per100.p }}g</span> ·
                          <span>C: {{ f.per100.c }}g</span> ·
                          <span>F: {{ f.per100.f }}g</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- TAB 6: ACTIVITY TIMELINE -->
            @if (activeTab === 'logs') {
              <div class="page-anim">
                <div class="logs-filter-bar">
                  <span class="hint">Filter by category:</span>
                  <button class="btn small" [class.primary]="logFilter === 'all'" [class.ghost]="logFilter !== 'all'"
                          (click)="setLogFilter('all')">All</button>
                  <button class="btn small" [class.primary]="logFilter === 'planner'" [class.ghost]="logFilter !== 'planner'"
                          (click)="setLogFilter('planner')">Planner</button>
                  <button class="btn small" [class.primary]="logFilter === 'goals'" [class.ghost]="logFilter !== 'goals'"
                          (click)="setLogFilter('goals')">Goals</button>
                  <button class="btn small" [class.primary]="logFilter === 'recipes'" [class.ghost]="logFilter !== 'recipes'"
                          (click)="setLogFilter('recipes')">Recipes</button>
                  <button class="btn small" [class.primary]="logFilter === 'grocery'" [class.ghost]="logFilter !== 'grocery'"
                          (click)="setLogFilter('grocery')">Grocery</button>
                  <button class="btn small" [class.primary]="logFilter === 'foods'" [class.ghost]="logFilter !== 'foods'"
                          (click)="setLogFilter('foods')">Foods</button>
                  <button class="btn small" [class.primary]="logFilter === 'auth'" [class.ghost]="logFilter !== 'auth'"
                          (click)="setLogFilter('auth')">Auth</button>
                </div>

                @if (filteredLogs.length === 0) {
                  <div class="empty small" style="margin-top:20px">No activity records match this filter.</div>
                } @else {
                  <div class="activity-timeline">
                    @for (log of filteredLogs; track log.id) {
                      <div class="log-item stagger">
                        <div class="log-badge" [attr.data-cat]="log.category">
                          <app-icon [name]="getCatIcon(log.category)" [size]="14"/>
                        </div>
                        <div class="log-body">
                          <div class="log-header">
                            <span class="pill small" [attr.data-cat]="log.category">{{ log.category }}</span>
                            <span class="log-time">{{ timeAgo(log.created_at) }} · <small class="hint">{{ fmtTime(log.created_at) }}</small></span>
                          </div>
                          <div class="log-text">{{ log.details || log.action }}</div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

          }
        </div>

        <!-- Inspector Footer -->
        <div class="m-actions" style="border-top:1px solid var(--line);padding-top:12px">
          <button class="btn ghost" (click)="closeInspector()">Close Inspector</button>
          <button class="btn primary" (click)="loadUserSummary(inspectingUser.id)"><app-icon name="refresh" [size]="14"/> Refresh User Data</button>
        </div>

      </div>
    </div>
  }

  <!-- CREATE USER MODAL -->
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

  <!-- RESET PASSWORD MODAL -->
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

  <!-- CONFIRM ACTION MODAL -->
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

  // Global live activity feed
  showGlobalFeed = false;
  globalLogs: UserActivityLog[] = [];
  loadingGlobal = false;

  // Inspector State
  inspectingUser: AppUser | null = null;
  summary: UserActivitySummary | null = null;
  loadingSummary = false;
  activeTab: 'features' | 'progress' | 'schedule' | 'grocery' | 'custom' | 'logs' = 'features';
  logFilter = 'all';

  creating = false;
  nu = { name: '', email: '', password: '', role: 'user' };

  resetting: AppUser | null = null;
  newPass = '';

  confirmTitle = ''; confirmMsg = ''; confirmLabel = 'Confirm';
  private confirmAction: (() => void) | null = null;

  Math = Math;
  trimNum = trimNum;

  constructor(private api: Api, public auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void { this.reload(); }

  get me(): AppUser | null { return this.auth.user(); }

  reload(): void {
    this.api.get<AdminStats>('/admin/stats').subscribe(s => { this.stats = s; });
    this.api.get<{ users: AppUser[] }>('/admin/users').subscribe(res => { this.users = res.users; });
    if (this.showGlobalFeed) {
      this.loadGlobalFeed();
    }
  }

  toggleGlobalFeed(): void {
    this.showGlobalFeed = !this.showGlobalFeed;
    if (this.showGlobalFeed && this.globalLogs.length === 0) {
      this.loadGlobalFeed();
    }
  }

  loadGlobalFeed(): void {
    this.loadingGlobal = true;
    this.api.get<{ logs: UserActivityLog[] }>('/admin/activity/recent?limit=50').subscribe({
      next: res => {
        this.globalLogs = res.logs;
        this.loadingGlobal = false;
      },
      error: () => { this.loadingGlobal = false; },
    });
  }

  inspectUser(u: AppUser): void {
    this.inspectingUser = u;
    this.activeTab = 'features';
    this.logFilter = 'all';
    this.loadUserSummary(u.id);
  }

  loadUserSummary(uid: number): void {
    this.loadingSummary = true;
    this.api.get<UserActivitySummary>(`/admin/users/${uid}/activity-summary`).subscribe({
      next: res => {
        this.summary = res;
        this.loadingSummary = false;
      },
      error: (e: HttpErrorResponse) => {
        this.loadingSummary = false;
        this.toast.error(e.error?.error ?? 'Failed to load user summary');
      },
    });
  }

  closeInspector(): void {
    this.inspectingUser = null;
    this.summary = null;
  }

  get filteredLogs(): UserActivityLog[] {
    if (!this.summary?.activity_logs) { return []; }
    if (this.logFilter === 'all') { return this.summary.activity_logs; }
    return this.summary.activity_logs.filter(l => l.category === this.logFilter);
  }

  setLogFilter(cat: string): void {
    this.logFilter = cat;
  }

  getCalPct(u: AppUser): number {
    const goal = u.goal_kcal || 2000;
    const avg = u.weekly_avg_kcal || 0;
    return goal > 0 ? Math.round((avg / goal) * 100) : 0;
  }

  changing(id: number): boolean { return this.busyIds.has(id); }

  fmtDate(iso?: string): string {
    if (!iso) { return '—'; }
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  fmtTime(iso?: string): string {
    if (!iso) { return ''; }
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  timeAgo(iso?: string | null): string {
    if (!iso) { return 'Never'; }
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) { return 'Just now'; }
    if (diff < 3600) { return `${Math.floor(diff / 60)}m ago`; }
    if (diff < 86400) { return `${Math.floor(diff / 3600)}h ago`; }
    if (diff < 172800) { return 'Yesterday'; }
    return `${Math.floor(diff / 86400)}d ago`;
  }

  getCatIcon(cat: string): string {
    switch (cat) {
      case 'planner': return 'calendar';
      case 'goals': return 'target';
      case 'recipes': return 'book';
      case 'foods': return 'list';
      case 'grocery': return 'cart';
      case 'parser': return 'zap';
      case 'auth': return 'user';
      default: return 'activity';
    }
  }

  getSlotIcon(slot: string): string {
    switch (slot) {
      case 'breakfast': return 'coffee';
      case 'lunch': return 'sun';
      case 'dinner': return 'moon';
      default: return 'apple';
    }
  }

  fmtStatus(status: string): string {
    switch (status) {
      case 'on_track': return 'On Track ✓';
      case 'under': return 'Under Goal';
      case 'over': return 'Over Goal';
      default: return status;
    }
  }

  getIngNames(recipe: any): string {
    if (!recipe.ingredients) { return ''; }
    return recipe.ingredients.map((i: any) => i.food_name || i.raw || 'item').slice(0, 4).join(', ') +
           (recipe.ingredients.length > 4 ? '…' : '');
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
