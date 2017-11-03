/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleRef, Type } from '@angular/core';
import { NgElementConstructor } from './ng-element-constructor';
/**
 * TODO(gkalpak): Add docs.
 * @experimental
 */
export declare class NgElements<T> {
    readonly moduleRef: NgModuleRef<T>;
    private doc;
    private definitions;
    private upgradedElements;
    private appContext;
    private changeDetectionScheduled;
    constructor(moduleRef: NgModuleRef<T>, customElementComponents: Type<any>[]);
    detachAll(root?: Element): void;
    detectChanges(): void;
    forEach(cb: (def: NgElementConstructor<any, any>, selector: string, map: Map<string, NgElementConstructor<any, any>>) => void): void;
    get<C, P>(selector: string): NgElementConstructor<C, P> | undefined;
    markDirty(): void;
    register(customElements?: CustomElementRegistry): void;
    upgradeAll(root?: Element): void;
    private defineNgElement(appContext, resolver, componentType);
    private traverseTree(root, cb);
}
