/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ApplicationRef, ComponentFactoryResolver, Injector, SimpleChange } from '@angular/core';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { extractProjectableNodes } from './extract-projectable-nodes';
import { isFunction, scheduler, strictEquals } from './utils';
/** Time in milliseconds to wait before destroying the component ref when disconnected. */
var DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * @experimental
 */
var /**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * @experimental
 */
ComponentNgElementStrategyFactory = /** @class */ (function () {
    function ComponentNgElementStrategyFactory(component, injector) {
        this.component = component;
        this.injector = injector;
        this.componentFactory =
            injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
    }
    ComponentNgElementStrategyFactory.prototype.create = function (injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector);
    };
    return ComponentNgElementStrategyFactory;
}());
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * @experimental
 */
export { ComponentNgElementStrategyFactory };
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * @experimental
 */
var /**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * @experimental
 */
ComponentNgElementStrategy = /** @class */ (function () {
    function ComponentNgElementStrategy(componentFactory, injector) {
        this.componentFactory = componentFactory;
        this.injector = injector;
        /** Changes that have been made to the component ref since the last time onChanges was called. */
        this.inputChanges = null;
        /** Whether the created component implements the onChanges function. */
        this.implementsOnChanges = false;
        /** Whether a change detection has been scheduled to run on the component. */
        this.scheduledChangeDetectionFn = null;
        /** Callback function that when called will cancel a scheduled destruction on the component. */
        this.scheduledDestroyFn = null;
        /** Initial input values that were set before the component was created. */
        this.initialInputValues = new Map();
        /** Set of inputs that were not initially set when the component was created. */
        this.uninitializedInputs = new Set();
    }
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     */
    /**
       * Initializes a new component if one has not yet been created and cancels any scheduled
       * destruction.
       */
    ComponentNgElementStrategy.prototype.connect = /**
       * Initializes a new component if one has not yet been created and cancels any scheduled
       * destruction.
       */
    function (element) {
        // If the element is marked to be destroyed, cancel the task since the component was reconnected
        if (this.scheduledDestroyFn !== null) {
            this.scheduledDestroyFn();
            this.scheduledDestroyFn = null;
            return;
        }
        if (!this.componentRef) {
            this.initializeComponent(element);
        }
    };
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     */
    /**
       * Schedules the component to be destroyed after some small delay in case the element is just
       * being moved across the DOM.
       */
    ComponentNgElementStrategy.prototype.disconnect = /**
       * Schedules the component to be destroyed after some small delay in case the element is just
       * being moved across the DOM.
       */
    function () {
        var _this = this;
        // Return if there is no componentRef or the component is already scheduled for destruction
        if (!this.componentRef || this.scheduledDestroyFn !== null) {
            return;
        }
        // Schedule the component to be destroyed after a small timeout in case it is being
        // moved elsewhere in the DOM
        this.scheduledDestroyFn = scheduler.schedule(function () {
            if (_this.componentRef) {
                _this.componentRef.destroy();
                _this.componentRef = null;
            }
        }, DESTROY_DELAY);
    };
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     */
    /**
       * Returns the component property value. If the component has not yet been created, the value is
       * retrieved from the cached initialization values.
       */
    ComponentNgElementStrategy.prototype.getInputValue = /**
       * Returns the component property value. If the component has not yet been created, the value is
       * retrieved from the cached initialization values.
       */
    function (property) {
        if (!this.componentRef) {
            return this.initialInputValues.get(property);
        }
        return this.componentRef.instance[property];
    };
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    /**
       * Sets the input value for the property. If the component has not yet been created, the value is
       * cached and set when the component is created.
       */
    ComponentNgElementStrategy.prototype.setInputValue = /**
       * Sets the input value for the property. If the component has not yet been created, the value is
       * cached and set when the component is created.
       */
    function (property, value) {
        if (strictEquals(value, this.getInputValue(property))) {
            return;
        }
        if (!this.componentRef) {
            this.initialInputValues.set(property, value);
            return;
        }
        this.recordInputChange(property, value);
        this.componentRef.instance[property] = value;
        this.scheduleDetectChanges();
    };
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     */
    /**
       * Creates a new component through the component factory with the provided element host and
       * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
       */
    ComponentNgElementStrategy.prototype.initializeComponent = /**
       * Creates a new component through the component factory with the provided element host and
       * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
       */
    function (element) {
        var childInjector = Injector.create({ providers: [], parent: this.injector });
        var projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.implementsOnChanges =
            isFunction(this.componentRef.instance.ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs();
        this.detectChanges();
        var applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    };
    /** Set any stored initial inputs on the component's properties. */
    /** Set any stored initial inputs on the component's properties. */
    ComponentNgElementStrategy.prototype.initializeInputs = /** Set any stored initial inputs on the component's properties. */
    function () {
        var _this = this;
        this.componentFactory.inputs.forEach(function (_a) {
            var propName = _a.propName;
            var initialValue = _this.initialInputValues.get(propName);
            if (initialValue) {
                _this.setInputValue(propName, initialValue);
            }
            else {
                // Keep track of inputs that were not initialized in case we need to know this for
                // calling ngOnChanges with SimpleChanges
                // Keep track of inputs that were not initialized in case we need to know this for
                // calling ngOnChanges with SimpleChanges
                _this.uninitializedInputs.add(propName);
            }
        });
        this.initialInputValues.clear();
    };
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    ComponentNgElementStrategy.prototype.initializeOutputs = /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    function () {
        var _this = this;
        var eventEmitters = this.componentFactory.outputs.map(function (_a) {
            var propName = _a.propName, templateName = _a.templateName;
            var emitter = _this.componentRef.instance[propName];
            return emitter.pipe(map(function (value) { return ({ name: templateName, value: value }); }));
        });
        this.events = merge.apply(void 0, tslib_1.__spread(eventEmitters));
    };
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    ComponentNgElementStrategy.prototype.callNgOnChanges = /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    function () {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        var inputChanges = this.inputChanges;
        this.inputChanges = null;
        this.componentRef.instance.ngOnChanges(inputChanges);
    };
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     */
    /**
       * Schedules change detection to run on the component.
       * Ignores subsequent calls if already scheduled.
       */
    ComponentNgElementStrategy.prototype.scheduleDetectChanges = /**
       * Schedules change detection to run on the component.
       * Ignores subsequent calls if already scheduled.
       */
    function () {
        var _this = this;
        if (this.scheduledChangeDetectionFn) {
            return;
        }
        this.scheduledChangeDetectionFn = scheduler.scheduleBeforeRender(function () {
            _this.scheduledChangeDetectionFn = null;
            _this.detectChanges();
        });
    };
    /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     */
    /**
       * Records input changes so that the component receives SimpleChanges in its onChanges function.
       */
    ComponentNgElementStrategy.prototype.recordInputChange = /**
       * Records input changes so that the component receives SimpleChanges in its onChanges function.
       */
    function (property, currentValue) {
        // Do not record the change if the component does not implement `OnChanges`.
        if (this.componentRef && !this.implementsOnChanges) {
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        // If there already is a change, modify the current value to match but leave the values for
        // previousValue and isFirstChange.
        var pendingChange = this.inputChanges[property];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        var isFirstChange = this.uninitializedInputs.has(property);
        this.uninitializedInputs.delete(property);
        var previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    };
    /** Runs change detection on the component. */
    /** Runs change detection on the component. */
    ComponentNgElementStrategy.prototype.detectChanges = /** Runs change detection on the component. */
    function () {
        if (!this.componentRef) {
            return;
        }
        this.callNgOnChanges();
        this.componentRef.changeDetectorRef.detectChanges();
    };
    return ComponentNgElementStrategy;
}());
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * @experimental
 */
export { ComponentNgElementStrategy };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFvQix3QkFBd0IsRUFBOEIsUUFBUSxFQUFhLFlBQVksRUFBc0IsTUFBTSxlQUFlLENBQUM7QUFDN0ssT0FBTyxFQUFhLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2QyxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHbkMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDOztBQUc1RCxJQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7Ozs7Ozs7QUFRekI7Ozs7OztBQUFBO0lBR0UsMkNBQW9CLFNBQW9CLEVBQVUsUUFBa0I7UUFBaEQsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUFVLGFBQVEsR0FBUixRQUFRLENBQVU7UUFDbEUsSUFBSSxDQUFDLGdCQUFnQjtZQUNqQixRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDL0U7SUFFRCxrREFBTSxHQUFOLFVBQU8sUUFBa0I7UUFDdkIsT0FBTyxJQUFJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUN4RTs0Q0FuQ0g7SUFvQ0MsQ0FBQTs7Ozs7OztBQVhELDZDQVdDOzs7Ozs7O0FBUUQ7Ozs7OztBQUFBO0lBeUJFLG9DQUFvQixnQkFBdUMsRUFBVSxRQUFrQjtRQUFuRSxxQkFBZ0IsR0FBaEIsZ0JBQWdC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QUFDO1FBQ2xELElBQUksYUFBYSxFQUFFO1lBQ2pCLGFBQWEsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBQzFDLE9BQU87U0FDUjtRQUVELElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUxQyxJQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksWUFBWSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDNUY7SUFFRCw4Q0FBOEM7O0lBQ3BDLGtEQUFhO0lBQXZCO1FBQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDdEIsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFjLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLENBQUM7S0FDdkQ7cUNBM1BIO0lBNFBDLENBQUE7Ozs7Ozs7QUFoTkQsc0NBZ05DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmLCBDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIENvbXBvbmVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbmplY3RvciwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXMsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge21hcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge05nRWxlbWVudFN0cmF0ZWd5LCBOZ0VsZW1lbnRTdHJhdGVneUV2ZW50LCBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2V4dHJhY3RQcm9qZWN0YWJsZU5vZGVzfSBmcm9tICcuL2V4dHJhY3QtcHJvamVjdGFibGUtbm9kZXMnO1xuaW1wb3J0IHtpc0Z1bmN0aW9uLCBzY2hlZHVsZXIsIHN0cmljdEVxdWFsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKiBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBkZXN0cm95aW5nIHRoZSBjb21wb25lbnQgcmVmIHdoZW4gZGlzY29ubmVjdGVkLiAqL1xuY29uc3QgREVTVFJPWV9ERUxBWSA9IDEwO1xuXG4vKipcbiAqIEZhY3RvcnkgdGhhdCBjcmVhdGVzIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbnN0YW5jZS4gR2V0cyB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGVcbiAqIGNvbnN0cnVjdG9yJ3MgaW5qZWN0b3IncyBmYWN0b3J5IHJlc29sdmVyIGFuZCBwYXNzZXMgdGhhdCBmYWN0b3J5IHRvIGVhY2ggc3RyYXRlZ3kuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IHtcbiAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50OiBUeXBlPGFueT4sIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5ID1cbiAgICAgICAgaW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcikucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgfVxuXG4gIGNyZWF0ZShpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5KHRoaXMuY29tcG9uZW50RmFjdG9yeSwgaW5qZWN0b3IpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgZGVzdHJveXMgYSBjb21wb25lbnQgcmVmIHVzaW5nIGEgY29tcG9uZW50IGZhY3RvcnkgYW5kIGhhbmRsZXMgY2hhbmdlIGRldGVjdGlvblxuICogaW4gcmVzcG9uc2UgdG8gaW5wdXQgY2hhbmdlcy5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgLyoqIE1lcmdlZCBzdHJlYW0gb2YgdGhlIGNvbXBvbmVudCdzIG91dHB1dCBldmVudHMuICovXG4gIGV2ZW50czogT2JzZXJ2YWJsZTxOZ0VsZW1lbnRTdHJhdGVneUV2ZW50PjtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnQgdGhhdCB3YXMgY3JlYXRlZCBvbiBjb25uZWN0LiAqL1xuICBwcml2YXRlIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT58bnVsbDtcblxuICAvKiogQ2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBtYWRlIHRvIHRoZSBjb21wb25lbnQgcmVmIHNpbmNlIHRoZSBsYXN0IHRpbWUgb25DaGFuZ2VzIHdhcyBjYWxsZWQuICovXG4gIHByaXZhdGUgaW5wdXRDaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzfG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjcmVhdGVkIGNvbXBvbmVudCBpbXBsZW1lbnRzIHRoZSBvbkNoYW5nZXMgZnVuY3Rpb24uICovXG4gIHByaXZhdGUgaW1wbGVtZW50c09uQ2hhbmdlcyA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIGEgY2hhbmdlIGRldGVjdGlvbiBoYXMgYmVlbiBzY2hlZHVsZWQgdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm46ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3aGVuIGNhbGxlZCB3aWxsIGNhbmNlbCBhIHNjaGVkdWxlZCBkZXN0cnVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZERlc3Ryb3lGbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBJbml0aWFsIGlucHV0IHZhbHVlcyB0aGF0IHdlcmUgc2V0IGJlZm9yZSB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxJbnB1dFZhbHVlcyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG5cbiAgLyoqIFNldCBvZiBpbnB1dHMgdGhhdCB3ZXJlIG5vdCBpbml0aWFsbHkgc2V0IHdoZW4gdGhlIGNvbXBvbmVudCB3YXMgY3JlYXRlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSB1bmluaXRpYWxpemVkSW5wdXRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4sIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIG5ldyBjb21wb25lbnQgaWYgb25lIGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCBhbmQgY2FuY2VscyBhbnkgc2NoZWR1bGVkXG4gICAqIGRlc3RydWN0aW9uLlxuICAgKi9cbiAgY29ubmVjdChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIG1hcmtlZCB0byBiZSBkZXN0cm95ZWQsIGNhbmNlbCB0aGUgdGFzayBzaW5jZSB0aGUgY29tcG9uZW50IHdhcyByZWNvbm5lY3RlZFxuICAgIGlmICh0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4oKTtcbiAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICB0aGlzLmluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBzb21lIHNtYWxsIGRlbGF5IGluIGNhc2UgdGhlIGVsZW1lbnQgaXMganVzdFxuICAgKiBiZWluZyBtb3ZlZCBhY3Jvc3MgdGhlIERPTS5cbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgLy8gUmV0dXJuIGlmIHRoZXJlIGlzIG5vIGNvbXBvbmVudFJlZiBvciB0aGUgY29tcG9uZW50IGlzIGFscmVhZHkgc2NoZWR1bGVkIGZvciBkZXN0cnVjdGlvblxuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYgfHwgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTY2hlZHVsZSB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBhIHNtYWxsIHRpbWVvdXQgaW4gY2FzZSBpdCBpcyBiZWluZ1xuICAgIC8vIG1vdmVkIGVsc2V3aGVyZSBpbiB0aGUgRE9NXG4gICAgdGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gPSBzY2hlZHVsZXIuc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50UmVmICEuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiA9IG51bGw7XG4gICAgICB9XG4gICAgfSwgREVTVFJPWV9ERUxBWSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IHByb3BlcnR5IHZhbHVlLiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIHJldHJpZXZlZCBmcm9tIHRoZSBjYWNoZWQgaW5pdGlhbGl6YXRpb24gdmFsdWVzLlxuICAgKi9cbiAgZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogYW55IHtcbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BlcnR5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIGFueSlbcHJvcGVydHldO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGlucHV0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogY2FjaGVkIGFuZCBzZXQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBzZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoc3RyaWN0RXF1YWxzKHZhbHVlLCB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLnNldChwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHksIHZhbHVlKTtcbiAgICAodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55KVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICB0aGlzLnNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29tcG9uZW50IHRocm91Z2ggdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlIHByb3ZpZGVkIGVsZW1lbnQgaG9zdCBhbmRcbiAgICogc2V0cyB1cCBpdHMgaW5pdGlhbCBpbnB1dHMsIGxpc3RlbnMgZm9yIG91dHB1dHMgY2hhbmdlcywgYW5kIHJ1bnMgYW4gaW5pdGlhbCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZEluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IFtdLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3J9KTtcbiAgICBjb25zdCBwcm9qZWN0YWJsZU5vZGVzID1cbiAgICAgICAgZXh0cmFjdFByb2plY3RhYmxlTm9kZXMoZWxlbWVudCwgdGhpcy5jb21wb25lbnRGYWN0b3J5Lm5nQ29udGVudFNlbGVjdG9ycyk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSB0aGlzLmNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNoaWxkSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIGVsZW1lbnQpO1xuXG4gICAgdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzID1cbiAgICAgICAgaXNGdW5jdGlvbigodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55IGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplSW5wdXRzKCk7XG4gICAgdGhpcy5pbml0aWFsaXplT3V0cHV0cygpO1xuXG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvblJlZiA9IHRoaXMuaW5qZWN0b3IuZ2V0PEFwcGxpY2F0aW9uUmVmPihBcHBsaWNhdGlvblJlZik7XG4gICAgYXBwbGljYXRpb25SZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gIH1cblxuICAvKiogU2V0IGFueSBzdG9yZWQgaW5pdGlhbCBpbnB1dHMgb24gdGhlIGNvbXBvbmVudCdzIHByb3BlcnRpZXMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplSW5wdXRzKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lfSkgPT4ge1xuICAgICAgY29uc3QgaW5pdGlhbFZhbHVlID0gdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BOYW1lKTtcbiAgICAgIGlmIChpbml0aWFsVmFsdWUpIHtcbiAgICAgICAgdGhpcy5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBpbml0aWFsVmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBpbnB1dHMgdGhhdCB3ZXJlIG5vdCBpbml0aWFsaXplZCBpbiBjYXNlIHdlIG5lZWQgdG8ga25vdyB0aGlzIGZvclxuICAgICAgICAvLyBjYWxsaW5nIG5nT25DaGFuZ2VzIHdpdGggU2ltcGxlQ2hhbmdlc1xuICAgICAgICB0aGlzLnVuaW5pdGlhbGl6ZWRJbnB1dHMuYWRkKHByb3BOYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogU2V0cyB1cCBsaXN0ZW5lcnMgZm9yIHRoZSBjb21wb25lbnQncyBvdXRwdXRzIHNvIHRoYXQgdGhlIGV2ZW50cyBzdHJlYW0gZW1pdHMgdGhlIGV2ZW50cy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVPdXRwdXRzKCk6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50RW1pdHRlcnMgPSB0aGlzLmNvbXBvbmVudEZhY3Rvcnkub3V0cHV0cy5tYXAoKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSkgPT4ge1xuICAgICAgY29uc3QgZW1pdHRlciA9ICh0aGlzLmNvbXBvbmVudFJlZiAhLmluc3RhbmNlIGFzIGFueSlbcHJvcE5hbWVdIGFzIEV2ZW50RW1pdHRlcjxhbnk+O1xuICAgICAgcmV0dXJuIGVtaXR0ZXIucGlwZShtYXAoKHZhbHVlOiBhbnkpID0+ICh7bmFtZTogdGVtcGxhdGVOYW1lLCB2YWx1ZX0pKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmV2ZW50cyA9IG1lcmdlKC4uLmV2ZW50RW1pdHRlcnMpO1xuICB9XG5cbiAgLyoqIENhbGxzIG5nT25DaGFuZ2VzIHdpdGggYWxsIHRoZSBpbnB1dHMgdGhhdCBoYXZlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbC4gKi9cbiAgcHJvdGVjdGVkIGNhbGxOZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyB8fCB0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENhY2hlIHRoZSBjaGFuZ2VzIGFuZCBzZXQgaW5wdXRDaGFuZ2VzIHRvIG51bGwgdG8gY2FwdHVyZSBhbnkgY2hhbmdlcyB0aGF0IG1pZ2h0IG9jY3VyXG4gICAgLy8gZHVyaW5nIG5nT25DaGFuZ2VzLlxuICAgIGNvbnN0IGlucHV0Q2hhbmdlcyA9IHRoaXMuaW5wdXRDaGFuZ2VzO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0gbnVsbDtcbiAgICAodGhpcy5jb21wb25lbnRSZWYgIS5pbnN0YW5jZSBhcyBhbnkgYXMgT25DaGFuZ2VzKS5uZ09uQ2hhbmdlcyhpbnB1dENoYW5nZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHJ1biBvbiB0aGUgY29tcG9uZW50LlxuICAgKiBJZ25vcmVzIHN1YnNlcXVlbnQgY2FsbHMgaWYgYWxyZWFkeSBzY2hlZHVsZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc2NoZWR1bGVEZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zY2hlZHVsZWRDaGFuZ2VEZXRlY3Rpb25GbiA9IHNjaGVkdWxlci5zY2hlZHVsZUJlZm9yZVJlbmRlcigoKSA9PiB7XG4gICAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gbnVsbDtcbiAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZHMgaW5wdXQgY2hhbmdlcyBzbyB0aGF0IHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgU2ltcGxlQ2hhbmdlcyBpbiBpdHMgb25DaGFuZ2VzIGZ1bmN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5OiBzdHJpbmcsIGN1cnJlbnRWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgLy8gRG8gbm90IHJlY29yZCB0aGUgY2hhbmdlIGlmIHRoZSBjb21wb25lbnQgZG9lcyBub3QgaW1wbGVtZW50IGBPbkNoYW5nZXNgLlxuICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiAmJiAhdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5wdXRDaGFuZ2VzID09PSBudWxsKSB7XG4gICAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IHt9O1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGFscmVhZHkgaXMgYSBjaGFuZ2UsIG1vZGlmeSB0aGUgY3VycmVudCB2YWx1ZSB0byBtYXRjaCBidXQgbGVhdmUgdGhlIHZhbHVlcyBmb3JcbiAgICAvLyBwcmV2aW91c1ZhbHVlIGFuZCBpc0ZpcnN0Q2hhbmdlLlxuICAgIGNvbnN0IHBlbmRpbmdDaGFuZ2UgPSB0aGlzLmlucHV0Q2hhbmdlc1twcm9wZXJ0eV07XG4gICAgaWYgKHBlbmRpbmdDaGFuZ2UpIHtcbiAgICAgIHBlbmRpbmdDaGFuZ2UuY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzRmlyc3RDaGFuZ2UgPSB0aGlzLnVuaW5pdGlhbGl6ZWRJbnB1dHMuaGFzKHByb3BlcnR5KTtcbiAgICB0aGlzLnVuaW5pdGlhbGl6ZWRJbnB1dHMuZGVsZXRlKHByb3BlcnR5KTtcblxuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSBpc0ZpcnN0Q2hhbmdlID8gdW5kZWZpbmVkIDogdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KTtcbiAgICB0aGlzLmlucHV0Q2hhbmdlc1twcm9wZXJ0eV0gPSBuZXcgU2ltcGxlQ2hhbmdlKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRWYWx1ZSwgaXNGaXJzdENoYW5nZSk7XG4gIH1cblxuICAvKiogUnVucyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByb3RlY3RlZCBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxOZ09uQ2hhbmdlcygpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmICEuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG59XG4iXX0=