/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/component-factory-strategy.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
 * @type {?}
 */
const DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * \@publicApi
 */
export class ComponentNgElementStrategyFactory {
    /**
     * @param {?} component
     * @param {?} injector
     */
    constructor(component, injector) {
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
if (false) {
    /** @type {?} */
    ComponentNgElementStrategyFactory.prototype.componentFactory;
}
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * \@publicApi
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
         * Reference to the component that was created on connect.
         */
        this.componentRef = null;
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
         * Set of component inputs that have not yet changed, i.e. for which `ngOnChanges()` has not
         * fired. (This is used to determine the value of `fistChange` in `SimpleChange` instances.)
         */
        this.unchangedInputs = new Set();
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
        if (this.componentRef === null) {
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
        if (this.componentRef === null || this.scheduledDestroyFn !== null) {
            return;
        }
        // Schedule the component to be destroyed after a small timeout in case it is being
        // moved elsewhere in the DOM
        this.scheduledDestroyFn = scheduler.schedule((/**
         * @return {?}
         */
        () => {
            if (this.componentRef !== null) {
                this.componentRef.destroy();
                this.componentRef = null;
            }
        }), DESTROY_DELAY);
    }
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     * @param {?} property
     * @return {?}
     */
    getInputValue(property) {
        if (this.componentRef === null) {
            return this.initialInputValues.get(property);
        }
        return this.componentRef.instance[property];
    }
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    setInputValue(property, value) {
        if (this.componentRef === null) {
            this.initialInputValues.set(property, value);
            return;
        }
        // Ignore the value if it is strictly equal to the current value, except if it is `undefined`
        // and this is the first change to the value (because an explicit `undefined` _is_ strictly
        // equal to not having a value set at all, but we still need to record this as a change).
        if (strictEquals(value, this.getInputValue(property)) &&
            !((value === undefined) && this.unchangedInputs.has(property))) {
            return;
        }
        this.recordInputChange(property, value);
        this.componentRef.instance[property] = value;
        this.scheduleDetectChanges();
    }
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     * @protected
     * @param {?} element
     * @return {?}
     */
    initializeComponent(element) {
        /** @type {?} */
        const childInjector = Injector.create({ providers: [], parent: this.injector });
        /** @type {?} */
        const projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.implementsOnChanges = isFunction(((/** @type {?} */ (this.componentRef.instance))).ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs(this.componentRef);
        this.detectChanges();
        /** @type {?} */
        const applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    }
    /**
     * Set any stored initial inputs on the component's properties.
     * @protected
     * @return {?}
     */
    initializeInputs() {
        this.componentFactory.inputs.forEach((/**
         * @param {?} __0
         * @return {?}
         */
        ({ propName }) => {
            if (this.implementsOnChanges) {
                // If the component implements `ngOnChanges()`, keep track of which inputs have never
                // changed so far.
                this.unchangedInputs.add(propName);
            }
            if (this.initialInputValues.has(propName)) {
                // Call `setInputValue()` now that the component has been instantiated to update its
                // properties and fire `ngOnChanges()`.
                this.setInputValue(propName, this.initialInputValues.get(propName));
            }
        }));
        this.initialInputValues.clear();
    }
    /**
     * Sets up listeners for the component's outputs so that the events stream emits the events.
     * @protected
     * @param {?} componentRef
     * @return {?}
     */
    initializeOutputs(componentRef) {
        /** @type {?} */
        const eventEmitters = this.componentFactory.outputs.map((/**
         * @param {?} __0
         * @return {?}
         */
        ({ propName, templateName }) => {
            /** @type {?} */
            const emitter = componentRef.instance[propName];
            return emitter.pipe(map((/**
             * @param {?} value
             * @return {?}
             */
            value => ({ name: templateName, value }))));
        }));
        this.events = merge(...eventEmitters);
    }
    /**
     * Calls ngOnChanges with all the inputs that have changed since the last call.
     * @protected
     * @param {?} componentRef
     * @return {?}
     */
    callNgOnChanges(componentRef) {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        /** @type {?} */
        const inputChanges = this.inputChanges;
        this.inputChanges = null;
        ((/** @type {?} */ (componentRef.instance))).ngOnChanges(inputChanges);
    }
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     * @protected
     * @return {?}
     */
    scheduleDetectChanges() {
        if (this.scheduledChangeDetectionFn) {
            return;
        }
        this.scheduledChangeDetectionFn = scheduler.scheduleBeforeRender((/**
         * @return {?}
         */
        () => {
            this.scheduledChangeDetectionFn = null;
            this.detectChanges();
        }));
    }
    /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     * @protected
     * @param {?} property
     * @param {?} currentValue
     * @return {?}
     */
    recordInputChange(property, currentValue) {
        // Do not record the change if the component does not implement `OnChanges`.
        // (We can only determine that after the component has been instantiated.)
        if (this.componentRef !== null && !this.implementsOnChanges) {
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        // If there already is a change, modify the current value to match but leave the values for
        // previousValue and isFirstChange.
        /** @type {?} */
        const pendingChange = this.inputChanges[property];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        /** @type {?} */
        const isFirstChange = this.unchangedInputs.has(property);
        this.unchangedInputs.delete(property);
        /** @type {?} */
        const previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    }
    /**
     * Runs change detection on the component.
     * @protected
     * @return {?}
     */
    detectChanges() {
        if (this.componentRef === null) {
            return;
        }
        this.callNgOnChanges(this.componentRef);
        this.componentRef.changeDetectorRef.detectChanges();
    }
}
if (false) {
    /**
     * Merged stream of the component's output events.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.events;
    /**
     * Reference to the component that was created on connect.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.componentRef;
    /**
     * Changes that have been made to the component ref since the last time onChanges was called.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.inputChanges;
    /**
     * Whether the created component implements the onChanges function.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.implementsOnChanges;
    /**
     * Whether a change detection has been scheduled to run on the component.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.scheduledChangeDetectionFn;
    /**
     * Callback function that when called will cancel a scheduled destruction on the component.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.scheduledDestroyFn;
    /**
     * Initial input values that were set before the component was created.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.initialInputValues;
    /**
     * Set of component inputs that have not yet changed, i.e. for which `ngOnChanges()` has not
     * fired. (This is used to determine the value of `fistChange` in `SimpleChange` instances.)
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.unchangedInputs;
    /**
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.componentFactory;
    /**
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.injector;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBb0Isd0JBQXdCLEVBQThCLFFBQVEsRUFBYSxZQUFZLEVBQXNCLE1BQU0sZUFBZSxDQUFDO0FBQzdLLE9BQU8sRUFBQyxLQUFLLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFDdkMsT0FBTyxFQUFDLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR25DLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7TUFHdEQsYUFBYSxHQUFHLEVBQUU7Ozs7Ozs7QUFReEIsTUFBTSxPQUFPLGlDQUFpQzs7Ozs7SUFHNUMsWUFBWSxTQUFvQixFQUFFLFFBQWtCO1FBQ2xELElBQUksQ0FBQyxnQkFBZ0I7WUFDakIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7Ozs7O0lBRUQsTUFBTSxDQUFDLFFBQWtCO1FBQ3ZCLE9BQU8sSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekUsQ0FBQztDQUNGOzs7SUFWQyw2REFBd0M7Ozs7Ozs7O0FBa0IxQyxNQUFNLE9BQU8sMEJBQTBCOzs7OztJQTZCckMsWUFBb0IsZ0JBQXVDLEVBQVUsUUFBa0I7UUFBbkUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF1QjtRQUFVLGFBQVEsR0FBUixRQUFRLENBQVU7Ozs7UUF2Qi9FLGlCQUFZ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R2hELHlEQUFvQzs7Ozs7O0lBR3BDLGdFQUE2RDs7Ozs7O0lBRzdELHdEQUFxRDs7Ozs7O0lBR3JELHdEQUE2RDs7Ozs7OztJQU03RCxxREFBcUQ7Ozs7O0lBRXpDLHNEQUErQzs7Ozs7SUFBRSw4Q0FBMEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWYsIENvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgQ29tcG9uZW50UmVmLCBFdmVudEVtaXR0ZXIsIEluamVjdG9yLCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZSwgU2ltcGxlQ2hhbmdlcywgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge21lcmdlLCBPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7bWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQsIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7ZXh0cmFjdFByb2plY3RhYmxlTm9kZXN9IGZyb20gJy4vZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcyc7XG5pbXBvcnQge2lzRnVuY3Rpb24sIHNjaGVkdWxlciwgc3RyaWN0RXF1YWxzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIGRlc3Ryb3lpbmcgdGhlIGNvbXBvbmVudCByZWYgd2hlbiBkaXNjb25uZWN0ZWQuICovXG5jb25zdCBERVNUUk9ZX0RFTEFZID0gMTA7XG5cbi8qKlxuICogRmFjdG9yeSB0aGF0IGNyZWF0ZXMgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGluc3RhbmNlLiBHZXRzIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZVxuICogY29uc3RydWN0b3IncyBpbmplY3RvcidzIGZhY3RvcnkgcmVzb2x2ZXIgYW5kIHBhc3NlcyB0aGF0IGZhY3RvcnkgdG8gZWFjaCBzdHJhdGVneS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnkgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnkge1xuICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT47XG5cbiAgY29uc3RydWN0b3IoY29tcG9uZW50OiBUeXBlPGFueT4sIGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeSA9XG4gICAgICAgIGluamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIH1cblxuICBjcmVhdGUoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSh0aGlzLmNvbXBvbmVudEZhY3RvcnksIGluamVjdG9yKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIGRlc3Ryb3lzIGEgY29tcG9uZW50IHJlZiB1c2luZyBhIGNvbXBvbmVudCBmYWN0b3J5IGFuZCBoYW5kbGVzIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGluIHJlc3BvbnNlIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gIC8qKiBNZXJnZWQgc3RyZWFtIG9mIHRoZSBjb21wb25lbnQncyBvdXRwdXQgZXZlbnRzLiAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZXZlbnRzITogT2JzZXJ2YWJsZTxOZ0VsZW1lbnRTdHJhdGVneUV2ZW50PjtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnQgdGhhdCB3YXMgY3JlYXRlZCBvbiBjb25uZWN0LiAqL1xuICBwcml2YXRlIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT58bnVsbCA9IG51bGw7XG5cbiAgLyoqIENoYW5nZXMgdGhhdCBoYXZlIGJlZW4gbWFkZSB0byB0aGUgY29tcG9uZW50IHJlZiBzaW5jZSB0aGUgbGFzdCB0aW1lIG9uQ2hhbmdlcyB3YXMgY2FsbGVkLiAqL1xuICBwcml2YXRlIGlucHV0Q2hhbmdlczogU2ltcGxlQ2hhbmdlc3xudWxsID0gbnVsbDtcblxuICAvKiogV2hldGhlciB0aGUgY3JlYXRlZCBjb21wb25lbnQgaW1wbGVtZW50cyB0aGUgb25DaGFuZ2VzIGZ1bmN0aW9uLiAqL1xuICBwcml2YXRlIGltcGxlbWVudHNPbkNoYW5nZXMgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBhIGNoYW5nZSBkZXRlY3Rpb24gaGFzIGJlZW4gc2NoZWR1bGVkIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgLyoqIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd2hlbiBjYWxsZWQgd2lsbCBjYW5jZWwgYSBzY2hlZHVsZWQgZGVzdHJ1Y3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWREZXN0cm95Rm46ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAvKiogSW5pdGlhbCBpbnB1dCB2YWx1ZXMgdGhhdCB3ZXJlIHNldCBiZWZvcmUgdGhlIGNvbXBvbmVudCB3YXMgY3JlYXRlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBpbml0aWFsSW5wdXRWYWx1ZXMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgY29tcG9uZW50IGlucHV0cyB0aGF0IGhhdmUgbm90IHlldCBjaGFuZ2VkLCBpLmUuIGZvciB3aGljaCBgbmdPbkNoYW5nZXMoKWAgaGFzIG5vdFxuICAgKiBmaXJlZC4gKFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHZhbHVlIG9mIGBmaXN0Q2hhbmdlYCBpbiBgU2ltcGxlQ2hhbmdlYCBpbnN0YW5jZXMuKVxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSB1bmNoYW5nZWRJbnB1dHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PiwgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3IGNvbXBvbmVudCBpZiBvbmUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGFuZCBjYW5jZWxzIGFueSBzY2hlZHVsZWRcbiAgICogZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbWFya2VkIHRvIGJlIGRlc3Ryb3llZCwgY2FuY2VsIHRoZSB0YXNrIHNpbmNlIHRoZSBjb21wb25lbnQgd2FzIHJlY29ubmVjdGVkXG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbigpO1xuICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5pbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgc29tZSBzbWFsbCBkZWxheSBpbiBjYXNlIHRoZSBlbGVtZW50IGlzIGp1c3RcbiAgICogYmVpbmcgbW92ZWQgYWNyb3NzIHRoZSBET00uXG4gICAqL1xuICBkaXNjb25uZWN0KCkge1xuICAgIC8vIFJldHVybiBpZiB0aGVyZSBpcyBubyBjb21wb25lbnRSZWYgb3IgdGhlIGNvbXBvbmVudCBpcyBhbHJlYWR5IHNjaGVkdWxlZCBmb3IgZGVzdHJ1Y3Rpb25cbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwgfHwgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTY2hlZHVsZSB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBhIHNtYWxsIHRpbWVvdXQgaW4gY2FzZSBpdCBpcyBiZWluZ1xuICAgIC8vIG1vdmVkIGVsc2V3aGVyZSBpbiB0aGUgRE9NXG4gICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBzY2hlZHVsZXIuc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWYgPSBudWxsO1xuICAgICAgfVxuICAgIH0sIERFU1RST1lfREVMQVkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB2YWx1ZS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiByZXRyaWV2ZWQgZnJvbSB0aGUgY2FjaGVkIGluaXRpYWxpemF0aW9uIHZhbHVlcy5cbiAgICovXG4gIGdldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZyk6IGFueSB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BlcnR5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2VbcHJvcGVydHldO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGlucHV0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogY2FjaGVkIGFuZCBzZXQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBzZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLnNldChwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElnbm9yZSB0aGUgdmFsdWUgaWYgaXQgaXMgc3RyaWN0bHkgZXF1YWwgdG8gdGhlIGN1cnJlbnQgdmFsdWUsIGV4Y2VwdCBpZiBpdCBpcyBgdW5kZWZpbmVkYFxuICAgIC8vIGFuZCB0aGlzIGlzIHRoZSBmaXJzdCBjaGFuZ2UgdG8gdGhlIHZhbHVlIChiZWNhdXNlIGFuIGV4cGxpY2l0IGB1bmRlZmluZWRgIF9pc18gc3RyaWN0bHlcbiAgICAvLyBlcXVhbCB0byBub3QgaGF2aW5nIGEgdmFsdWUgc2V0IGF0IGFsbCwgYnV0IHdlIHN0aWxsIG5lZWQgdG8gcmVjb3JkIHRoaXMgYXMgYSBjaGFuZ2UpLlxuICAgIGlmIChzdHJpY3RFcXVhbHModmFsdWUsIHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSkpICYmXG4gICAgICAgICEoKHZhbHVlID09PSB1bmRlZmluZWQpICYmIHRoaXMudW5jaGFuZ2VkSW5wdXRzLmhhcyhwcm9wZXJ0eSkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eSwgdmFsdWUpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIHRoaXMuc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb21wb25lbnQgdGhyb3VnaCB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGUgcHJvdmlkZWQgZWxlbWVudCBob3N0IGFuZFxuICAgKiBzZXRzIHVwIGl0cyBpbml0aWFsIGlucHV0cywgbGlzdGVucyBmb3Igb3V0cHV0cyBjaGFuZ2VzLCBhbmQgcnVucyBhbiBpbml0aWFsIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IGNoaWxkSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVyczogW10sIHBhcmVudDogdGhpcy5pbmplY3Rvcn0pO1xuICAgIGNvbnN0IHByb2plY3RhYmxlTm9kZXMgPVxuICAgICAgICBleHRyYWN0UHJvamVjdGFibGVOb2RlcyhlbGVtZW50LCB0aGlzLmNvbXBvbmVudEZhY3RvcnkubmdDb250ZW50U2VsZWN0b3JzKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY2hpbGRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgZWxlbWVudCk7XG5cbiAgICB0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgPSBpc0Z1bmN0aW9uKCh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZUlucHV0cygpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZU91dHB1dHModGhpcy5jb21wb25lbnRSZWYpO1xuXG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvblJlZiA9IHRoaXMuaW5qZWN0b3IuZ2V0PEFwcGxpY2F0aW9uUmVmPihBcHBsaWNhdGlvblJlZik7XG4gICAgYXBwbGljYXRpb25SZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gIH1cblxuICAvKiogU2V0IGFueSBzdG9yZWQgaW5pdGlhbCBpbnB1dHMgb24gdGhlIGNvbXBvbmVudCdzIHByb3BlcnRpZXMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplSW5wdXRzKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lfSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgICAvLyBJZiB0aGUgY29tcG9uZW50IGltcGxlbWVudHMgYG5nT25DaGFuZ2VzKClgLCBrZWVwIHRyYWNrIG9mIHdoaWNoIGlucHV0cyBoYXZlIG5ldmVyXG4gICAgICAgIC8vIGNoYW5nZWQgc28gZmFyLlxuICAgICAgICB0aGlzLnVuY2hhbmdlZElucHV0cy5hZGQocHJvcE5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuaGFzKHByb3BOYW1lKSkge1xuICAgICAgICAvLyBDYWxsIGBzZXRJbnB1dFZhbHVlKClgIG5vdyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHRvIHVwZGF0ZSBpdHNcbiAgICAgICAgLy8gcHJvcGVydGllcyBhbmQgZmlyZSBgbmdPbkNoYW5nZXMoKWAuXG4gICAgICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BOYW1lKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIFNldHMgdXAgbGlzdGVuZXJzIGZvciB0aGUgY29tcG9uZW50J3Mgb3V0cHV0cyBzbyB0aGF0IHRoZSBldmVudHMgc3RyZWFtIGVtaXRzIHRoZSBldmVudHMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplT3V0cHV0cyhjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgY29uc3QgZXZlbnRFbWl0dGVycyA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5vdXRwdXRzLm1hcCgoe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KSA9PiB7XG4gICAgICBjb25zdCBlbWl0dGVyOiBFdmVudEVtaXR0ZXI8YW55PiA9IGNvbXBvbmVudFJlZi5pbnN0YW5jZVtwcm9wTmFtZV07XG4gICAgICByZXR1cm4gZW1pdHRlci5waXBlKG1hcCh2YWx1ZSA9PiAoe25hbWU6IHRlbXBsYXRlTmFtZSwgdmFsdWV9KSkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5ldmVudHMgPSBtZXJnZSguLi5ldmVudEVtaXR0ZXJzKTtcbiAgfVxuXG4gIC8qKiBDYWxscyBuZ09uQ2hhbmdlcyB3aXRoIGFsbCB0aGUgaW5wdXRzIHRoYXQgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGNhbGwuICovXG4gIHByb3RlY3RlZCBjYWxsTmdPbkNoYW5nZXMoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIGlmICghdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzIHx8IHRoaXMuaW5wdXRDaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2FjaGUgdGhlIGNoYW5nZXMgYW5kIHNldCBpbnB1dENoYW5nZXMgdG8gbnVsbCB0byBjYXB0dXJlIGFueSBjaGFuZ2VzIHRoYXQgbWlnaHQgb2NjdXJcbiAgICAvLyBkdXJpbmcgbmdPbkNoYW5nZXMuXG4gICAgY29uc3QgaW5wdXRDaGFuZ2VzID0gdGhpcy5pbnB1dENoYW5nZXM7XG4gICAgdGhpcy5pbnB1dENoYW5nZXMgPSBudWxsO1xuICAgIChjb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgT25DaGFuZ2VzKS5uZ09uQ2hhbmdlcyhpbnB1dENoYW5nZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LlxuICAgKiBJZ25vcmVzIHN1YnNlcXVlbnQgY2FsbHMgaWYgYWxyZWFkeSBzY2hlZHVsZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IHNjaGVkdWxlci5zY2hlZHVsZUJlZm9yZVJlbmRlcigoKSA9PiB7XG4gICAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gbnVsbDtcbiAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgaW5wdXQgY2hhbmdlcyBzbyB0aGF0IHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgU2ltcGxlQ2hhbmdlcyBpbiBpdHMgb25DaGFuZ2VzIGZ1bmN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5OiBzdHJpbmcsIGN1cnJlbnRWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgLy8gRG8gbm90IHJlY29yZCB0aGUgY2hhbmdlIGlmIHRoZSBjb21wb25lbnQgZG9lcyBub3QgaW1wbGVtZW50IGBPbkNoYW5nZXNgLlxuICAgIC8vIChXZSBjYW4gb25seSBkZXRlcm1pbmUgdGhhdCBhZnRlciB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGluc3RhbnRpYXRlZC4pXG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmICE9PSBudWxsICYmICF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0ge307XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYWxyZWFkeSBpcyBhIGNoYW5nZSwgbW9kaWZ5IHRoZSBjdXJyZW50IHZhbHVlIHRvIG1hdGNoIGJ1dCBsZWF2ZSB0aGUgdmFsdWVzIGZvclxuICAgIC8vIHByZXZpb3VzVmFsdWUgYW5kIGlzRmlyc3RDaGFuZ2UuXG4gICAgY29uc3QgcGVuZGluZ0NoYW5nZSA9IHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XTtcbiAgICBpZiAocGVuZGluZ0NoYW5nZSkge1xuICAgICAgcGVuZGluZ0NoYW5nZS5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNGaXJzdENoYW5nZSA9IHRoaXMudW5jaGFuZ2VkSW5wdXRzLmhhcyhwcm9wZXJ0eSk7XG4gICAgdGhpcy51bmNoYW5nZWRJbnB1dHMuZGVsZXRlKHByb3BlcnR5KTtcblxuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSBpc0ZpcnN0Q2hhbmdlID8gdW5kZWZpbmVkIDogdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KTtcbiAgICB0aGlzLmlucHV0Q2hhbmdlc1twcm9wZXJ0eV0gPSBuZXcgU2ltcGxlQ2hhbmdlKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRWYWx1ZSwgaXNGaXJzdENoYW5nZSk7XG4gIH1cblxuICAvKiogUnVucyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByb3RlY3RlZCBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2FsbE5nT25DaGFuZ2VzKHRoaXMuY29tcG9uZW50UmVmKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbn1cbiJdfQ==