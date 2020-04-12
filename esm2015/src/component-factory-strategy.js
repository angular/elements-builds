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
if (false) {
    /** @type {?} */
    ComponentNgElementStrategyFactory.prototype.componentFactory;
    /**
     * @type {?}
     * @private
     */
    ComponentNgElementStrategyFactory.prototype.component;
    /**
     * @type {?}
     * @private
     */
    ComponentNgElementStrategyFactory.prototype.injector;
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
        this.scheduledDestroyFn = scheduler.schedule((/**
         * @return {?}
         */
        () => {
            if (this.componentRef) {
                (/** @type {?} */ (this.componentRef)).destroy();
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
        if (!this.componentRef) {
            return this.initialInputValues.get(property);
        }
        return ((/** @type {?} */ (this.componentRef.instance)))[property];
    }
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    setInputValue(property, value) {
        if (!this.componentRef) {
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
        ((/** @type {?} */ (this.componentRef.instance)))[property] = value;
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
        this.implementsOnChanges =
            isFunction(((/** @type {?} */ ((/** @type {?} */ (this.componentRef.instance))))).ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs();
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
     * @return {?}
     */
    initializeOutputs() {
        /** @type {?} */
        const eventEmitters = this.componentFactory.outputs.map((/**
         * @param {?} __0
         * @return {?}
         */
        ({ propName, templateName }) => {
            /** @type {?} */
            const emitter = (/** @type {?} */ (((/** @type {?} */ ((/** @type {?} */ (this.componentRef)).instance)))[propName]));
            return emitter.pipe(map((/**
             * @param {?} value
             * @return {?}
             */
            (value) => ({ name: templateName, value }))));
        }));
        this.events = merge(...eventEmitters);
    }
    /**
     * Calls ngOnChanges with all the inputs that have changed since the last call.
     * @protected
     * @return {?}
     */
    callNgOnChanges() {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        /** @type {?} */
        const inputChanges = this.inputChanges;
        this.inputChanges = null;
        ((/** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ (this.componentRef)).instance))))).ngOnChanges(inputChanges);
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
        if (this.componentRef && !this.implementsOnChanges) {
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
        if (!this.componentRef) {
            return;
        }
        this.callNgOnChanges();
        (/** @type {?} */ (this.componentRef)).changeDetectorRef.detectChanges();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBb0Isd0JBQXdCLEVBQThCLFFBQVEsRUFBYSxZQUFZLEVBQXNCLE1BQU0sZUFBZSxDQUFDO0FBQzdLLE9BQU8sRUFBYSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdkMsT0FBTyxFQUFDLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR25DLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7TUFHdEQsYUFBYSxHQUFHLEVBQUU7Ozs7Ozs7QUFReEIsTUFBTSxPQUFPLGlDQUFpQzs7Ozs7SUFHNUMsWUFBb0IsU0FBb0IsRUFBVSxRQUFrQjtRQUFoRCxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNsRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ2pCLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRixDQUFDOzs7OztJQUVELE1BQU0sQ0FBQyxRQUFrQjtRQUN2QixPQUFPLElBQUksMEJBQTBCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7Q0FDRjs7O0lBVkMsNkRBQXdDOzs7OztJQUU1QixzREFBNEI7Ozs7O0lBQUUscURBQTBCOzs7Ozs7OztBQWdCdEUsTUFBTSxPQUFPLDBCQUEwQjs7Ozs7SUE4QnJDLFlBQW9CLGdCQUF1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LENBQUMsYUFBYSxFQUFFLENBQUM7SUFDeEQsQ0FBQztDQUNGOzs7Ozs7SUF6TkMsNENBQTZDOzs7Ozs7SUFJN0Msa0RBQWdEOzs7Ozs7SUFHaEQsa0RBQWdEOzs7Ozs7SUFHaEQseURBQW9DOzs7Ozs7SUFHcEMsZ0VBQTZEOzs7Ozs7SUFHN0Qsd0RBQXFEOzs7Ozs7SUFHckQsd0RBQTZEOzs7Ozs7O0lBTTdELHFEQUFxRDs7Ozs7SUFFekMsc0RBQStDOzs7OztJQUFFLDhDQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZiwgQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBDb21wb25lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5qZWN0b3IsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgbWVyZ2V9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHttYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lFdmVudCwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtleHRyYWN0UHJvamVjdGFibGVOb2Rlc30gZnJvbSAnLi9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzJztcbmltcG9ydCB7aXNGdW5jdGlvbiwgc2NoZWR1bGVyLCBzdHJpY3RFcXVhbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgZGVzdHJveWluZyB0aGUgY29tcG9uZW50IHJlZiB3aGVuIGRpc2Nvbm5lY3RlZC4gKi9cbmNvbnN0IERFU1RST1lfREVMQVkgPSAxMDtcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW5zdGFuY2UuIEdldHMgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlXG4gKiBjb25zdHJ1Y3RvcidzIGluamVjdG9yJ3MgZmFjdG9yeSByZXNvbHZlciBhbmQgcGFzc2VzIHRoYXQgZmFjdG9yeSB0byBlYWNoIHN0cmF0ZWd5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSB7XG4gIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudDogVHlwZTxhbnk+LCBwcml2YXRlIGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeSA9XG4gICAgICAgIGluamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIH1cblxuICBjcmVhdGUoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSh0aGlzLmNvbXBvbmVudEZhY3RvcnksIGluamVjdG9yKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIGRlc3Ryb3lzIGEgY29tcG9uZW50IHJlZiB1c2luZyBhIGNvbXBvbmVudCBmYWN0b3J5IGFuZCBoYW5kbGVzIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGluIHJlc3BvbnNlIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gIC8qKiBNZXJnZWQgc3RyZWFtIG9mIHRoZSBjb21wb25lbnQncyBvdXRwdXQgZXZlbnRzLiAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZXZlbnRzICE6IE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD47XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHRoYXQgd2FzIGNyZWF0ZWQgb24gY29ubmVjdC4gKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgY29tcG9uZW50UmVmICE6IENvbXBvbmVudFJlZjxhbnk+fCBudWxsO1xuXG4gIC8qKiBDaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG1hZGUgdG8gdGhlIGNvbXBvbmVudCByZWYgc2luY2UgdGhlIGxhc3QgdGltZSBvbkNoYW5nZXMgd2FzIGNhbGxlZC4gKi9cbiAgcHJpdmF0ZSBpbnB1dENoYW5nZXM6IFNpbXBsZUNoYW5nZXN8bnVsbCA9IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNyZWF0ZWQgY29tcG9uZW50IGltcGxlbWVudHMgdGhlIG9uQ2hhbmdlcyBmdW5jdGlvbi4gKi9cbiAgcHJpdmF0ZSBpbXBsZW1lbnRzT25DaGFuZ2VzID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIGhhcyBiZWVuIHNjaGVkdWxlZCB0byBydW4gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdoZW4gY2FsbGVkIHdpbGwgY2FuY2VsIGEgc2NoZWR1bGVkIGRlc3RydWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkRGVzdHJveUZuOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgLyoqIEluaXRpYWwgaW5wdXQgdmFsdWVzIHRoYXQgd2VyZSBzZXQgYmVmb3JlIHRoZSBjb21wb25lbnQgd2FzIGNyZWF0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbElucHV0VmFsdWVzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIGNvbXBvbmVudCBpbnB1dHMgdGhhdCBoYXZlIG5vdCB5ZXQgY2hhbmdlZCwgaS5lLiBmb3Igd2hpY2ggYG5nT25DaGFuZ2VzKClgIGhhcyBub3RcbiAgICogZmlyZWQuIChUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSB2YWx1ZSBvZiBgZmlzdENoYW5nZWAgaW4gYFNpbXBsZUNoYW5nZWAgaW5zdGFuY2VzLilcbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgdW5jaGFuZ2VkSW5wdXRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4sIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIG5ldyBjb21wb25lbnQgaWYgb25lIGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCBhbmQgY2FuY2VscyBhbnkgc2NoZWR1bGVkXG4gICAqIGRlc3RydWN0aW9uLlxuICAgKi9cbiAgY29ubmVjdChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIG1hcmtlZCB0byBiZSBkZXN0cm95ZWQsIGNhbmNlbCB0aGUgdGFzayBzaW5jZSB0aGUgY29tcG9uZW50IHdhcyByZWNvbm5lY3RlZFxuICAgIGlmICh0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4oKTtcbiAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICB0aGlzLmluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBzb21lIHNtYWxsIGRlbGF5IGluIGNhc2UgdGhlIGVsZW1lbnQgaXMganVzdFxuICAgKiBiZWluZyBtb3ZlZCBhY3Jvc3MgdGhlIERPTS5cbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgLy8gUmV0dXJuIGlmIHRoZXJlIGlzIG5vIGNvbXBvbmVudFJlZiBvciB0aGUgY29tcG9uZW50IGlzIGFscmVhZHkgc2NoZWR1bGVkIGZvciBkZXN0cnVjdGlvblxuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYgfHwgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTY2hlZHVsZSB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBhIHNtYWxsIHRpbWVvdXQgaW4gY2FzZSBpdCBpcyBiZWluZ1xuICAgIC8vIG1vdmVkIGVsc2V3aGVyZSBpbiB0aGUgRE9NXG4gICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBzY2hlZHVsZXIuc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50UmVmICEuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiA9IG51bGw7XG4gICAgICB9XG4gICAgfSwgREVTVFJPWV9ERUxBWSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IHByb3BlcnR5IHZhbHVlLiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIHJldHJpZXZlZCBmcm9tIHRoZSBjYWNoZWQgaW5pdGlhbGl6YXRpb24gdmFsdWVzLlxuICAgKi9cbiAgZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogYW55IHtcbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BlcnR5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIGFueSlbcHJvcGVydHldO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGlucHV0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogY2FjaGVkIGFuZCBzZXQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBzZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5zZXQocHJvcGVydHksIHZhbHVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZ25vcmUgdGhlIHZhbHVlIGlmIGl0IGlzIHN0cmljdGx5IGVxdWFsIHRvIHRoZSBjdXJyZW50IHZhbHVlLCBleGNlcHQgaWYgaXQgaXMgYHVuZGVmaW5lZGBcbiAgICAvLyBhbmQgdGhpcyBpcyB0aGUgZmlyc3QgY2hhbmdlIHRvIHRoZSB2YWx1ZSAoYmVjYXVzZSBhbiBleHBsaWNpdCBgdW5kZWZpbmVkYCBfaXNfIHN0cmljdGx5XG4gICAgLy8gZXF1YWwgdG8gbm90IGhhdmluZyBhIHZhbHVlIHNldCBhdCBhbGwsIGJ1dCB3ZSBzdGlsbCBuZWVkIHRvIHJlY29yZCB0aGlzIGFzIGEgY2hhbmdlKS5cbiAgICBpZiAoc3RyaWN0RXF1YWxzKHZhbHVlLCB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpKSAmJlxuICAgICAgICAhKCh2YWx1ZSA9PT0gdW5kZWZpbmVkKSAmJiB0aGlzLnVuY2hhbmdlZElucHV0cy5oYXMocHJvcGVydHkpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHksIHZhbHVlKTtcbiAgICAodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55KVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICB0aGlzLnNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29tcG9uZW50IHRocm91Z2ggdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlIHByb3ZpZGVkIGVsZW1lbnQgaG9zdCBhbmRcbiAgICogc2V0cyB1cCBpdHMgaW5pdGlhbCBpbnB1dHMsIGxpc3RlbnMgZm9yIG91dHB1dHMgY2hhbmdlcywgYW5kIHJ1bnMgYW4gaW5pdGlhbCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZEluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IFtdLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3J9KTtcbiAgICBjb25zdCBwcm9qZWN0YWJsZU5vZGVzID1cbiAgICAgICAgZXh0cmFjdFByb2plY3RhYmxlTm9kZXMoZWxlbWVudCwgdGhpcy5jb21wb25lbnRGYWN0b3J5Lm5nQ29udGVudFNlbGVjdG9ycyk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSB0aGlzLmNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNoaWxkSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIGVsZW1lbnQpO1xuXG4gICAgdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzID1cbiAgICAgICAgaXNGdW5jdGlvbigodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55IGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplSW5wdXRzKCk7XG4gICAgdGhpcy5pbml0aWFsaXplT3V0cHV0cygpO1xuXG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvblJlZiA9IHRoaXMuaW5qZWN0b3IuZ2V0PEFwcGxpY2F0aW9uUmVmPihBcHBsaWNhdGlvblJlZik7XG4gICAgYXBwbGljYXRpb25SZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gIH1cblxuICAvKiogU2V0IGFueSBzdG9yZWQgaW5pdGlhbCBpbnB1dHMgb24gdGhlIGNvbXBvbmVudCdzIHByb3BlcnRpZXMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplSW5wdXRzKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lfSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgICAvLyBJZiB0aGUgY29tcG9uZW50IGltcGxlbWVudHMgYG5nT25DaGFuZ2VzKClgLCBrZWVwIHRyYWNrIG9mIHdoaWNoIGlucHV0cyBoYXZlIG5ldmVyXG4gICAgICAgIC8vIGNoYW5nZWQgc28gZmFyLlxuICAgICAgICB0aGlzLnVuY2hhbmdlZElucHV0cy5hZGQocHJvcE5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuaGFzKHByb3BOYW1lKSkge1xuICAgICAgICAvLyBDYWxsIGBzZXRJbnB1dFZhbHVlKClgIG5vdyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHRvIHVwZGF0ZSBpdHNcbiAgICAgICAgLy8gcHJvcGVydGllcyBhbmQgZmlyZSBgbmdPbkNoYW5nZXMoKWAuXG4gICAgICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BOYW1lKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIFNldHMgdXAgbGlzdGVuZXJzIGZvciB0aGUgY29tcG9uZW50J3Mgb3V0cHV0cyBzbyB0aGF0IHRoZSBldmVudHMgc3RyZWFtIGVtaXRzIHRoZSBldmVudHMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplT3V0cHV0cygpOiB2b2lkIHtcbiAgICBjb25zdCBldmVudEVtaXR0ZXJzID0gdGhpcy5jb21wb25lbnRGYWN0b3J5Lm91dHB1dHMubWFwKCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pID0+IHtcbiAgICAgIGNvbnN0IGVtaXR0ZXIgPSAodGhpcy5jb21wb25lbnRSZWYgIS5pbnN0YW5jZSBhcyBhbnkpW3Byb3BOYW1lXSBhcyBFdmVudEVtaXR0ZXI8YW55PjtcbiAgICAgIHJldHVybiBlbWl0dGVyLnBpcGUobWFwKCh2YWx1ZTogYW55KSA9PiAoe25hbWU6IHRlbXBsYXRlTmFtZSwgdmFsdWV9KSkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5ldmVudHMgPSBtZXJnZSguLi5ldmVudEVtaXR0ZXJzKTtcbiAgfVxuXG4gIC8qKiBDYWxscyBuZ09uQ2hhbmdlcyB3aXRoIGFsbCB0aGUgaW5wdXRzIHRoYXQgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGNhbGwuICovXG4gIHByb3RlY3RlZCBjYWxsTmdPbkNoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgfHwgdGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDYWNoZSB0aGUgY2hhbmdlcyBhbmQgc2V0IGlucHV0Q2hhbmdlcyB0byBudWxsIHRvIGNhcHR1cmUgYW55IGNoYW5nZXMgdGhhdCBtaWdodCBvY2N1clxuICAgIC8vIGR1cmluZyBuZ09uQ2hhbmdlcy5cbiAgICBjb25zdCBpbnB1dENoYW5nZXMgPSB0aGlzLmlucHV0Q2hhbmdlcztcbiAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IG51bGw7XG4gICAgKHRoaXMuY29tcG9uZW50UmVmICEuaW5zdGFuY2UgYXMgYW55IGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMoaW5wdXRDaGFuZ2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgY2hhbmdlIGRldGVjdGlvbiB0byBydW4gb24gdGhlIGNvbXBvbmVudC5cbiAgICogSWdub3JlcyBzdWJzZXF1ZW50IGNhbGxzIGlmIGFscmVhZHkgc2NoZWR1bGVkLlxuICAgKi9cbiAgcHJvdGVjdGVkIHNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25Gbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBzY2hlZHVsZXIuc2NoZWR1bGVCZWZvcmVSZW5kZXIoKCkgPT4ge1xuICAgICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IG51bGw7XG4gICAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmRzIGlucHV0IGNoYW5nZXMgc28gdGhhdCB0aGUgY29tcG9uZW50IHJlY2VpdmVzIFNpbXBsZUNoYW5nZXMgaW4gaXRzIG9uQ2hhbmdlcyBmdW5jdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCByZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eTogc3RyaW5nLCBjdXJyZW50VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIC8vIERvIG5vdCByZWNvcmQgdGhlIGNoYW5nZSBpZiB0aGUgY29tcG9uZW50IGRvZXMgbm90IGltcGxlbWVudCBgT25DaGFuZ2VzYC5cbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgJiYgIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5pbnB1dENoYW5nZXMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBhbHJlYWR5IGlzIGEgY2hhbmdlLCBtb2RpZnkgdGhlIGN1cnJlbnQgdmFsdWUgdG8gbWF0Y2ggYnV0IGxlYXZlIHRoZSB2YWx1ZXMgZm9yXG4gICAgLy8gcHJldmlvdXNWYWx1ZSBhbmQgaXNGaXJzdENoYW5nZS5cbiAgICBjb25zdCBwZW5kaW5nQ2hhbmdlID0gdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldO1xuICAgIGlmIChwZW5kaW5nQ2hhbmdlKSB7XG4gICAgICBwZW5kaW5nQ2hhbmdlLmN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0ZpcnN0Q2hhbmdlID0gdGhpcy51bmNoYW5nZWRJbnB1dHMuaGFzKHByb3BlcnR5KTtcbiAgICB0aGlzLnVuY2hhbmdlZElucHV0cy5kZWxldGUocHJvcGVydHkpO1xuXG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGlzRmlyc3RDaGFuZ2UgPyB1bmRlZmluZWQgOiB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XSA9IG5ldyBTaW1wbGVDaGFuZ2UocHJldmlvdXNWYWx1ZSwgY3VycmVudFZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2FsbE5nT25DaGFuZ2VzKCk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgIS5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbn1cbiJdfQ==