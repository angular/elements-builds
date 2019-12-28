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
        if (strictEquals(value, this.getInputValue(property))) {
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
            if (this.initialInputValues.has(propName)) {
                this.setInputValue(propName, this.initialInputValues.get(propName));
            }
            else {
                // Keep track of inputs that were not initialized in case we need to know this for
                // calling ngOnChanges with SimpleChanges
                this.uninitializedInputs.add(propName);
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
        const isFirstChange = this.uninitializedInputs.has(property);
        this.uninitializedInputs.delete(property);
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
     * Set of inputs that were not initially set when the component was created.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.uninitializedInputs;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBb0Isd0JBQXdCLEVBQThCLFFBQVEsRUFBYSxZQUFZLEVBQXNCLE1BQU0sZUFBZSxDQUFDO0FBQzdLLE9BQU8sRUFBYSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdkMsT0FBTyxFQUFDLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR25DLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7TUFHdEQsYUFBYSxHQUFHLEVBQUU7Ozs7Ozs7QUFReEIsTUFBTSxPQUFPLGlDQUFpQzs7Ozs7SUFHNUMsWUFBb0IsU0FBb0IsRUFBVSxRQUFrQjtRQUFoRCxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNsRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ2pCLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRixDQUFDOzs7OztJQUVELE1BQU0sQ0FBQyxRQUFrQjtRQUN2QixPQUFPLElBQUksMEJBQTBCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7Q0FDRjs7O0lBVkMsNkRBQXdDOzs7OztJQUU1QixzREFBNEI7Ozs7O0lBQUUscURBQTBCOzs7Ozs7OztBQWdCdEUsTUFBTSxPQUFPLDBCQUEwQjs7Ozs7SUEyQnJDLFlBQW9CLGdCQUF1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RDs7Ozs7SUFFN0Msc0RBQStDOzs7OztJQUFFLDhDQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZiwgQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBDb21wb25lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5qZWN0b3IsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgbWVyZ2V9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHttYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lFdmVudCwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtleHRyYWN0UHJvamVjdGFibGVOb2Rlc30gZnJvbSAnLi9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzJztcbmltcG9ydCB7aXNGdW5jdGlvbiwgc2NoZWR1bGVyLCBzdHJpY3RFcXVhbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgZGVzdHJveWluZyB0aGUgY29tcG9uZW50IHJlZiB3aGVuIGRpc2Nvbm5lY3RlZC4gKi9cbmNvbnN0IERFU1RST1lfREVMQVkgPSAxMDtcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW5zdGFuY2UuIEdldHMgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlXG4gKiBjb25zdHJ1Y3RvcidzIGluamVjdG9yJ3MgZmFjdG9yeSByZXNvbHZlciBhbmQgcGFzc2VzIHRoYXQgZmFjdG9yeSB0byBlYWNoIHN0cmF0ZWd5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSB7XG4gIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudDogVHlwZTxhbnk+LCBwcml2YXRlIGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeSA9XG4gICAgICAgIGluamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIH1cblxuICBjcmVhdGUoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSh0aGlzLmNvbXBvbmVudEZhY3RvcnksIGluamVjdG9yKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIGRlc3Ryb3lzIGEgY29tcG9uZW50IHJlZiB1c2luZyBhIGNvbXBvbmVudCBmYWN0b3J5IGFuZCBoYW5kbGVzIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGluIHJlc3BvbnNlIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gIC8qKiBNZXJnZWQgc3RyZWFtIG9mIHRoZSBjb21wb25lbnQncyBvdXRwdXQgZXZlbnRzLiAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZXZlbnRzICE6IE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD47XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHRoYXQgd2FzIGNyZWF0ZWQgb24gY29ubmVjdC4gKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgY29tcG9uZW50UmVmICE6IENvbXBvbmVudFJlZjxhbnk+fCBudWxsO1xuXG4gIC8qKiBDaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG1hZGUgdG8gdGhlIGNvbXBvbmVudCByZWYgc2luY2UgdGhlIGxhc3QgdGltZSBvbkNoYW5nZXMgd2FzIGNhbGxlZC4gKi9cbiAgcHJpdmF0ZSBpbnB1dENoYW5nZXM6IFNpbXBsZUNoYW5nZXN8bnVsbCA9IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNyZWF0ZWQgY29tcG9uZW50IGltcGxlbWVudHMgdGhlIG9uQ2hhbmdlcyBmdW5jdGlvbi4gKi9cbiAgcHJpdmF0ZSBpbXBsZW1lbnRzT25DaGFuZ2VzID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIGhhcyBiZWVuIHNjaGVkdWxlZCB0byBydW4gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdoZW4gY2FsbGVkIHdpbGwgY2FuY2VsIGEgc2NoZWR1bGVkIGRlc3RydWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkRGVzdHJveUZuOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgLyoqIEluaXRpYWwgaW5wdXQgdmFsdWVzIHRoYXQgd2VyZSBzZXQgYmVmb3JlIHRoZSBjb21wb25lbnQgd2FzIGNyZWF0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbElucHV0VmFsdWVzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuICAvKiogU2V0IG9mIGlucHV0cyB0aGF0IHdlcmUgbm90IGluaXRpYWxseSBzZXQgd2hlbiB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHVuaW5pdGlhbGl6ZWRJbnB1dHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PiwgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3IGNvbXBvbmVudCBpZiBvbmUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGFuZCBjYW5jZWxzIGFueSBzY2hlZHVsZWRcbiAgICogZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbWFya2VkIHRvIGJlIGRlc3Ryb3llZCwgY2FuY2VsIHRoZSB0YXNrIHNpbmNlIHRoZSBjb21wb25lbnQgd2FzIHJlY29ubmVjdGVkXG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbigpO1xuICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIHNvbWUgc21hbGwgZGVsYXkgaW4gY2FzZSB0aGUgZWxlbWVudCBpcyBqdXN0XG4gICAqIGJlaW5nIG1vdmVkIGFjcm9zcyB0aGUgRE9NLlxuICAgKi9cbiAgZGlzY29ubmVjdCgpIHtcbiAgICAvLyBSZXR1cm4gaWYgdGhlcmUgaXMgbm8gY29tcG9uZW50UmVmIG9yIHRoZSBjb21wb25lbnQgaXMgYWxyZWFkeSBzY2hlZHVsZWQgZm9yIGRlc3RydWN0aW9uXG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZiB8fCB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNjaGVkdWxlIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIGEgc21hbGwgdGltZW91dCBpbiBjYXNlIGl0IGlzIGJlaW5nXG4gICAgLy8gbW92ZWQgZWxzZXdoZXJlIGluIHRoZSBET01cbiAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IHNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWYgIS5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50UmVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9LCBERVNUUk9ZX0RFTEFZKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgcHJvcGVydHkgdmFsdWUuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogcmV0cmlldmVkIGZyb20gdGhlIGNhY2hlZCBpbml0aWFsaXphdGlvbiB2YWx1ZXMuXG4gICAqL1xuICBnZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBhbnkge1xuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHJldHVybiB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcGVydHkpO1xuICAgIH1cblxuICAgIHJldHVybiAodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55KVtwcm9wZXJ0eV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5wdXQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiBjYWNoZWQgYW5kIHNldCB3aGVuIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHNldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLnNldChwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzdHJpY3RFcXVhbHModmFsdWUsIHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIHRoaXMuc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb21wb25lbnQgdGhyb3VnaCB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGUgcHJvdmlkZWQgZWxlbWVudCBob3N0IGFuZFxuICAgKiBzZXRzIHVwIGl0cyBpbml0aWFsIGlucHV0cywgbGlzdGVucyBmb3Igb3V0cHV0cyBjaGFuZ2VzLCBhbmQgcnVucyBhbiBpbml0aWFsIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IGNoaWxkSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVyczogW10sIHBhcmVudDogdGhpcy5pbmplY3Rvcn0pO1xuICAgIGNvbnN0IHByb2plY3RhYmxlTm9kZXMgPVxuICAgICAgICBleHRyYWN0UHJvamVjdGFibGVOb2RlcyhlbGVtZW50LCB0aGlzLmNvbXBvbmVudEZhY3RvcnkubmdDb250ZW50U2VsZWN0b3JzKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY2hpbGRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgZWxlbWVudCk7XG5cbiAgICB0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgPVxuICAgICAgICBpc0Z1bmN0aW9uKCh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkgYXMgT25DaGFuZ2VzKS5uZ09uQ2hhbmdlcyk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVJbnB1dHMoKTtcbiAgICB0aGlzLmluaXRpYWxpemVPdXRwdXRzKCk7XG5cbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGNvbnN0IGFwcGxpY2F0aW9uUmVmID0gdGhpcy5pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICBhcHBsaWNhdGlvblJlZi5hdHRhY2hWaWV3KHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIC8qKiBTZXQgYW55IHN0b3JlZCBpbml0aWFsIGlucHV0cyBvbiB0aGUgY29tcG9uZW50J3MgcHJvcGVydGllcy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVJbnB1dHMoKTogdm9pZCB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5LmlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWV9KSA9PiB7XG4gICAgICBpZiAodGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuaGFzKHByb3BOYW1lKSkge1xuICAgICAgICB0aGlzLnNldElucHV0VmFsdWUocHJvcE5hbWUsIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmdldChwcm9wTmFtZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBpbnB1dHMgdGhhdCB3ZXJlIG5vdCBpbml0aWFsaXplZCBpbiBjYXNlIHdlIG5lZWQgdG8ga25vdyB0aGlzIGZvclxuICAgICAgICAvLyBjYWxsaW5nIG5nT25DaGFuZ2VzIHdpdGggU2ltcGxlQ2hhbmdlc1xuICAgICAgICB0aGlzLnVuaW5pdGlhbGl6ZWRJbnB1dHMuYWRkKHByb3BOYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogU2V0cyB1cCBsaXN0ZW5lcnMgZm9yIHRoZSBjb21wb25lbnQncyBvdXRwdXRzIHNvIHRoYXQgdGhlIGV2ZW50cyBzdHJlYW0gZW1pdHMgdGhlIGV2ZW50cy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVPdXRwdXRzKCk6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50RW1pdHRlcnMgPSB0aGlzLmNvbXBvbmVudEZhY3Rvcnkub3V0cHV0cy5tYXAoKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSkgPT4ge1xuICAgICAgY29uc3QgZW1pdHRlciA9ICh0aGlzLmNvbXBvbmVudFJlZiAhLmluc3RhbmNlIGFzIGFueSlbcHJvcE5hbWVdIGFzIEV2ZW50RW1pdHRlcjxhbnk+O1xuICAgICAgcmV0dXJuIGVtaXR0ZXIucGlwZShtYXAoKHZhbHVlOiBhbnkpID0+ICh7bmFtZTogdGVtcGxhdGVOYW1lLCB2YWx1ZX0pKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmV2ZW50cyA9IG1lcmdlKC4uLmV2ZW50RW1pdHRlcnMpO1xuICB9XG5cbiAgLyoqIENhbGxzIG5nT25DaGFuZ2VzIHdpdGggYWxsIHRoZSBpbnB1dHMgdGhhdCBoYXZlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbC4gKi9cbiAgcHJvdGVjdGVkIGNhbGxOZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyB8fCB0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENhY2hlIHRoZSBjaGFuZ2VzIGFuZCBzZXQgaW5wdXRDaGFuZ2VzIHRvIG51bGwgdG8gY2FwdHVyZSBhbnkgY2hhbmdlcyB0aGF0IG1pZ2h0IG9jY3VyXG4gICAgLy8gZHVyaW5nIG5nT25DaGFuZ2VzLlxuICAgIGNvbnN0IGlucHV0Q2hhbmdlcyA9IHRoaXMuaW5wdXRDaGFuZ2VzO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0gbnVsbDtcbiAgICAodGhpcy5jb21wb25lbnRSZWYgIS5pbnN0YW5jZSBhcyBhbnkgYXMgT25DaGFuZ2VzKS5uZ09uQ2hhbmdlcyhpbnB1dENoYW5nZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LlxuICAgKiBJZ25vcmVzIHN1YnNlcXVlbnQgY2FsbHMgaWYgYWxyZWFkeSBzY2hlZHVsZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IHNjaGVkdWxlci5zY2hlZHVsZUJlZm9yZVJlbmRlcigoKSA9PiB7XG4gICAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gbnVsbDtcbiAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgaW5wdXQgY2hhbmdlcyBzbyB0aGF0IHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgU2ltcGxlQ2hhbmdlcyBpbiBpdHMgb25DaGFuZ2VzIGZ1bmN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5OiBzdHJpbmcsIGN1cnJlbnRWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgLy8gRG8gbm90IHJlY29yZCB0aGUgY2hhbmdlIGlmIHRoZSBjb21wb25lbnQgZG9lcyBub3QgaW1wbGVtZW50IGBPbkNoYW5nZXNgLlxuICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiAmJiAhdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5wdXRDaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IHt9O1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGFscmVhZHkgaXMgYSBjaGFuZ2UsIG1vZGlmeSB0aGUgY3VycmVudCB2YWx1ZSB0byBtYXRjaCBidXQgbGVhdmUgdGhlIHZhbHVlcyBmb3JcbiAgICAvLyBwcmV2aW91c1ZhbHVlIGFuZCBpc0ZpcnN0Q2hhbmdlLlxuICAgIGNvbnN0IHBlbmRpbmdDaGFuZ2UgPSB0aGlzLmlucHV0Q2hhbmdlc1twcm9wZXJ0eV07XG4gICAgaWYgKHBlbmRpbmdDaGFuZ2UpIHtcbiAgICAgIHBlbmRpbmdDaGFuZ2UuY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzRmlyc3RDaGFuZ2UgPSB0aGlzLnVuaW5pdGlhbGl6ZWRJbnB1dHMuaGFzKHByb3BlcnR5KTtcbiAgICB0aGlzLnVuaW5pdGlhbGl6ZWRJbnB1dHMuZGVsZXRlKHByb3BlcnR5KTtcblxuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSBpc0ZpcnN0Q2hhbmdlID8gdW5kZWZpbmVkIDogdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KTtcbiAgICB0aGlzLmlucHV0Q2hhbmdlc1twcm9wZXJ0eV0gPSBuZXcgU2ltcGxlQ2hhbmdlKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRWYWx1ZSwgaXNGaXJzdENoYW5nZSk7XG4gIH1cblxuICAvKiogUnVucyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByb3RlY3RlZCBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxOZ09uQ2hhbmdlcygpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmICEuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG59XG4iXX0=