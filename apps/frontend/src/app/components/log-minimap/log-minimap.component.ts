import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { SubSink } from 'subsink';


export interface Rect {
  w: number;
  h: number;
  x: number;
  y: number;
}

@Component({
  selector: 'dc-log-minimap',
  templateUrl: './log-minimap.component.html',
  styleUrl: './log-minimap.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogMinimapComponent implements OnInit, OnDestroy {

  subs = new SubSink();

  contentRect: Rect;
  viewportRect: Rect;
  drag_ry: number;
  ctx: CanvasRenderingContext2D;
  viewport: HTMLDivElement = undefined;
  cursor = 'pointer';
  height: number;
  drag = false;
  drawThrottle = new BehaviorSubject<void>(undefined);

  black = (pc) => `rgba(255,255,255,${pc / 100})`;
  settings = {
    styles: {
      '.log-entry > span.error': 'rgba(255, 0, 0, 0.4)',
      '.log-entry > span.info': 'rgba(32, 178, 170, 0.4)',
      '.log-entry > span': this.black(30),
    },
    back: this.black(2),
    view: this.black(5),
    drag: this.black(10),
  };

  @Input() width: number = 100;
  @Input() scale: number = 0.10;

  @ViewChild('map', { static: true }) canvas: ElementRef;
  @ViewChild('content', { static: true }) contentEl: ElementRef;

  ngOnInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.viewport = this.contentEl.nativeElement;
    this.init();

    this.subs.sink = this.drawThrottle
      .pipe(
        auditTime(10),
      )
      .subscribe(() => this.draw());
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  toRect(x, y, w, h): Rect {
    return { x, y, w, h };
  };

  rectRelTo(rect: Rect, pos = { x: 0, y: 0 }) {
    return this.toRect(rect.x - pos.x, rect.y - pos.y, rect.w, rect.h);
  };

  elGetOffset(el) {
    const br = el.getBoundingClientRect();
    return { x: br.left + window.pageXOffset, y: br.top + window.pageYOffset };
  };

  rectOfEl(el) {
    const { x, y } = this.elGetOffset(el);
    return this.toRect(x, y, el.offsetWidth, el.offsetHeight);
  };

  rectOfViewport(el) {
    const { x, y } = this.elGetOffset(el);
    return this.toRect(x + el.clientLeft, y + el.clientTop, el.clientWidth, el.clientHeight);
  };

  rectOfContent(el) {
    const { x, y } = this.elGetOffset(el);
    return this.toRect(x + el.clientLeft - el.scrollLeft, y + el.clientTop - el.scrollTop, el.scrollWidth, el.scrollHeight);
  };

  drawRect(rect: Rect, color: string) {
    if (color) {
      this.ctx.beginPath();
      this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
  }

  applyStyles(styles, offset) {
    Object.keys(styles).forEach(sel => {
      const col = styles[sel];
      Array
        .from(this.viewport.querySelectorAll(sel))
        .forEach(el => {
          this.drawRect(
            this.scaleRect(
              this.offsetRect(
                this.rectRelTo(
                  this.rectOfEl(el),
                  this.contentRect,
                ),
                0, offset,
              ),
              this.scale,
            ),
            col,
          );
        });
    });
  }

  scaleRect(rect: Rect, scale: number | Partial<Rect>) {
    return {
      x: rect.x * (typeof scale === 'number' ? scale : scale.x ?? 1),
      y: rect.y * (typeof scale === 'number' ? scale : scale.y ?? 1),
      w: rect.w * (typeof scale === 'number' ? scale : scale.w ?? 1),
      h: rect.h * (typeof scale === 'number' ? scale : scale.h ?? 1),
    };
  }

  offsetRect(rect: Rect, x: number, y: number) {
    return {
      h: rect.h,
      w: rect.w,
      x: rect.x + x,
      y: rect.y + y,
    };
  }

  draw() {
    this.contentRect = this.rectOfContent(this.viewport);
    this.viewportRect = this.rectOfViewport(this.viewport);
    this.height = this.viewportRect.h;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);

    let scrollOffset = this.viewport.scrollTop;
    let scrollPourcent = scrollOffset / (this.contentRect.h - this.viewportRect.h);
    const scrollbarSize = Math.min(this.viewportRect.h, this.contentRect.h) * this.scale;
    const trackSize = Math.min(this.viewportRect.h, this.contentRect.h * this.scale);

    const handleOffset = ~~((trackSize - scrollbarSize) * scrollPourcent);
    const backgroundOffset = this.contentRect.h * this.scale > this.viewportRect.h ?
      (this.viewportRect.h - (this.contentRect.h * this.scale)) * scrollPourcent : // TODO fix
      0;

    const dragRect: Rect = {
      w: this.viewportRect.w,
      h: Math.min(this.viewportRect.h, this.contentRect.h) * this.scale,
      x: 0,
      y: handleOffset,
    };

    this.applyStyles(this.settings.styles, backgroundOffset);
    this.drawRect(dragRect, this.settings.drag);
  };

  @HostListener('window:mousemove', ['$event'])
  onDrag(ev: MouseEvent) {
    if (this.drag) {
      ev.preventDefault();
      const viewportRect = this.rectOfViewport(this.canvas.nativeElement);
      const y = ((ev.pageY - viewportRect.y) / Math.min(this.viewportRect.h, this.contentRect.h * this.scale)) * this.contentRect.h;
      this.viewport.scrollTop = y - (this.viewportRect.h * this.drag_ry);
      this.requestDraw();
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onDragEnd(ev: MouseEvent) {
    if (this.drag) {
      this.drag = false;
      this.cursor = 'pointer';
      this.onDrag(ev);
    }
  }

  onDragStart(ev: MouseEvent) {
    this.drag = true;

    const cr = this.rectOfViewport(this.canvas.nativeElement);
    this.contentRect = this.rectOfContent(this.viewport);
    this.viewportRect = this.rectOfViewport(this.viewport);
    let scrollOffset = this.viewport.scrollTop;
    let scrollPourcent = scrollOffset / (this.contentRect.h - this.viewportRect.h);
    const scrollbarSize = Math.min(this.viewportRect.h, this.contentRect.h) * this.scale;
    const trackSize = Math.min(this.viewportRect.h, this.contentRect.h * this.scale);
    const handleOffset = ~~((trackSize - scrollbarSize) * scrollPourcent);

    this.drag_ry = ((ev.pageY - cr.y) - handleOffset) / (this.viewportRect.h * this.scale);
    if (this.drag_ry < 0 || this.drag_ry > 1) {
      this.drag_ry = 0.5;
    }

    this.cursor = 'crosshair';
    this.onDrag(ev);
  };

  requestDraw() {
    this.drawThrottle.next();
  }

  init() {
    setTimeout(() => {
      this.draw();
    }, 500);
  };
}
