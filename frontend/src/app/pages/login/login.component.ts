import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../core/icon.component';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Api } from '../../core/api.service';
import { MobileService } from '../../core/mobile.service';
import { HttpErrorResponse } from '@angular/common/http';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-login',
  imports: [FormsModule, IconComponent],
  template: `
<div class="login-page-wrap">
  <div class="blob b1"></div>
  <div class="blob b2"></div>
  
  <div class="login-split-card">
    <!-- Left Hero Column: Interactive Food Image Carousel (10 South Indian Dishes) -->
    <div class="login-hero-pane" (mouseenter)="pauseSlider()" (mouseleave)="resumeSlider()">
      <!-- Background Slides with smooth hardware-accelerated crossfade -->
      @for (slide of slides; track slide.image; let i = $index) {
        <div 
          class="hero-slide-bg" 
          [class.active]="i === currentSlide"
          [style.background-image]="'url(' + slide.image + ')'"
          role="img"
          [attr.aria-label]="slide.title">
        </div>
      }
      
      <!-- Gradient overlay for readability -->
      <div class="hero-overlay"></div>

      <!-- Top-left Brand Badge -->
      <div class="hero-brand-badge">
        <div class="badge-logo"><app-icon name="logo" [size]="22"/></div>
        <span class="badge-name">NutriPlan</span>
      </div>

      <!-- Bottom Hero Content -->
      <div class="hero-content">
        <div class="hero-text-box">
          <h2 class="hero-title">{{ slides[currentSlide].title }}</h2>
          <p class="hero-subtitle">{{ slides[currentSlide].subtitle }}</p>
        </div>

        <!-- Carousel Pagination Dots (10 Items) -->
        <div class="carousel-dots" role="tablist" aria-label="Slideshow navigation">
          @for (s of slides; track s.image; let i = $index) {
            <button 
              type="button"
              class="dot" 
              [class.active]="i === currentSlide"
              (click)="goToSlide(i)"
              [attr.aria-label]="'Go to slide ' + (i + 1) + ': ' + s.title"
              [attr.aria-selected]="i === currentSlide">
            </button>
          }
        </div>
      </div>

      <!-- GPU Hardware-Accelerated Progress Bar -->
      <div class="hero-progress-track">
        <div 
          class="hero-progress-bar"
          [class.paused]="isPaused"
          [class.animating]="animatingProgress"
          [style.animationDuration.ms]="slideDurationMs">
        </div>
      </div>
    </div>

    <!-- Right Column: Authentication Form -->
    <div class="login-form-pane">
      <div class="login-brand-header">
        <div class="logo-box">
          <app-icon name="logo" [size]="34"/>
        </div>
        <div class="brand-text">
          <b class="brand-title">NutriPlan</b>
          <span class="brand-subtitle">RECIPE PLANNER &amp; CALORIE ANALYZER</span>
        </div>
      </div>

      <div class="seg-switcher">
        <button 
          type="button" 
          class="seg-btn"
          [class.on]="mode === 'login'" 
          (click)="setMode('login')">
          <app-icon name="lock" [size]="14"/> Sign in
        </button>
        <button 
          type="button" 
          class="seg-btn"
          [class.on]="mode === 'register'" 
          (click)="setMode('register')">
          <app-icon name="user-plus" [size]="14"/> Request access
        </button>
      </div>

      @if (error) {
        <div class="form-err"><app-icon name="alert" [size]="17"/> {{ error }}</div>
      }
      @if (okMsg) {
        <div class="form-ok"><app-icon name="check-circle" [size]="17"/> {{ okMsg }}</div>
      }

      @if (mode === 'login') {
        <form (ngSubmit)="doLogin()" class="auth-form">
          <label class="form-field">
            <span class="field-label">Email</span>
            <div class="field-input-wrap">
              <app-icon name="mail" [size]="17"/>
              <input 
                type="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                placeholder="you@example.com" 
                autocomplete="email">
            </div>
          </label>

          <label class="form-field">
            <span class="field-label">Password</span>
            <div class="field-input-wrap">
              <app-icon name="lock" [size]="17"/>
              <input 
                type="password" 
                name="password" 
                [(ngModel)]="password" 
                required 
                placeholder="Your password" 
                autocomplete="current-password">
            </div>
          </label>

          <button class="btn-submit" type="submit" [disabled]="busy">
            @if (busy) { 
              <span class="spin"><app-icon name="refresh" [size]="17"/></span> Signing in… 
            } @else { 
              <span>Sign in</span>
              <app-icon name="arrow-right" [size]="18"/> 
            }
          </button>
        </form>

        <!-- Quick Demo Account Fill -->
        <div class="demo-accounts-card">
          <div class="demo-header">Quick Test Credentials</div>
          <div class="demo-row">
            <span class="demo-label">Admin:</span>
            <button type="button" class="demo-pill-btn" (click)="fillDemo('admin')">
              <code>admin&#64;nutriplan.app</code>
            </button>
          </div>
          <div class="demo-row">
            <span class="demo-label">Demo:</span>
            <button type="button" class="demo-pill-btn" (click)="fillDemo('demo')">
              <code>demo&#64;nutriplan.app</code>
            </button>
          </div>
        </div>
      } @else {
        <form (ngSubmit)="doRegister()" class="auth-form">
          <label class="form-field">
            <span class="field-label">Full name</span>
            <div class="field-input-wrap">
              <app-icon name="user" [size]="17"/>
              <input 
                type="text" 
                name="name" 
                [(ngModel)]="regName" 
                required 
                placeholder="Ravi Kumar" 
                autocomplete="name">
            </div>
          </label>

          <label class="form-field">
            <span class="field-label">Email</span>
            <div class="field-input-wrap">
              <app-icon name="mail" [size]="17"/>
              <input 
                type="email" 
                name="remail" 
                [(ngModel)]="regEmail" 
                required 
                placeholder="you@example.com" 
                autocomplete="email">
            </div>
          </label>

          <label class="form-field">
            <span class="field-label">Password (min 6 characters)</span>
            <div class="field-input-wrap">
              <app-icon name="key" [size]="17"/>
              <input 
                type="password" 
                name="rpassword" 
                [(ngModel)]="regPassword" 
                required 
                placeholder="Create a password" 
                autocomplete="new-password">
            </div>
          </label>

          <button class="btn-submit" type="submit" [disabled]="busy">
            @if (busy) { 
              <span class="spin"><app-icon name="refresh" [size]="17"/></span> Sending… 
            } @else { 
              <app-icon name="mail" [size]="17"/> 
              <span>Send request to admin</span>
            }
          </button>
        </form>
      }

      <!-- Mobile Server Connection Indicator / Switcher -->
      <div style="margin-top: 14px; text-align: center;">
        <button type="button" class="icon-btn" style="font-size: 11.5px; font-weight: 600; color: var(--muted); gap: 5px; align-items: center; border-radius: 999px; padding: 4px 10px; background: #f0f4ee;" (click)="showServerModal = true">
          <app-icon name="server" [size]="13"/>
          <span>Server: {{ api.serverUrl() || 'Relative (/api)' }}</span>
          <app-icon name="settings" [size]="12"/>
        </button>
      </div>
    </div>
  </div>

  <!-- Server Connection Settings Modal -->
  @if (showServerModal) {
    <div class="overlay" (click)="showServerModal = false">
      <div class="modal" (click)="$event.stopPropagation()" style="max-width: 440px;">
        <div class="m-head">
          <h3>
            <span class="m-ic"><app-icon name="server" [size]="20"/></span>
            Backend Connection
          </h3>
          <button type="button" class="icon-btn" (click)="showServerModal = false">
            <app-icon name="x" [size]="18"/>
          </button>
        </div>
        <p class="m-muted">Configure the Flask REST API endpoint for mobile devices or local network testing.</p>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px;">
          <div class="fld">
            <span class="fld-ic"><app-icon name="globe" [size]="14"/> Server URL</span>
            <input type="text" [(ngModel)]="tempServerUrl" placeholder="http://192.168.1.50:8000" />
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn small ghost" (click)="tempServerUrl = 'http://10.0.2.2:8000'">
              Android Emulator
            </button>
            <button type="button" class="btn small ghost" (click)="tempServerUrl = 'http://localhost:8000'">
              iOS / Localhost
            </button>
            <button type="button" class="btn small ghost" (click)="tempServerUrl = ''">
              Relative Web
            </button>
          </div>

          @if (testStatus) {
            <div [class]="testStatus.ok ? 'form-ok' : 'form-err'" style="margin: 0;">
              <app-icon [name]="testStatus.ok ? 'check-circle' : 'alert'" [size]="16"/>
              {{ testStatus.msg }}
            </div>
          }

          <div class="m-actions">
            <button type="button" class="btn ghost" (click)="testConnection()" [disabled]="testingServer">
              @if (testingServer) { <span class="spin"><app-icon name="refresh" [size]="15"/></span> }
              Test Ping
            </button>
            <button type="button" class="btn primary" (click)="saveServerUrl()">
              Save &amp; Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  }
</div>
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  regName = '';
  regEmail = '';
  regPassword = '';
  error = '';
  okMsg = '';
  busy = false;

  showServerModal = false;
  tempServerUrl = '';
  testingServer = false;
  testStatus: { ok: boolean; msg: string } | null = null;

  // 10 Distinct Ultra-HD South Indian Dishes
  readonly slides: Slide[] = [
    {
      image: 'assets/slides/medu_vada.jpg',
      title: 'Medu Vada',
      subtitle: 'Crispy golden lentil fritters with fresh coconut chutney',
    },
    {
      image: 'assets/slides/masala_dosa.jpg',
      title: 'Masala Dosa',
      subtitle: 'Golden crispy crêpe filled with spiced potato masala & sambar',
    },
    {
      image: 'assets/slides/classic_idli.jpg',
      title: 'Classic Steamed Idli',
      subtitle: 'Soft, fluffy fermented rice cakes with piping hot sambar',
    },
    {
      image: 'assets/slides/hyderabadi_biryani.jpg',
      title: 'Hyderabadi Dum Biryani',
      subtitle: 'Fragrant basmati rice layered with aromatic spices & herbs',
    },
    {
      image: 'assets/slides/ven_pongal.jpg',
      title: 'Ven Pongal',
      subtitle: 'Ghee-roasted cumin & black pepper dal rice with crunchy cashews',
    },
    {
      image: 'assets/slides/onion_uttapam.jpg',
      title: 'Onion Tomato Uttapam',
      subtitle: 'Thick fermented savory pancake topped with crisp onions & herbs',
    },
    {
      image: 'assets/slides/pesarattu.jpg',
      title: 'Andhra Pesarattu',
      subtitle: 'Nutritious green moong dosa with traditional ginger allam pachadi',
    },
    {
      image: 'assets/slides/kerala_appam.jpg',
      title: 'Kerala Appam',
      subtitle: 'Lacy soft-centered fermented hoppers with fragrant coconut stew',
    },
    {
      image: 'assets/slides/curd_rice.jpg',
      title: 'Curd Rice (Daddojanam)',
      subtitle: 'Soothing tempered yogurt rice with mustard seeds & curry leaves',
    },
    {
      image: 'assets/slides/mysore_pak.jpg',
      title: 'Royal Mysore Pak',
      subtitle: 'Melt-in-the-mouth golden ghee & besan traditional sweet delicacy',
    },
  ];

  currentSlide = 0;
  isPaused = false;
  animatingProgress = true;
  readonly slideDurationMs = 4500;
  private slideTimer: any = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    public api: Api,
    public mobile: MobileService,
  ) {}

  ngOnInit(): void {
    this.tempServerUrl = this.api.serverUrl();
    this.startSlider();
  }

  ngOnDestroy(): void {
    this.stopSlider();
  }

  fillDemo(type: 'admin' | 'demo'): void {
    if (type === 'admin') {
      this.email = 'admin@nutriplan.app';
      this.password = 'Admin@123';
    } else {
      this.email = 'demo@nutriplan.app';
      this.password = 'Demo@123';
    }
  }

  testConnection(): void {
    this.testingServer = true;
    this.testStatus = null;
    const testUrl = (this.tempServerUrl || '').trim().replace(/\/+$/, '') + '/api/foods?q=apple';
    fetch(testUrl, { method: 'GET' })
      .then(r => {
        this.testingServer = false;
        if (r.ok || r.status === 401) {
          this.testStatus = { ok: true, msg: 'Backend reachable and responsive!' };
        } else {
          this.testStatus = { ok: false, msg: `Server returned status ${r.status}` };
        }
      })
      .catch(err => {
        this.testingServer = false;
        this.testStatus = { ok: false, msg: 'Connection failed. Check IP & port.' };
      });
  }

  saveServerUrl(): void {
    this.api.setServerUrl(this.tempServerUrl);
    this.showServerModal = false;
    this.testStatus = null;
  }

  startSlider(): void {
    this.stopSlider();
    this.isPaused = false;
    this.restartProgressBar();
    this.slideTimer = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      this.restartProgressBar();
    }, this.slideDurationMs);
  }

  stopSlider(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }

  pauseSlider(): void {
    this.isPaused = true;
    this.stopSlider();
  }

  resumeSlider(): void {
    this.isPaused = false;
    this.startSlider();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.startSlider();
  }

  private restartProgressBar(): void {
    this.animatingProgress = false;
    setTimeout(() => {
      this.animatingProgress = true;
    }, 20);
  }

  setMode(m: 'login' | 'register'): void {
    this.mode = m;
    this.error = '';
    this.okMsg = '';
  }

  doLogin(): void {
    this.error = '';
    this.okMsg = '';
    this.busy = true;
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: res => {
        const dest = res.user.role === 'admin' ? ['/admin'] : ['/today'];
        this.router.navigate(dest);
      },
      error: (e: HttpErrorResponse) => {
        this.busy = false;
        this.error = e.error?.error ?? 'Login failed — please try again.';
      },
    });
  }

  doRegister(): void {
    this.error = '';
    this.okMsg = '';
    this.busy = true;
    this.auth.register(this.regName.trim(), this.regEmail.trim(), this.regPassword).subscribe({
      next: res => {
        this.busy = false;
        this.okMsg = '✓ ' + res.message;
        this.regName = this.regEmail = this.regPassword = '';
      },
      error: (e: HttpErrorResponse) => {
        this.busy = false;
        this.error = e.error?.error ?? 'Registration failed — please try again.';
      },
    });
  }
}
