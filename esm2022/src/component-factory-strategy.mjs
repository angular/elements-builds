/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, ComponentFactoryResolver, Injector, NgZone, ɵChangeDetectionScheduler as ChangeDetectionScheduler, } from '@angular/core';
import { merge, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { extractProjectableNodes } from './extract-projectable-nodes';
import { scheduler } from './utils';
/** Time in milliseconds to wait before destroying the component ref when disconnected. */
const DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 */
export class ComponentNgElementStrategyFactory {
    constructor(component, injector) {
        this.inputMap = new Map();
        this.componentFactory = injector
            .get(ComponentFactoryResolver)
            .resolveComponentFactory(component);
        for (const input of this.componentFactory.inputs) {
            this.inputMap.set(input.propName, input.templateName);
        }
    }
    create(injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector, this.inputMap);
    }
}
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 */
export class ComponentNgElementStrategy {
    constructor(componentFactory, injector, inputMap) {
        this.componentFactory = componentFactory;
        this.injector = injector;
        this.inputMap = inputMap;
        // Subject of `NgElementStrategyEvent` observables corresponding to the component's outputs.
        this.eventEmitters = new ReplaySubject(1);
        /** Merged stream of the component's output events. */
        this.events = this.eventEmitters.pipe(switchMap((emitters) => merge(...emitters)));
        /** Reference to the component that was created on connect. */
        this.componentRef = null;
        /** Callback function that when called will cancel a scheduled destruction on the component. */
        this.scheduledDestroyFn = null;
        /** Initial input values that were set before the component was created. */
        this.initialInputValues = new Map();
        this.ngZone = this.injector.get(NgZone);
        this.appRef = this.injector.get(ApplicationRef);
        this.cdScheduler = injector.get(ChangeDetectionScheduler);
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
    setInputValue(property, value) {
        if (this.componentRef === null) {
            this.initialInputValues.set(property, value);
            return;
        }
        this.runInZone(() => {
            this.componentRef.setInput(this.inputMap.get(property) ?? property, value);
            // `setInput` won't mark the view dirty if the input didn't change from its previous value.
            if (this.componentRef.hostView.dirty) {
                // `setInput` will have marked the view dirty already, but also mark it for refresh. This
                // guarantees the view will be checked even if the input is being set from within change
                // detection. This provides backwards compatibility, since we used to unconditionally
                // schedule change detection in addition to the current zone run.
                this.componentRef.changeDetectorRef.markForRefresh();
                // Notifying the scheduler with `NotificationSource.CustomElement` causes a `tick()` to be
                // scheduled unconditionally, even if the scheduler is otherwise disabled.
                this.cdScheduler.notify(6 /* NotificationSource.CustomElement */);
            }
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
        this.initializeInputs();
        this.initializeOutputs(this.componentRef);
        this.appRef.attachView(this.componentRef.hostView);
        this.componentRef.hostView.detectChanges();
    }
    /** Set any stored initial inputs on the component's properties. */
    initializeInputs() {
        for (const [propName, value] of this.initialInputValues) {
            this.setInputValue(propName, value);
        }
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
    /** Runs in the angular zone, if present. */
    runInZone(fn) {
        return this.elementZone && Zone.current !== this.elementZone ? this.ngZone.run(fn) : fn();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLGNBQWMsRUFFZCx3QkFBd0IsRUFHeEIsUUFBUSxFQUNSLE1BQU0sRUFFTix5QkFBeUIsSUFBSSx3QkFBd0IsR0FHdEQsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLEtBQUssRUFBYyxhQUFhLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdEQsT0FBTyxFQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQU85QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRWxDLDBGQUEwRjtBQUMxRixNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFFekI7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGlDQUFpQztJQUs1QyxZQUFZLFNBQW9CLEVBQUUsUUFBa0I7UUFGcEQsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBR25DLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRO2FBQzdCLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQzthQUM3Qix1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN4RCxDQUFDO0lBQ0gsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFr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QUFRLENBQUMsQ0FBQztZQUNuRSxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQ0YsQ0FBQztRQUVGLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCw0Q0FBNEM7SUFDcEMsU0FBUyxDQUFDLEVBQWlCO1FBQ2pDLE9BQU8sSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUM1RixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENvbXBvbmVudEZhY3RvcnksXG4gIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgQ29tcG9uZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdG9yLFxuICBOZ1pvbmUsXG4gIFR5cGUsXG4gIMm1Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIGFzIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgybVOb3RpZmljYXRpb25Tb3VyY2UgYXMgTm90aWZpY2F0aW9uU291cmNlLFxuICDJtVZpZXdSZWYgYXMgVmlld1JlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge21lcmdlLCBPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7bWFwLCBzd2l0Y2hNYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtcbiAgTmdFbGVtZW50U3RyYXRlZ3ksXG4gIE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQsXG4gIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSxcbn0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7ZXh0cmFjdFByb2plY3RhYmxlTm9kZXN9IGZyb20gJy4vZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcyc7XG5pbXBvcnQge3NjaGVkdWxlcn0gZnJvbSAnLi91dGlscyc7XG5cbi8qKiBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBkZXN0cm95aW5nIHRoZSBjb21wb25lbnQgcmVmIHdoZW4gZGlzY29ubmVjdGVkLiAqL1xuY29uc3QgREVTVFJPWV9ERUxBWSA9IDEwO1xuXG4vKipcbiAqIEZhY3RvcnkgdGhhdCBjcmVhdGVzIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbnN0YW5jZS4gR2V0cyB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGVcbiAqIGNvbnN0cnVjdG9yJ3MgaW5qZWN0b3IncyBmYWN0b3J5IHJlc29sdmVyIGFuZCBwYXNzZXMgdGhhdCBmYWN0b3J5IHRvIGVhY2ggc3RyYXRlZ3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnkgaW1wbGVtZW50cyBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnkge1xuICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT47XG5cbiAgaW5wdXRNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKGNvbXBvbmVudDogVHlwZTxhbnk+LCBpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnkgPSBpbmplY3RvclxuICAgICAgLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpXG4gICAgICAucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgICBmb3IgKGNvbnN0IGlucHV0IG9mIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMpIHtcbiAgICAgIHRoaXMuaW5wdXRNYXAuc2V0KGlucHV0LnByb3BOYW1lLCBpbnB1dC50ZW1wbGF0ZU5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZShpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5KHRoaXMuY29tcG9uZW50RmFjdG9yeSwgaW5qZWN0b3IsIHRoaXMuaW5wdXRNYXApO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgZGVzdHJveXMgYSBjb21wb25lbnQgcmVmIHVzaW5nIGEgY29tcG9uZW50IGZhY3RvcnkgYW5kIGhhbmRsZXMgY2hhbmdlIGRldGVjdGlvblxuICogaW4gcmVzcG9uc2UgdG8gaW5wdXQgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3kge1xuICAvLyBTdWJqZWN0IG9mIGBOZ0VsZW1lbnRTdHJhdGVneUV2ZW50YCBvYnNlcnZhYmxlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBjb21wb25lbnQncyBvdXRwdXRzLlxuICBwcml2YXRlIGV2ZW50RW1pdHRlcnMgPSBuZXcgUmVwbGF5U3ViamVjdDxPYnNlcnZhYmxlPE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQ+W10+KDEpO1xuXG4gIC8qKiBNZXJnZWQgc3RyZWFtIG9mIHRoZSBjb21wb25lbnQncyBvdXRwdXQgZXZlbnRzLiAqL1xuICByZWFkb25seSBldmVudHMgPSB0aGlzLmV2ZW50RW1pdHRlcnMucGlwZShzd2l0Y2hNYXAoKGVtaXR0ZXJzKSA9PiBtZXJnZSguLi5lbWl0dGVycykpKTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnQgdGhhdCB3YXMgY3JlYXRlZCBvbiBjb25uZWN0LiAqL1xuICBwcml2YXRlIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4gfCBudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3aGVuIGNhbGxlZCB3aWxsIGNhbmNlbCBhIHNjaGVkdWxlZCBkZXN0cnVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZERlc3Ryb3lGbjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIEluaXRpYWwgaW5wdXQgdmFsdWVzIHRoYXQgd2VyZSBzZXQgYmVmb3JlIHRoZSBjb21wb25lbnQgd2FzIGNyZWF0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbElucHV0VmFsdWVzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuICAvKiogU2VydmljZSBmb3Igc2V0dGluZyB6b25lIGNvbnRleHQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgbmdab25lOiBOZ1pvbmU7XG5cbiAgLyoqIFRoZSB6b25lIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIGluIG9yIGBudWxsYCBpZiBab25lLmpzIGlzIG5vdCBsb2FkZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZWxlbWVudFpvbmU6IFpvbmUgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgYEFwcGxpY2F0aW9uUmVmYCBzaGFyZWQgYnkgYWxsIGluc3RhbmNlcyBvZiB0aGlzIGN1c3RvbSBlbGVtZW50IChhbmQgcG90ZW50aWFsbHkgb3RoZXJzKS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwUmVmOiBBcHBsaWNhdGlvblJlZjtcblxuICAvKipcbiAgICogQW5ndWxhcidzIGNoYW5nZSBkZXRlY3Rpb24gc2NoZWR1bGVyLCB3aGljaCB3b3JrcyBpbmRlcGVuZGVudGx5IG9mIHpvbmUuanMuXG4gICAqL1xuICBwcml2YXRlIGNkU2NoZWR1bGVyOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4sXG4gICAgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgcHJpdmF0ZSBpbnB1dE1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgKSB7XG4gICAgdGhpcy5uZ1pvbmUgPSB0aGlzLmluamVjdG9yLmdldChOZ1pvbmUpO1xuICAgIHRoaXMuYXBwUmVmID0gdGhpcy5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25SZWYpO1xuICAgIHRoaXMuY2RTY2hlZHVsZXIgPSBpbmplY3Rvci5nZXQoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyKTtcbiAgICB0aGlzLmVsZW1lbnRab25lID0gdHlwZW9mIFpvbmUgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHRoaXMubmdab25lLnJ1bigoKSA9PiBab25lLmN1cnJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgbmV3IGNvbXBvbmVudCBpZiBvbmUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGFuZCBjYW5jZWxzIGFueSBzY2hlZHVsZWRcbiAgICogZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgbWFya2VkIHRvIGJlIGRlc3Ryb3llZCwgY2FuY2VsIHRoZSB0YXNrIHNpbmNlIHRoZSBjb21wb25lbnQgd2FzXG4gICAgICAvLyByZWNvbm5lY3RlZFxuICAgICAgaWYgKHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuKCk7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gbnVsbDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBzb21lIHNtYWxsIGRlbGF5IGluIGNhc2UgdGhlIGVsZW1lbnQgaXMganVzdFxuICAgKiBiZWluZyBtb3ZlZCBhY3Jvc3MgdGhlIERPTS5cbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgdGhpcy5ydW5JblpvbmUoKCkgPT4ge1xuICAgICAgLy8gUmV0dXJuIGlmIHRoZXJlIGlzIG5vIGNvbXBvbmVudFJlZiBvciB0aGUgY29tcG9uZW50IGlzIGFscmVhZHkgc2NoZWR1bGVkIGZvciBkZXN0cnVjdGlvblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsIHx8IHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gU2NoZWR1bGUgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgYSBzbWFsbCB0aW1lb3V0IGluIGNhc2UgaXQgaXMgYmVpbmdcbiAgICAgIC8vIG1vdmVkIGVsc2V3aGVyZSBpbiB0aGUgRE9NXG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IHNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0sIERFU1RST1lfREVMQVkpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB2YWx1ZS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiByZXRyaWV2ZWQgZnJvbSB0aGUgY2FjaGVkIGluaXRpYWxpemF0aW9uIHZhbHVlcy5cbiAgICovXG4gIGdldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZyk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucnVuSW5ab25lKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BlcnR5KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BlcnR5XTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnB1dCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIGNhY2hlZCBhbmQgc2V0IHdoZW4gdGhlIGNvbXBvbmVudCBpcyBjcmVhdGVkLlxuICAgKi9cbiAgc2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5zZXQocHJvcGVydHksIHZhbHVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJ1bkluWm9uZSgoKSA9PiB7XG4gICAgICB0aGlzLmNvbXBvbmVudFJlZiEuc2V0SW5wdXQodGhpcy5pbnB1dE1hcC5nZXQocHJvcGVydHkpID8/IHByb3BlcnR5LCB2YWx1ZSk7XG5cbiAgICAgIC8vIGBzZXRJbnB1dGAgd29uJ3QgbWFyayB0aGUgdmlldyBkaXJ0eSBpZiB0aGUgaW5wdXQgZGlkbid0IGNoYW5nZSBmcm9tIGl0cyBwcmV2aW91cyB2YWx1ZS5cbiAgICAgIGlmICgodGhpcy5jb21wb25lbnRSZWYhLmhvc3RWaWV3IGFzIFZpZXdSZWY8dW5rbm93bj4pLmRpcnR5KSB7XG4gICAgICAgIC8vIGBzZXRJbnB1dGAgd2lsbCBoYXZlIG1hcmtlZCB0aGUgdmlldyBkaXJ0eSBhbHJlYWR5LCBidXQgYWxzbyBtYXJrIGl0IGZvciByZWZyZXNoLiBUaGlzXG4gICAgICAgIC8vIGd1YXJhbnRlZXMgdGhlIHZpZXcgd2lsbCBiZSBjaGVja2VkIGV2ZW4gaWYgdGhlIGlucHV0IGlzIGJlaW5nIHNldCBmcm9tIHdpdGhpbiBjaGFuZ2VcbiAgICAgICAgLy8gZGV0ZWN0aW9uLiBUaGlzIHByb3ZpZGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCBzaW5jZSB3ZSB1c2VkIHRvIHVuY29uZGl0aW9uYWxseVxuICAgICAgICAvLyBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIGluIGFkZGl0aW9uIHRvIHRoZSBjdXJyZW50IHpvbmUgcnVuLlxuICAgICAgICAodGhpcy5jb21wb25lbnRSZWYhLmNoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdSZWY8dW5rbm93bj4pLm1hcmtGb3JSZWZyZXNoKCk7XG5cbiAgICAgICAgLy8gTm90aWZ5aW5nIHRoZSBzY2hlZHVsZXIgd2l0aCBgTm90aWZpY2F0aW9uU291cmNlLkN1c3RvbUVsZW1lbnRgIGNhdXNlcyBhIGB0aWNrKClgIHRvIGJlXG4gICAgICAgIC8vIHNjaGVkdWxlZCB1bmNvbmRpdGlvbmFsbHksIGV2ZW4gaWYgdGhlIHNjaGVkdWxlciBpcyBvdGhlcndpc2UgZGlzYWJsZWQuXG4gICAgICAgIHRoaXMuY2RTY2hlZHVsZXIubm90aWZ5KE5vdGlmaWNhdGlvblNvdXJjZS5DdXN0b21FbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudCB0aHJvdWdoIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZSBwcm92aWRlZCBlbGVtZW50IGhvc3QgYW5kXG4gICAqIHNldHMgdXAgaXRzIGluaXRpYWwgaW5wdXRzLCBsaXN0ZW5zIGZvciBvdXRwdXRzIGNoYW5nZXMsIGFuZCBydW5zIGFuIGluaXRpYWwgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgY2hpbGRJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBbXSwgcGFyZW50OiB0aGlzLmluamVjdG9yfSk7XG4gICAgY29uc3QgcHJvamVjdGFibGVOb2RlcyA9IGV4dHJhY3RQcm9qZWN0YWJsZU5vZGVzKFxuICAgICAgZWxlbWVudCxcbiAgICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5uZ0NvbnRlbnRTZWxlY3RvcnMsXG4gICAgKTtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY2hpbGRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgZWxlbWVudCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVJbnB1dHMoKTtcbiAgICB0aGlzLmluaXRpYWxpemVPdXRwdXRzKHRoaXMuY29tcG9uZW50UmVmKTtcblxuICAgIHRoaXMuYXBwUmVmLmF0dGFjaFZpZXcodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3LmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKiBTZXQgYW55IHN0b3JlZCBpbml0aWFsIGlucHV0cyBvbiB0aGUgY29tcG9uZW50J3MgcHJvcGVydGllcy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVJbnB1dHMoKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBbcHJvcE5hbWUsIHZhbHVlXSBvZiB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcykge1xuICAgICAgdGhpcy5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHVwIGxpc3RlbmVycyBmb3IgdGhlIGNvbXBvbmVudCdzIG91dHB1dHMgc28gdGhhdCB0aGUgZXZlbnRzIHN0cmVhbSBlbWl0cyB0aGUgZXZlbnRzLiAqL1xuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZU91dHB1dHMoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50RW1pdHRlcnM6IE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD5bXSA9IHRoaXMuY29tcG9uZW50RmFjdG9yeS5vdXRwdXRzLm1hcChcbiAgICAgICh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pID0+IHtcbiAgICAgICAgY29uc3QgZW1pdHRlcjogRXZlbnRFbWl0dGVyPGFueT4gPSBjb21wb25lbnRSZWYuaW5zdGFuY2VbcHJvcE5hbWVdO1xuICAgICAgICByZXR1cm4gZW1pdHRlci5waXBlKG1hcCgodmFsdWUpID0+ICh7bmFtZTogdGVtcGxhdGVOYW1lLCB2YWx1ZX0pKSk7XG4gICAgICB9LFxuICAgICk7XG5cbiAgICB0aGlzLmV2ZW50RW1pdHRlcnMubmV4dChldmVudEVtaXR0ZXJzKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGluIHRoZSBhbmd1bGFyIHpvbmUsIGlmIHByZXNlbnQuICovXG4gIHByaXZhdGUgcnVuSW5ab25lKGZuOiAoKSA9PiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFpvbmUgJiYgWm9uZS5jdXJyZW50ICE9PSB0aGlzLmVsZW1lbnRab25lID8gdGhpcy5uZ1pvbmUucnVuKGZuKSA6IGZuKCk7XG4gIH1cbn1cbiJdfQ==