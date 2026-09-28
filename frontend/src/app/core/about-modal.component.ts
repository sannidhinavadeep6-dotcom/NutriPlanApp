import { Component, EventEmitter, Output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-about-modal',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="about-backdrop" (click)="close.emit()">
      <div class="about-card" (click)="$event.stopPropagation()">
        <!-- Header / Banner -->
        <div class="about-header">
          <div class="about-brand-row">
            <div class="about-logo">
              <app-icon name="logo" [size]="28"/>
            </div>
            <div>
              <h2 class="about-title">About NutriPlan</h2>
              <span class="about-tagline">Intelligent Recipe Planner &amp; Precision Calorie Analyzer</span>
            </div>
          </div>
          <button type="button" class="about-close-btn" (click)="close.emit()" aria-label="Close modal">
            <app-icon name="x" [size]="18"/>
          </button>
        </div>

        <div class="about-body">
          <!-- App Mission & Highlights -->
          <section class="about-section">
            <h3 class="section-title">
              <app-icon name="sparkles" [size]="18"/> What is NutriPlan?
            </h3>
            <p class="section-text">
              <strong>NutriPlan</strong> is a modern, full-stack nutrition intelligence and meal management system designed to make healthy eating, calorie balancing, and grocery shopping effortless and precise.
            </p>
            <div class="feature-pills">
              <div class="pill">
                <app-icon name="book" [size]="14"/>
                <span><strong>100+ Recipes:</strong> South Indian &amp; North classics with detailed macro breakdown</span>
              </div>
              <div class="pill">
                <app-icon name="zap" [size]="14"/>
                <span><strong>Smart NLP Parser:</strong> Heuristic ingredient extraction &amp; USDA nutrition matching</span>
              </div>
              <div class="pill">
                <app-icon name="calendar" [size]="14"/>
                <span><strong>7-Day Meal Scheduler:</strong> Calorie-targeted meal slot planning &amp; portion scaling</span>
              </div>
              <div class="pill">
                <app-icon name="cart" [size]="14"/>
                <span><strong>Aisle-Grouped Grocery:</strong> Automated shopping lists scaled to planned servings</span>
              </div>
              <div class="pill">
                <app-icon name="target" [size]="14"/>
                <span><strong>TDEE &amp; Macro Goals:</strong> Mifflin-St Jeor metabolic target calculations</span>
              </div>
            </div>
          </section>

          <!-- Developer / Creator Profile -->
          <section class="about-section dev-card">
            <div class="dev-header">
              <div class="dev-avatar">
                <app-icon name="user" [size]="24"/>
              </div>
              <div>
                <span class="dev-badge">Lead Creator &amp; Architect</span>
                <h3 class="dev-name">S. Navadeep (Sannidhi Navadeep)</h3>
                <span class="dev-role">Full-Stack Software Engineer</span>
              </div>
            </div>
            <p class="section-text" style="margin-top: 10px;">
              Designed and engineered <strong>NutriPlan</strong> to bridge the gap between computational nutrition science and everyday culinary planning. Passionate about building high-performance, aesthetically pleasing, and user-centric web &amp; mobile solutions.
            </p>
            <div class="dev-links">
              <a href="https://github.com/sannidhinavadeep6-dotcom" target="_blank" rel="noopener noreferrer" class="dev-btn">
                <app-icon name="github" [size]="15"/>
                <span>GitHub &#64;sannidhinavadeep6-dotcom</span>
                <app-icon name="external-link" [size]="12"/>
              </a>
              <a href="mailto:sannidhinavadeep6@gmail.com" class="dev-btn">
                <app-icon name="mail" [size]="15"/>
                <span>sannidhinavadeep6&#64;gmail.com</span>
              </a>
            </div>
          </section>

          <!-- Technology Stack -->
          <section class="about-section">
            <h3 class="section-title">
              <app-icon name="code" [size]="18"/> Technology Stack
            </h3>
            <div class="tech-grid">
              <div class="tech-item">
                <b>Frontend</b>
                <span>Angular 20 · Standalone Components · Signals · CSS3 Design Tokens · Capacitor</span>
              </div>
              <div class="tech-item">
                <b>Backend</b>
                <span>Python 3.11 · Flask RESTful API · Waitress Multi-Threaded WSGI</span>
              </div>
              <div class="tech-item">
                <b>Database</b>
                <span>SQLite · SQLAlchemy ORM · Indexed Relational Schema · USDA Datasets</span>
              </div>
              <div class="tech-item">
                <b>Security</b>
                <span>JWT Authentication (HS256) · RBAC Admin Approvals · Hash-protected Credentials</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <div class="about-footer">
          <span class="about-foot-note">
            <app-icon name="heart" [size]="14" style="color: #e05252; display: inline-block; vertical-align: middle;"/> Crafted by S. Navadeep · NutriPlan v2.0
          </span>
          <button type="button" class="about-primary-btn" (click)="close.emit()">
            Close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .about-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(14, 28, 18, 0.62);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeIn 0.25s ease-out both;
    }

    .about-card {
      background: #ffffff;
      width: 100%;
      max-width: 620px;
      max-height: 90vh;
      border-radius: 20px;
      box-shadow: 0 24px 60px -15px rgba(10, 40, 20, 0.35);
      border: 1px solid rgba(20, 160, 90, 0.16);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: popIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    .about-header {
      padding: 18px 22px;
      background: linear-gradient(135deg, #f3faf5, #e8f7ee);
      border-bottom: 1px solid #e0ede4;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .about-brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .about-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #ffffff;
      border: 1.5px solid rgba(20, 160, 90, 0.2);
      display: grid;
      place-items: center;
      box-shadow: 0 2px 8px rgba(20, 160, 90, 0.12);
    }

    .about-title {
      margin: 0;
      font-size: 19px;
      font-weight: 800;
      color: #16241c;
      letter-spacing: -0.3px;
    }

    .about-tagline {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #0c7a43;
      margin-top: 1px;
    }

    .about-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: #4a5568;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .about-close-btn:hover {
      background: rgba(224, 82, 82, 0.12);
      color: #e05252;
      transform: scale(1.08);
    }

    .about-body {
      padding: 20px 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .about-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .section-title {
      margin: 0;
      font-size: 15px;
      font-weight: 750;
      color: #1a3324;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .section-text {
      margin: 0;
      font-size: 13.5px;
      line-height: 1.55;
      color: #4a5d4e;
    }

    .feature-pills {
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-top: 6px;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 9px;
      background: #f4f9f3;
      border: 1px solid #e2eee1;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 12.5px;
      color: #27402f;
    }

    .pill app-icon {
      color: #14a05a;
      flex-shrink: 0;
    }

    .dev-card {
      background: linear-gradient(135deg, #fbfdfb, #f0f7f2);
      border: 1.5px solid #d8e9dc;
      padding: 16px;
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(20, 160, 90, 0.05);
    }

    .dev-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dev-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, #14a05a, #34d67d);
      color: #ffffff;
      display: grid;
      place-items: center;
      box-shadow: 0 4px 10px rgba(20, 160, 90, 0.25);
    }

    .dev-badge {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #0c7a43;
      background: #dcf2e4;
      padding: 2px 8px;
      border-radius: 999px;
      margin-bottom: 2px;
    }

    .dev-name {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #122117;
    }

    .dev-role {
      font-size: 12px;
      color: #64735f;
      font-weight: 600;
    }

    .dev-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .dev-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid #cfe0d3;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 650;
      color: #16241c;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .dev-btn:hover {
      background: #14a05a;
      color: #ffffff;
      border-color: #14a05a;
      transform: translateY(-1px);
    }

    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 8px;
      margin-top: 6px;
    }

    .tech-item {
      background: #f8faf7;
      border: 1px solid #e7efe5;
      padding: 9px 12px;
      border-radius: 10px;
      font-size: 12px;
    }

    .tech-item b {
      display: block;
      color: #16241c;
      font-size: 12.5px;
      margin-bottom: 2px;
    }

    .tech-item span {
      color: #607262;
    }

    .about-footer {
      padding: 14px 22px;
      background: #fafcfa;
      border-top: 1px solid #e8eee6;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .about-foot-note {
      font-size: 12px;
      color: #64735f;
      font-weight: 600;
    }

    .about-primary-btn {
      padding: 8px 18px;
      background: #14a05a;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .about-primary-btn:hover {
      background: #0c7a43;
      transform: translateY(-1px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popIn {
      from { opacity: 0; transform: translateY(18px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class AboutModalComponent {
  @Output() close = new EventEmitter<void>();
}
