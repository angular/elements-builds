/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, ComponentFactoryResolver, Injector, SimpleChange } from '@angular/core';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { extractProjectableNodes } from './extract-projectable-nodes';
import { isFunction, scheduler, strictEquals } from './utils';
/**
 * Time in milliseconds to wait before destroying the component ref when disconnected.
 */
const /** @type {?} */ DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * \@experimental
 */
export class ComponentNgElementStrategyFactory {
    /**
     * @param {?} component
     * @param {?} injector
     */
    constructor(component, injector) {
        this.component = component;
        this.injector = injector;
        this.componentFactory =
            injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
    }
    /**
     * @param {?} injector
     * @return {?}
     */
    create(injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector);
    }
}
function ComponentNgElementStrategyFactory_tsickle_Closure_declarations() {
    /** @type {?} */
    ComponentNgElementStrategyFactory.prototype.componentFactory;
    /** @type {?} */
    ComponentNgElementStrategyFactory.prototype.component;
    /** @type {?} */
    ComponentNgElementStrategyFactory.prototype.injector;
}
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * \@experimental
 */
export class ComponentNgElementStrategy {
    /**
     * @param {?} componentFactory
     * @param {?} injector
     */
    constructor(componentFactory, injector) {
        this.componentFactory = componentFactory;
        this.injector = injector;
        /**
         * Changes that have been made to the component ref since the last time onChanges was called.
         */
        this.inputChanges = null;
        /**
         * Whether the created component implements the onChanges function.
         */
        this.implementsOnChanges = false;
        /**
         * Whether a change detection has been scheduled to run on the component.
         */
        this.scheduledChangeDetectionFn = null;
        /**
         * Callback function that when called will cancel a scheduled destruction on the component.
         */
        this.scheduledDestroyFn = null;
        /**
         * Initial input values that were set before the component was created.
         */
        this.initialInputValues = new Map();
        /**
         * Set of inputs that were not initially set when the component was created.
         */
        this.uninitializedInputs = new Set();
    }
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     * @param {?} element
     * @return {?}
     */
    connect(element) {
        // If the element is marked to be destroyed, cancel the task since the component was reconnected
        if (this.scheduledDestroyFn !== null) {
            this.scheduledDestroyFn();
            this.scheduledDestroyFn = null;
            return;
        }
        if (!this.componentRef) {
            this.initializeComponent(element);
        }
    }
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     * @return {?}
     */
    disconnect() {
        // Return if there is no componentRef or the component is already scheduled for destruction
        if (!this.componentRef || this.scheduledDestroyFn !== null) {
            return;
        }
        // Schedule the component to be destroyed after a small timeout in case it is being
        // moved elsewhere in the DOM
        this.scheduledDestroyFn = scheduler.schedule(() => {
            if (this.componentRef) {
                /** @type {?} */ ((this.componentRef)).destroy();
                this.componentRef = null;
            }
        }, DESTROY_DELAY);
    }
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     * @param {?} property
     * @return {?}
     */
    getInputValue(property) {
        if (!this.componentRef) {
            return this.initialInputValues.get(property);
        }
        return (/** @type {?} */ (this.componentRef.instance))[property];
    }
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    setInputValue(property, value) {
        if (strictEquals(value, this.getInputValue(property))) {
            return;
        }
        if (!this.componentRef) {
            this.initialInputValues.set(property, value);
            return;
        }
        this.recordInputChange(property, value);
        (/** @type {?} */ (this.componentRef.instance))[property] = value;
        this.scheduleDetectChanges();
    }
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     * @param {?} element
     * @return {?}
     */
    initializeComponent(element) {
        const /** @type {?} */ childInjector = Injector.create({ providers: [], parent: this.injector });
        const /** @type {?} */ projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.implementsOnChanges =
            isFunction((/** @type {?} */ ((this.componentRef.instance))).ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs();
        this.detectChanges();
        const /** @type {?} */ applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    }
    /**
     * Set any stored initial inputs on the component's properties.
     * @return {?}
     */
    initializeInputs() {
        this.componentFactory.inputs.forEach(({ propName }) => {
            const /** @type {?} */ initialValue = this.initialInputValues.get(propName);
            if (initialValue) {
                this.setInputValue(propName, initialValue);
            }
            else {
                // Keep track of inputs that were not initialized in case we need to know this for
                // calling ngOnChanges with SimpleChanges
                this.uninitializedInputs.add(propName);
            }
        });
        this.initialInputValues.clear();
    }
    /**
     * Sets up listeners for the component's outputs so that the events stream emits the events.
     * @return {?}
     */
    initializeOutputs() {
        const /** @type {?} */ eventEmitters = this.componentFactory.outputs.map(({ propName, templateName }) => {
            const /** @type {?} */ emitter = /** @type {?} */ ((/** @type {?} */ (((this.componentRef)).instance))[propName]);
            return emitter.pipe(map((value) => ({ name: templateName, value })));
        });
        this.events = merge(...eventEmitters);
    }
    /**
     * Calls ngOnChanges with all the inputs that have changed since the last call.
     * @return {?}
     */
    callNgOnChanges() {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        const /** @type {?} */ inputChanges = this.inputChanges;
        this.inputChanges = null;
        (/** @type {?} */ ((((this.componentRef)).instance))).ngOnChanges(inputChanges);
    }
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     * @return {?}
     */
    scheduleDetectChanges() {
        if (this.scheduledChangeDetectionFn) {
            return;
        }
        this.scheduledChangeDetectionFn = scheduler.scheduleBeforeRender(() => {
            this.scheduledChangeDetectionFn = null;
            this.detectChanges();
        });
    }
    /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     * @param {?} property
     * @param {?} currentValue
     * @return {?}
     */
    recordInputChange(property, currentValue) {
        // Do not record the change if the component does not implement `OnChanges`.
        if (this.componentRef && !this.implementsOnChanges) {
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        // If there already is a change, modify the current value to match but leave the values for
        // previousValue and isFirstChange.
        const /** @type {?} */ pendingChange = this.inputChanges[property];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        const /** @type {?} */ isFirstChange = this.uninitializedInputs.has(property);
        this.uninitializedInputs.delete(property);
        const /** @type {?} */ previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    }
    /**
     * Runs change detection on the component.
     * @return {?}
     */
    detectChanges() {
        if (!this.componentRef) {
            return;
        }
        this.callNgOnChanges(); /** @type {?} */
        ((this.componentRef)).changeDetectorRef.detectChanges();
    }
}
function ComponentNgElementStrategy_tsickle_Closure_declarations() {
    /**
     * Merged stream of the component's output events.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.events;
    /**
     * Reference to the component that was created on connect.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.componentRef;
    /**
     * Changes that have been made to the component ref since the last time onChanges was called.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.inputChanges;
    /**
     * Whether the created component implements the onChanges function.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.implementsOnChanges;
    /**
     * Whether a change detection has been scheduled to run on the component.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.scheduledChangeDetectionFn;
    /**
     * Callback function that when called will cancel a scheduled destruction on the component.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.scheduledDestroyFn;
    /**
     * Initial input values that were set before the component was created.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.initialInputValues;
    /**
     * Set of inputs that were not initially set when the component was created.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.uninitializedInputs;
    /** @type {?} */
    ComponentNgElementStrategy.prototype.componentFactory;
    /** @type {?} */
    ComponentNgElementStrategy.prototype.injector;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFvQix3QkFBd0IsRUFBOEIsUUFBUSxFQUFhLFlBQVksRUFBc0IsTUFBTSxlQUFlLENBQUM7QUFDN0ssT0FBTyxFQUFhLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2QyxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHbkMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7O0FBRzVELHVCQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7Ozs7Ozs7QUFRekIsTUFBTTs7Ozs7SUFHSixZQUFvQixTQUFvQixFQUFVLFFBQWtCO1FBQWhELGNBQVMsR0FBVCxTQUFTLENBQVc7UUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFVO1FBQ2xFLElBQUksQ0FBQyxnQkFBZ0I7WUFDakIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQy9FOzs7OztJQUVELE1BQU0sQ0FBQyxRQUFrQjtRQUN2QixPQUFPLElBQUksMEJBQTBCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ3hFO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7OztBQVFELE1BQU07Ozs7O0lBeUJKLFlBQW9CLGdCQUF1QyxFQUFVLFFBQWtCO1FBQW5FLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBdUI7UUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFV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QUFDO1FBRTFDLHVCQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksWUFBWSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDNUY7Ozs7O0lBR1MsYUFBYTtRQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUN0QixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7VUFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxpQkFBaUIsQ0FBQyxhQUFhO0tBQ3BEO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWYsIENvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgQ29tcG9uZW50UmVmLCBFdmVudEVtaXR0ZXIsIEluamVjdG9yLCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZSwgU2ltcGxlQ2hhbmdlcywgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG1lcmdlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7bWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQsIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7ZXh0cmFjdFByb2plY3RhYmxlTm9kZXN9IGZyb20gJy4vZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcyc7XG5pbXBvcnQge2lzRnVuY3Rpb24sIHNjaGVkdWxlciwgc3RyaWN0RXF1YWxzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIGRlc3Ryb3lpbmcgdGhlIGNvbXBvbmVudCByZWYgd2hlbiBkaXNjb25uZWN0ZWQuICovXG5jb25zdCBERVNUUk9ZX0RFTEFZID0gMTA7XG5cbi8qKlxuICogRmFjdG9yeSB0aGF0IGNyZWF0ZXMgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGluc3RhbmNlLiBHZXRzIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZVxuICogY29uc3RydWN0b3IncyBpbmplY3RvcidzIGZhY3RvcnkgcmVzb2x2ZXIgYW5kIHBhc3NlcyB0aGF0IGZhY3RvcnkgdG8gZWFjaCBzdHJhdGVneS5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnkgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnkge1xuICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT47XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnQ6IFR5cGU8YW55PiwgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnkgPVxuICAgICAgICBpbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKS5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICB9XG5cbiAgY3JlYXRlKGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kodGhpcy5jb21wb25lbnRGYWN0b3J5LCBpbmplY3Rvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBkZXN0cm95cyBhIGNvbXBvbmVudCByZWYgdXNpbmcgYSBjb21wb25lbnQgZmFjdG9yeSBhbmQgaGFuZGxlcyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBpbiByZXNwb25zZSB0byBpbnB1dCBjaGFuZ2VzLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3kge1xuICAvKiogTWVyZ2VkIHN0cmVhbSBvZiB0aGUgY29tcG9uZW50J3Mgb3V0cHV0IGV2ZW50cy4gKi9cbiAgZXZlbnRzOiBPYnNlcnZhYmxlPE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQ+O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudCB0aGF0IHdhcyBjcmVhdGVkIG9uIGNvbm5lY3QuICovXG4gIHByaXZhdGUgY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55PnxudWxsO1xuXG4gIC8qKiBDaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG1hZGUgdG8gdGhlIGNvbXBvbmVudCByZWYgc2luY2UgdGhlIGxhc3QgdGltZSBvbkNoYW5nZXMgd2FzIGNhbGxlZC4gKi9cbiAgcHJpdmF0ZSBpbnB1dENoYW5nZXM6IFNpbXBsZUNoYW5nZXN8bnVsbCA9IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNyZWF0ZWQgY29tcG9uZW50IGltcGxlbWVudHMgdGhlIG9uQ2hhbmdlcyBmdW5jdGlvbi4gKi9cbiAgcHJpdmF0ZSBpbXBsZW1lbnRzT25DaGFuZ2VzID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIGhhcyBiZWVuIHNjaGVkdWxlZCB0byBydW4gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdoZW4gY2FsbGVkIHdpbGwgY2FuY2VsIGEgc2NoZWR1bGVkIGRlc3RydWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkRGVzdHJveUZuOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgLyoqIEluaXRpYWwgaW5wdXQgdmFsdWVzIHRoYXQgd2VyZSBzZXQgYmVmb3JlIHRoZSBjb21wb25lbnQgd2FzIGNyZWF0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbElucHV0VmFsdWVzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuICAvKiogU2V0IG9mIGlucHV0cyB0aGF0IHdlcmUgbm90IGluaXRpYWxseSBzZXQgd2hlbiB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHVuaW5pdGlhbGl6ZWRJbnB1dHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PiwgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3IGNvbXBvbmVudCBpZiBvbmUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGFuZCBjYW5jZWxzIGFueSBzY2hlZHVsZWRcbiAgICogZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbWFya2VkIHRvIGJlIGRlc3Ryb3llZCwgY2FuY2VsIHRoZSB0YXNrIHNpbmNlIHRoZSBjb21wb25lbnQgd2FzIHJlY29ubmVjdGVkXG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbigpO1xuICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIHNvbWUgc21hbGwgZGVsYXkgaW4gY2FzZSB0aGUgZWxlbWVudCBpcyBqdXN0XG4gICAqIGJlaW5nIG1vdmVkIGFjcm9zcyB0aGUgRE9NLlxuICAgKi9cbiAgZGlzY29ubmVjdCgpIHtcbiAgICAvLyBSZXR1cm4gaWYgdGhlcmUgaXMgbm8gY29tcG9uZW50UmVmIG9yIHRoZSBjb21wb25lbnQgaXMgYWxyZWFkeSBzY2hlZHVsZWQgZm9yIGRlc3RydWN0aW9uXG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZiB8fCB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNjaGVkdWxlIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIGEgc21hbGwgdGltZW91dCBpbiBjYXNlIGl0IGlzIGJlaW5nXG4gICAgLy8gbW92ZWQgZWxzZXdoZXJlIGluIHRoZSBET01cbiAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IHNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWYgIS5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50UmVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9LCBERVNUUk9ZX0RFTEFZKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgcHJvcGVydHkgdmFsdWUuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogcmV0cmlldmVkIGZyb20gdGhlIGNhY2hlZCBpbml0aWFsaXphdGlvbiB2YWx1ZXMuXG4gICAqL1xuICBnZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBhbnkge1xuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHJldHVybiB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcGVydHkpO1xuICAgIH1cblxuICAgIHJldHVybiAodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55KVtwcm9wZXJ0eV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5wdXQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiBjYWNoZWQgYW5kIHNldCB3aGVuIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHNldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGlmIChzdHJpY3RFcXVhbHModmFsdWUsIHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuc2V0KHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIHRoaXMuc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb21wb25lbnQgdGhyb3VnaCB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGUgcHJvdmlkZWQgZWxlbWVudCBob3N0IGFuZFxuICAgKiBzZXRzIHVwIGl0cyBpbml0aWFsIGlucHV0cywgbGlzdGVucyBmb3Igb3V0cHV0cyBjaGFuZ2VzLCBhbmQgcnVucyBhbiBpbml0aWFsIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IGNoaWxkSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVyczogW10sIHBhcmVudDogdGhpcy5pbmplY3Rvcn0pO1xuICAgIGNvbnN0IHByb2plY3RhYmxlTm9kZXMgPVxuICAgICAgICBleHRyYWN0UHJvamVjdGFibGVOb2RlcyhlbGVtZW50LCB0aGlzLmNvbXBvbmVudEZhY3RvcnkubmdDb250ZW50U2VsZWN0b3JzKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY2hpbGRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgZWxlbWVudCk7XG5cbiAgICB0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgPVxuICAgICAgICBpc0Z1bmN0aW9uKCh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkgYXMgT25DaGFuZ2VzKS5uZ09uQ2hhbmdlcyk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVJbnB1dHMoKTtcbiAgICB0aGlzLmluaXRpYWxpemVPdXRwdXRzKCk7XG5cbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGNvbnN0IGFwcGxpY2F0aW9uUmVmID0gdGhpcy5pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICBhcHBsaWNhdGlvblJlZi5hdHRhY2hWaWV3KHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIC8qKiBTZXQgYW55IHN0b3JlZCBpbml0aWFsIGlucHV0cyBvbiB0aGUgY29tcG9uZW50J3MgcHJvcGVydGllcy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVJbnB1dHMoKTogdm9pZCB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5LmlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWV9KSA9PiB7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPSB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcE5hbWUpO1xuICAgICAgaWYgKGluaXRpYWxWYWx1ZSkge1xuICAgICAgICB0aGlzLnNldElucHV0VmFsdWUocHJvcE5hbWUsIGluaXRpYWxWYWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBLZWVwIHRyYWNrIG9mIGlucHV0cyB0aGF0IHdlcmUgbm90IGluaXRpYWxpemVkIGluIGNhc2Ugd2UgbmVlZCB0byBrbm93IHRoaXMgZm9yXG4gICAgICAgIC8vIGNhbGxpbmcgbmdPbkNoYW5nZXMgd2l0aCBTaW1wbGVDaGFuZ2VzXG4gICAgICAgIHRoaXMudW5pbml0aWFsaXplZElucHV0cy5hZGQocHJvcE5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHVwIGxpc3RlbmVycyBmb3IgdGhlIGNvbXBvbmVudCdzIG91dHB1dHMgc28gdGhhdCB0aGUgZXZlbnRzIHN0cmVhbSBlbWl0cyB0aGUgZXZlbnRzLiAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgY29uc3QgZXZlbnRFbWl0dGVycyA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5vdXRwdXRzLm1hcCgoe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KSA9PiB7XG4gICAgICBjb25zdCBlbWl0dGVyID0gKHRoaXMuY29tcG9uZW50UmVmICEuaW5zdGFuY2UgYXMgYW55KVtwcm9wTmFtZV0gYXMgRXZlbnRFbWl0dGVyPGFueT47XG4gICAgICByZXR1cm4gZW1pdHRlci5waXBlKG1hcCgodmFsdWU6IGFueSkgPT4gKHtuYW1lOiB0ZW1wbGF0ZU5hbWUsIHZhbHVlfSkpKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZXZlbnRzID0gbWVyZ2UoLi4uZXZlbnRFbWl0dGVycyk7XG4gIH1cblxuICAvKiogQ2FsbHMgbmdPbkNoYW5nZXMgd2l0aCBhbGwgdGhlIGlucHV0cyB0aGF0IGhhdmUgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjYWxsLiAqL1xuICBwcm90ZWN0ZWQgY2FsbE5nT25DaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzIHx8IHRoaXMuaW5wdXRDaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2FjaGUgdGhlIGNoYW5nZXMgYW5kIHNldCBpbnB1dENoYW5nZXMgdG8gbnVsbCB0byBjYXB0dXJlIGFueSBjaGFuZ2VzIHRoYXQgbWlnaHQgb2NjdXJcbiAgICAvLyBkdXJpbmcgbmdPbkNoYW5nZXMuXG4gICAgY29uc3QgaW5wdXRDaGFuZ2VzID0gdGhpcy5pbnB1dENoYW5nZXM7XG4gICAgdGhpcy5pbnB1dENoYW5nZXMgPSBudWxsO1xuICAgICh0aGlzLmNvbXBvbmVudFJlZiAhLmluc3RhbmNlIGFzIGFueSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKGlucHV0Q2hhbmdlcyk7XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIGNoYW5nZSBkZXRlY3Rpb24gdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuXG4gICAqIElnbm9yZXMgc3Vic2VxdWVudCBjYWxscyBpZiBhbHJlYWR5IHNjaGVkdWxlZC5cbiAgICovXG4gIHByb3RlY3RlZCBzY2hlZHVsZURldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gc2NoZWR1bGVyLnNjaGVkdWxlQmVmb3JlUmVuZGVyKCgpID0+IHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBudWxsO1xuICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyBpbnB1dCBjaGFuZ2VzIHNvIHRoYXQgdGhlIGNvbXBvbmVudCByZWNlaXZlcyBTaW1wbGVDaGFuZ2VzIGluIGl0cyBvbkNoYW5nZXMgZnVuY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHk6IHN0cmluZywgY3VycmVudFZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICAvLyBEbyBub3QgcmVjb3JkIHRoZSBjaGFuZ2UgaWYgdGhlIGNvbXBvbmVudCBkb2VzIG5vdCBpbXBsZW1lbnQgYE9uQ2hhbmdlc2AuXG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmICYmICF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0ge307XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYWxyZWFkeSBpcyBhIGNoYW5nZSwgbW9kaWZ5IHRoZSBjdXJyZW50IHZhbHVlIHRvIG1hdGNoIGJ1dCBsZWF2ZSB0aGUgdmFsdWVzIGZvclxuICAgIC8vIHByZXZpb3VzVmFsdWUgYW5kIGlzRmlyc3RDaGFuZ2UuXG4gICAgY29uc3QgcGVuZGluZ0NoYW5nZSA9IHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XTtcbiAgICBpZiAocGVuZGluZ0NoYW5nZSkge1xuICAgICAgcGVuZGluZ0NoYW5nZS5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNGaXJzdENoYW5nZSA9IHRoaXMudW5pbml0aWFsaXplZElucHV0cy5oYXMocHJvcGVydHkpO1xuICAgIHRoaXMudW5pbml0aWFsaXplZElucHV0cy5kZWxldGUocHJvcGVydHkpO1xuXG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGlzRmlyc3RDaGFuZ2UgPyB1bmRlZmluZWQgOiB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XSA9IG5ldyBTaW1wbGVDaGFuZ2UocHJldmlvdXNWYWx1ZSwgY3VycmVudFZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2FsbE5nT25DaGFuZ2VzKCk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgIS5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbn1cbiJdfQ==