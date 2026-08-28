import { Directive, ElementRef, HostListener, Input } from '@angular/core';

/* Makes floating windows draggable by their header.
   Disabled on small screens where modals are bottom sheets. */
@Directive({ selector: '[appDrag]', standalone: true })
export class DragDirective {
  @Input() appDrag = '';   // optional selector; defaults to .modal

  private modal: HTMLElement | null = null;
  private dragging = false;
  private sx = 0;
  private sy = 0;
  private ox = 0;
  private oy = 0;

  constructor(private host: ElementRef<HTMLElement>) {}

  @HostListener('pointerdown', ['$event'])
  onDown(e: PointerEvent): void {
    if (window.innerWidth <= 760) { return; }              // bottom-sheet mode
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) { return; }
    this.modal = this.host.nativeElement.closest(this.appDrag || '.modal') as HTMLElement | null;
    if (!this.modal) { return; }

    const m = new DOMMatrixReadOnly(getComputedStyle(this.modal).transform);
    this.ox = m.m41 || 0;
    this.oy = m.m42 || 0;
    this.sx = e.clientX;
    this.sy = e.clientY;
    this.dragging = true;
    this.modal.classList.add('dragging');
    this.modal.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  @HostListener('document:pointermove', ['$event'])
  onMove(e: PointerEvent): void {
    if (!this.dragging || !this.modal) { return; }
    const dx = this.ox + e.clientX - this.sx;
    const dy = this.oy + e.clientY - this.sy;
    const maxX = window.innerWidth * 0.4;
    const maxY = window.innerHeight * 0.35;
    const x = Math.max(-maxX, Math.min(maxX, dx));
    const y = Math.max(-maxY, Math.min(maxY, dy));
    this.modal.style.transform = `translate(${x}px, ${y}px) rotate(0.4deg) scale(1.01)`;
  }

  @HostListener('document:pointerup', [])
  onUp(): void {
    if (!this.dragging || !this.modal) { return; }
    const m = new DOMMatrixReadOnly(getComputedStyle(this.modal).transform);
    this.modal.style.transform = `translate(${m.m41 || 0}px, ${m.m42 || 0}px)`;
    this.modal.classList.remove('dragging');
    this.dragging = false;
    this.modal = null;
  }
}
