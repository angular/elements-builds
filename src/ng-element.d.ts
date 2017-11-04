/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentFactory, ComponentRef, EventEmitter } from '@angular/core';
import { NgElementApplicationContext } from './ng-element-application-context';
/**
 * TODO(gkalpak): Add docs.
 * @experimental
 */
export declare type NgElementWithProps<T, P> = NgElement<T> & {
    [property in keyof P]: P[property];
};
/**
 * TODO(gkalpak): Add docs.
 * @experimental
 */
export interface NgElement<T> extends HTMLElement {
    ngElement: NgElement<T> | null;
    componentRef: ComponentRef<T> | null;
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string, namespace?: string): void;
    connectedCallback(): void;
    detach(): void;
    detectChanges(): void;
    disconnectedCallback(): void;
    getHost(): HTMLElement;
    markDirty(): void;
}
/**
 * Represents an `NgElement` input.
 * Similar to a `ComponentFactory` input (`{propName: string, templateName: string}`),
 * except that `attrName` is derived by kebab-casing `templateName`.
 */
export interface NgElementInput {
    propName: string;
    attrName: string;
}
/**
 * Represents an `NgElement` input.
 * Similar to a `ComponentFactory` output (`{propName: string, templateName: string}`),
 * except that `templateName` is renamed to `eventName`.
 */
export interface NgElementOutput {
    propName: string;
    eventName: string;
}
export declare abstract class NgElementImpl<T> extends HTMLElement implements NgElement<T> {
    private appContext;
    private componentFactory;
    private readonly inputs;
    private readonly outputs;
    private static DESTROY_DELAY;
    ngElement: NgElement<T> | null;
    componentRef: ComponentRef<T> | null;
    onConnected: EventEmitter<void>;
    onDisconnected: EventEmitter<void>;
    private host;
    private readonly componentName;
    private readonly initialInputValues;
    private readonly uninitializedInputs;
    private readonly outputSubscriptions;
    private inputChanges;
    private implementsOnChanges;
    private changeDetectionScheduled;
    private lifecyclePhase;
    private cancelDestruction;
    constructor(appContext: NgElementApplicationContext, componentFactory: ComponentFactory<T>, inputs: NgElementInput[], outputs: NgElementOutput[]);
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string, namespace?: string): void;
    connectedCallback(ignoreUpgraded?: boolean): void;
    detach(): void;
    detectChanges(): void;
    disconnectedCallback(): void;
    getHost(): HTMLElement;
    getInputValue(propName: string): any;
    markDirty(): void;
    setHost(host: HTMLElement): void;
    setInputValue(propName: string, newValue: any): void;
    private assertNotInPhase(phase, caller);
    private callNgOnChanges(this);
    private destroy();
    private dispatchCustomEvent(eventName, value);
    private initializeInputs();
    private initializeOutputs(this);
    private recordInputChange(propName, currentValue);
    private subscribeToOutput(this, output);
    private unsubscribeFromOutput({propName});
}
