/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __read, __spread } from "tslib";
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
 * @publicApi
 */
var ComponentNgElementStrategyFactory = /** @class */ (function () {
    function ComponentNgElementStrategyFactory(component, injector) {
        this.componentFactory =
            injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
    }
    ComponentNgElementStrategyFactory.prototype.create = function (injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector);
    };
    return ComponentNgElementStrategyFactory;
}());
export { ComponentNgElementStrategyFactory };
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * @publicApi
 */
var ComponentNgElementStrategy = /** @class */ (function () {
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
        /**
         * Set of component inputs that have not yet changed, i.e. for which `ngOnChanges()` has not
         * fired. (This is used to determine the value of `fistChange` in `SimpleChange` instances.)
         */
        this.unchangedInputs = new Set();
    }
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     */
    ComponentNgElementStrategy.prototype.connect = function (element) {
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
    ComponentNgElementStrategy.prototype.disconnect = function () {
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
    ComponentNgElementStrategy.prototype.getInputValue = function (property) {
        if (!this.componentRef) {
            return this.initialInputValues.get(property);
        }
        return this.componentRef.instance[property];
    };
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    ComponentNgElementStrategy.prototype.setInputValue = function (property, value) {
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
        this.componentRef.instance[property] = value;
        this.scheduleDetectChanges();
    };
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     */
    ComponentNgElementStrategy.prototype.initializeComponent = function (element) {
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
    ComponentNgElementStrategy.prototype.initializeInputs = function () {
        var _this = this;
        this.componentFactory.inputs.forEach(function (_a) {
            var propName = _a.propName;
            if (_this.implementsOnChanges) {
                // If the component implements `ngOnChanges()`, keep track of which inputs have never
                // changed so far.
                _this.unchangedInputs.add(propName);
            }
            if (_this.initialInputValues.has(propName)) {
                // Call `setInputValue()` now that the component has been instantiated to update its
                // properties and fire `ngOnChanges()`.
                _this.setInputValue(propName, _this.initialInputValues.get(propName));
            }
        });
        this.initialInputValues.clear();
    };
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    ComponentNgElementStrategy.prototype.initializeOutputs = function () {
        var _this = this;
        var eventEmitters = this.componentFactory.outputs.map(function (_a) {
            var propName = _a.propName, templateName = _a.templateName;
            var emitter = _this.componentRef.instance[propName];
            return emitter.pipe(map(function (value) { return ({ name: templateName, value: value }); }));
        });
        this.events = merge.apply(void 0, __spread(eventEmitters));
    };
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    ComponentNgElementStrategy.prototype.callNgOnChanges = function () {
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
    ComponentNgElementStrategy.prototype.scheduleDetectChanges = function () {
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
    ComponentNgElementStrategy.prototype.recordInputChange = function (property, currentValue) {
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
        var isFirstChange = this.unchangedInputs.has(property);
        this.unchangedInputs.delete(property);
        var previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    };
    /** Runs change detection on the component. */
    ComponentNgElementStrategy.prototype.detectChanges = function () {
        if (!this.componentRef) {
            return;
        }
        this.callNgOnChanges();
        this.componentRef.changeDetectorRef.detectChanges();
    };
    return ComponentNgElementStrategy;
}());
export { ComponentNgElementStrategy };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQW9CLHdCQUF3QixFQUE4QixRQUFRLEVBQWEsWUFBWSxFQUFzQixNQUFNLGVBQWUsQ0FBQztBQUM3SyxPQUFPLEVBQUMsS0FBSyxFQUFhLE1BQU0sTUFBTSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxHQUFHLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUduQyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFNUQsMEZBQTBGO0FBQzFGLElBQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUV6Qjs7Ozs7R0FLRztBQUNIO0lBR0UsMkNBQVksU0FBb0IsRUFBRSxRQUFrQjtRQUNsRCxJQUFJLENBQUMsZ0JBQWdCO1lBQ2pCLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsa0RBQU0sR0FBTixVQUFPLFFBQWtCO1FBQ3ZCLE9BQU8sSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNILHdDQUFDO0FBQUQsQ0FBQyxBQVhELElBV0M7O0FBRUQ7Ozs7O0dBS0c7QUFDSDtJQThCRSxvQ0FBb0IsZ0JBQXVDLEVBQVUsUUFBa0I7UUFBbkUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF1QjtRQUFVLGFBQVEsR0FBUixRQUFRLENB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QVksRUFBRTtZQUN0QixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLFlBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2RCxDQUFDO0lBQ0gsaUNBQUM7QUFBRCxDQUFDLEFBNU5ELElBNE5DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmLCBDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIENvbXBvbmVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbmplY3RvciwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXMsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHttZXJnZSwgT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge21hcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge05nRWxlbWVudFN0cmF0ZWd5LCBOZ0VsZW1lbnRTdHJhdGVneUV2ZW50LCBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2V4dHJhY3RQcm9qZWN0YWJsZU5vZGVzfSBmcm9tICcuL2V4dHJhY3QtcHJvamVjdGFibGUtbm9kZXMnO1xuaW1wb3J0IHtpc0Z1bmN0aW9uLCBzY2hlZHVsZXIsIHN0cmljdEVxdWFsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKiBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBkZXN0cm95aW5nIHRoZSBjb21wb25lbnQgcmVmIHdoZW4gZGlzY29ubmVjdGVkLiAqL1xuY29uc3QgREVTVFJPWV9ERUxBWSA9IDEwO1xuXG4vKipcbiAqIEZhY3RvcnkgdGhhdCBjcmVhdGVzIG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbnN0YW5jZS4gR2V0cyB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2l0aCB0aGVcbiAqIGNvbnN0cnVjdG9yJ3MgaW5qZWN0b3IncyBmYWN0b3J5IHJlc29sdmVyIGFuZCBwYXNzZXMgdGhhdCBmYWN0b3J5IHRvIGVhY2ggc3RyYXRlZ3kuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IHtcbiAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKGNvbXBvbmVudDogVHlwZTxhbnk+LCBpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnkgPVxuICAgICAgICBpbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKS5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICB9XG5cbiAgY3JlYXRlKGluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kodGhpcy5jb21wb25lbnRGYWN0b3J5LCBpbmplY3Rvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBkZXN0cm95cyBhIGNvbXBvbmVudCByZWYgdXNpbmcgYSBjb21wb25lbnQgZmFjdG9yeSBhbmQgaGFuZGxlcyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBpbiByZXNwb25zZSB0byBpbnB1dCBjaGFuZ2VzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5IGltcGxlbWVudHMgTmdFbGVtZW50U3RyYXRlZ3kge1xuICAvKiogTWVyZ2VkIHN0cmVhbSBvZiB0aGUgY29tcG9uZW50J3Mgb3V0cHV0IGV2ZW50cy4gKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGV2ZW50cyE6IE9ic2VydmFibGU8TmdFbGVtZW50U3RyYXRlZ3lFdmVudD47XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IHRoYXQgd2FzIGNyZWF0ZWQgb24gY29ubmVjdC4gKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgY29tcG9uZW50UmVmITogQ29tcG9uZW50UmVmPGFueT58bnVsbDtcblxuICAvKiogQ2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBtYWRlIHRvIHRoZSBjb21wb25lbnQgcmVmIHNpbmNlIHRoZSBsYXN0IHRpbWUgb25DaGFuZ2VzIHdhcyBjYWxsZWQuICovXG4gIHByaXZhdGUgaW5wdXRDaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzfG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjcmVhdGVkIGNvbXBvbmVudCBpbXBsZW1lbnRzIHRoZSBvbkNoYW5nZXMgZnVuY3Rpb24uICovXG4gIHByaXZhdGUgaW1wbGVtZW50c09uQ2hhbmdlcyA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIGEgY2hhbmdlIGRldGVjdGlvbiBoYXMgYmVlbiBzY2hlZHVsZWQgdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm46ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3aGVuIGNhbGxlZCB3aWxsIGNhbmNlbCBhIHNjaGVkdWxlZCBkZXN0cnVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZERlc3Ryb3lGbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBJbml0aWFsIGlucHV0IHZhbHVlcyB0aGF0IHdlcmUgc2V0IGJlZm9yZSB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxJbnB1dFZhbHVlcyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiBjb21wb25lbnQgaW5wdXRzIHRoYXQgaGF2ZSBub3QgeWV0IGNoYW5nZWQsIGkuZS4gZm9yIHdoaWNoIGBuZ09uQ2hhbmdlcygpYCBoYXMgbm90XG4gICAqIGZpcmVkLiAoVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZSB0aGUgdmFsdWUgb2YgYGZpc3RDaGFuZ2VgIGluIGBTaW1wbGVDaGFuZ2VgIGluc3RhbmNlcy4pXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHVuY2hhbmdlZElucHV0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+LCBwcml2YXRlIGluamVjdG9yOiBJbmplY3Rvcikge31cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBuZXcgY29tcG9uZW50IGlmIG9uZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgYW5kIGNhbmNlbHMgYW55IHNjaGVkdWxlZFxuICAgKiBkZXN0cnVjdGlvbi5cbiAgICovXG4gIGNvbm5lY3QoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBtYXJrZWQgdG8gYmUgZGVzdHJveWVkLCBjYW5jZWwgdGhlIHRhc2sgc2luY2UgdGhlIGNvbXBvbmVudCB3YXMgcmVjb25uZWN0ZWRcbiAgICBpZiAodGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuKCk7XG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgdGhpcy5pbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgc29tZSBzbWFsbCBkZWxheSBpbiBjYXNlIHRoZSBlbGVtZW50IGlzIGp1c3RcbiAgICogYmVpbmcgbW92ZWQgYWNyb3NzIHRoZSBET00uXG4gICAqL1xuICBkaXNjb25uZWN0KCkge1xuICAgIC8vIFJldHVybiBpZiB0aGVyZSBpcyBubyBjb21wb25lbnRSZWYgb3IgdGhlIGNvbXBvbmVudCBpcyBhbHJlYWR5IHNjaGVkdWxlZCBmb3IgZGVzdHJ1Y3Rpb25cbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmIHx8IHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuICE9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU2NoZWR1bGUgdGhlIGNvbXBvbmVudCB0byBiZSBkZXN0cm95ZWQgYWZ0ZXIgYSBzbWFsbCB0aW1lb3V0IGluIGNhc2UgaXQgaXMgYmVpbmdcbiAgICAvLyBtb3ZlZCBlbHNld2hlcmUgaW4gdGhlIERPTVxuICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuID0gc2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZikge1xuICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiEuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiA9IG51bGw7XG4gICAgICB9XG4gICAgfSwgREVTVFJPWV9ERUxBWSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IHByb3BlcnR5IHZhbHVlLiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIHJldHJpZXZlZCBmcm9tIHRoZSBjYWNoZWQgaW5pdGlhbGl6YXRpb24gdmFsdWVzLlxuICAgKi9cbiAgZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogYW55IHtcbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BlcnR5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIGFueSlbcHJvcGVydHldO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGlucHV0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkuIElmIHRoZSBjb21wb25lbnQgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkLCB0aGUgdmFsdWUgaXNcbiAgICogY2FjaGVkIGFuZCBzZXQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBzZXRJbnB1dFZhbHVlKHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29tcG9uZW50UmVmKSB7XG4gICAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5zZXQocHJvcGVydHksIHZhbHVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZ25vcmUgdGhlIHZhbHVlIGlmIGl0IGlzIHN0cmljdGx5IGVxdWFsIHRvIHRoZSBjdXJyZW50IHZhbHVlLCBleGNlcHQgaWYgaXQgaXMgYHVuZGVmaW5lZGBcbiAgICAvLyBhbmQgdGhpcyBpcyB0aGUgZmlyc3QgY2hhbmdlIHRvIHRoZSB2YWx1ZSAoYmVjYXVzZSBhbiBleHBsaWNpdCBgdW5kZWZpbmVkYCBfaXNfIHN0cmljdGx5XG4gICAgLy8gZXF1YWwgdG8gbm90IGhhdmluZyBhIHZhbHVlIHNldCBhdCBhbGwsIGJ1dCB3ZSBzdGlsbCBuZWVkIHRvIHJlY29yZCB0aGlzIGFzIGEgY2hhbmdlKS5cbiAgICBpZiAoc3RyaWN0RXF1YWxzKHZhbHVlLCB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpKSAmJlxuICAgICAgICAhKCh2YWx1ZSA9PT0gdW5kZWZpbmVkKSAmJiB0aGlzLnVuY2hhbmdlZElucHV0cy5oYXMocHJvcGVydHkpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHksIHZhbHVlKTtcbiAgICAodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55KVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICB0aGlzLnNjaGVkdWxlRGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29tcG9uZW50IHRocm91Z2ggdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlIHByb3ZpZGVkIGVsZW1lbnQgaG9zdCBhbmRcbiAgICogc2V0cyB1cCBpdHMgaW5pdGlhbCBpbnB1dHMsIGxpc3RlbnMgZm9yIG91dHB1dHMgY2hhbmdlcywgYW5kIHJ1bnMgYW4gaW5pdGlhbCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZEluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IFtdLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3J9KTtcbiAgICBjb25zdCBwcm9qZWN0YWJsZU5vZGVzID1cbiAgICAgICAgZXh0cmFjdFByb2plY3RhYmxlTm9kZXMoZWxlbWVudCwgdGhpcy5jb21wb25lbnRGYWN0b3J5Lm5nQ29udGVudFNlbGVjdG9ycyk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSB0aGlzLmNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNoaWxkSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIGVsZW1lbnQpO1xuXG4gICAgdGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzID1cbiAgICAgICAgaXNGdW5jdGlvbigodGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2UgYXMgYW55IGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplSW5wdXRzKCk7XG4gICAgdGhpcy5pbml0aWFsaXplT3V0cHV0cygpO1xuXG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvblJlZiA9IHRoaXMuaW5qZWN0b3IuZ2V0PEFwcGxpY2F0aW9uUmVmPihBcHBsaWNhdGlvblJlZik7XG4gICAgYXBwbGljYXRpb25SZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gIH1cblxuICAvKiogU2V0IGFueSBzdG9yZWQgaW5pdGlhbCBpbnB1dHMgb24gdGhlIGNvbXBvbmVudCdzIHByb3BlcnRpZXMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplSW5wdXRzKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeS5pbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lfSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgICAvLyBJZiB0aGUgY29tcG9uZW50IGltcGxlbWVudHMgYG5nT25DaGFuZ2VzKClgLCBrZWVwIHRyYWNrIG9mIHdoaWNoIGlucHV0cyBoYXZlIG5ldmVyXG4gICAgICAgIC8vIGNoYW5nZWQgc28gZmFyLlxuICAgICAgICB0aGlzLnVuY2hhbmdlZElucHV0cy5hZGQocHJvcE5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuaGFzKHByb3BOYW1lKSkge1xuICAgICAgICAvLyBDYWxsIGBzZXRJbnB1dFZhbHVlKClgIG5vdyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHRvIHVwZGF0ZSBpdHNcbiAgICAgICAgLy8gcHJvcGVydGllcyBhbmQgZmlyZSBgbmdPbkNoYW5nZXMoKWAuXG4gICAgICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuZ2V0KHByb3BOYW1lKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIFNldHMgdXAgbGlzdGVuZXJzIGZvciB0aGUgY29tcG9uZW50J3Mgb3V0cHV0cyBzbyB0aGF0IHRoZSBldmVudHMgc3RyZWFtIGVtaXRzIHRoZSBldmVudHMuICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplT3V0cHV0cygpOiB2b2lkIHtcbiAgICBjb25zdCBldmVudEVtaXR0ZXJzID0gdGhpcy5jb21wb25lbnRGYWN0b3J5Lm91dHB1dHMubWFwKCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pID0+IHtcbiAgICAgIGNvbnN0IGVtaXR0ZXIgPSAodGhpcy5jb21wb25lbnRSZWYhLmluc3RhbmNlIGFzIGFueSlbcHJvcE5hbWVdIGFzIEV2ZW50RW1pdHRlcjxhbnk+O1xuICAgICAgcmV0dXJuIGVtaXR0ZXIucGlwZShtYXAoKHZhbHVlOiBhbnkpID0+ICh7bmFtZTogdGVtcGxhdGVOYW1lLCB2YWx1ZX0pKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmV2ZW50cyA9IG1lcmdlKC4uLmV2ZW50RW1pdHRlcnMpO1xuICB9XG5cbiAgLyoqIENhbGxzIG5nT25DaGFuZ2VzIHdpdGggYWxsIHRoZSBpbnB1dHMgdGhhdCBoYXZlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbC4gKi9cbiAgcHJvdGVjdGVkIGNhbGxOZ09uQ2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyB8fCB0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENhY2hlIHRoZSBjaGFuZ2VzIGFuZCBzZXQgaW5wdXRDaGFuZ2VzIHRvIG51bGwgdG8gY2FwdHVyZSBhbnkgY2hhbmdlcyB0aGF0IG1pZ2h0IG9jY3VyXG4gICAgLy8gZHVyaW5nIG5nT25DaGFuZ2VzLlxuICAgIGNvbnN0IGlucHV0Q2hhbmdlcyA9IHRoaXMuaW5wdXRDaGFuZ2VzO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0gbnVsbDtcbiAgICAodGhpcy5jb21wb25lbnRSZWYhLmluc3RhbmNlIGFzIGFueSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKGlucHV0Q2hhbmdlcyk7XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIGNoYW5nZSBkZXRlY3Rpb24gdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuXG4gICAqIElnbm9yZXMgc3Vic2VxdWVudCBjYWxscyBpZiBhbHJlYWR5IHNjaGVkdWxlZC5cbiAgICovXG4gIHByb3RlY3RlZCBzY2hlZHVsZURldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gc2NoZWR1bGVyLnNjaGVkdWxlQmVmb3JlUmVuZGVyKCgpID0+IHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBudWxsO1xuICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyBpbnB1dCBjaGFuZ2VzIHNvIHRoYXQgdGhlIGNvbXBvbmVudCByZWNlaXZlcyBTaW1wbGVDaGFuZ2VzIGluIGl0cyBvbkNoYW5nZXMgZnVuY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHk6IHN0cmluZywgY3VycmVudFZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICAvLyBEbyBub3QgcmVjb3JkIHRoZSBjaGFuZ2UgaWYgdGhlIGNvbXBvbmVudCBkb2VzIG5vdCBpbXBsZW1lbnQgYE9uQ2hhbmdlc2AuXG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmICYmICF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0ge307XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYWxyZWFkeSBpcyBhIGNoYW5nZSwgbW9kaWZ5IHRoZSBjdXJyZW50IHZhbHVlIHRvIG1hdGNoIGJ1dCBsZWF2ZSB0aGUgdmFsdWVzIGZvclxuICAgIC8vIHByZXZpb3VzVmFsdWUgYW5kIGlzRmlyc3RDaGFuZ2UuXG4gICAgY29uc3QgcGVuZGluZ0NoYW5nZSA9IHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XTtcbiAgICBpZiAocGVuZGluZ0NoYW5nZSkge1xuICAgICAgcGVuZGluZ0NoYW5nZS5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNGaXJzdENoYW5nZSA9IHRoaXMudW5jaGFuZ2VkSW5wdXRzLmhhcyhwcm9wZXJ0eSk7XG4gICAgdGhpcy51bmNoYW5nZWRJbnB1dHMuZGVsZXRlKHByb3BlcnR5KTtcblxuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSBpc0ZpcnN0Q2hhbmdlID8gdW5kZWZpbmVkIDogdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KTtcbiAgICB0aGlzLmlucHV0Q2hhbmdlc1twcm9wZXJ0eV0gPSBuZXcgU2ltcGxlQ2hhbmdlKHByZXZpb3VzVmFsdWUsIGN1cnJlbnRWYWx1ZSwgaXNGaXJzdENoYW5nZSk7XG4gIH1cblxuICAvKiogUnVucyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByb3RlY3RlZCBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb21wb25lbnRSZWYpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxOZ09uQ2hhbmdlcygpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmIS5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbn1cbiJdfQ==