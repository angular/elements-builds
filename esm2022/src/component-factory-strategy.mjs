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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBb0Isd0JBQXdCLEVBQThCLFFBQVEsRUFBRSxNQUFNLEVBQWEsWUFBWSxFQUFzQixNQUFNLGVBQWUsQ0FBQztBQUN4TSxPQUFPLEVBQUMsS0FBSyxFQUFjLGFBQWEsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN0RCxPQUFPLEVBQUMsR0FBRyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRzlDLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU1RCwwRkFBMEY7QUFDMUYsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBRXpCOzs7R0FHRztBQUNILE1BQU0sT0FBTyxpQ0FBaUM7SUFHNUMsWUFBWSxTQUFvQixFQUFFLFFBQWtCO1FBQ2xELElBQUksQ0FBQyxnQkFBZ0I7WUFDakIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFFRCxNQUFNLENBQUMsUUFBa0I7UUFDdkIsT0FBTyxJQUFJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RSxDQUFDO0NBQ0Y7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sMEJBQTBCO0lBZ0RyQyxZQUFvQixnQkFBdUMsRUFBVSxRQUFrQjtRQUFuRSxxQkFBZ0IsR0FBaEIsZ0JBQWdC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IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmLCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBDb21wb25lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5qZWN0b3IsIE5nWm9uZSwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXMsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHttZXJnZSwgT2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge21hcCwgc3dpdGNoTWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQsIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7ZXh0cmFjdFByb2plY3RhYmxlTm9kZXN9IGZyb20gJy4vZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcyc7XG5pbXBvcnQge2lzRnVuY3Rpb24sIHNjaGVkdWxlciwgc3RyaWN0RXF1YWxzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIGRlc3Ryb3lpbmcgdGhlIGNvbXBvbmVudCByZWYgd2hlbiBkaXNjb25uZWN0ZWQuICovXG5jb25zdCBERVNUUk9ZX0RFTEFZID0gMTA7XG5cbi8qKlxuICogRmFjdG9yeSB0aGF0IGNyZWF0ZXMgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGluc3RhbmNlLiBHZXRzIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZVxuICogY29uc3RydWN0b3IncyBpbmplY3RvcidzIGZhY3RvcnkgcmVzb2x2ZXIgYW5kIHBhc3NlcyB0aGF0IGZhY3RvcnkgdG8gZWFjaCBzdHJhdGVneS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSB7XG4gIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PjtcblxuICBjb25zdHJ1Y3Rvcihjb21wb25lbnQ6IFR5cGU8YW55PiwgaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5ID1cbiAgICAgICAgaW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcikucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgfVxuXG4gIGNyZWF0ZShpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5KHRoaXMuY29tcG9uZW50RmFjdG9yeSwgaW5qZWN0b3IpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgZGVzdHJveXMgYSBjb21wb25lbnQgcmVmIHVzaW5nIGEgY29tcG9uZW50IGZhY3RvcnkgYW5kIGhhbmRsZXMgY2hhbmdlIGRldGVjdGlvblxuICogaW4gcmVzcG9uc2UgdG8gaW5wdXQgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3kge1xuICAvLyBTdWJqZWN0IG9mIGBOZ0VsZW1lbnRTdHJhdGVneUV2ZW50YCBvYnNlcnZhYmxlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBjb21wb25lbnQncyBvdXRwdXRzLlxuICBwcml2YXRlIGV2ZW50RW1pdHRlcnMgPSBuZXcgUmVwbGF5U3ViamVjdDxPYnNlcnZhYmxlPE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQ+W10+KDEpO1xuXG4gIC8qKiBNZXJnZWQgc3RyZWFtIG9mIHRoZSBjb21wb25lbnQncyBvdXRwdXQgZXZlbnRzLiAqL1xuICByZWFkb25seSBldmVudHMgPSB0aGlzLmV2ZW50RW1pdHRlcnMucGlwZShzd2l0Y2hNYXAoZW1pdHRlcnMgPT4gbWVyZ2UoLi4uZW1pdHRlcnMpKSk7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHRoYXQgd2FzIGNyZWF0ZWQgb24gY29ubmVjdC4gKi9cbiAgcHJpdmF0ZSBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+fG51bGwgPSBudWxsO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudCB2aWV3J3MgYENoYW5nZURldGVjdG9yUmVmYC4gKi9cbiAgcHJpdmF0ZSB2aWV3Q2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmfG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG1hZGUgdG8gY29tcG9uZW50IGlucHV0cyBzaW5jZSB0aGUgbGFzdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAgICogKE5PVEU6IFRoZXNlIGFyZSBvbmx5IHJlY29yZGVkIGlmIHRoZSBjb21wb25lbnQgaW1wbGVtZW50cyB0aGUgYE9uQ2hhbmdlc2AgaW50ZXJmYWNlLilcbiAgICovXG4gIHByaXZhdGUgaW5wdXRDaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzfG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIGNoYW5nZXMgaGF2ZSBiZWVuIG1hZGUgdG8gY29tcG9uZW50IGlucHV0cyBzaW5jZSB0aGUgbGFzdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gKi9cbiAgcHJpdmF0ZSBoYXNJbnB1dENoYW5nZXMgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgY3JlYXRlZCBjb21wb25lbnQgaW1wbGVtZW50cyB0aGUgYE9uQ2hhbmdlc2AgaW50ZXJmYWNlLiAqL1xuICBwcml2YXRlIGltcGxlbWVudHNPbkNoYW5nZXMgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBhIGNoYW5nZSBkZXRlY3Rpb24gaGFzIGJlZW4gc2NoZWR1bGVkIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgLyoqIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd2hlbiBjYWxsZWQgd2lsbCBjYW5jZWwgYSBzY2hlZHVsZWQgZGVzdHJ1Y3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZWREZXN0cm95Rm46ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAvKiogSW5pdGlhbCBpbnB1dCB2YWx1ZXMgdGhhdCB3ZXJlIHNldCBiZWZvcmUgdGhlIGNvbXBvbmVudCB3YXMgY3JlYXRlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBpbml0aWFsSW5wdXRWYWx1ZXMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgY29tcG9uZW50IGlucHV0cyB0aGF0IGhhdmUgbm90IHlldCBjaGFuZ2VkLCBpLmUuIGZvciB3aGljaCBgcmVjb3JkSW5wdXRDaGFuZ2UoKWAgaGFzIG5vdFxuICAgKiBmaXJlZC5cbiAgICogKFRoaXMgaGVscHMgZGV0ZWN0IHRoZSBmaXJzdCBjaGFuZ2Ugb2YgYW4gaW5wdXQsIGV2ZW4gaWYgaXQgaXMgZXhwbGljaXRseSBzZXQgdG8gYHVuZGVmaW5lZGAuKVxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSB1bmNoYW5nZWRJbnB1dHM6IFNldDxzdHJpbmc+O1xuXG4gIC8qKiBTZXJ2aWNlIGZvciBzZXR0aW5nIHpvbmUgY29udGV4dC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBuZ1pvbmU6IE5nWm9uZTtcblxuICAvKiogVGhlIHpvbmUgdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgaW4gb3IgYG51bGxgIGlmIFpvbmUuanMgaXMgbm90IGxvYWRlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBlbGVtZW50Wm9uZTogWm9uZXxudWxsO1xuXG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4sIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgdGhpcy51bmNoYW5nZWRJbnB1dHMgPVxuICAgICAgICBuZXcgU2V0PHN0cmluZz4odGhpcy5jb21wb25lbnRGYWN0b3J5LmlucHV0cy5tYXAoKHtwcm9wTmFtZX0pID0+IHByb3BOYW1lKSk7XG4gICAgdGhpcy5uZ1pvbmUgPSB0aGlzLmluamVjdG9yLmdldDxOZ1pvbmU+KE5nWm9uZSk7XG4gICAgdGhpcy5lbGVtZW50Wm9uZSA9ICh0eXBlb2YgWm9uZSA9PT0gJ3VuZGVmaW5lZCcpID8gbnVsbCA6IHRoaXMubmdab25lLnJ1bigoKSA9PiBab25lLmN1cnJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3IGNvbXBvbmVudCBpZiBvbmUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGFuZCBjYW5jZWxzIGFueSBzY2hlZHVsZWRcbiAgICogZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbWFya2VkIHRvIGJlIGRlc3Ryb3llZCwgY2FuY2VsIHRoZSB0YXNrIHNpbmNlIHRoZSBjb21wb25lbnQgd2FzXG4gICAgICAvLyByZWNvbm5lY3RlZFxuICAgICAgaWYgKHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuKCk7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gbnVsbDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBzb21lIHNtYWxsIGRlbGF5IGluIGNhc2UgdGhlIGVsZW1lbnQgaXMganVzdFxuICAgKiBiZWluZyBtb3ZlZCBhY3Jvc3MgdGhlIERPTS5cbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgLy8gUmV0dXJuIGlmIHRoZXJlIGlzIG5vIGNvbXBvbmVudFJlZiBvciB0aGUgY29tcG9uZW50IGlzIGFscmVhZHkgc2NoZWR1bGVkIGZvciBkZXN0cnVjdGlvblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsIHx8IHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gU2NoZWR1bGUgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgYSBzbWFsbCB0aW1lb3V0IGluIGNhc2UgaXQgaXMgYmVpbmdcbiAgICAgIC8vIG1vdmVkIGVsc2V3aGVyZSBpbiB0aGUgRE9NXG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IHNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiA9IG51bGw7XG4gICAgICAgICAgdGhpcy52aWV3Q2hhbmdlRGV0ZWN0b3JSZWYgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9LCBERVNUUk9ZX0RFTEFZKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgcHJvcGVydHkgdmFsdWUuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogcmV0cmlldmVkIGZyb20gdGhlIGNhY2hlZCBpbml0aWFsaXphdGlvbiB2YWx1ZXMuXG4gICAqL1xuICBnZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnJ1bkluWm9uZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmdldChwcm9wZXJ0eSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZVtwcm9wZXJ0eV07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5wdXQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiBjYWNoZWQgYW5kIHNldCB3aGVuIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHNldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSwgdHJhbnNmb3JtPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IHZvaWQge1xuICAgIHRoaXMucnVuSW5ab25lKCgpID0+IHtcbiAgICAgIGlmICh0cmFuc2Zvcm0pIHtcbiAgICAgICAgdmFsdWUgPSB0cmFuc2Zvcm0uY2FsbCh0aGlzLmNvbXBvbmVudFJlZj8uaW5zdGFuY2UsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLnNldChwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIElnbm9yZSB0aGUgdmFsdWUgaWYgaXQgaXMgc3RyaWN0bHkgZXF1YWwgdG8gdGhlIGN1cnJlbnQgdmFsdWUsIGV4Y2VwdCBpZiBpdCBpcyBgdW5kZWZpbmVkYFxuICAgICAgLy8gYW5kIHRoaXMgaXMgdGhlIGZpcnN0IGNoYW5nZSB0byB0aGUgdmFsdWUgKGJlY2F1c2UgYW4gZXhwbGljaXQgYHVuZGVmaW5lZGAgX2lzXyBzdHJpY3RseVxuICAgICAgLy8gZXF1YWwgdG8gbm90IGhhdmluZyBhIHZhbHVlIHNldCBhdCBhbGwsIGJ1dCB3ZSBzdGlsbCBuZWVkIHRvIHJlY29yZCB0aGlzIGFzIGEgY2hhbmdlKS5cbiAgICAgIGlmIChzdHJpY3RFcXVhbHModmFsdWUsIHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSkpICYmXG4gICAgICAgICAgISgodmFsdWUgPT09IHVuZGVmaW5lZCkgJiYgdGhpcy51bmNoYW5nZWRJbnB1dHMuaGFzKHByb3BlcnR5KSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBSZWNvcmQgdGhlIGNoYW5nZWQgdmFsdWUgYW5kIHVwZGF0ZSBpbnRlcm5hbCBzdGF0ZSB0byByZWZsZWN0IHRoZSBmYWN0IHRoYXQgdGhpcyBpbnB1dCBoYXNcbiAgICAgIC8vIGNoYW5nZWQuXG4gICAgICB0aGlzLnJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICB0aGlzLnVuY2hhbmdlZElucHV0cy5kZWxldGUocHJvcGVydHkpO1xuICAgICAgdGhpcy5oYXNJbnB1dENoYW5nZXMgPSB0cnVlO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICAgIHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgdGhpcy5zY2hlZHVsZURldGVjdENoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudCB0aHJvdWdoIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZSBwcm92aWRlZCBlbGVtZW50IGhvc3QgYW5kXG4gICAqIHNldHMgdXAgaXRzIGluaXRpYWwgaW5wdXRzLCBsaXN0ZW5zIGZvciBvdXRwdXRzIGNoYW5nZXMsIGFuZCBydW5zIGFuIGluaXRpYWwgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgY2hpbGRJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBbXSwgcGFyZW50OiB0aGlzLmluamVjdG9yfSk7XG4gICAgY29uc3QgcHJvamVjdGFibGVOb2RlcyA9XG4gICAgICAgIGV4dHJhY3RQcm9qZWN0YWJsZU5vZGVzKGVsZW1lbnQsIHRoaXMuY29tcG9uZW50RmFjdG9yeS5uZ0NvbnRlbnRTZWxlY3RvcnMpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmID0gdGhpcy5jb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjaGlsZEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCBlbGVtZW50KTtcbiAgICB0aGlzLnZpZXdDaGFuZ2VEZXRlY3RvclJlZiA9IHRoaXMuY29tcG9uZW50UmVmLmluamVjdG9yLmdldChDaGFuZ2VEZXRlY3RvclJlZik7XG5cbiAgICB0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgPSBpc0Z1bmN0aW9uKCh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZUlucHV0cygpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZU91dHB1dHModGhpcy5jb21wb25lbnRSZWYpO1xuXG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvblJlZiA9IHRoaXMuaW5qZWN0b3IuZ2V0PEFwcGxpY2F0aW9uUmVmPihBcHBsaWNhdGlvblJlZik7XG4gICAgYXBwbGljYXRpb25SZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gIH1cblxuICAvKiogU2V0IGFueSBzdG9yZWQgaW5pdGlhbCBpbnB1dHMgb24gdGhlIGNvbXBvbmVudCdzIHByb3BlcnRpZXMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplSW5wdXRzKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lLCB0cmFuc2Zvcm19KSA9PiB7XG4gICAgICBpZiAodGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuaGFzKHByb3BOYW1lKSkge1xuICAgICAgICAvLyBDYWxsIGBzZXRJbnB1dFZhbHVlKClgIG5vdyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHRvIHVwZGF0ZSBpdHNcbiAgICAgICAgLy8gcHJvcGVydGllcyBhbmQgZmlyZSBgbmdPbkNoYW5nZXMoKWAuXG4gICAgICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BOYW1lKSwgdHJhbnNmb3JtKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogU2V0cyB1cCBsaXN0ZW5lcnMgZm9yIHRoZSBjb21wb25lbnQncyBvdXRwdXRzIHNvIHRoYXQgdGhlIGV2ZW50cyBzdHJlYW0gZW1pdHMgdGhlIGV2ZW50cy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVPdXRwdXRzKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBldmVudEVtaXR0ZXJzOiBPYnNlcnZhYmxlPE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQ+W10gPVxuICAgICAgICB0aGlzLmNvbXBvbmVudEZhY3Rvcnkub3V0cHV0cy5tYXAoKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGVtaXR0ZXI6IEV2ZW50RW1pdHRlcjxhbnk+ID0gY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BOYW1lXTtcbiAgICAgICAgICByZXR1cm4gZW1pdHRlci5waXBlKG1hcCh2YWx1ZSA9PiAoe25hbWU6IHRlbXBsYXRlTmFtZSwgdmFsdWV9KSkpO1xuICAgICAgICB9KTtcblxuICAgIHRoaXMuZXZlbnRFbWl0dGVycy5uZXh0KGV2ZW50RW1pdHRlcnMpO1xuICB9XG5cbiAgLyoqIENhbGxzIG5nT25DaGFuZ2VzIHdpdGggYWxsIHRoZSBpbnB1dHMgdGhhdCBoYXZlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbC4gKi9cbiAgcHJvdGVjdGVkIGNhbGxOZ09uQ2hhbmdlcyhjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgfHwgdGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDYWNoZSB0aGUgY2hhbmdlcyBhbmQgc2V0IGlucHV0Q2hhbmdlcyB0byBudWxsIHRvIGNhcHR1cmUgYW55IGNoYW5nZXMgdGhhdCBtaWdodCBvY2N1clxuICAgIC8vIGR1cmluZyBuZ09uQ2hhbmdlcy5cbiAgICBjb25zdCBpbnB1dENoYW5nZXMgPSB0aGlzLmlucHV0Q2hhbmdlcztcbiAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IG51bGw7XG4gICAgKGNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKGlucHV0Q2hhbmdlcyk7XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIGNvbXBvbmVudCB2aWV3IGZvciBjaGVjaywgaWYgbmVjZXNzYXJ5LlxuICAgKiAoTk9URTogVGhpcyBpcyByZXF1aXJlZCB3aGVuIHRoZSBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGlzIHNldCB0byBgT25QdXNoYC4pXG4gICAqL1xuICBwcm90ZWN0ZWQgbWFya1ZpZXdGb3JDaGVjayh2aWV3Q2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFzSW5wdXRDaGFuZ2VzKSB7XG4gICAgICB0aGlzLmhhc0lucHV0Q2hhbmdlcyA9IGZhbHNlO1xuICAgICAgdmlld0NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgY2hhbmdlIGRldGVjdGlvbiB0byBydW4gb24gdGhlIGNvbXBvbmVudC5cbiAgICogSWdub3JlcyBzdWJzZXF1ZW50IGNhbGxzIGlmIGFscmVhZHkgc2NoZWR1bGVkLlxuICAgKi9cbiAgcHJvdGVjdGVkIHNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25Gbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBzY2hlZHVsZXIuc2NoZWR1bGVCZWZvcmVSZW5kZXIoKCkgPT4ge1xuICAgICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IG51bGw7XG4gICAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmRzIGlucHV0IGNoYW5nZXMgc28gdGhhdCB0aGUgY29tcG9uZW50IHJlY2VpdmVzIFNpbXBsZUNoYW5nZXMgaW4gaXRzIG9uQ2hhbmdlcyBmdW5jdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCByZWNvcmRJbnB1dENoYW5nZShwcm9wZXJ0eTogc3RyaW5nLCBjdXJyZW50VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIC8vIERvIG5vdCByZWNvcmQgdGhlIGNoYW5nZSBpZiB0aGUgY29tcG9uZW50IGRvZXMgbm90IGltcGxlbWVudCBgT25DaGFuZ2VzYC5cbiAgICBpZiAoIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5pbnB1dENoYW5nZXMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBhbHJlYWR5IGlzIGEgY2hhbmdlLCBtb2RpZnkgdGhlIGN1cnJlbnQgdmFsdWUgdG8gbWF0Y2ggYnV0IGxlYXZlIHRoZSB2YWx1ZXMgZm9yXG4gICAgLy8gYHByZXZpb3VzVmFsdWVgIGFuZCBgaXNGaXJzdENoYW5nZWAuXG4gICAgY29uc3QgcGVuZGluZ0NoYW5nZSA9IHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XTtcbiAgICBpZiAocGVuZGluZ0NoYW5nZSkge1xuICAgICAgcGVuZGluZ0NoYW5nZS5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNGaXJzdENoYW5nZSA9IHRoaXMudW5jaGFuZ2VkSW5wdXRzLmhhcyhwcm9wZXJ0eSk7XG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGlzRmlyc3RDaGFuZ2UgPyB1bmRlZmluZWQgOiB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XSA9IG5ldyBTaW1wbGVDaGFuZ2UocHJldmlvdXNWYWx1ZSwgY3VycmVudFZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsTmdPbkNoYW5nZXModGhpcy5jb21wb25lbnRSZWYpO1xuICAgIHRoaXMubWFya1ZpZXdGb3JDaGVjayh0aGlzLnZpZXdDaGFuZ2VEZXRlY3RvclJlZiEpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGluIHRoZSBhbmd1bGFyIHpvbmUsIGlmIHByZXNlbnQuICovXG4gIHByaXZhdGUgcnVuSW5ab25lKGZuOiAoKSA9PiB1bmtub3duKSB7XG4gICAgcmV0dXJuICh0aGlzLmVsZW1lbnRab25lICYmIFpvbmUuY3VycmVudCAhPT0gdGhpcy5lbGVtZW50Wm9uZSkgPyB0aGlzLm5nWm9uZS5ydW4oZm4pIDogZm4oKTtcbiAgfVxufVxuIl19