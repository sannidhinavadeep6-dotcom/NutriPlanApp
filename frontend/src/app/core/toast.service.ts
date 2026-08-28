import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; msg: string; err: boolean; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private next = 1;

  show(msg: string, err = false): void {
    const t: Toast = { id: this.next++, msg, err };
    this.toasts.set([...this.toasts(), t]);
    setTimeout(() => {
      this.toasts.set(this.toasts().filter(x => x.id !== t.id));
    }, 2600);
  }

  ok(msg: string): void { this.show(msg, false); }
  error(msg: string): void { this.show(msg, true); }
}
