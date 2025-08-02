import { AfterContentInit, DestroyRef, Directive, ElementRef, input, OnDestroy, output } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime } from 'rxjs/operators';

@Directive({
  selector: '[autoScroll]',
  standalone: true,
})
export class AutoScrollDirective implements AfterContentInit, OnDestroy {
  public readonly lockYOffset = input(10);
  public readonly initialScroll = input(true);
  public readonly lockChanges = output<boolean>();

  private readonly nativeElement: HTMLElement;
  private _isLocked: boolean = false;
  private mutationObserver: MutationObserver;

  constructor(
    element: ElementRef,
    private readonly destroyRef: DestroyRef,
  ) {
    this.nativeElement = element.nativeElement;
    this.mutationObserver = new MutationObserver(() => {
      if (!this._isLocked) {
        this.scrollDown();
      }
    });
  }

  public async ngAfterContentInit() {
    fromEvent(this.nativeElement, 'scroll', { passive: true })
      .pipe(takeUntilDestroyed(this.destroyRef), auditTime(100))
      .subscribe(() => this.scrollHandler());

    this.mutationObserver.observe(this.nativeElement, { childList: true });
    if (this.initialScroll()) {
      this.scrollDown();
    }
  }

  public ngOnDestroy(): void {
    this.mutationObserver.disconnect();
  }

  public isLocked(): boolean {
    return this._isLocked;
  }

  public scrollDown(): void {
    const el = (this.nativeElement as HTMLDivElement);
    el.scrollTop = el.scrollHeight;
  }

  private scrollHandler(): void {
    const el = (this.nativeElement as HTMLDivElement);
    const scrollFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const oldLock = this._isLocked;
    this._isLocked = scrollFromBottom > this.lockYOffset();
    if (oldLock !== this._isLocked) {
      this.lockChanges.emit(this._isLocked);
    }
  }
}
