/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
        this.scheduledDestroyFn = scheduler.schedule(() => {
            if (this.componentRef) {
                (/** @type {?} */ (this.componentRef)).destroy();
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
        if (strictEquals(value, this.getInputValue(property))) {
            return;
        }
        if (!this.componentRef) {
            this.initialInputValues.set(property, value);
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
        this.componentFactory.inputs.forEach(({ propName }) => {
            /** @type {?} */
            const initialValue = this.initialInputValues.get(propName);
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
     * @protected
     * @return {?}
     */
    initializeOutputs() {
        /** @type {?} */
        const eventEmitters = this.componentFactory.outputs.map(({ propName, templateName }) => {
            /** @type {?} */
            const emitter = (/** @type {?} */ (((/** @type {?} */ ((/** @type {?} */ (this.componentRef)).instance)))[propName]));
            return emitter.pipe(map((value) => ({ name: templateName, value })));
        });
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
        this.scheduledChangeDetectionFn = scheduler.scheduleBeforeRender(() => {
            this.scheduledChangeDetectionFn = null;
            this.detectChanges();
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFvQix3QkFBd0IsRUFBOEIsUUFBUSxFQUFhLFlBQVksRUFBc0IsTUFBTSxlQUFlLENBQUM7QUFDN0ssT0FBTyxFQUFhLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2QyxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHbkMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7OztNQUd0RCxhQUFhLEdBQUcsRUFBRTs7Ozs7OztBQVF4QixNQUFNLE9BQU8saUNBQWlDOzs7OztJQUc1QyxZQUFvQixTQUFvQixFQUFVLFFBQWtCO1FBQWhELGNBQVMsR0FBVCxTQUFTLENBQVc7UUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFVO1FBQ2xFLElBQUksQ0FBQyxnQkFBZ0I7WUFDakIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7Ozs7O0lBRUQsTUFBTSxDQUFDLFFBQWtCO1FBQ3ZCLE9BQU8sSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekUsQ0FBQztDQUNGOzs7SUFWQyw2REFBd0M7Ozs7O0lBRTVCLHNEQUE0Qjs7Ozs7SUFBRSxxREFBMEI7Ozs7Ozs7O0FBZ0J0RSxNQUFNLE9BQU8sMEJBQTBCOzs7OztJQTJCckMsWUFBb0IsZ0JBQXVD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OENBQTBCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmLCBDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIENvbXBvbmVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbmplY3RvciwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXMsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge21hcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge05nRWxlbWVudFN0cmF0ZWd5LCBOZ0VsZW1lbnRTdHJhdGVneUV2ZW50LCBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2V4dHJhY3RQcm9qZWN0YWJsZU5vZGVzfSBmcm9tICcuL2V4dHJhY3QtcHJvamVjdGFibGUtbm9kZXMnO1xuaW1wb3J0IHtpc0Z1bmN0aW9uLCBzY2hlZHVsZXIsIHN0cmljdEVxdWFsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKiBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBkZXN0cm95aW5nIHRoZSBjb21wb25lbnQgcmVmIHdoZW4gZGlzY29ubmVjdGVkLiAqL1xuY29uc3QgREVTVFJPWV9ERUxBWSA9IDEwO1xuXG4vKipcbiAqIEZhY3RvcnkgdGhhdCBjcmVhdGVzIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbnN0YW5jZS4gR2V0cyB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGVcbiAqIGNvbnN0cnVjdG9yJ3MgaW5qZWN0b3IncyBmYWN0b3J5IHJlc29sdmVyIGFuZCBwYXNzZXMgdGhhdCBmYWN0b3J5IHRvIGVhY2ggc3RyYXRlZ3kuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IHtcbiAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50OiBUeXBlPGFueT4sIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5ID1cbiAgICAgICAgaW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcikucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgfVxuXG4gIGNyZWF0ZShpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5KHRoaXMuY29tcG9uZW50RmFjdG9yeSwgaW5qZWN0b3IpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgZGVzdHJveXMgYSBjb21wb25lbnQgcmVmIHVzaW5nIGEgY29tcG9uZW50IGZhY3RvcnkgYW5kIGhhbmRsZXMgY2hhbmdlIGRldGVjdGlvblxuICogaW4gcmVzcG9uc2UgdG8gaW5wdXQgY2hhbmdlcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgLyoqIE1lcmdlZCBzdHJlYW0gb2YgdGhlIGNvbXBvbmVudCdzIG91dHB1dCBldmVudHMuICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBldmVudHMgITogT2JzZXJ2YWJsZTxOZ0VsZW1lbnRTdHJhdGVneUV2ZW50PjtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnQgdGhhdCB3YXMgY3JlYXRlZCBvbiBjb25uZWN0LiAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBjb21wb25lbnRSZWYgITogQ29tcG9uZW50UmVmPGFueT58IG51bGw7XG5cbiAgLyoqIENoYW5nZXMgdGhhdCBoYXZlIGJlZW4gbWFkZSB0byB0aGUgY29tcG9uZW50IHJlZiBzaW5jZSB0aGUgbGFzdCB0aW1lIG9uQ2hhbmdlcyB3YXMgY2FsbGVkLiAqL1xuICBwcml2YXRlIGlucHV0Q2hhbmdlczogU2ltcGxlQ2hhbmdlc3xudWxsID0gbnVsbDtcblxuICAvKiogV2hldGhlciB0aGUgY3JlYXRlZCBjb21wb25lbnQgaW1wbGVtZW50cyB0aGUgb25DaGFuZ2VzIGZ1bmN0aW9uLiAqL1xuICBwcml2YXRlIGltcGxlbWVudHNPbkNoYW5nZXMgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBhIGNoYW5nZSBkZXRlY3Rpb24gaGFzIGJlZW4gc2NoZWR1bGVkIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgLyoqIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd2hlbiBjYWxsZWQgd2lsbCBjYW5jZWwgYSBzY2hlZHVsZWQgZGVzdHJ1Y3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWREZXN0cm95Rm46ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAvKiogSW5pdGlhbCBpbnB1dCB2YWx1ZXMgdGhhdCB3ZXJlIHNldCBiZWZvcmUgdGhlIGNvbXBvbmVudCB3YXMgY3JlYXRlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBpbml0aWFsSW5wdXRWYWx1ZXMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xuXG4gIC8qKiBTZXQgb2YgaW5wdXRzIHRoYXQgd2VyZSBub3QgaW5pdGlhbGx5IHNldCB3aGVuIHRoZSBjb21wb25lbnQgd2FzIGNyZWF0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgdW5pbml0aWFsaXplZElucHV0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+LCBwcml2YXRlIGluamVjdG9yOiBJbmplY3Rvcikge31cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBuZXcgY29tcG9uZW50IGlmIG9uZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgYW5kIGNhbmNlbHMgYW55IHNjaGVkdWxlZFxuICAgKiBkZXN0cnVjdGlvbi5cbiAgICovXG4gIGNvbm5lY3QoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBtYXJrZWQgdG8gYmUgZGVzdHJveWVkLCBjYW5jZWwgdGhlIHRhc2sgc2luY2UgdGhlIGNvbXBvbmVudCB3YXMgcmVjb25uZWN0ZWRcbiAgICBpZiAodGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuKCk7XG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgdGhpcy5pbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgc29tZSBzbWFsbCBkZWxheSBpbiBjYXNlIHRoZSBlbGVtZW50IGlzIGp1c3RcbiAgICogYmVpbmcgbW92ZWQgYWNyb3NzIHRoZSBET00uXG4gICAqL1xuICBkaXNjb25uZWN0KCkge1xuICAgIC8vIFJldHVybiBpZiB0aGVyZSBpcyBubyBjb21wb25lbnRSZWYgb3IgdGhlIGNvbXBvbmVudCBpcyBhbHJlYWR5IHNjaGVkdWxlZCBmb3IgZGVzdHJ1Y3Rpb25cbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmIHx8IHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU2NoZWR1bGUgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgYSBzbWFsbCB0aW1lb3V0IGluIGNhc2UgaXQgaXMgYmVpbmdcbiAgICAvLyBtb3ZlZCBlbHNld2hlcmUgaW4gdGhlIERPTVxuICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gc2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiAhLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWYgPSBudWxsO1xuICAgICAgfVxuICAgIH0sIERFU1RST1lfREVMQVkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB2YWx1ZS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiByZXRyaWV2ZWQgZnJvbSB0aGUgY2FjaGVkIGluaXRpYWxpemF0aW9uIHZhbHVlcy5cbiAgICovXG4gIGdldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZyk6IGFueSB7XG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmdldChwcm9wZXJ0eSk7XG4gICAgfVxuXG4gICAgcmV0dXJuICh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkpW3Byb3BlcnR5XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnB1dCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIGNhY2hlZCBhbmQgc2V0IHdoZW4gdGhlIGNvbXBvbmVudCBpcyBjcmVhdGVkLlxuICAgKi9cbiAgc2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgaWYgKHN0cmljdEVxdWFscyh2YWx1ZSwgdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5zZXQocHJvcGVydHksIHZhbHVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgKHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIGFueSlbcHJvcGVydHldID0gdmFsdWU7XG4gICAgdGhpcy5zY2hlZHVsZURldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudCB0aHJvdWdoIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZSBwcm92aWRlZCBlbGVtZW50IGhvc3QgYW5kXG4gICAqIHNldHMgdXAgaXRzIGluaXRpYWwgaW5wdXRzLCBsaXN0ZW5zIGZvciBvdXRwdXRzIGNoYW5nZXMsIGFuZCBydW5zIGFuIGluaXRpYWwgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgY2hpbGRJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBbXSwgcGFyZW50OiB0aGlzLmluamVjdG9yfSk7XG4gICAgY29uc3QgcHJvamVjdGFibGVOb2RlcyA9XG4gICAgICAgIGV4dHJhY3RQcm9qZWN0YWJsZU5vZGVzKGVsZW1lbnQsIHRoaXMuY29tcG9uZW50RmFjdG9yeS5uZ0NvbnRlbnRTZWxlY3RvcnMpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmID0gdGhpcy5jb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjaGlsZEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCBlbGVtZW50KTtcblxuICAgIHRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyA9XG4gICAgICAgIGlzRnVuY3Rpb24oKHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIGFueSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZUlucHV0cygpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZU91dHB1dHMoKTtcblxuICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgY29uc3QgYXBwbGljYXRpb25SZWYgPSB0aGlzLmluamVjdG9yLmdldDxBcHBsaWNhdGlvblJlZj4oQXBwbGljYXRpb25SZWYpO1xuICAgIGFwcGxpY2F0aW9uUmVmLmF0dGFjaFZpZXcodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICB9XG5cbiAgLyoqIFNldCBhbnkgc3RvcmVkIGluaXRpYWwgaW5wdXRzIG9uIHRoZSBjb21wb25lbnQncyBwcm9wZXJ0aWVzLiAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZUlucHV0cygpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnkuaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZX0pID0+IHtcbiAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmdldChwcm9wTmFtZSk7XG4gICAgICBpZiAoaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgaW5pdGlhbFZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEtlZXAgdHJhY2sgb2YgaW5wdXRzIHRoYXQgd2VyZSBub3QgaW5pdGlhbGl6ZWQgaW4gY2FzZSB3ZSBuZWVkIHRvIGtub3cgdGhpcyBmb3JcbiAgICAgICAgLy8gY2FsbGluZyBuZ09uQ2hhbmdlcyB3aXRoIFNpbXBsZUNoYW5nZXNcbiAgICAgICAgdGhpcy51bmluaXRpYWxpemVkSW5wdXRzLmFkZChwcm9wTmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIFNldHMgdXAgbGlzdGVuZXJzIGZvciB0aGUgY29tcG9uZW50J3Mgb3V0cHV0cyBzbyB0aGF0IHRoZSBldmVudHMgc3RyZWFtIGVtaXRzIHRoZSBldmVudHMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplT3V0cHV0cygpOiB2b2lkIHtcbiAgICBjb25zdCBldmVudEVtaXR0ZXJzID0gdGhpcy5jb21wb25lbnRGYWN0b3J5Lm91dHB1dHMubWFwKCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pID0+IHtcbiAgICAgIGNvbnN0IGVtaXR0ZXIgPSAodGhpcy5jb21wb25lbnRSZWYgIS5pbnN0YW5jZSBhcyBhbnkpW3Byb3BOYW1lXSBhcyBFdmVudEVtaXR0ZXI8YW55PjtcbiAgICAgIHJldHVybiBlbWl0dGVyLnBpcGUobWFwKCh2YWx1ZTogYW55KSA9PiAoe25hbWU6IHRlbXBsYXRlTmFtZSwgdmFsdWV9KSkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5ldmVudHMgPSBtZXJnZSguLi5ldmVudEVtaXR0ZXJzKTtcbiAgfVxuXG4gIC8qKiBDYWxscyBuZ09uQ2hhbmdlcyB3aXRoIGFsbCB0aGUgaW5wdXRzIHRoYXQgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGNhbGwuICovXG4gIHByb3RlY3RlZCBjYWxsTmdPbkNoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgfHwgdGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDYWNoZSB0aGUgY2hhbmdlcyBhbmQgc2V0IGlucHV0Q2hhbmdlcyB0byBudWxsIHRvIGNhcHR1cmUgYW55IGNoYW5nZXMgdGhhdCBtaWdodCBvY2N1clxuICAgIC8vIGR1cmluZyBuZ09uQ2hhbmdlcy5cbiAgICBjb25zdCBpbnB1dENoYW5nZXMgPSB0aGlzLmlucHV0Q2hhbmdlcztcbiAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IG51bGw7XG4gICAgKHRoaXMuY29tcG9uZW50UmVmICEuaW5zdGFuY2UgYXMgYW55IGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMoaW5wdXRDaGFuZ2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgY2hhbmdlIGRldGVjdGlvbiB0byBydW4gb24gdGhlIGNvbXBvbmVudC5cbiAgICogSWdub3JlcyBzdWJzZXF1ZW50IGNhbGxzIGlmIGFscmVhZHkgc2NoZWR1bGVkLlxuICAgKi9cbiAgcHJvdGVjdGVkIHNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25Gbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBzY2hlZHVsZXIuc2NoZWR1bGVCZWZvcmVSZW5kZXIoKCkgPT4ge1xuICAgICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IG51bGw7XG4gICAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmRzIGlucHV0IGNoYW5nZXMgc28gdGhhdCB0aGUgY29tcG9uZW50IHJlY2VpdmVzIFNpbXBsZUNoYW5nZXMgaW4gaXRzIG9uQ2hhbmdlcyBmdW5jdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCByZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eTogc3RyaW5nLCBjdXJyZW50VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIC8vIERvIG5vdCByZWNvcmQgdGhlIGNoYW5nZSBpZiB0aGUgY29tcG9uZW50IGRvZXMgbm90IGltcGxlbWVudCBgT25DaGFuZ2VzYC5cbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgJiYgIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5pbnB1dENoYW5nZXMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBhbHJlYWR5IGlzIGEgY2hhbmdlLCBtb2RpZnkgdGhlIGN1cnJlbnQgdmFsdWUgdG8gbWF0Y2ggYnV0IGxlYXZlIHRoZSB2YWx1ZXMgZm9yXG4gICAgLy8gcHJldmlvdXNWYWx1ZSBhbmQgaXNGaXJzdENoYW5nZS5cbiAgICBjb25zdCBwZW5kaW5nQ2hhbmdlID0gdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldO1xuICAgIGlmIChwZW5kaW5nQ2hhbmdlKSB7XG4gICAgICBwZW5kaW5nQ2hhbmdlLmN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0ZpcnN0Q2hhbmdlID0gdGhpcy51bmluaXRpYWxpemVkSW5wdXRzLmhhcyhwcm9wZXJ0eSk7XG4gICAgdGhpcy51bmluaXRpYWxpemVkSW5wdXRzLmRlbGV0ZShwcm9wZXJ0eSk7XG5cbiAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gaXNGaXJzdENoYW5nZSA/IHVuZGVmaW5lZCA6IHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSk7XG4gICAgdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldID0gbmV3IFNpbXBsZUNoYW5nZShwcmV2aW91c1ZhbHVlLCBjdXJyZW50VmFsdWUsIGlzRmlyc3RDaGFuZ2UpO1xuICB9XG5cbiAgLyoqIFJ1bnMgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcm90ZWN0ZWQgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsTmdPbkNoYW5nZXMoKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiAhLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxufVxuIl19