/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleFactory, NgModuleRef, PlatformRef, Type } from '@angular/core';
/**
 * TODO(gkalpak): Add docs.
 * @experimental
 */
export declare function registerAsCustomElements<T>(customElementComponents: Type<any>[], platformRef: PlatformRef, moduleFactory: NgModuleFactory<T>): Promise<NgModuleRef<T>>;
export declare function registerAsCustomElements<T>(customElementComponents: Type<any>[], bootstrapFn: () => Promise<NgModuleRef<T>>): Promise<NgModuleRef<T>>;
