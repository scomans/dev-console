import { Component, ElementRef, HostListener, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WebContents, WebviewTag } from 'electron';
import { ReplaySubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'cl-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
  host: {
    '[style.display]': `visibility ? 'block' : 'none'`,
  },
})
export class SearchBoxComponent implements OnInit, OnDestroy {

  subs = new SubSink();
  currentResultIndex = 0;
  resultCount = 0;
  caseSensitive = false;
  requestId;
  prevQuery;
  searchInputValue = new ReplaySubject<string>(1);
  visibility = false;
  contents: WebContents;

  @Input('webview') webview: WebviewTag;

  @ViewChild('searchInput', { static: true }) searchInput: ElementRef<HTMLInputElement>;

  constructor(
    private readonly electronService: ElectronService,
    private _ngZone: NgZone,
  ) {
  }

  ngOnInit(): void {
    this.subs.sink = this.searchInputValue
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
      )
      .subscribe(query => {
        if (query && query !== '') {
          this.startToFind(query);
        } else {
          this.stopFind(false);
        }
      });

    this.webview.addEventListener('dom-ready', () => {
      this.contents = this.electronService.webContents.fromId(this.webview.getWebContentsId());

      this.contents.addListener('found-in-page', this.onResult.bind(this));
      this.contents.on('before-input-event', (event, input) => {
        this._ngZone.run(() => {
          if (input.control && input.key === 'f') {
            this.show();
          } else if (input.key === 'Escape') {
            if (this.visibility) {
              this.stopFind();
            }
          } else if (input.key === 'F3') {
            if (this.visibility) {
              this.findNext(!input.shift);
            }
          } else if (input.control && input.shift && input.alt && input.key === 'O') {
            this.webview.openDevTools();
          }
        });
      });
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  @HostListener('document:keydown.control.f')
  show() {
    if (!this.visibility) {
      this.visibility = true;
      this.searchInput.nativeElement.value = '';
      this.currentResultIndex = 0;
      this.resultCount = 0;
    }
    this.focus();
  }

  @HostListener('document:keydown.f3')
  next() {
    if (this.visibility) {
      this.findNext(true);
    }
  }

  @HostListener('document:keydown.shift.f3')
  previous() {
    if (this.visibility) {
      this.findNext(false);
    }
  }

  focus() {
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 50);
  }

  onResult(err, result) {
    this._ngZone.run(() => {
      this.currentResultIndex = result.activeMatchOrdinal;
      this.resultCount = result.matches;
    });
  }

  startToFind(query?: string) {
    this.prevQuery = query ?? this.prevQuery;
    this.requestId = this.contents.findInPage(this.prevQuery, {
      matchCase: this.caseSensitive,
    });
    this.focus();
  }

  findNext(forward: boolean) {
    this.requestId = this.contents.findInPage(this.prevQuery, {
      forward,
      findNext: this.currentResultIndex !== this.resultCount && this.currentResultIndex !== 1,
      matchCase: this.caseSensitive,
    });
  }

  @HostListener('window:keydown.esc')
  stopFind(close: boolean = true) {
    this.contents.stopFindInPage('clearSelection');
    this.currentResultIndex = 0;
    this.resultCount = 0;
    if (close) {
      this.visibility = false;
    }
  }
}
