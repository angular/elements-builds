/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '@angular/core';
/**
 * Provide methods for scheduling the execution of a callback.
 */
export declare const scheduler: {
    schedule(cb: () => void, delay: number): () => void;
    scheduleBeforeRender(cb: () => void): () => void;
};
/**
 * Convert a camelCased string to kebab-cased.
 */
export declare function camelToKebabCase(input: string): string;
/**
 * Create a `CustomEvent` (even on browsers where `CustomEvent` is not a constructor).
 */
export declare function createCustomEvent(doc: Document, name: string, detail: any): CustomEvent;
/**
 * Return the name of the component or the first line of its stringified version.
 */
export declare function getComponentName(component: Type<any>): string;
/**
 * Check whether the input is an `Element`.
 */
export declare function isElement(node: Node): node is Element;
/**
 * Check whether the input is a function.
 */
export declare function isFunction(value: any): value is Function;
/**
 * Convert a kebab-cased string to camelCased.
 */
export declare function kebabToCamelCase(input: string): string;
/**
 * Check whether an `Element` matches a CSS selector.
 */
export declare function matchesSelector(element: Element, selector: string): boolean;
/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 */
export declare function strictEquals(value1: any, value2: any): boolean;
/**
 * Throw an error with the specified message.
 * (It provides a centralized place where it is easy to apply some change/behavior to all errors.)
 */
export declare function throwError(message: string): void;
