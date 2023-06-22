/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, ChangeDetectorRef, ComponentFactoryResolver, Injector, NgZone, SimpleChange } from '@angular/core';
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
        this.componentFactory =
            injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
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
        this.events = this.eventEmitters.pipe(switchMap(emitters => merge(...emitters)));
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
        this.unchangedInputs =
            new Set(this.componentFactory.inputs.map(({ propName }) => propName));
        this.ngZone = this.injector.get(NgZone);
        this.elementZone = (typeof Zone === 'undefined') ? null : this.ngZone.run(() => Zone.current);
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
                !((value === undefined) && this.unchangedInputs.has(property))) {
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
            return emitter.pipe(map(value => ({ name: templateName, value })));
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
        return (this.elementZone && Zone.current !== this.elementZone) ? this.ngZone.run(fn) : fn();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBb0Isd0JBQXdCLEVBQThCLFFBQVEsRUFBRSxNQUFNLEVBQWEsWUFBWSxFQUFzQixNQUFNLGVBQWUsQ0FBQztBQUN4TSxPQUFPLEVBQUMsS0FBSyxFQUFjLGFBQWEsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN0RCxPQUFPLEVBQUMsR0FBRyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRzlDLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU1RCwwRkFBMEY7QUFDMUYsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBRXpCOzs7R0FHRztBQUNILE1BQU0sT0FBTyxpQ0FBaUM7SUFHNUMsWUFBWSxTQUFvQixFQUFFLFFBQWtCO1FBQ2xELElBQUksQ0FBQyxnQkFBZ0I7WUFDakIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFFRCxNQUFNLENBQUMsUUFBa0I7UUFDdkIsT0FBTyxJQUFJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RSxDQUFDO0NBQ0Y7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sMEJBQTBCO0lBZ0RyQyxZQUFvQixnQkFBdUMsRUFBVSxRQUFrQjtRQUFuRSxxQkFBZ0IsR0FBaEIsZ0JBQWdC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O1FBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0UsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FBQyxhQUFhLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFFRCw4Q0FBOEM7SUFDcEMsYUFBYTtRQUNyQixJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxFQUFFO1lBQzlCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMscUJBQXNCLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3RELENBQUM7SUFFRCw0Q0FBNEM7SUFDcEMsU0FBUyxDQUFDLEVBQWlCO1FBQ2pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDOUYsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWYsIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIENvbXBvbmVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbmplY3RvciwgTmdab25lLCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZSwgU2ltcGxlQ2hhbmdlcywgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge21lcmdlLCBPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7bWFwLCBzd2l0Y2hNYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lFdmVudCwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtleHRyYWN0UHJvamVjdGFibGVOb2Rlc30gZnJvbSAnLi9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzJztcbmltcG9ydCB7aXNGdW5jdGlvbiwgc2NoZWR1bGVyLCBzdHJpY3RFcXVhbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgZGVzdHJveWluZyB0aGUgY29tcG9uZW50IHJlZiB3aGVuIGRpc2Nvbm5lY3RlZC4gKi9cbmNvbnN0IERFU1RST1lfREVMQVkgPSAxMDtcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW5zdGFuY2UuIEdldHMgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlXG4gKiBjb25zdHJ1Y3RvcidzIGluamVjdG9yJ3MgZmFjdG9yeSByZXNvbHZlciBhbmQgcGFzc2VzIHRoYXQgZmFjdG9yeSB0byBlYWNoIHN0cmF0ZWd5LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IHtcbiAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKGNvbXBvbmVudDogVHlwZTxhbnk+LCBpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnkgPVxuICAgICAgICBpbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKS5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICB9XG5cbiAgY3JlYXRlKGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kodGhpcy5jb21wb25lbnRGYWN0b3J5LCBpbmplY3Rvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBkZXN0cm95cyBhIGNvbXBvbmVudCByZWYgdXNpbmcgYSBjb21wb25lbnQgZmFjdG9yeSBhbmQgaGFuZGxlcyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBpbiByZXNwb25zZSB0byBpbnB1dCBjaGFuZ2VzLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gIC8vIFN1YmplY3Qgb2YgYE5nRWxlbWVudFN0cmF0ZWd5RXZlbnRgIG9ic2VydmFibGVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNvbXBvbmVudCdzIG91dHB1dHMuXG4gIHByaXZhdGUgZXZlbnRFbWl0dGVycyA9IG5ldyBSZXBsYXlTdWJqZWN0PE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD5bXT4oMSk7XG5cbiAgLyoqIE1lcmdlZCBzdHJlYW0gb2YgdGhlIGNvbXBvbmVudCdzIG91dHB1dCBldmVudHMuICovXG4gIHJlYWRvbmx5IGV2ZW50cyA9IHRoaXMuZXZlbnRFbWl0dGVycy5waXBlKHN3aXRjaE1hcChlbWl0dGVycyA9PiBtZXJnZSguLi5lbWl0dGVycykpKTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnQgdGhhdCB3YXMgY3JlYXRlZCBvbiBjb25uZWN0LiAqL1xuICBwcml2YXRlIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT58bnVsbCA9IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHZpZXcncyBgQ2hhbmdlRGV0ZWN0b3JSZWZgLiAqL1xuICBwcml2YXRlIHZpZXdDaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWZ8bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhhdCBoYXZlIGJlZW4gbWFkZSB0byBjb21wb25lbnQgaW5wdXRzIHNpbmNlIHRoZSBsYXN0IGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICAgKiAoTk9URTogVGhlc2UgYXJlIG9ubHkgcmVjb3JkZWQgaWYgdGhlIGNvbXBvbmVudCBpbXBsZW1lbnRzIHRoZSBgT25DaGFuZ2VzYCBpbnRlcmZhY2UuKVxuICAgKi9cbiAgcHJpdmF0ZSBpbnB1dENoYW5nZXM6IFNpbXBsZUNoYW5nZXN8bnVsbCA9IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgY2hhbmdlcyBoYXZlIGJlZW4gbWFkZSB0byBjb21wb25lbnQgaW5wdXRzIHNpbmNlIHRoZSBsYXN0IGNoYW5nZSBkZXRlY3Rpb24gcnVuLiAqL1xuICBwcml2YXRlIGhhc0lucHV0Q2hhbmdlcyA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjcmVhdGVkIGNvbXBvbmVudCBpbXBsZW1lbnRzIHRoZSBgT25DaGFuZ2VzYCBpbnRlcmZhY2UuICovXG4gIHByaXZhdGUgaW1wbGVtZW50c09uQ2hhbmdlcyA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIGEgY2hhbmdlIGRldGVjdGlvbiBoYXMgYmVlbiBzY2hlZHVsZWQgdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm46ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3aGVuIGNhbGxlZCB3aWxsIGNhbmNlbCBhIHNjaGVkdWxlZCBkZXN0cnVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZERlc3Ryb3lGbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBJbml0aWFsIGlucHV0IHZhbHVlcyB0aGF0IHdlcmUgc2V0IGJlZm9yZSB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxJbnB1dFZhbHVlcyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiBjb21wb25lbnQgaW5wdXRzIHRoYXQgaGF2ZSBub3QgeWV0IGNoYW5nZWQsIGkuZS4gZm9yIHdoaWNoIGByZWNvcmRJbnB1dENoYW5nZSgpYCBoYXMgbm90XG4gICAqIGZpcmVkLlxuICAgKiAoVGhpcyBoZWxwcyBkZXRlY3QgdGhlIGZpcnN0IGNoYW5nZSBvZiBhbiBpbnB1dCwgZXZlbiBpZiBpdCBpcyBleHBsaWNpdGx5IHNldCB0byBgdW5kZWZpbmVkYC4pXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHVuY2hhbmdlZElucHV0czogU2V0PHN0cmluZz47XG5cbiAgLyoqIFNlcnZpY2UgZm9yIHNldHRpbmcgem9uZSBjb250ZXh0LiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZTogTmdab25lO1xuXG4gIC8qKiBUaGUgem9uZSB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCBpbiBvciBgbnVsbGAgaWYgWm9uZS5qcyBpcyBub3QgbG9hZGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGVsZW1lbnRab25lOiBab25lfG51bGw7XG5cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PiwgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICB0aGlzLnVuY2hhbmdlZElucHV0cyA9XG4gICAgICAgIG5ldyBTZXQ8c3RyaW5nPih0aGlzLmNvbXBvbmVudEZhY3RvcnkuaW5wdXRzLm1hcCgoe3Byb3BOYW1lfSkgPT4gcHJvcE5hbWUpKTtcbiAgICB0aGlzLm5nWm9uZSA9IHRoaXMuaW5qZWN0b3IuZ2V0PE5nWm9uZT4oTmdab25lKTtcbiAgICB0aGlzLmVsZW1lbnRab25lID0gKHR5cGVvZiBab25lID09PSAndW5kZWZpbmVkJykgPyBudWxsIDogdGhpcy5uZ1pvbmUucnVuKCgpID0+IFpvbmUuY3VycmVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBuZXcgY29tcG9uZW50IGlmIG9uZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgYW5kIGNhbmNlbHMgYW55IHNjaGVkdWxlZFxuICAgKiBkZXN0cnVjdGlvbi5cbiAgICovXG4gIGNvbm5lY3QoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLnJ1bkluWm9uZSgoKSA9PiB7XG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBtYXJrZWQgdG8gYmUgZGVzdHJveWVkLCBjYW5jZWwgdGhlIHRhc2sgc2luY2UgdGhlIGNvbXBvbmVudCB3YXNcbiAgICAgIC8vIHJlY29ubmVjdGVkXG4gICAgICBpZiAodGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4oKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBudWxsO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIHNvbWUgc21hbGwgZGVsYXkgaW4gY2FzZSB0aGUgZWxlbWVudCBpcyBqdXN0XG4gICAqIGJlaW5nIG1vdmVkIGFjcm9zcyB0aGUgRE9NLlxuICAgKi9cbiAgZGlzY29ubmVjdCgpIHtcbiAgICB0aGlzLnJ1bkluWm9uZSgoKSA9PiB7XG4gICAgICAvLyBSZXR1cm4gaWYgdGhlcmUgaXMgbm8gY29tcG9uZW50UmVmIG9yIHRoZSBjb21wb25lbnQgaXMgYWxyZWFkeSBzY2hlZHVsZWQgZm9yIGRlc3RydWN0aW9uXG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwgfHwgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBTY2hlZHVsZSB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBhIHNtYWxsIHRpbWVvdXQgaW4gY2FzZSBpdCBpcyBiZWluZ1xuICAgICAgLy8gbW92ZWQgZWxzZXdoZXJlIGluIHRoZSBET01cbiAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gc2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmICE9PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5jb21wb25lbnRSZWYuZGVzdHJveSgpO1xuICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVmID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnZpZXdDaGFuZ2VEZXRlY3RvclJlZiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0sIERFU1RST1lfREVMQVkpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB2YWx1ZS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiByZXRyaWV2ZWQgZnJvbSB0aGUgY2FjaGVkIGluaXRpYWxpemF0aW9uIHZhbHVlcy5cbiAgICovXG4gIGdldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZyk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucnVuSW5ab25lKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BlcnR5KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BlcnR5XTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnB1dCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIGNhY2hlZCBhbmQgc2V0IHdoZW4gdGhlIGNvbXBvbmVudCBpcyBjcmVhdGVkLlxuICAgKi9cbiAgc2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55LCB0cmFuc2Zvcm0/OiAodmFsdWU6IGFueSkgPT4gYW55KTogdm9pZCB7XG4gICAgdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgaWYgKHRyYW5zZm9ybSkge1xuICAgICAgICB2YWx1ZSA9IHRyYW5zZm9ybS5jYWxsKHRoaXMuY29tcG9uZW50UmVmPy5pbnN0YW5jZSwgdmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuc2V0KHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWdub3JlIHRoZSB2YWx1ZSBpZiBpdCBpcyBzdHJpY3RseSBlcXVhbCB0byB0aGUgY3VycmVudCB2YWx1ZSwgZXhjZXB0IGlmIGl0IGlzIGB1bmRlZmluZWRgXG4gICAgICAvLyBhbmQgdGhpcyBpcyB0aGUgZmlyc3QgY2hhbmdlIHRvIHRoZSB2YWx1ZSAoYmVjYXVzZSBhbiBleHBsaWNpdCBgdW5kZWZpbmVkYCBfaXNfIHN0cmljdGx5XG4gICAgICAvLyBlcXVhbCB0byBub3QgaGF2aW5nIGEgdmFsdWUgc2V0IGF0IGFsbCwgYnV0IHdlIHN0aWxsIG5lZWQgdG8gcmVjb3JkIHRoaXMgYXMgYSBjaGFuZ2UpLlxuICAgICAgaWYgKHN0cmljdEVxdWFscyh2YWx1ZSwgdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KSkgJiZcbiAgICAgICAgICAhKCh2YWx1ZSA9PT0gdW5kZWZpbmVkKSAmJiB0aGlzLnVuY2hhbmdlZElucHV0cy5oYXMocHJvcGVydHkpKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29yZCB0aGUgY2hhbmdlZCB2YWx1ZSBhbmQgdXBkYXRlIGludGVybmFsIHN0YXRlIHRvIHJlZmxlY3QgdGhlIGZhY3QgdGhhdCB0aGlzIGlucHV0IGhhc1xuICAgICAgLy8gY2hhbmdlZC5cbiAgICAgIHRoaXMucmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHksIHZhbHVlKTtcbiAgICAgIHRoaXMudW5jaGFuZ2VkSW5wdXRzLmRlbGV0ZShwcm9wZXJ0eSk7XG4gICAgICB0aGlzLmhhc0lucHV0Q2hhbmdlcyA9IHRydWU7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgICAgdGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2VbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICB0aGlzLnNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29tcG9uZW50IHRocm91Z2ggdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlIHByb3ZpZGVkIGVsZW1lbnQgaG9zdCBhbmRcbiAgICogc2V0cyB1cCBpdHMgaW5pdGlhbCBpbnB1dHMsIGxpc3RlbnMgZm9yIG91dHB1dHMgY2hhbmdlcywgYW5kIHJ1bnMgYW4gaW5pdGlhbCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZEluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IFtdLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3J9KTtcbiAgICBjb25zdCBwcm9qZWN0YWJsZU5vZGVzID1cbiAgICAgICAgZXh0cmFjdFByb2plY3RhYmxlTm9kZXMoZWxlbWVudCwgdGhpcy5jb21wb25lbnRGYWN0b3J5Lm5nQ29udGVudFNlbGVjdG9ycyk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSB0aGlzLmNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNoaWxkSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIGVsZW1lbnQpO1xuICAgIHRoaXMudmlld0NoYW5nZURldGVjdG9yUmVmID0gdGhpcy5jb21wb25lbnRSZWYuaW5qZWN0b3IuZ2V0KENoYW5nZURldGVjdG9yUmVmKTtcblxuICAgIHRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyA9IGlzRnVuY3Rpb24oKHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplSW5wdXRzKCk7XG4gICAgdGhpcy5pbml0aWFsaXplT3V0cHV0cyh0aGlzLmNvbXBvbmVudFJlZik7XG5cbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGNvbnN0IGFwcGxpY2F0aW9uUmVmID0gdGhpcy5pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICBhcHBsaWNhdGlvblJlZi5hdHRhY2hWaWV3KHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIC8qKiBTZXQgYW55IHN0b3JlZCBpbml0aWFsIGlucHV0cyBvbiB0aGUgY29tcG9uZW50J3MgcHJvcGVydGllcy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVJbnB1dHMoKTogdm9pZCB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5LmlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWUsIHRyYW5zZm9ybX0pID0+IHtcbiAgICAgIGlmICh0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5oYXMocHJvcE5hbWUpKSB7XG4gICAgICAgIC8vIENhbGwgYHNldElucHV0VmFsdWUoKWAgbm93IHRoYXQgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBpbnN0YW50aWF0ZWQgdG8gdXBkYXRlIGl0c1xuICAgICAgICAvLyBwcm9wZXJ0aWVzIGFuZCBmaXJlIGBuZ09uQ2hhbmdlcygpYC5cbiAgICAgICAgdGhpcy5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcE5hbWUpLCB0cmFuc2Zvcm0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHVwIGxpc3RlbmVycyBmb3IgdGhlIGNvbXBvbmVudCdzIG91dHB1dHMgc28gdGhhdCB0aGUgZXZlbnRzIHN0cmVhbSBlbWl0cyB0aGUgZXZlbnRzLiAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZU91dHB1dHMoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50RW1pdHRlcnM6IE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD5bXSA9XG4gICAgICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5vdXRwdXRzLm1hcCgoe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KSA9PiB7XG4gICAgICAgICAgY29uc3QgZW1pdHRlcjogRXZlbnRFbWl0dGVyPGFueT4gPSBjb21wb25lbnRSZWYuaW5zdGFuY2VbcHJvcE5hbWVdO1xuICAgICAgICAgIHJldHVybiBlbWl0dGVyLnBpcGUobWFwKHZhbHVlID0+ICh7bmFtZTogdGVtcGxhdGVOYW1lLCB2YWx1ZX0pKSk7XG4gICAgICAgIH0pO1xuXG4gICAgdGhpcy5ldmVudEVtaXR0ZXJzLm5leHQoZXZlbnRFbWl0dGVycyk7XG4gIH1cblxuICAvKiogQ2FsbHMgbmdPbkNoYW5nZXMgd2l0aCBhbGwgdGhlIGlucHV0cyB0aGF0IGhhdmUgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjYWxsLiAqL1xuICBwcm90ZWN0ZWQgY2FsbE5nT25DaGFuZ2VzKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyB8fCB0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENhY2hlIHRoZSBjaGFuZ2VzIGFuZCBzZXQgaW5wdXRDaGFuZ2VzIHRvIG51bGwgdG8gY2FwdHVyZSBhbnkgY2hhbmdlcyB0aGF0IG1pZ2h0IG9jY3VyXG4gICAgLy8gZHVyaW5nIG5nT25DaGFuZ2VzLlxuICAgIGNvbnN0IGlucHV0Q2hhbmdlcyA9IHRoaXMuaW5wdXRDaGFuZ2VzO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0gbnVsbDtcbiAgICAoY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMoaW5wdXRDaGFuZ2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGUgY29tcG9uZW50IHZpZXcgZm9yIGNoZWNrLCBpZiBuZWNlc3NhcnkuXG4gICAqIChOT1RFOiBUaGlzIGlzIHJlcXVpcmVkIHdoZW4gdGhlIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgaXMgc2V0IHRvIGBPblB1c2hgLilcbiAgICovXG4gIHByb3RlY3RlZCBtYXJrVmlld0ZvckNoZWNrKHZpZXdDaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYXNJbnB1dENoYW5nZXMpIHtcbiAgICAgIHRoaXMuaGFzSW5wdXRDaGFuZ2VzID0gZmFsc2U7XG4gICAgICB2aWV3Q2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LlxuICAgKiBJZ25vcmVzIHN1YnNlcXVlbnQgY2FsbHMgaWYgYWxyZWFkeSBzY2hlZHVsZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IHNjaGVkdWxlci5zY2hlZHVsZUJlZm9yZVJlbmRlcigoKSA9PiB7XG4gICAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gbnVsbDtcbiAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgaW5wdXQgY2hhbmdlcyBzbyB0aGF0IHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgU2ltcGxlQ2hhbmdlcyBpbiBpdHMgb25DaGFuZ2VzIGZ1bmN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5OiBzdHJpbmcsIGN1cnJlbnRWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgLy8gRG8gbm90IHJlY29yZCB0aGUgY2hhbmdlIGlmIHRoZSBjb21wb25lbnQgZG9lcyBub3QgaW1wbGVtZW50IGBPbkNoYW5nZXNgLlxuICAgIGlmICghdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5wdXRDaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IHt9O1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGFscmVhZHkgaXMgYSBjaGFuZ2UsIG1vZGlmeSB0aGUgY3VycmVudCB2YWx1ZSB0byBtYXRjaCBidXQgbGVhdmUgdGhlIHZhbHVlcyBmb3JcbiAgICAvLyBgcHJldmlvdXNWYWx1ZWAgYW5kIGBpc0ZpcnN0Q2hhbmdlYC5cbiAgICBjb25zdCBwZW5kaW5nQ2hhbmdlID0gdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldO1xuICAgIGlmIChwZW5kaW5nQ2hhbmdlKSB7XG4gICAgICBwZW5kaW5nQ2hhbmdlLmN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0ZpcnN0Q2hhbmdlID0gdGhpcy51bmNoYW5nZWRJbnB1dHMuaGFzKHByb3BlcnR5KTtcbiAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gaXNGaXJzdENoYW5nZSA/IHVuZGVmaW5lZCA6IHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSk7XG4gICAgdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldID0gbmV3IFNpbXBsZUNoYW5nZShwcmV2aW91c1ZhbHVlLCBjdXJyZW50VmFsdWUsIGlzRmlyc3RDaGFuZ2UpO1xuICB9XG5cbiAgLyoqIFJ1bnMgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcm90ZWN0ZWQgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxOZ09uQ2hhbmdlcyh0aGlzLmNvbXBvbmVudFJlZik7XG4gICAgdGhpcy5tYXJrVmlld0ZvckNoZWNrKHRoaXMudmlld0NoYW5nZURldGVjdG9yUmVmISk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqIFJ1bnMgaW4gdGhlIGFuZ3VsYXIgem9uZSwgaWYgcHJlc2VudC4gKi9cbiAgcHJpdmF0ZSBydW5JblpvbmUoZm46ICgpID0+IHVua25vd24pIHtcbiAgICByZXR1cm4gKHRoaXMuZWxlbWVudFpvbmUgJiYgWm9uZS5jdXJyZW50ICE9PSB0aGlzLmVsZW1lbnRab25lKSA/IHRoaXMubmdab25lLnJ1bihmbikgOiBmbigpO1xuICB9XG59XG4iXX0=