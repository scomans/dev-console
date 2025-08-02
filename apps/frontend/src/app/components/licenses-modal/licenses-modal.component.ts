import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { catchError, Observable, of, startWith } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';


const additionalLicenses = '' +
  'Meslo Nerd Font License\n' +
  'Copyright 2009, 2010, 2013 André Berg\n' +
  '\n' +
  'Licensed under the Apache License, Version 2.0 (the "License");\n' +
  'you may not use this file except in compliance with the License.\n' +
  'You may obtain a copy of the License at\n' +
  '\n' +
  'http://www.apache.org/licenses/LICENSE-2.0\n' +
  '\n' +
  'Unless required by applicable law or agreed to in writing, software\n' +
  'distributed under the License is distributed on an "AS IS" BASIS,\n' +
  'WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n' +
  'See the License for the specific language governing permissions and\n' +
  'limitations under the License.\n\n';

@Component({
  selector: 'dc-licenses-modal',
  templateUrl: './licenses-modal.component.html',
  styleUrl: './licenses-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    NzButtonModule,
    NzModalModule,
  ],
})
export class LicensesModalComponent {

  protected readonly isVisible = signal(false);
  licenses$: Observable<string>;

  constructor(
    private readonly http: HttpClient,
  ) {
    this.licenses$ = this.http
      .get('3rdpartylicenses.txt', { responseType: 'text' })
      .pipe(
        catchError(() => of('')),
        map((text) => additionalLicenses + text),
        startWith(additionalLicenses),
        map((text) => text.replace(/\n/g, '<br>')),
      );
  }

  close(): void {
    this.isVisible.set(false);
  }

  show() {
    this.isVisible.set(true);
  }
}
