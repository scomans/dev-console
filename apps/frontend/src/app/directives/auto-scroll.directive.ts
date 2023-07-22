import { AfterContentInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { delay, fromEvent, of, Subscription } from 'rxjs';

@Directive({
  selector: '[autoScroll]',
  standalone: true,
})
export class AutoScrollDirective implements AfterContentInit, OnDestroy {

  @Input('lock-y-offset') public lockYOffset: number = 10;

  @Output() lockChanges = new EventEmitter<boolean>();

  private readonly nativeElement: HTMLElement;
  private _isLocked: boolean = false;
  private mutationObserver: MutationObserver;
  private scrollSubscription: Subscription;

  constructor(element: ElementRef) {
    this.nativeElement = element.nativeElement;
  }

  public ngAfterContentInit(): void {
    this.mutationObserver = new MutationObserver(() => {
      if (!this._isLocked) {
        this.scrollDown();
      }
    });
    this.mutationObserver.observe(this.nativeElement.firstChild.firstChild, {
      attributes: true,
    });
    this.scrollSubscription = fromEvent(this.nativeElement.firstChild, 'scroll', { passive: true })
      .subscribe(() => this.scrollHandler());
    of(null).pipe(delay(0)).subscribe(() => this.scrollDown());
  }

  public ngOnDestroy(): void {
    this.mutationObserver.disconnect();
    this.scrollSubscription.unsubscribe();
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
    this._isLocked = scrollFromBottom > this.lockYOffset;
    if (oldLock !== this._isLocked) {
      this.lockChanges.emit(this._isLocked);
    }
  }

}
