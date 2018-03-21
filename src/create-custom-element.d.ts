/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, Type } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { NgElementStrategy, NgElementStrategyFactory } from './element-strategy';
/**
 * Class constructor based on an Angular Component to be used for custom element registration.
 *
 * @experimental
 */
export interface NgElementConstructor<P> {
    readonly observedAttributes: string[];
    new (injector: Injector): NgElement & WithProperties<P>;
}
/**
 * Class that extends HTMLElement and implements the functionality needed for a custom element.
 *
 * @experimental
 */
export declare abstract class NgElement extends HTMLElement {
    protected ngElementStrategy: NgElementStrategy;
    protected ngElementEventsSubscription: Subscription | null;
    abstract attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string, namespace?: string): void;
    abstract connectedCallback(): void;
    abstract disconnectedCallback(): void;
}
/**
 * Additional type information that can be added to the NgElement class for properties added based
 * on the inputs and methods of the underlying component.
 *
 * @experimental
 */
export declare type WithProperties<P> = {
    [property in keyof P]: P[property];
};
/**
 * Initialization configuration for the NgElementConstructor which contains the injector to be used
 * for retrieving the component's factory as well as the default context for the component. May
 * provide a custom strategy factory to be used instead of the default.
 *
 * @experimental
 */
export interface NgElementConfig {
    injector: Injector;
    strategyFactory?: NgElementStrategyFactory;
}
/**
 * @whatItDoes Creates a custom element class based on an Angular Component. Takes a configuration
 * that provides initialization information to the created class. E.g. the configuration's injector
 * will be the initial injector set on the class which will be used for each created instance.
 *
 * @description Builds a class that encapsulates the functionality of the provided component and
 * uses the config's information to provide more context to the class. Takes the component factory's
 * inputs and outputs to convert them to the proper custom element API and add hooks to input
 * changes. Passes the config's injector to each created instance (may be overridden with the
 * static property to affect all newly created instances, or as a constructor argument for
 * one-off creations).
 *
 * @experimental
 */
export declare function createCustomElement<P>(component: Type<any>, config: NgElementConfig): NgElementConstructor<P>;
