/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { ApplicationRef, ChangeDetectorRef, ComponentFactoryResolver, Injector, NgZone, SimpleChange, } from '@angular/core';
import { merge, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { extractProjectableNodes } from './extract-projectable-nodes';
import { isFunction, scheduler, strictEquals } from './utils';
/** Time in milliseconds to wait before destroying the component ref when disconnected. */
const DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 */
export class ComponentNgElementStrategyFactory {
    constructor(component, injector) {
        this.componentFactory = injector
            .get(ComponentFactoryResolver)
            .resolveComponentFactory(component);
    }
    create(injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector);
    }
}
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 */
export class ComponentNgElementStrategy {
    constructor(componentFactory, injector) {
        this.componentFactory = componentFactory;
        this.injector = injector;
        // Subject of `NgElementStrategyEvent` observables corresponding to the component's outputs.
        this.eventEmitters = new ReplaySubject(1);
        /** Merged stream of the component's output events. */
        this.events = this.eventEmitters.pipe(switchMap((emitters) => merge(...emitters)));
        /** Reference to the component that was created on connect. */
        this.componentRef = null;
        /** Reference to the component view's `ChangeDetectorRef`. */
        this.viewChangeDetectorRef = null;
        /**
         * Changes that have been made to component inputs since the last change detection run.
         * (NOTE: These are only recorded if the component implements the `OnChanges` interface.)
         */
        this.inputChanges = null;
        /** Whether changes have been made to component inputs since the last change detection run. */
        this.hasInputChanges = false;
        /** Whether the created component implements the `OnChanges` interface. */
        this.implementsOnChanges = false;
        /** Whether a change detection has been scheduled to run on the component. */
        this.scheduledChangeDetectionFn = null;
        /** Callback function that when called will cancel a scheduled destruction on the component. */
        this.scheduledDestroyFn = null;
        /** Initial input values that were set before the component was created. */
        this.initialInputValues = new Map();
        this.unchangedInputs = new Set(this.componentFactory.inputs.map(({ propName }) => propName));
        this.ngZone = this.injector.get(NgZone);
        this.elementZone = typeof Zone === 'undefined' ? null : this.ngZone.run(() => Zone.current);
    }
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     */
    connect(element) {
        this.runInZone(() => {
            // If the element is marked to be destroyed, cancel the task since the component was
            // reconnected
            if (this.scheduledDestroyFn !== null) {
                this.scheduledDestroyFn();
                this.scheduledDestroyFn = null;
                return;
            }
            if (this.componentRef === null) {
                this.initializeComponent(element);
            }
        });
    }
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     */
    disconnect() {
        this.runInZone(() => {
            // Return if there is no componentRef or the component is already scheduled for destruction
            if (this.componentRef === null || this.scheduledDestroyFn !== null) {
                return;
            }
            // Schedule the component to be destroyed after a small timeout in case it is being
            // moved elsewhere in the DOM
            this.scheduledDestroyFn = scheduler.schedule(() => {
                if (this.componentRef !== null) {
                    this.componentRef.destroy();
                    this.componentRef = null;
                    this.viewChangeDetectorRef = null;
                }
            }, DESTROY_DELAY);
        });
    }
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     */
    getInputValue(property) {
        return this.runInZone(() => {
            if (this.componentRef === null) {
                return this.initialInputValues.get(property);
            }
            return this.componentRef.instance[property];
        });
    }
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    setInputValue(property, value, transform) {
        this.runInZone(() => {
            if (transform) {
                value = transform.call(this.componentRef?.instance, value);
            }
            if (this.componentRef === null) {
                this.initialInputValues.set(property, value);
                return;
            }
            // Ignore the value if it is strictly equal to the current value, except if it is `undefined`
            // and this is the first change to the value (because an explicit `undefined` _is_ strictly
            // equal to not having a value set at all, but we still need to record this as a change).
            if (strictEquals(value, this.getInputValue(property)) &&
                !(value === undefined && this.unchangedInputs.has(property))) {
                return;
            }
            // Record the changed value and update internal state to reflect the fact that this input has
            // changed.
            this.recordInputChange(property, value);
            this.unchangedInputs.delete(property);
            this.hasInputChanges = true;
            // Update the component instance and schedule change detection.
            this.componentRef.instance[property] = value;
            this.scheduleDetectChanges();
        });
    }
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     */
    initializeComponent(element) {
        const childInjector = Injector.create({ providers: [], parent: this.injector });
        const projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.viewChangeDetectorRef = this.componentRef.injector.get(ChangeDetectorRef);
        this.implementsOnChanges = isFunction(this.componentRef.instance.ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs(this.componentRef);
        this.detectChanges();
        const applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    }
    /** Set any stored initial inputs on the component's properties. */
    initializeInputs() {
        this.componentFactory.inputs.forEach(({ propName, transform }) => {
            if (this.initialInputValues.has(propName)) {
                // Call `setInputValue()` now that the component has been instantiated to update its
                // properties and fire `ngOnChanges()`.
                this.setInputValue(propName, this.initialInputValues.get(propName), transform);
            }
        });
        this.initialInputValues.clear();
    }
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    initializeOutputs(componentRef) {
        const eventEmitters = this.componentFactory.outputs.map(({ propName, templateName }) => {
            const emitter = componentRef.instance[propName];
            return emitter.pipe(map((value) => ({ name: templateName, value })));
        });
        this.eventEmitters.next(eventEmitters);
    }
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    callNgOnChanges(componentRef) {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        const inputChanges = this.inputChanges;
        this.inputChanges = null;
        componentRef.instance.ngOnChanges(inputChanges);
    }
    /**
     * Marks the component view for check, if necessary.
     * (NOTE: This is required when the `ChangeDetectionStrategy` is set to `OnPush`.)
     */
    markViewForCheck(viewChangeDetectorRef) {
        if (this.hasInputChanges) {
            this.hasInputChanges = false;
            viewChangeDetectorRef.markForCheck();
        }
    }
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
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
     */
    recordInputChange(property, currentValue) {
        // Do not record the change if the component does not implement `OnChanges`.
        if (!this.implementsOnChanges) {
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        // If there already is a change, modify the current value to match but leave the values for
        // `previousValue` and `isFirstChange`.
        const pendingChange = this.inputChanges[property];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        const isFirstChange = this.unchangedInputs.has(property);
        const previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    }
    /** Runs change detection on the component. */
    detectChanges() {
        if (this.componentRef === null) {
            return;
        }
        this.callNgOnChanges(this.componentRef);
        this.markViewForCheck(this.viewChangeDetectorRef);
        this.componentRef.changeDetectorRef.detectChanges();
    }
    /** Runs in the angular zone, if present. */
    runInZone(fn) {
        return this.elementZone && Zone.current !== this.elementZone ? this.ngZone.run(fn) : fn();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLGNBQWMsRUFDZCxpQkFBaUIsRUFFakIsd0JBQXdCLEVBR3hCLFFBQVEsRUFDUixNQUFNLEVBRU4sWUFBWSxHQUdiLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxLQUFLLEVBQWMsYUFBYSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3RELE9BQU8sRUFBQyxHQUFHLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFPOUMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTVELDBGQUEwRjtBQUMxRixNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFFekI7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGlDQUFpQztJQUc1QyxZQUFZLFNBQW9CLEVBQUUsUUFBa0I7UUFDbEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVE7YUFDN0IsR0FBRyxDQUFDLHdCQUF3QixDQUFDO2FBQzdCLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxNQUFNLENBQUMsUUFBa0I7UUFDdkIsT0FBTyxJQUFJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RSxDQUFDO0NBQ0Y7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sMEJBQTBCO0lBK0NyQyxZQUNVLGdCQUF1QyxFQUN2QyxRQUFrQjtRQURsQixxQkFBZ0IsR0FBaEIsZ0JBQWdC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bnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5kZXYvbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUmVmLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50RmFjdG9yeSxcbiAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICBDb21wb25lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0b3IsXG4gIE5nWm9uZSxcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2UsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFR5cGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHttZXJnZSwgT2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge21hcCwgc3dpdGNoTWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7XG4gIE5nRWxlbWVudFN0cmF0ZWd5LFxuICBOZ0VsZW1lbnRTdHJhdGVneUV2ZW50LFxuICBOZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnksXG59IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2V4dHJhY3RQcm9qZWN0YWJsZU5vZGVzfSBmcm9tICcuL2V4dHJhY3QtcHJvamVjdGFibGUtbm9kZXMnO1xuaW1wb3J0IHtpc0Z1bmN0aW9uLCBzY2hlZHVsZXIsIHN0cmljdEVxdWFsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKiBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBkZXN0cm95aW5nIHRoZSBjb21wb25lbnQgcmVmIHdoZW4gZGlzY29ubmVjdGVkLiAqL1xuY29uc3QgREVTVFJPWV9ERUxBWSA9IDEwO1xuXG4vKipcbiAqIEZhY3RvcnkgdGhhdCBjcmVhdGVzIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbnN0YW5jZS4gR2V0cyB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGVcbiAqIGNvbnN0cnVjdG9yJ3MgaW5qZWN0b3IncyBmYWN0b3J5IHJlc29sdmVyIGFuZCBwYXNzZXMgdGhhdCBmYWN0b3J5IHRvIGVhY2ggc3RyYXRlZ3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnkgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnkge1xuICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT47XG5cbiAgY29uc3RydWN0b3IoY29tcG9uZW50OiBUeXBlPGFueT4sIGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeSA9IGluamVjdG9yXG4gICAgICAuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcilcbiAgICAgIC5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICB9XG5cbiAgY3JlYXRlKGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kodGhpcy5jb21wb25lbnRGYWN0b3J5LCBpbmplY3Rvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBkZXN0cm95cyBhIGNvbXBvbmVudCByZWYgdXNpbmcgYSBjb21wb25lbnQgZmFjdG9yeSBhbmQgaGFuZGxlcyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBpbiByZXNwb25zZSB0byBpbnB1dCBjaGFuZ2VzLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gIC8vIFN1YmplY3Qgb2YgYE5nRWxlbWVudFN0cmF0ZWd5RXZlbnRgIG9ic2VydmFibGVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNvbXBvbmVudCdzIG91dHB1dHMuXG4gIHByaXZhdGUgZXZlbnRFbWl0dGVycyA9IG5ldyBSZXBsYXlTdWJqZWN0PE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD5bXT4oMSk7XG5cbiAgLyoqIE1lcmdlZCBzdHJlYW0gb2YgdGhlIGNvbXBvbmVudCdzIG91dHB1dCBldmVudHMuICovXG4gIHJlYWRvbmx5IGV2ZW50cyA9IHRoaXMuZXZlbnRFbWl0dGVycy5waXBlKHN3aXRjaE1hcCgoZW1pdHRlcnMpID0+IG1lcmdlKC4uLmVtaXR0ZXJzKSkpO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudCB0aGF0IHdhcyBjcmVhdGVkIG9uIGNvbm5lY3QuICovXG4gIHByaXZhdGUgY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55PiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudCB2aWV3J3MgYENoYW5nZURldGVjdG9yUmVmYC4gKi9cbiAgcHJpdmF0ZSB2aWV3Q2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhhdCBoYXZlIGJlZW4gbWFkZSB0byBjb21wb25lbnQgaW5wdXRzIHNpbmNlIHRoZSBsYXN0IGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICAgKiAoTk9URTogVGhlc2UgYXJlIG9ubHkgcmVjb3JkZWQgaWYgdGhlIGNvbXBvbmVudCBpbXBsZW1lbnRzIHRoZSBgT25DaGFuZ2VzYCBpbnRlcmZhY2UuKVxuICAgKi9cbiAgcHJpdmF0ZSBpbnB1dENoYW5nZXM6IFNpbXBsZUNoYW5nZXMgfCBudWxsID0gbnVsbDtcblxuICAvKiogV2hldGhlciBjaGFuZ2VzIGhhdmUgYmVlbiBtYWRlIHRvIGNvbXBvbmVudCBpbnB1dHMgc2luY2UgdGhlIGxhc3QgY2hhbmdlIGRldGVjdGlvbiBydW4uICovXG4gIHByaXZhdGUgaGFzSW5wdXRDaGFuZ2VzID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNyZWF0ZWQgY29tcG9uZW50IGltcGxlbWVudHMgdGhlIGBPbkNoYW5nZXNgIGludGVyZmFjZS4gKi9cbiAgcHJpdmF0ZSBpbXBsZW1lbnRzT25DaGFuZ2VzID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIGhhcyBiZWVuIHNjaGVkdWxlZCB0byBydW4gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd2hlbiBjYWxsZWQgd2lsbCBjYW5jZWwgYSBzY2hlZHVsZWQgZGVzdHJ1Y3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWREZXN0cm95Rm46ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBJbml0aWFsIGlucHV0IHZhbHVlcyB0aGF0IHdlcmUgc2V0IGJlZm9yZSB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxJbnB1dFZhbHVlcyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiBjb21wb25lbnQgaW5wdXRzIHRoYXQgaGF2ZSBub3QgeWV0IGNoYW5nZWQsIGkuZS4gZm9yIHdoaWNoIGByZWNvcmRJbnB1dENoYW5nZSgpYCBoYXMgbm90XG4gICAqIGZpcmVkLlxuICAgKiAoVGhpcyBoZWxwcyBkZXRlY3QgdGhlIGZpcnN0IGNoYW5nZSBvZiBhbiBpbnB1dCwgZXZlbiBpZiBpdCBpcyBleHBsaWNpdGx5IHNldCB0byBgdW5kZWZpbmVkYC4pXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHVuY2hhbmdlZElucHV0czogU2V0PHN0cmluZz47XG5cbiAgLyoqIFNlcnZpY2UgZm9yIHNldHRpbmcgem9uZSBjb250ZXh0LiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZTogTmdab25lO1xuXG4gIC8qKiBUaGUgem9uZSB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCBpbiBvciBgbnVsbGAgaWYgWm9uZS5qcyBpcyBub3QgbG9hZGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGVsZW1lbnRab25lOiBab25lIHwgbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PixcbiAgICBwcml2YXRlIGluamVjdG9yOiBJbmplY3RvcixcbiAgKSB7XG4gICAgdGhpcy51bmNoYW5nZWRJbnB1dHMgPSBuZXcgU2V0PHN0cmluZz4oXG4gICAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnkuaW5wdXRzLm1hcCgoe3Byb3BOYW1lfSkgPT4gcHJvcE5hbWUpLFxuICAgICk7XG4gICAgdGhpcy5uZ1pvbmUgPSB0aGlzLmluamVjdG9yLmdldDxOZ1pvbmU+KE5nWm9uZSk7XG4gICAgdGhpcy5lbGVtZW50Wm9uZSA9IHR5cGVvZiBab25lID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gWm9uZS5jdXJyZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIG5ldyBjb21wb25lbnQgaWYgb25lIGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCBhbmQgY2FuY2VscyBhbnkgc2NoZWR1bGVkXG4gICAqIGRlc3RydWN0aW9uLlxuICAgKi9cbiAgY29ubmVjdChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMucnVuSW5ab25lKCgpID0+IHtcbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIG1hcmtlZCB0byBiZSBkZXN0cm95ZWQsIGNhbmNlbCB0aGUgdGFzayBzaW5jZSB0aGUgY29tcG9uZW50IHdhc1xuICAgICAgLy8gcmVjb25uZWN0ZWRcbiAgICAgIGlmICh0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbigpO1xuICAgICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IG51bGw7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUNvbXBvbmVudChlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgc29tZSBzbWFsbCBkZWxheSBpbiBjYXNlIHRoZSBlbGVtZW50IGlzIGp1c3RcbiAgICogYmVpbmcgbW92ZWQgYWNyb3NzIHRoZSBET00uXG4gICAqL1xuICBkaXNjb25uZWN0KCkge1xuICAgIHRoaXMucnVuSW5ab25lKCgpID0+IHtcbiAgICAgIC8vIFJldHVybiBpZiB0aGVyZSBpcyBubyBjb21wb25lbnRSZWYgb3IgdGhlIGNvbXBvbmVudCBpcyBhbHJlYWR5IHNjaGVkdWxlZCBmb3IgZGVzdHJ1Y3Rpb25cbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCB8fCB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFNjaGVkdWxlIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIGEgc21hbGwgdGltZW91dCBpbiBjYXNlIGl0IGlzIGJlaW5nXG4gICAgICAvLyBtb3ZlZCBlbHNld2hlcmUgaW4gdGhlIERPTVxuICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBzY2hlZHVsZXIuc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgIT09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZi5kZXN0cm95KCk7XG4gICAgICAgICAgdGhpcy5jb21wb25lbnRSZWYgPSBudWxsO1xuICAgICAgICAgIHRoaXMudmlld0NoYW5nZURldGVjdG9yUmVmID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSwgREVTVFJPWV9ERUxBWSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IHByb3BlcnR5IHZhbHVlLiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIHJldHJpZXZlZCBmcm9tIHRoZSBjYWNoZWQgaW5pdGlhbGl6YXRpb24gdmFsdWVzLlxuICAgKi9cbiAgZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcGVydHkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2VbcHJvcGVydHldO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGlucHV0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogY2FjaGVkIGFuZCBzZXQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBzZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnksIHRyYW5zZm9ybT86ICh2YWx1ZTogYW55KSA9PiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLnJ1bkluWm9uZSgoKSA9PiB7XG4gICAgICBpZiAodHJhbnNmb3JtKSB7XG4gICAgICAgIHZhbHVlID0gdHJhbnNmb3JtLmNhbGwodGhpcy5jb21wb25lbnRSZWY/Lmluc3RhbmNlLCB2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5zZXQocHJvcGVydHksIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJZ25vcmUgdGhlIHZhbHVlIGlmIGl0IGlzIHN0cmljdGx5IGVxdWFsIHRvIHRoZSBjdXJyZW50IHZhbHVlLCBleGNlcHQgaWYgaXQgaXMgYHVuZGVmaW5lZGBcbiAgICAgIC8vIGFuZCB0aGlzIGlzIHRoZSBmaXJzdCBjaGFuZ2UgdG8gdGhlIHZhbHVlIChiZWNhdXNlIGFuIGV4cGxpY2l0IGB1bmRlZmluZWRgIF9pc18gc3RyaWN0bHlcbiAgICAgIC8vIGVxdWFsIHRvIG5vdCBoYXZpbmcgYSB2YWx1ZSBzZXQgYXQgYWxsLCBidXQgd2Ugc3RpbGwgbmVlZCB0byByZWNvcmQgdGhpcyBhcyBhIGNoYW5nZSkuXG4gICAgICBpZiAoXG4gICAgICAgIHN0cmljdEVxdWFscyh2YWx1ZSwgdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KSkgJiZcbiAgICAgICAgISh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHRoaXMudW5jaGFuZ2VkSW5wdXRzLmhhcyhwcm9wZXJ0eSkpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBSZWNvcmQgdGhlIGNoYW5nZWQgdmFsdWUgYW5kIHVwZGF0ZSBpbnRlcm5hbCBzdGF0ZSB0byByZWZsZWN0IHRoZSBmYWN0IHRoYXQgdGhpcyBpbnB1dCBoYXNcbiAgICAgIC8vIGNoYW5nZWQuXG4gICAgICB0aGlzLnJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICB0aGlzLnVuY2hhbmdlZElucHV0cy5kZWxldGUocHJvcGVydHkpO1xuICAgICAgdGhpcy5oYXNJbnB1dENoYW5nZXMgPSB0cnVlO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICAgIHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgdGhpcy5zY2hlZHVsZURldGVjdENoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudCB0aHJvdWdoIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZSBwcm92aWRlZCBlbGVtZW50IGhvc3QgYW5kXG4gICAqIHNldHMgdXAgaXRzIGluaXRpYWwgaW5wdXRzLCBsaXN0ZW5zIGZvciBvdXRwdXRzIGNoYW5nZXMsIGFuZCBydW5zIGFuIGluaXRpYWwgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgY2hpbGRJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBbXSwgcGFyZW50OiB0aGlzLmluamVjdG9yfSk7XG4gICAgY29uc3QgcHJvamVjdGFibGVOb2RlcyA9IGV4dHJhY3RQcm9qZWN0YWJsZU5vZGVzKFxuICAgICAgZWxlbWVudCxcbiAgICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5uZ0NvbnRlbnRTZWxlY3RvcnMsXG4gICAgKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY2hpbGRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgZWxlbWVudCk7XG4gICAgdGhpcy52aWV3Q2hhbmdlRGV0ZWN0b3JSZWYgPSB0aGlzLmNvbXBvbmVudFJlZi5pbmplY3Rvci5nZXQoQ2hhbmdlRGV0ZWN0b3JSZWYpO1xuXG4gICAgdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzID0gaXNGdW5jdGlvbigodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgT25DaGFuZ2VzKS5uZ09uQ2hhbmdlcyk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVJbnB1dHMoKTtcbiAgICB0aGlzLmluaXRpYWxpemVPdXRwdXRzKHRoaXMuY29tcG9uZW50UmVmKTtcblxuICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgY29uc3QgYXBwbGljYXRpb25SZWYgPSB0aGlzLmluamVjdG9yLmdldDxBcHBsaWNhdGlvblJlZj4oQXBwbGljYXRpb25SZWYpO1xuICAgIGFwcGxpY2F0aW9uUmVmLmF0dGFjaFZpZXcodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICB9XG5cbiAgLyoqIFNldCBhbnkgc3RvcmVkIGluaXRpYWwgaW5wdXRzIG9uIHRoZSBjb21wb25lbnQncyBwcm9wZXJ0aWVzLiAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZUlucHV0cygpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnkuaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZSwgdHJhbnNmb3JtfSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmhhcyhwcm9wTmFtZSkpIHtcbiAgICAgICAgLy8gQ2FsbCBgc2V0SW5wdXRWYWx1ZSgpYCBub3cgdGhhdCB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGluc3RhbnRpYXRlZCB0byB1cGRhdGUgaXRzXG4gICAgICAgIC8vIHByb3BlcnRpZXMgYW5kIGZpcmUgYG5nT25DaGFuZ2VzKClgLlxuICAgICAgICB0aGlzLnNldElucHV0VmFsdWUocHJvcE5hbWUsIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmdldChwcm9wTmFtZSksIHRyYW5zZm9ybSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIFNldHMgdXAgbGlzdGVuZXJzIGZvciB0aGUgY29tcG9uZW50J3Mgb3V0cHV0cyBzbyB0aGF0IHRoZSBldmVudHMgc3RyZWFtIGVtaXRzIHRoZSBldmVudHMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplT3V0cHV0cyhjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgY29uc3QgZXZlbnRFbWl0dGVyczogT2JzZXJ2YWJsZTxOZ0VsZW1lbnRTdHJhdGVneUV2ZW50PltdID0gdGhpcy5jb21wb25lbnRGYWN0b3J5Lm91dHB1dHMubWFwKFxuICAgICAgKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSkgPT4ge1xuICAgICAgICBjb25zdCBlbWl0dGVyOiBFdmVudEVtaXR0ZXI8YW55PiA9IGNvbXBvbmVudFJlZi5pbnN0YW5jZVtwcm9wTmFtZV07XG4gICAgICAgIHJldHVybiBlbWl0dGVyLnBpcGUobWFwKCh2YWx1ZSkgPT4gKHtuYW1lOiB0ZW1wbGF0ZU5hbWUsIHZhbHVlfSkpKTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIHRoaXMuZXZlbnRFbWl0dGVycy5uZXh0KGV2ZW50RW1pdHRlcnMpO1xuICB9XG5cbiAgLyoqIENhbGxzIG5nT25DaGFuZ2VzIHdpdGggYWxsIHRoZSBpbnB1dHMgdGhhdCBoYXZlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbC4gKi9cbiAgcHJvdGVjdGVkIGNhbGxOZ09uQ2hhbmdlcyhjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgfHwgdGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDYWNoZSB0aGUgY2hhbmdlcyBhbmQgc2V0IGlucHV0Q2hhbmdlcyB0byBudWxsIHRvIGNhcHR1cmUgYW55IGNoYW5nZXMgdGhhdCBtaWdodCBvY2N1clxuICAgIC8vIGR1cmluZyBuZ09uQ2hhbmdlcy5cbiAgICBjb25zdCBpbnB1dENoYW5nZXMgPSB0aGlzLmlucHV0Q2hhbmdlcztcbiAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IG51bGw7XG4gICAgKGNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKGlucHV0Q2hhbmdlcyk7XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIGNvbXBvbmVudCB2aWV3IGZvciBjaGVjaywgaWYgbmVjZXNzYXJ5LlxuICAgKiAoTk9URTogVGhpcyBpcyByZXF1aXJlZCB3aGVuIHRoZSBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGlzIHNldCB0byBgT25QdXNoYC4pXG4gICAqL1xuICBwcm90ZWN0ZWQgbWFya1ZpZXdGb3JDaGVjayh2aWV3Q2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFzSW5wdXRDaGFuZ2VzKSB7XG4gICAgICB0aGlzLmhhc0lucHV0Q2hhbmdlcyA9IGZhbHNlO1xuICAgICAgdmlld0NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgY2hhbmdlIGRldGVjdGlvbiB0byBydW4gb24gdGhlIGNvbXBvbmVudC5cbiAgICogSWdub3JlcyBzdWJzZXF1ZW50IGNhbGxzIGlmIGFscmVhZHkgc2NoZWR1bGVkLlxuICAgKi9cbiAgcHJvdGVjdGVkIHNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25Gbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBzY2hlZHVsZXIuc2NoZWR1bGVCZWZvcmVSZW5kZXIoKCkgPT4ge1xuICAgICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IG51bGw7XG4gICAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmRzIGlucHV0IGNoYW5nZXMgc28gdGhhdCB0aGUgY29tcG9uZW50IHJlY2VpdmVzIFNpbXBsZUNoYW5nZXMgaW4gaXRzIG9uQ2hhbmdlcyBmdW5jdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCByZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eTogc3RyaW5nLCBjdXJyZW50VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIC8vIERvIG5vdCByZWNvcmQgdGhlIGNoYW5nZSBpZiB0aGUgY29tcG9uZW50IGRvZXMgbm90IGltcGxlbWVudCBgT25DaGFuZ2VzYC5cbiAgICBpZiAoIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5pbnB1dENoYW5nZXMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBhbHJlYWR5IGlzIGEgY2hhbmdlLCBtb2RpZnkgdGhlIGN1cnJlbnQgdmFsdWUgdG8gbWF0Y2ggYnV0IGxlYXZlIHRoZSB2YWx1ZXMgZm9yXG4gICAgLy8gYHByZXZpb3VzVmFsdWVgIGFuZCBgaXNGaXJzdENoYW5nZWAuXG4gICAgY29uc3QgcGVuZGluZ0NoYW5nZSA9IHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XTtcbiAgICBpZiAocGVuZGluZ0NoYW5nZSkge1xuICAgICAgcGVuZGluZ0NoYW5nZS5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNGaXJzdENoYW5nZSA9IHRoaXMudW5jaGFuZ2VkSW5wdXRzLmhhcyhwcm9wZXJ0eSk7XG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGlzRmlyc3RDaGFuZ2UgPyB1bmRlZmluZWQgOiB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XSA9IG5ldyBTaW1wbGVDaGFuZ2UocHJldmlvdXNWYWx1ZSwgY3VycmVudFZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsTmdPbkNoYW5nZXModGhpcy5jb21wb25lbnRSZWYpO1xuICAgIHRoaXMubWFya1ZpZXdGb3JDaGVjayh0aGlzLnZpZXdDaGFuZ2VEZXRlY3RvclJlZiEpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGluIHRoZSBhbmd1bGFyIHpvbmUsIGlmIHByZXNlbnQuICovXG4gIHByaXZhdGUgcnVuSW5ab25lKGZuOiAoKSA9PiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFpvbmUgJiYgWm9uZS5jdXJyZW50ICE9PSB0aGlzLmVsZW1lbnRab25lID8gdGhpcy5uZ1pvbmUucnVuKGZuKSA6IGZuKCk7XG4gIH1cbn1cbiJdfQ==