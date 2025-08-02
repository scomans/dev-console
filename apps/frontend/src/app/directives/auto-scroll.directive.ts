import { AfterContentInit, DestroyRef, Directive, ElementRef, input, OnDestroy, output } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { waitForElement } from '../helpers/dom.helper';
import { auditTime } from 'rxjs/operators';

@Directive({
  selector: '[autoScroll]',
  standalone: true,
})
export class AutoScrollDirective implements AfterContentInit, OnDestroy {
  public readonly lockYOffset = input(10);
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
    const scollElement = await waitForElement('.rx-virtual-scroll-element');
    if (scollElement) {
      fromEvent(scollElement, 'scroll', { passive: true })
        .pipe(takeUntilDestroyed(this.destroyRef), auditTime(100))
        .subscribe(() => this.scrollHandler());
    } else {
      console.warn('scollElement not found');
    }

    const sentinelElement = await waitForElement('.rx-virtual-scroll__sentinel');
    if (sentinelElement) {
      this.mutationObserver.observe(sentinelElement, { attributes: true });
    } else {
      console.warn('sentinelElement not found');
    }
  }

  public ngOnDestroy(): void {
    this.mutationObserver.disconnect();
  }

  public isLocked(): boolean {
    return this._isLocked;
  }

  public scrollDown(): void {
    const el = (this.nativeElement.firstChild as HTMLDivElement);
    el.scrollTop = el.scrollHeight;
  }

  private scrollHandler(): void {
    const el = (this.nativeElement.firstChild as HTMLDivElement);
    const scrollFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const oldLock = this._isLocked;
    this._isLocked = scrollFromBottom > this.lockYOffset();
    if (oldLock !== this._isLocked) {
      this.lockChanges.emit(this._isLocked);
    }
  }

}
