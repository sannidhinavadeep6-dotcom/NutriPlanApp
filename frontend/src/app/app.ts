import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/toast.service';
import { MobileService } from './core/mobile.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    <div class="toasts">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.err]="t.err">{{ t.msg }}</div>
      }
    </div>
  `,
})
export class App {
  constructor(
    readonly toast: ToastService,
    private mobile: MobileService,
  ) {}
}

