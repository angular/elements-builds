/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
/** *
 * Time in milliseconds to wait before destroying the component ref when disconnected.
  @type {?} */
const DESTROY_DELAY = 10;
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
if (false) {
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
        /** @type {?} */
        const childInjector = Injector.create({ providers: [], parent: this.injector });
        /** @type {?} */
        const projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.implementsOnChanges =
            isFunction((/** @type {?} */ ((this.componentRef.instance))).ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs();
        this.detectChanges();
        /** @type {?} */
        const applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    }
    /**
     * Set any stored initial inputs on the component's properties.
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
     * @return {?}
     */
    initializeOutputs() {
        /** @type {?} */
        const eventEmitters = this.componentFactory.outputs.map(({ propName, templateName }) => {
            /** @type {?} */
            const emitter = /** @type {?} */ ((/** @type {?} */ (((this.componentRef)).instance))[propName]);
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
        /** @type {?} */
        const inputChanges = this.inputChanges;
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
if (false) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFvQix3QkFBd0IsRUFBOEIsUUFBUSxFQUFhLFlBQVksRUFBc0IsTUFBTSxlQUFlLENBQUM7QUFDN0ssT0FBTyxFQUFhLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2QyxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHbkMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7O0FBRzVELE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQzs7Ozs7OztBQVF6QixNQUFNOzs7OztJQUdKLFlBQW9CLFNBQW9CLEVBQVUsUUFBa0I7UUFBaEQsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUFVLGFBQVEsR0FBUixRQUFRLENBQVU7UUFDbEUsSUFBSSxDQUFDLGdCQUFnQjtZQUNqQixRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDL0U7Ozs7O0lBRUQsTUFBTSxDQUFDLFFBQWtCO1FBQ3ZCLE9BQU8sSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDeEU7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7O0FBUUQsTUFBTTs7Ozs7SUEyQkosWUFBb0IsZ0JBQXVDLEVBQVUsUUFBa0I7UUFBbkUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF1QjtRQUFVLGFBQVEsR0FBUixRQUFRLENBQVU7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LE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9FLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxZQUFZLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztLQUM1Rjs7Ozs7SUFHUyxhQUFhO1FBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3RCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztVQUN2QixJQUFJLENBQUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDLGFBQWE7S0FDcEQ7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZiwgQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBDb21wb25lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5qZWN0b3IsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgbWVyZ2V9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHttYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lFdmVudCwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtleHRyYWN0UHJvamVjdGFibGVOb2Rlc30gZnJvbSAnLi9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzJztcbmltcG9ydCB7aXNGdW5jdGlvbiwgc2NoZWR1bGVyLCBzdHJpY3RFcXVhbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgZGVzdHJveWluZyB0aGUgY29tcG9uZW50IHJlZiB3aGVuIGRpc2Nvbm5lY3RlZC4gKi9cbmNvbnN0IERFU1RST1lfREVMQVkgPSAxMDtcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW5zdGFuY2UuIEdldHMgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlXG4gKiBjb25zdHJ1Y3RvcidzIGluamVjdG9yJ3MgZmFjdG9yeSByZXNvbHZlciBhbmQgcGFzc2VzIHRoYXQgZmFjdG9yeSB0byBlYWNoIHN0cmF0ZWd5LlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSB7XG4gIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudDogVHlwZTxhbnk+LCBwcml2YXRlIGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeSA9XG4gICAgICAgIGluamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIH1cblxuICBjcmVhdGUoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSh0aGlzLmNvbXBvbmVudEZhY3RvcnksIGluamVjdG9yKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIGRlc3Ryb3lzIGEgY29tcG9uZW50IHJlZiB1c2luZyBhIGNvbXBvbmVudCBmYWN0b3J5IGFuZCBoYW5kbGVzIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGluIHJlc3BvbnNlIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gIC8qKiBNZXJnZWQgc3RyZWFtIG9mIHRoZSBjb21wb25lbnQncyBvdXRwdXQgZXZlbnRzLiAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZXZlbnRzICE6IE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD47XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHRoYXQgd2FzIGNyZWF0ZWQgb24gY29ubmVjdC4gKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgY29tcG9uZW50UmVmICE6IENvbXBvbmVudFJlZjxhbnk+fCBudWxsO1xuXG4gIC8qKiBDaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG1hZGUgdG8gdGhlIGNvbXBvbmVudCByZWYgc2luY2UgdGhlIGxhc3QgdGltZSBvbkNoYW5nZXMgd2FzIGNhbGxlZC4gKi9cbiAgcHJpdmF0ZSBpbnB1dENoYW5nZXM6IFNpbXBsZUNoYW5nZXN8bnVsbCA9IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNyZWF0ZWQgY29tcG9uZW50IGltcGxlbWVudHMgdGhlIG9uQ2hhbmdlcyBmdW5jdGlvbi4gKi9cbiAgcHJpdmF0ZSBpbXBsZW1lbnRzT25DaGFuZ2VzID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIGhhcyBiZWVuIHNjaGVkdWxlZCB0byBydW4gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdoZW4gY2FsbGVkIHdpbGwgY2FuY2VsIGEgc2NoZWR1bGVkIGRlc3RydWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkRGVzdHJveUZuOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgLyoqIEluaXRpYWwgaW5wdXQgdmFsdWVzIHRoYXQgd2VyZSBzZXQgYmVmb3JlIHRoZSBjb21wb25lbnQgd2FzIGNyZWF0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbElucHV0VmFsdWVzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuICAvKiogU2V0IG9mIGlucHV0cyB0aGF0IHdlcmUgbm90IGluaXRpYWxseSBzZXQgd2hlbiB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHVuaW5pdGlhbGl6ZWRJbnB1dHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PiwgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3IGNvbXBvbmVudCBpZiBvbmUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGFuZCBjYW5jZWxzIGFueSBzY2hlZHVsZWRcbiAgICogZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbWFya2VkIHRvIGJlIGRlc3Ryb3llZCwgY2FuY2VsIHRoZSB0YXNrIHNpbmNlIHRoZSBjb21wb25lbnQgd2FzIHJlY29ubmVjdGVkXG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbigpO1xuICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIHNvbWUgc21hbGwgZGVsYXkgaW4gY2FzZSB0aGUgZWxlbWVudCBpcyBqdXN0XG4gICAqIGJlaW5nIG1vdmVkIGFjcm9zcyB0aGUgRE9NLlxuICAgKi9cbiAgZGlzY29ubmVjdCgpIHtcbiAgICAvLyBSZXR1cm4gaWYgdGhlcmUgaXMgbm8gY29tcG9uZW50UmVmIG9yIHRoZSBjb21wb25lbnQgaXMgYWxyZWFkeSBzY2hlZHVsZWQgZm9yIGRlc3RydWN0aW9uXG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZiB8fCB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNjaGVkdWxlIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIGEgc21hbGwgdGltZW91dCBpbiBjYXNlIGl0IGlzIGJlaW5nXG4gICAgLy8gbW92ZWQgZWxzZXdoZXJlIGluIHRoZSBET01cbiAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IHNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWYgIS5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50UmVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9LCBERVNUUk9ZX0RFTEFZKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgcHJvcGVydHkgdmFsdWUuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogcmV0cmlldmVkIGZyb20gdGhlIGNhY2hlZCBpbml0aWFsaXphdGlvbiB2YWx1ZXMuXG4gICAqL1xuICBnZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBhbnkge1xuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHJldHVybiB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcGVydHkpO1xuICAgIH1cblxuICAgIHJldHVybiAodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55KVtwcm9wZXJ0eV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5wdXQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiBjYWNoZWQgYW5kIHNldCB3aGVuIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHNldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGlmIChzdHJpY3RFcXVhbHModmFsdWUsIHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuc2V0KHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIHRoaXMuc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb21wb25lbnQgdGhyb3VnaCB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGUgcHJvdmlkZWQgZWxlbWVudCBob3N0IGFuZFxuICAgKiBzZXRzIHVwIGl0cyBpbml0aWFsIGlucHV0cywgbGlzdGVucyBmb3Igb3V0cHV0cyBjaGFuZ2VzLCBhbmQgcnVucyBhbiBpbml0aWFsIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IGNoaWxkSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVyczogW10sIHBhcmVudDogdGhpcy5pbmplY3Rvcn0pO1xuICAgIGNvbnN0IHByb2plY3RhYmxlTm9kZXMgPVxuICAgICAgICBleHRyYWN0UHJvamVjdGFibGVOb2RlcyhlbGVtZW50LCB0aGlzLmNvbXBvbmVudEZhY3RvcnkubmdDb250ZW50U2VsZWN0b3JzKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY2hpbGRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgZWxlbWVudCk7XG5cbiAgICB0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgPVxuICAgICAgICBpc0Z1bmN0aW9uKCh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBhbnkgYXMgT25DaGFuZ2VzKS5uZ09uQ2hhbmdlcyk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVJbnB1dHMoKTtcbiAgICB0aGlzLmluaXRpYWxpemVPdXRwdXRzKCk7XG5cbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGNvbnN0IGFwcGxpY2F0aW9uUmVmID0gdGhpcy5pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICBhcHBsaWNhdGlvblJlZi5hdHRhY2hWaWV3KHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIC8qKiBTZXQgYW55IHN0b3JlZCBpbml0aWFsIGlucHV0cyBvbiB0aGUgY29tcG9uZW50J3MgcHJvcGVydGllcy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVJbnB1dHMoKTogdm9pZCB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5LmlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWV9KSA9PiB7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPSB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcE5hbWUpO1xuICAgICAgaWYgKGluaXRpYWxWYWx1ZSkge1xuICAgICAgICB0aGlzLnNldElucHV0VmFsdWUocHJvcE5hbWUsIGluaXRpYWxWYWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBLZWVwIHRyYWNrIG9mIGlucHV0cyB0aGF0IHdlcmUgbm90IGluaXRpYWxpemVkIGluIGNhc2Ugd2UgbmVlZCB0byBrbm93IHRoaXMgZm9yXG4gICAgICAgIC8vIGNhbGxpbmcgbmdPbkNoYW5nZXMgd2l0aCBTaW1wbGVDaGFuZ2VzXG4gICAgICAgIHRoaXMudW5pbml0aWFsaXplZElucHV0cy5hZGQocHJvcE5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHVwIGxpc3RlbmVycyBmb3IgdGhlIGNvbXBvbmVudCdzIG91dHB1dHMgc28gdGhhdCB0aGUgZXZlbnRzIHN0cmVhbSBlbWl0cyB0aGUgZXZlbnRzLiAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgY29uc3QgZXZlbnRFbWl0dGVycyA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5vdXRwdXRzLm1hcCgoe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KSA9PiB7XG4gICAgICBjb25zdCBlbWl0dGVyID0gKHRoaXMuY29tcG9uZW50UmVmICEuaW5zdGFuY2UgYXMgYW55KVtwcm9wTmFtZV0gYXMgRXZlbnRFbWl0dGVyPGFueT47XG4gICAgICByZXR1cm4gZW1pdHRlci5waXBlKG1hcCgodmFsdWU6IGFueSkgPT4gKHtuYW1lOiB0ZW1wbGF0ZU5hbWUsIHZhbHVlfSkpKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZXZlbnRzID0gbWVyZ2UoLi4uZXZlbnRFbWl0dGVycyk7XG4gIH1cblxuICAvKiogQ2FsbHMgbmdPbkNoYW5nZXMgd2l0aCBhbGwgdGhlIGlucHV0cyB0aGF0IGhhdmUgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjYWxsLiAqL1xuICBwcm90ZWN0ZWQgY2FsbE5nT25DaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzIHx8IHRoaXMuaW5wdXRDaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2FjaGUgdGhlIGNoYW5nZXMgYW5kIHNldCBpbnB1dENoYW5nZXMgdG8gbnVsbCB0byBjYXB0dXJlIGFueSBjaGFuZ2VzIHRoYXQgbWlnaHQgb2NjdXJcbiAgICAvLyBkdXJpbmcgbmdPbkNoYW5nZXMuXG4gICAgY29uc3QgaW5wdXRDaGFuZ2VzID0gdGhpcy5pbnB1dENoYW5nZXM7XG4gICAgdGhpcy5pbnB1dENoYW5nZXMgPSBudWxsO1xuICAgICh0aGlzLmNvbXBvbmVudFJlZiAhLmluc3RhbmNlIGFzIGFueSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKGlucHV0Q2hhbmdlcyk7XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIGNoYW5nZSBkZXRlY3Rpb24gdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuXG4gICAqIElnbm9yZXMgc3Vic2VxdWVudCBjYWxscyBpZiBhbHJlYWR5IHNjaGVkdWxlZC5cbiAgICovXG4gIHByb3RlY3RlZCBzY2hlZHVsZURldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gc2NoZWR1bGVyLnNjaGVkdWxlQmVmb3JlUmVuZGVyKCgpID0+IHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBudWxsO1xuICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyBpbnB1dCBjaGFuZ2VzIHNvIHRoYXQgdGhlIGNvbXBvbmVudCByZWNlaXZlcyBTaW1wbGVDaGFuZ2VzIGluIGl0cyBvbkNoYW5nZXMgZnVuY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHk6IHN0cmluZywgY3VycmVudFZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICAvLyBEbyBub3QgcmVjb3JkIHRoZSBjaGFuZ2UgaWYgdGhlIGNvbXBvbmVudCBkb2VzIG5vdCBpbXBsZW1lbnQgYE9uQ2hhbmdlc2AuXG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmICYmICF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0ge307XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYWxyZWFkeSBpcyBhIGNoYW5nZSwgbW9kaWZ5IHRoZSBjdXJyZW50IHZhbHVlIHRvIG1hdGNoIGJ1dCBsZWF2ZSB0aGUgdmFsdWVzIGZvclxuICAgIC8vIHByZXZpb3VzVmFsdWUgYW5kIGlzRmlyc3RDaGFuZ2UuXG4gICAgY29uc3QgcGVuZGluZ0NoYW5nZSA9IHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XTtcbiAgICBpZiAocGVuZGluZ0NoYW5nZSkge1xuICAgICAgcGVuZGluZ0NoYW5nZS5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNGaXJzdENoYW5nZSA9IHRoaXMudW5pbml0aWFsaXplZElucHV0cy5oYXMocHJvcGVydHkpO1xuICAgIHRoaXMudW5pbml0aWFsaXplZElucHV0cy5kZWxldGUocHJvcGVydHkpO1xuXG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGlzRmlyc3RDaGFuZ2UgPyB1bmRlZmluZWQgOiB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XSA9IG5ldyBTaW1wbGVDaGFuZ2UocHJldmlvdXNWYWx1ZSwgY3VycmVudFZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2FsbE5nT25DaGFuZ2VzKCk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgIS5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbn1cbiJdfQ==