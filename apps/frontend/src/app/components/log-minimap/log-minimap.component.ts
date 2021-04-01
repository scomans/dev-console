import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { WINDOW } from '../app.const';

@Component({
  selector: 'cl-log-minimap',
  templateUrl: './log-minimap.component.html',
  styleUrls: ['./log-minimap.component.scss'],
})
export class LogMinimapComponent implements OnInit, OnDestroy {

  subs = new SubSink();

  drag = false;

  root_rect;
  view_rect;
  scale;
  drag_rx;
  drag_ry;

  document: Document;
  ctx;

  viewport = undefined;

  black = (pc) => `rgba(255,255,255,${pc / 100})`;
  settings = {
    viewport: null,
    styles: {
      'header,footer,section,article': this.black(8),
      'h1,a,p,pre': this.black(30),
      'h2,h3,h4': this.black(8),
    },
    back: this.black(2),
    view: this.black(5),
    drag: this.black(10),
    interval: null,
  };

  drawThrottle = new BehaviorSubject<void>(undefined);

  @ViewChild('map', { static: true }) canvas: ElementRef;
  @ViewChild('content', { static: true }) contentEl: ElementRef;

  constructor(
    @Inject(WINDOW) private readonly window: Window,
  ) {
    this.document = window.document;
  }

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

  toRect(x, y, w, h) {
    return { x, y, w, h };
  };

  rectRelTo(rect, pos = { x: 0, y: 0 }) {
    return this.toRect(rect.x - pos.x, rect.y - pos.y, rect.w, rect.h);
  };

  elGetOffset(el) {
    const br = el.getBoundingClientRect();
    return { x: br.left + this.window.pageXOffset, y: br.top + this.window.pageYOffset };
  };

  rectOfEl(el) {
    const { x, y } = this.elGetOffset(el);
    return this.toRect(x, y, el.offsetWidth, el.offsetHeight);
  };

  rectOfViewport = (el) => {
    const { x, y } = this.elGetOffset(el);
    return this.toRect(x + el.clientLeft, y + el.clientTop, el.clientWidth, el.clientHeight);
  };

  rectOfContent = (el) => {
    const { x, y } = this.elGetOffset(el);
    return this.toRect(x + el.clientLeft - el.scrollLeft, y + el.clientTop - el.scrollTop, el.scrollWidth, el.scrollHeight);
  };

  calcScale() {
    const width = 100; // this.canvas.nativeElement.clientWidth;
    const height = this.canvas.nativeElement.clientHeight;
    return (w, h) => Math.min(width / w, height / h);
  };

  resizeCanvas(w, h) {
    this.canvas.nativeElement.width = w;
    this.canvas.nativeElement.height = h;
    this.canvas.nativeElement.style.width = `${w}px`;
    this.canvas.nativeElement.style.height = `${h}px`;
  }

  drawRect(rect, col) {
    if (col) {
      this.ctx.beginPath();
      this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
      this.ctx.fillStyle = col;
      this.ctx.fill();
    }
  }

  applyStyles(styles) {
    Object.keys(styles).forEach(sel => {
      const col = styles[sel];
      Array
        .from((this.viewport || this.document).querySelectorAll(sel))
        .forEach(el => {
          this.drawRect(this.rectRelTo(this.rectOfEl(el), this.root_rect), col);
        });
    });
  }

  draw() {
    this.root_rect = this.rectOfContent(this.viewport);
    this.view_rect = this.rectOfViewport(this.viewport);
    this.scale = this.calcScale()(this.root_rect.w, this.root_rect.h);

    this.resizeCanvas(this.root_rect.w * this.scale, this.root_rect.h * this.scale);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.ctx.scale(this.scale, this.scale);

    this.drawRect(this.rectRelTo(this.root_rect, this.root_rect), this.settings.back);
    this.applyStyles(this.settings.styles);
    this.drawRect(this.rectRelTo(this.view_rect, this.root_rect), this.drag ? this.settings.drag : this.settings.view);
  };

  onDrag(ev) {
    if (this.drag) {
      ev.preventDefault();
      const cr = this.rectOfViewport(this.canvas.nativeElement);
      const x = (ev.pageX - cr.x) / this.scale - this.view_rect.w * this.drag_rx;
      const y = (ev.pageY - cr.y) / this.scale - this.view_rect.h * this.drag_ry;

      if (this.viewport) {
        this.viewport.scrollLeft = x;
        this.viewport.scrollTop = y;
      } else {
        this.window.scrollTo(x, y);
      }
      this.requestDraw();
    }
  }

  onDragEnd(ev) {
    if (this.drag) {
      this.drag = false;
      this.canvas.nativeElement.style.cursor = 'pointer';
      this.onDrag(ev);
    }
  }

  onDragStart(ev) {
    this.drag = true;

    const cr = this.rectOfViewport(this.canvas.nativeElement);
    const vr = this.rectRelTo(this.view_rect, this.root_rect);
    this.drag_rx = ((ev.pageX - cr.x) / this.scale - vr.x) / vr.w;
    this.drag_ry = ((ev.pageY - cr.y) / this.scale - vr.y) / vr.h;
    if (this.drag_rx < 0 || this.drag_rx > 1 || this.drag_ry < 0 || this.drag_ry > 1) {
      this.drag_rx = 0.5;
      this.drag_ry = 0.5;
    }

    this.canvas.nativeElement.style.cursor = 'crosshair';
    this.onDrag(ev);
  };

  requestDraw() {
    this.drawThrottle.next();
  }

  init() {
    this.canvas.nativeElement.style.cursor = 'pointer';
    if (this.settings.interval > 0) {
      setInterval(() => this.draw(), this.settings.interval);
    }
    setTimeout(() => {
      this.draw();
    }, 500);
  };
}
