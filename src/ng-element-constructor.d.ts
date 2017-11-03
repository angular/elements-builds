/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentFactory, EventEmitter } from '@angular/core';
import { NgElementWithProps } from './ng-element';
import { NgElementApplicationContext } from './ng-element-application-context';
/**
 * TODO(gkalpak): Add docs.
 * @experimental
 */
export interface NgElementConstructor<T, P> {
    readonly is: string;
    readonly observedAttributes: string[];
    upgrade(host: HTMLElement): NgElementWithProps<T, P>;
    new (): NgElementWithProps<T, P>;
}
export interface NgElementConstructorInternal<T, P> extends NgElementConstructor<T, P> {
    readonly onConnected: EventEmitter<NgElementWithProps<T, P>>;
    readonly onDisconnected: EventEmitter<NgElementWithProps<T, P>>;
    upgrade(host: HTMLElement, ignoreUpgraded?: boolean): NgElementWithProps<T, P>;
}
export declare function createNgElementConstructor<T, P>(appContext: NgElementApplicationContext, componentFactory: ComponentFactory<T>): NgElementConstructorInternal<T, P>;
