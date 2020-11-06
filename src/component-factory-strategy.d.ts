/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, ComponentFactory, ComponentRef, Injector, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { NgElementStrategy, NgElementStrategyEvent, NgElementStrategyFactory } from './element-strategy';
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * @publicApi
 */
export declare class ComponentNgElementStrategyFactory implements NgElementStrategyFactory {
    componentFactory: ComponentFactory<any>;
    constructor(component: Type<any>, injector: Injector);
    create(injector: Injector): ComponentNgElementStrategy;
}
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * @publicApi
 */
export declare class ComponentNgElementStrategy implements NgElementStrategy {
    private componentFactory;
    private injector;
    private eventEmitters;
    /** Merged stream of the component's output events. */
    readonly events: Observable<NgElementStrategyEvent>;
    /** Reference to the component that was created on connect. */
    private componentRef;
    /** Reference to the component view's `ChangeDetectorRef`. */
    private viewChangeDetectorRef;
    /**
     * Changes that have been made to component inputs since the last change detection run.
     * (NOTE: These are only recorded if the component implements the `OnChanges` interface.)
     */
    private inputChanges;
    /** Whether changes have been made to component inputs since the last change detection run. */
    private hasInputChanges;
    /** Whether the created component implements the `OnChanges` interface. */
    private implementsOnChanges;
    /** Whether a change detection has been scheduled to run on the component. */
    private scheduledChangeDetectionFn;
    /** Callback function that when called will cancel a scheduled destruction on the component. */
    private scheduledDestroyFn;
    /** Initial input values that were set before the component was created. */
    private readonly initialInputValues;
    /**
     * Set of component inputs that have not yet changed, i.e. for which `recordInputChange()` has not
     * fired.
     * (This helps detect the first change of an input, even if it is explicitly set to `undefined`.)
     */
    private readonly unchangedInputs;
    /** Service for setting zone context. */
    private readonly ngZone;
    /** The zone the element was created in or `null` if Zone.js is not loaded. */
    private readonly elementZone;
    constructor(componentFactory: ComponentFactory<any>, injector: Injector);
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     */
    connect(element: HTMLElement): void;
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     */
    disconnect(): void;
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     */
    getInputValue(property: string): any;
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    setInputValue(property: string, value: any): void;
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     */
    protected initializeComponent(element: HTMLElement): void;
    /** Set any stored initial inputs on the component's properties. */
    protected initializeInputs(): void;
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    protected initializeOutputs(componentRef: ComponentRef<any>): void;
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    protected callNgOnChanges(componentRef: ComponentRef<any>): void;
    /**
     * Marks the component view for check, if necessary.
     * (NOTE: This is required when the `ChangeDetectionStrategy` is set to `OnPush`.)
     */
    protected markViewForCheck(viewChangeDetectorRef: ChangeDetectorRef): void;
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     */
    protected scheduleDetectChanges(): void;
    /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     */
    protected recordInputChange(property: string, currentValue: any): void;
    /** Runs change detection on the component. */
    protected detectChanges(): void;
    /** Runs in the angular zone, if present. */
    private runInZone;
}
