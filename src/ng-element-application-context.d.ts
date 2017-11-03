/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, Injector, NgZone } from '@angular/core';
export declare class NgElementApplicationContext {
    injector: Injector;
    applicationRef: ApplicationRef;
    ngZone: NgZone;
    constructor(injector: Injector);
    runInNgZone<R>(cb: () => R): R;
}
