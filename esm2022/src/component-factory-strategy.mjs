/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLGNBQWMsRUFDZCxpQkFBaUIsRUFFakIsd0JBQXdCLEVBR3hCLFFBQVEsRUFDUixNQUFNLEVBRU4sWUFBWSxHQUdiLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxLQUFLLEVBQWMsYUFBYSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3RELE9BQU8sRUFBQyxHQUFHLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFPOUMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTVELDBGQUEwRjtBQUMxRixNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFFekI7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGlDQUFpQztJQUc1QyxZQUFZLFNBQW9CLEVBQUUsUUFBa0I7UUFDbEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVE7YUFDN0IsR0FBRyxDQUFDLHdCQUF3QixDQUFDO2FBQzdCLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxNQUFNLENBQUMsUUFBa0I7UUFDdkIsT0FBTyxJQUFJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RSxDQUFDO0NBQ0Y7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sMEJBQTBCO0lBK0NyQyxZQUNVLGdCQUF1QyxFQUN2QyxRQUFrQjtRQURsQixxQkFBZ0IsR0FBaEIsZ0JBQWdC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bnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnRGYWN0b3J5LFxuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIENvbXBvbmVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3RvcixcbiAgTmdab25lLFxuICBPbkNoYW5nZXMsXG4gIFNpbXBsZUNoYW5nZSxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVHlwZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge21lcmdlLCBPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7bWFwLCBzd2l0Y2hNYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtcbiAgTmdFbGVtZW50U3RyYXRlZ3ksXG4gIE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQsXG4gIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSxcbn0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7ZXh0cmFjdFByb2plY3RhYmxlTm9kZXN9IGZyb20gJy4vZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcyc7XG5pbXBvcnQge2lzRnVuY3Rpb24sIHNjaGVkdWxlciwgc3RyaWN0RXF1YWxzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIGRlc3Ryb3lpbmcgdGhlIGNvbXBvbmVudCByZWYgd2hlbiBkaXNjb25uZWN0ZWQuICovXG5jb25zdCBERVNUUk9ZX0RFTEFZID0gMTA7XG5cbi8qKlxuICogRmFjdG9yeSB0aGF0IGNyZWF0ZXMgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGluc3RhbmNlLiBHZXRzIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZVxuICogY29uc3RydWN0b3IncyBpbmplY3RvcidzIGZhY3RvcnkgcmVzb2x2ZXIgYW5kIHBhc3NlcyB0aGF0IGZhY3RvcnkgdG8gZWFjaCBzdHJhdGVneS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSB7XG4gIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PjtcblxuICBjb25zdHJ1Y3Rvcihjb21wb25lbnQ6IFR5cGU8YW55PiwgaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5ID0gaW5qZWN0b3JcbiAgICAgIC5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKVxuICAgICAgLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIH1cblxuICBjcmVhdGUoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSh0aGlzLmNvbXBvbmVudEZhY3RvcnksIGluamVjdG9yKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIGRlc3Ryb3lzIGEgY29tcG9uZW50IHJlZiB1c2luZyBhIGNvbXBvbmVudCBmYWN0b3J5IGFuZCBoYW5kbGVzIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGluIHJlc3BvbnNlIHRvIGlucHV0IGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgLy8gU3ViamVjdCBvZiBgTmdFbGVtZW50U3RyYXRlZ3lFdmVudGAgb2JzZXJ2YWJsZXMgY29ycmVzcG9uZGluZyB0byB0aGUgY29tcG9uZW50J3Mgb3V0cHV0cy5cbiAgcHJpdmF0ZSBldmVudEVtaXR0ZXJzID0gbmV3IFJlcGxheVN1YmplY3Q8T2JzZXJ2YWJsZTxOZ0VsZW1lbnRTdHJhdGVneUV2ZW50PltdPigxKTtcblxuICAvKiogTWVyZ2VkIHN0cmVhbSBvZiB0aGUgY29tcG9uZW50J3Mgb3V0cHV0IGV2ZW50cy4gKi9cbiAgcmVhZG9ubHkgZXZlbnRzID0gdGhpcy5ldmVudEVtaXR0ZXJzLnBpcGUoc3dpdGNoTWFwKChlbWl0dGVycykgPT4gbWVyZ2UoLi4uZW1pdHRlcnMpKSk7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHRoYXQgd2FzIGNyZWF0ZWQgb24gY29ubmVjdC4gKi9cbiAgcHJpdmF0ZSBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHZpZXcncyBgQ2hhbmdlRGV0ZWN0b3JSZWZgLiAqL1xuICBwcml2YXRlIHZpZXdDaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYgfCBudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBtYWRlIHRvIGNvbXBvbmVudCBpbnB1dHMgc2luY2UgdGhlIGxhc3QgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gICAqIChOT1RFOiBUaGVzZSBhcmUgb25seSByZWNvcmRlZCBpZiB0aGUgY29tcG9uZW50IGltcGxlbWVudHMgdGhlIGBPbkNoYW5nZXNgIGludGVyZmFjZS4pXG4gICAqL1xuICBwcml2YXRlIGlucHV0Q2hhbmdlczogU2ltcGxlQ2hhbmdlcyB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIGNoYW5nZXMgaGF2ZSBiZWVuIG1hZGUgdG8gY29tcG9uZW50IGlucHV0cyBzaW5jZSB0aGUgbGFzdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gKi9cbiAgcHJpdmF0ZSBoYXNJbnB1dENoYW5nZXMgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgY3JlYXRlZCBjb21wb25lbnQgaW1wbGVtZW50cyB0aGUgYE9uQ2hhbmdlc2AgaW50ZXJmYWNlLiAqL1xuICBwcml2YXRlIGltcGxlbWVudHNPbkNoYW5nZXMgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBhIGNoYW5nZSBkZXRlY3Rpb24gaGFzIGJlZW4gc2NoZWR1bGVkIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3aGVuIGNhbGxlZCB3aWxsIGNhbmNlbCBhIHNjaGVkdWxlZCBkZXN0cnVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZERlc3Ryb3lGbjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIEluaXRpYWwgaW5wdXQgdmFsdWVzIHRoYXQgd2VyZSBzZXQgYmVmb3JlIHRoZSBjb21wb25lbnQgd2FzIGNyZWF0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbElucHV0VmFsdWVzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIGNvbXBvbmVudCBpbnB1dHMgdGhhdCBoYXZlIG5vdCB5ZXQgY2hhbmdlZCwgaS5lLiBmb3Igd2hpY2ggYHJlY29yZElucHV0Q2hhbmdlKClgIGhhcyBub3RcbiAgICogZmlyZWQuXG4gICAqIChUaGlzIGhlbHBzIGRldGVjdCB0aGUgZmlyc3QgY2hhbmdlIG9mIGFuIGlucHV0LCBldmVuIGlmIGl0IGlzIGV4cGxpY2l0bHkgc2V0IHRvIGB1bmRlZmluZWRgLilcbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgdW5jaGFuZ2VkSW5wdXRzOiBTZXQ8c3RyaW5nPjtcblxuICAvKiogU2VydmljZSBmb3Igc2V0dGluZyB6b25lIGNvbnRleHQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgbmdab25lOiBOZ1pvbmU7XG5cbiAgLyoqIFRoZSB6b25lIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIGluIG9yIGBudWxsYCBpZiBab25lLmpzIGlzIG5vdCBsb2FkZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZWxlbWVudFpvbmU6IFpvbmUgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+LFxuICAgIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yLFxuICApIHtcbiAgICB0aGlzLnVuY2hhbmdlZElucHV0cyA9IG5ldyBTZXQ8c3RyaW5nPihcbiAgICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMubWFwKCh7cHJvcE5hbWV9KSA9PiBwcm9wTmFtZSksXG4gICAgKTtcbiAgICB0aGlzLm5nWm9uZSA9IHRoaXMuaW5qZWN0b3IuZ2V0PE5nWm9uZT4oTmdab25lKTtcbiAgICB0aGlzLmVsZW1lbnRab25lID0gdHlwZW9mIFpvbmUgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHRoaXMubmdab25lLnJ1bigoKSA9PiBab25lLmN1cnJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3IGNvbXBvbmVudCBpZiBvbmUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGFuZCBjYW5jZWxzIGFueSBzY2hlZHVsZWRcbiAgICogZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbWFya2VkIHRvIGJlIGRlc3Ryb3llZCwgY2FuY2VsIHRoZSB0YXNrIHNpbmNlIHRoZSBjb21wb25lbnQgd2FzXG4gICAgICAvLyByZWNvbm5lY3RlZFxuICAgICAgaWYgKHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuKCk7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gbnVsbDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBzb21lIHNtYWxsIGRlbGF5IGluIGNhc2UgdGhlIGVsZW1lbnQgaXMganVzdFxuICAgKiBiZWluZyBtb3ZlZCBhY3Jvc3MgdGhlIERPTS5cbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgLy8gUmV0dXJuIGlmIHRoZXJlIGlzIG5vIGNvbXBvbmVudFJlZiBvciB0aGUgY29tcG9uZW50IGlzIGFscmVhZHkgc2NoZWR1bGVkIGZvciBkZXN0cnVjdGlvblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsIHx8IHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gU2NoZWR1bGUgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgYSBzbWFsbCB0aW1lb3V0IGluIGNhc2UgaXQgaXMgYmVpbmdcbiAgICAgIC8vIG1vdmVkIGVsc2V3aGVyZSBpbiB0aGUgRE9NXG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IHNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiA9IG51bGw7XG4gICAgICAgICAgdGhpcy52aWV3Q2hhbmdlRGV0ZWN0b3JSZWYgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9LCBERVNUUk9ZX0RFTEFZKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgcHJvcGVydHkgdmFsdWUuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogcmV0cmlldmVkIGZyb20gdGhlIGNhY2hlZCBpbml0aWFsaXphdGlvbiB2YWx1ZXMuXG4gICAqL1xuICBnZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnJ1bkluWm9uZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmdldChwcm9wZXJ0eSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZVtwcm9wZXJ0eV07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5wdXQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiBjYWNoZWQgYW5kIHNldCB3aGVuIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHNldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSwgdHJhbnNmb3JtPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IHZvaWQge1xuICAgIHRoaXMucnVuSW5ab25lKCgpID0+IHtcbiAgICAgIGlmICh0cmFuc2Zvcm0pIHtcbiAgICAgICAgdmFsdWUgPSB0cmFuc2Zvcm0uY2FsbCh0aGlzLmNvbXBvbmVudFJlZj8uaW5zdGFuY2UsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLnNldChwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIElnbm9yZSB0aGUgdmFsdWUgaWYgaXQgaXMgc3RyaWN0bHkgZXF1YWwgdG8gdGhlIGN1cnJlbnQgdmFsdWUsIGV4Y2VwdCBpZiBpdCBpcyBgdW5kZWZpbmVkYFxuICAgICAgLy8gYW5kIHRoaXMgaXMgdGhlIGZpcnN0IGNoYW5nZSB0byB0aGUgdmFsdWUgKGJlY2F1c2UgYW4gZXhwbGljaXQgYHVuZGVmaW5lZGAgX2lzXyBzdHJpY3RseVxuICAgICAgLy8gZXF1YWwgdG8gbm90IGhhdmluZyBhIHZhbHVlIHNldCBhdCBhbGwsIGJ1dCB3ZSBzdGlsbCBuZWVkIHRvIHJlY29yZCB0aGlzIGFzIGEgY2hhbmdlKS5cbiAgICAgIGlmIChcbiAgICAgICAgc3RyaWN0RXF1YWxzKHZhbHVlLCB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpKSAmJlxuICAgICAgICAhKHZhbHVlID09PSB1bmRlZmluZWQgJiYgdGhpcy51bmNoYW5nZWRJbnB1dHMuaGFzKHByb3BlcnR5KSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29yZCB0aGUgY2hhbmdlZCB2YWx1ZSBhbmQgdXBkYXRlIGludGVybmFsIHN0YXRlIHRvIHJlZmxlY3QgdGhlIGZhY3QgdGhhdCB0aGlzIGlucHV0IGhhc1xuICAgICAgLy8gY2hhbmdlZC5cbiAgICAgIHRoaXMucmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHksIHZhbHVlKTtcbiAgICAgIHRoaXMudW5jaGFuZ2VkSW5wdXRzLmRlbGV0ZShwcm9wZXJ0eSk7XG4gICAgICB0aGlzLmhhc0lucHV0Q2hhbmdlcyA9IHRydWU7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgICAgdGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2VbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICB0aGlzLnNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29tcG9uZW50IHRocm91Z2ggdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlIHByb3ZpZGVkIGVsZW1lbnQgaG9zdCBhbmRcbiAgICogc2V0cyB1cCBpdHMgaW5pdGlhbCBpbnB1dHMsIGxpc3RlbnMgZm9yIG91dHB1dHMgY2hhbmdlcywgYW5kIHJ1bnMgYW4gaW5pdGlhbCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZEluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IFtdLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3J9KTtcbiAgICBjb25zdCBwcm9qZWN0YWJsZU5vZGVzID0gZXh0cmFjdFByb2plY3RhYmxlTm9kZXMoXG4gICAgICBlbGVtZW50LFxuICAgICAgdGhpcy5jb21wb25lbnRGYWN0b3J5Lm5nQ29udGVudFNlbGVjdG9ycyxcbiAgICApO1xuICAgIHRoaXMuY29tcG9uZW50UmVmID0gdGhpcy5jb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjaGlsZEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCBlbGVtZW50KTtcbiAgICB0aGlzLnZpZXdDaGFuZ2VEZXRlY3RvclJlZiA9IHRoaXMuY29tcG9uZW50UmVmLmluamVjdG9yLmdldChDaGFuZ2VEZXRlY3RvclJlZik7XG5cbiAgICB0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgPSBpc0Z1bmN0aW9uKCh0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZUlucHV0cygpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZU91dHB1dHModGhpcy5jb21wb25lbnRSZWYpO1xuXG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvblJlZiA9IHRoaXMuaW5qZWN0b3IuZ2V0PEFwcGxpY2F0aW9uUmVmPihBcHBsaWNhdGlvblJlZik7XG4gICAgYXBwbGljYXRpb25SZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gIH1cblxuICAvKiogU2V0IGFueSBzdG9yZWQgaW5pdGlhbCBpbnB1dHMgb24gdGhlIGNvbXBvbmVudCdzIHByb3BlcnRpZXMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplSW5wdXRzKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lLCB0cmFuc2Zvcm19KSA9PiB7XG4gICAgICBpZiAodGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuaGFzKHByb3BOYW1lKSkge1xuICAgICAgICAvLyBDYWxsIGBzZXRJbnB1dFZhbHVlKClgIG5vdyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHRvIHVwZGF0ZSBpdHNcbiAgICAgICAgLy8gcHJvcGVydGllcyBhbmQgZmlyZSBgbmdPbkNoYW5nZXMoKWAuXG4gICAgICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BOYW1lKSwgdHJhbnNmb3JtKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogU2V0cyB1cCBsaXN0ZW5lcnMgZm9yIHRoZSBjb21wb25lbnQncyBvdXRwdXRzIHNvIHRoYXQgdGhlIGV2ZW50cyBzdHJlYW0gZW1pdHMgdGhlIGV2ZW50cy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVPdXRwdXRzKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBldmVudEVtaXR0ZXJzOiBPYnNlcnZhYmxlPE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQ+W10gPSB0aGlzLmNvbXBvbmVudEZhY3Rvcnkub3V0cHV0cy5tYXAoXG4gICAgICAoe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KSA9PiB7XG4gICAgICAgIGNvbnN0IGVtaXR0ZXI6IEV2ZW50RW1pdHRlcjxhbnk+ID0gY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BOYW1lXTtcbiAgICAgICAgcmV0dXJuIGVtaXR0ZXIucGlwZShtYXAoKHZhbHVlKSA9PiAoe25hbWU6IHRlbXBsYXRlTmFtZSwgdmFsdWV9KSkpO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgdGhpcy5ldmVudEVtaXR0ZXJzLm5leHQoZXZlbnRFbWl0dGVycyk7XG4gIH1cblxuICAvKiogQ2FsbHMgbmdPbkNoYW5nZXMgd2l0aCBhbGwgdGhlIGlucHV0cyB0aGF0IGhhdmUgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjYWxsLiAqL1xuICBwcm90ZWN0ZWQgY2FsbE5nT25DaGFuZ2VzKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyB8fCB0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENhY2hlIHRoZSBjaGFuZ2VzIGFuZCBzZXQgaW5wdXRDaGFuZ2VzIHRvIG51bGwgdG8gY2FwdHVyZSBhbnkgY2hhbmdlcyB0aGF0IG1pZ2h0IG9jY3VyXG4gICAgLy8gZHVyaW5nIG5nT25DaGFuZ2VzLlxuICAgIGNvbnN0IGlucHV0Q2hhbmdlcyA9IHRoaXMuaW5wdXRDaGFuZ2VzO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0gbnVsbDtcbiAgICAoY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMoaW5wdXRDaGFuZ2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGUgY29tcG9uZW50IHZpZXcgZm9yIGNoZWNrLCBpZiBuZWNlc3NhcnkuXG4gICAqIChOT1RFOiBUaGlzIGlzIHJlcXVpcmVkIHdoZW4gdGhlIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgaXMgc2V0IHRvIGBPblB1c2hgLilcbiAgICovXG4gIHByb3RlY3RlZCBtYXJrVmlld0ZvckNoZWNrKHZpZXdDaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYXNJbnB1dENoYW5nZXMpIHtcbiAgICAgIHRoaXMuaGFzSW5wdXRDaGFuZ2VzID0gZmFsc2U7XG4gICAgICB2aWV3Q2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LlxuICAgKiBJZ25vcmVzIHN1YnNlcXVlbnQgY2FsbHMgaWYgYWxyZWFkeSBzY2hlZHVsZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IHNjaGVkdWxlci5zY2hlZHVsZUJlZm9yZVJlbmRlcigoKSA9PiB7XG4gICAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gbnVsbDtcbiAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgaW5wdXQgY2hhbmdlcyBzbyB0aGF0IHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgU2ltcGxlQ2hhbmdlcyBpbiBpdHMgb25DaGFuZ2VzIGZ1bmN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5OiBzdHJpbmcsIGN1cnJlbnRWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgLy8gRG8gbm90IHJlY29yZCB0aGUgY2hhbmdlIGlmIHRoZSBjb21wb25lbnQgZG9lcyBub3QgaW1wbGVtZW50IGBPbkNoYW5nZXNgLlxuICAgIGlmICghdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5wdXRDaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IHt9O1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGFscmVhZHkgaXMgYSBjaGFuZ2UsIG1vZGlmeSB0aGUgY3VycmVudCB2YWx1ZSB0byBtYXRjaCBidXQgbGVhdmUgdGhlIHZhbHVlcyBmb3JcbiAgICAvLyBgcHJldmlvdXNWYWx1ZWAgYW5kIGBpc0ZpcnN0Q2hhbmdlYC5cbiAgICBjb25zdCBwZW5kaW5nQ2hhbmdlID0gdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldO1xuICAgIGlmIChwZW5kaW5nQ2hhbmdlKSB7XG4gICAgICBwZW5kaW5nQ2hhbmdlLmN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0ZpcnN0Q2hhbmdlID0gdGhpcy51bmNoYW5nZWRJbnB1dHMuaGFzKHByb3BlcnR5KTtcbiAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gaXNGaXJzdENoYW5nZSA/IHVuZGVmaW5lZCA6IHRoaXMuZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSk7XG4gICAgdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldID0gbmV3IFNpbXBsZUNoYW5nZShwcmV2aW91c1ZhbHVlLCBjdXJyZW50VmFsdWUsIGlzRmlyc3RDaGFuZ2UpO1xuICB9XG5cbiAgLyoqIFJ1bnMgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcm90ZWN0ZWQgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxOZ09uQ2hhbmdlcyh0aGlzLmNvbXBvbmVudFJlZik7XG4gICAgdGhpcy5tYXJrVmlld0ZvckNoZWNrKHRoaXMudmlld0NoYW5nZURldGVjdG9yUmVmISk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqIFJ1bnMgaW4gdGhlIGFuZ3VsYXIgem9uZSwgaWYgcHJlc2VudC4gKi9cbiAgcHJpdmF0ZSBydW5JblpvbmUoZm46ICgpID0+IHVua25vd24pIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50Wm9uZSAmJiBab25lLmN1cnJlbnQgIT09IHRoaXMuZWxlbWVudFpvbmUgPyB0aGlzLm5nWm9uZS5ydW4oZm4pIDogZm4oKTtcbiAgfVxufVxuIl19