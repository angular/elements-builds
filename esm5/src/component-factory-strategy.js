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
        /** Reference to the component that was created on connect. */
        this.componentRef = null;
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
        if (this.componentRef === null) {
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
        if (this.componentRef === null || this.scheduledDestroyFn !== null) {
            return;
        }
        // Schedule the component to be destroyed after a small timeout in case it is being
        // moved elsewhere in the DOM
        this.scheduledDestroyFn = scheduler.schedule(function () {
            if (_this.componentRef !== null) {
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
        if (this.componentRef === null) {
            return this.initialInputValues.get(property);
        }
        return this.componentRef.instance[property];
    };
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    ComponentNgElementStrategy.prototype.setInputValue = function (property, value) {
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
        this.implementsOnChanges = isFunction(this.componentRef.instance.ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs(this.componentRef);
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
    ComponentNgElementStrategy.prototype.initializeOutputs = function (componentRef) {
        var eventEmitters = this.componentFactory.outputs.map(function (_a) {
            var propName = _a.propName, templateName = _a.templateName;
            var emitter = componentRef.instance[propName];
            return emitter.pipe(map(function (value) { return ({ name: templateName, value: value }); }));
        });
        this.events = merge.apply(void 0, __spread(eventEmitters));
    };
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    ComponentNgElementStrategy.prototype.callNgOnChanges = function (componentRef) {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        var inputChanges = this.inputChanges;
        this.inputChanges = null;
        componentRef.instance.ngOnChanges(inputChanges);
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
        // (We can only determine that after the component has been instantiated.)
        if (this.componentRef !== null && !this.implementsOnChanges) {
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
        if (this.componentRef === null) {
            return;
        }
        this.callNgOnChanges(this.componentRef);
        this.componentRef.changeDetectorRef.detectChanges();
    };
    return ComponentNgElementStrategy;
}());
export { ComponentNgElementStrategy };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQW9CLHdCQUF3QixFQUE4QixRQUFRLEVBQWEsWUFBWSxFQUFzQixNQUFNLGVBQWUsQ0FBQztBQUM3SyxPQUFPLEVBQUMsS0FBSyxFQUFhLE1BQU0sTUFBTSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxHQUFHLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUduQyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFNUQsMEZBQTBGO0FBQzFGLElBQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUV6Qjs7Ozs7R0FLRztBQUNIO0lBR0UsMkNBQVksU0FBb0IsRUFBRSxRQUFrQjtRQUNsRCxJQUFJLENBQUMsZ0JBQWdCO1lBQ2pCLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsa0RBQU0sR0FBTixVQUFPLFFBQWtCO1FBQ3ZCLE9BQU8sSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNILHdDQUFDO0FBQUQsQ0FBQyxBQVhELElBV0M7O0FBRUQ7Ozs7O0dBS0c7QUFDSDtJQTZCRSxvQ0FBb0IsZ0JBQXVDLEVBQVUsUUFBa0I7UUFBbkUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF1QjtRQUFVLGFBQVEsR0FBUixRQUFRLENB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QyxhQUFhLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFFRCw4Q0FBOEM7SUFDcEMsa0RBQWEsR0FBdkI7UUFDRSxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxFQUFFO1lBQzlCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdEQsQ0FBQztJQUNILGlDQUFDO0FBQUQsQ0FBQyxBQTNORCxJQTJOQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZiwgQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBDb21wb25lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5qZWN0b3IsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7bWVyZ2UsIE9ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHttYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lFdmVudCwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtleHRyYWN0UHJvamVjdGFibGVOb2Rlc30gZnJvbSAnLi9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzJztcbmltcG9ydCB7aXNGdW5jdGlvbiwgc2NoZWR1bGVyLCBzdHJpY3RFcXVhbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgZGVzdHJveWluZyB0aGUgY29tcG9uZW50IHJlZiB3aGVuIGRpc2Nvbm5lY3RlZC4gKi9cbmNvbnN0IERFU1RST1lfREVMQVkgPSAxMDtcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3kgaW5zdGFuY2UuIEdldHMgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdpdGggdGhlXG4gKiBjb25zdHJ1Y3RvcidzIGluamVjdG9yJ3MgZmFjdG9yeSByZXNvbHZlciBhbmQgcGFzc2VzIHRoYXQgZmFjdG9yeSB0byBlYWNoIHN0cmF0ZWd5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSB7XG4gIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55PjtcblxuICBjb25zdHJ1Y3Rvcihjb21wb25lbnQ6IFR5cGU8YW55PiwgaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5ID1cbiAgICAgICAgaW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcikucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgfVxuXG4gIGNyZWF0ZShpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5KHRoaXMuY29tcG9uZW50RmFjdG9yeSwgaW5qZWN0b3IpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgZGVzdHJveXMgYSBjb21wb25lbnQgcmVmIHVzaW5nIGEgY29tcG9uZW50IGZhY3RvcnkgYW5kIGhhbmRsZXMgY2hhbmdlIGRldGVjdGlvblxuICogaW4gcmVzcG9uc2UgdG8gaW5wdXQgY2hhbmdlcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneSBpbXBsZW1lbnRzIE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgLyoqIE1lcmdlZCBzdHJlYW0gb2YgdGhlIGNvbXBvbmVudCdzIG91dHB1dCBldmVudHMuICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBldmVudHMhOiBPYnNlcnZhYmxlPE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQ+O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudCB0aGF0IHdhcyBjcmVhdGVkIG9uIGNvbm5lY3QuICovXG4gIHByaXZhdGUgY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICAvKiogQ2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBtYWRlIHRvIHRoZSBjb21wb25lbnQgcmVmIHNpbmNlIHRoZSBsYXN0IHRpbWUgb25DaGFuZ2VzIHdhcyBjYWxsZWQuICovXG4gIHByaXZhdGUgaW5wdXRDaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzfG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjcmVhdGVkIGNvbXBvbmVudCBpbXBsZW1lbnRzIHRoZSBvbkNoYW5nZXMgZnVuY3Rpb24uICovXG4gIHByaXZhdGUgaW1wbGVtZW50c09uQ2hhbmdlcyA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIGEgY2hhbmdlIGRldGVjdGlvbiBoYXMgYmVlbiBzY2hlZHVsZWQgdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuICovXG4gIHByaXZhdGUgc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm46ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3aGVuIGNhbGxlZCB3aWxsIGNhbmNlbCBhIHNjaGVkdWxlZCBkZXN0cnVjdGlvbiBvbiB0aGUgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIHNjaGVkdWxlZERlc3Ryb3lGbjogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gIC8qKiBJbml0aWFsIGlucHV0IHZhbHVlcyB0aGF0IHdlcmUgc2V0IGJlZm9yZSB0aGUgY29tcG9uZW50IHdhcyBjcmVhdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxJbnB1dFZhbHVlcyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiBjb21wb25lbnQgaW5wdXRzIHRoYXQgaGF2ZSBub3QgeWV0IGNoYW5nZWQsIGkuZS4gZm9yIHdoaWNoIGBuZ09uQ2hhbmdlcygpYCBoYXMgbm90XG4gICAqIGZpcmVkLiAoVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZSB0aGUgdmFsdWUgb2YgYGZpc3RDaGFuZ2VgIGluIGBTaW1wbGVDaGFuZ2VgIGluc3RhbmNlcy4pXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHVuY2hhbmdlZElucHV0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+LCBwcml2YXRlIGluamVjdG9yOiBJbmplY3Rvcikge31cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBuZXcgY29tcG9uZW50IGlmIG9uZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgYW5kIGNhbmNlbHMgYW55IHNjaGVkdWxlZFxuICAgKiBkZXN0cnVjdGlvbi5cbiAgICovXG4gIGNvbm5lY3QoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBtYXJrZWQgdG8gYmUgZGVzdHJveWVkLCBjYW5jZWwgdGhlIHRhc2sgc2luY2UgdGhlIGNvbXBvbmVudCB3YXMgcmVjb25uZWN0ZWRcbiAgICBpZiAodGhpcy5zY2hlZHVsZWREZXN0cm95Rm4gIT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkRGVzdHJveUZuKCk7XG4gICAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICB0aGlzLmluaXRpYWxpemVDb21wb25lbnQoZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgY29tcG9uZW50IHRvIGJlIGRlc3Ryb3llZCBhZnRlciBzb21lIHNtYWxsIGRlbGF5IGluIGNhc2UgdGhlIGVsZW1lbnQgaXMganVzdFxuICAgKiBiZWluZyBtb3ZlZCBhY3Jvc3MgdGhlIERPTS5cbiAgICovXG4gIGRpc2Nvbm5lY3QoKSB7XG4gICAgLy8gUmV0dXJuIGlmIHRoZXJlIGlzIG5vIGNvbXBvbmVudFJlZiBvciB0aGUgY29tcG9uZW50IGlzIGFscmVhZHkgc2NoZWR1bGVkIGZvciBkZXN0cnVjdGlvblxuICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCB8fCB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNjaGVkdWxlIHRoZSBjb21wb25lbnQgdG8gYmUgZGVzdHJveWVkIGFmdGVyIGEgc21hbGwgdGltZW91dCBpbiBjYXNlIGl0IGlzIGJlaW5nXG4gICAgLy8gbW92ZWQgZWxzZXdoZXJlIGluIHRoZSBET01cbiAgICB0aGlzLnNjaGVkdWxlZERlc3Ryb3lGbiA9IHNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWYuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudFJlZiA9IG51bGw7XG4gICAgICB9XG4gICAgfSwgREVTVFJPWV9ERUxBWSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IHByb3BlcnR5IHZhbHVlLiBJZiB0aGUgY29tcG9uZW50IGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCwgdGhlIHZhbHVlIGlzXG4gICAqIHJldHJpZXZlZCBmcm9tIHRoZSBjYWNoZWQgaW5pdGlhbGl6YXRpb24gdmFsdWVzLlxuICAgKi9cbiAgZ2V0SW5wdXRWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogYW55IHtcbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcGVydHkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudFJlZi5pbnN0YW5jZVtwcm9wZXJ0eV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5wdXQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQsIHRoZSB2YWx1ZSBpc1xuICAgKiBjYWNoZWQgYW5kIHNldCB3aGVuIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHNldElucHV0VmFsdWUocHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNvbXBvbmVudFJlZiA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5pbml0aWFsSW5wdXRWYWx1ZXMuc2V0KHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWdub3JlIHRoZSB2YWx1ZSBpZiBpdCBpcyBzdHJpY3RseSBlcXVhbCB0byB0aGUgY3VycmVudCB2YWx1ZSwgZXhjZXB0IGlmIGl0IGlzIGB1bmRlZmluZWRgXG4gICAgLy8gYW5kIHRoaXMgaXMgdGhlIGZpcnN0IGNoYW5nZSB0byB0aGUgdmFsdWUgKGJlY2F1c2UgYW4gZXhwbGljaXQgYHVuZGVmaW5lZGAgX2lzXyBzdHJpY3RseVxuICAgIC8vIGVxdWFsIHRvIG5vdCBoYXZpbmcgYSB2YWx1ZSBzZXQgYXQgYWxsLCBidXQgd2Ugc3RpbGwgbmVlZCB0byByZWNvcmQgdGhpcyBhcyBhIGNoYW5nZSkuXG4gICAgaWYgKHN0cmljdEVxdWFscyh2YWx1ZSwgdGhpcy5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KSkgJiZcbiAgICAgICAgISgodmFsdWUgPT09IHVuZGVmaW5lZCkgJiYgdGhpcy51bmNoYW5nZWRJbnB1dHMuaGFzKHByb3BlcnR5KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29yZElucHV0Q2hhbmdlKHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgdGhpcy5jb21wb25lbnRSZWYuaW5zdGFuY2VbcHJvcGVydHldID0gdmFsdWU7XG4gICAgdGhpcy5zY2hlZHVsZURldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudCB0aHJvdWdoIHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aXRoIHRoZSBwcm92aWRlZCBlbGVtZW50IGhvc3QgYW5kXG4gICAqIHNldHMgdXAgaXRzIGluaXRpYWwgaW5wdXRzLCBsaXN0ZW5zIGZvciBvdXRwdXRzIGNoYW5nZXMsIGFuZCBydW5zIGFuIGluaXRpYWwgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBpbml0aWFsaXplQ29tcG9uZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgY2hpbGRJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBbXSwgcGFyZW50OiB0aGlzLmluamVjdG9yfSk7XG4gICAgY29uc3QgcHJvamVjdGFibGVOb2RlcyA9XG4gICAgICAgIGV4dHJhY3RQcm9qZWN0YWJsZU5vZGVzKGVsZW1lbnQsIHRoaXMuY29tcG9uZW50RmFjdG9yeS5uZ0NvbnRlbnRTZWxlY3RvcnMpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmID0gdGhpcy5jb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjaGlsZEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCBlbGVtZW50KTtcblxuICAgIHRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcyA9IGlzRnVuY3Rpb24oKHRoaXMuY29tcG9uZW50UmVmLmluc3RhbmNlIGFzIE9uQ2hhbmdlcykubmdPbkNoYW5nZXMpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplSW5wdXRzKCk7XG4gICAgdGhpcy5pbml0aWFsaXplT3V0cHV0cyh0aGlzLmNvbXBvbmVudFJlZik7XG5cbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcblxuICAgIGNvbnN0IGFwcGxpY2F0aW9uUmVmID0gdGhpcy5pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICBhcHBsaWNhdGlvblJlZi5hdHRhY2hWaWV3KHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIC8qKiBTZXQgYW55IHN0b3JlZCBpbml0aWFsIGlucHV0cyBvbiB0aGUgY29tcG9uZW50J3MgcHJvcGVydGllcy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVJbnB1dHMoKTogdm9pZCB7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5LmlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWV9KSA9PiB7XG4gICAgICBpZiAodGhpcy5pbXBsZW1lbnRzT25DaGFuZ2VzKSB7XG4gICAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgaW1wbGVtZW50cyBgbmdPbkNoYW5nZXMoKWAsIGtlZXAgdHJhY2sgb2Ygd2hpY2ggaW5wdXRzIGhhdmUgbmV2ZXJcbiAgICAgICAgLy8gY2hhbmdlZCBzbyBmYXIuXG4gICAgICAgIHRoaXMudW5jaGFuZ2VkSW5wdXRzLmFkZChwcm9wTmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5oYXMocHJvcE5hbWUpKSB7XG4gICAgICAgIC8vIENhbGwgYHNldElucHV0VmFsdWUoKWAgbm93IHRoYXQgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBpbnN0YW50aWF0ZWQgdG8gdXBkYXRlIGl0c1xuICAgICAgICAvLyBwcm9wZXJ0aWVzIGFuZCBmaXJlIGBuZ09uQ2hhbmdlcygpYC5cbiAgICAgICAgdGhpcy5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCB0aGlzLmluaXRpYWxJbnB1dFZhbHVlcy5nZXQocHJvcE5hbWUpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuaW5pdGlhbElucHV0VmFsdWVzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogU2V0cyB1cCBsaXN0ZW5lcnMgZm9yIHRoZSBjb21wb25lbnQncyBvdXRwdXRzIHNvIHRoYXQgdGhlIGV2ZW50cyBzdHJlYW0gZW1pdHMgdGhlIGV2ZW50cy4gKi9cbiAgcHJvdGVjdGVkIGluaXRpYWxpemVPdXRwdXRzKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBldmVudEVtaXR0ZXJzID0gdGhpcy5jb21wb25lbnRGYWN0b3J5Lm91dHB1dHMubWFwKCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pID0+IHtcbiAgICAgIGNvbnN0IGVtaXR0ZXI6IEV2ZW50RW1pdHRlcjxhbnk+ID0gY29tcG9uZW50UmVmLmluc3RhbmNlW3Byb3BOYW1lXTtcbiAgICAgIHJldHVybiBlbWl0dGVyLnBpcGUobWFwKHZhbHVlID0+ICh7bmFtZTogdGVtcGxhdGVOYW1lLCB2YWx1ZX0pKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmV2ZW50cyA9IG1lcmdlKC4uLmV2ZW50RW1pdHRlcnMpO1xuICB9XG5cbiAgLyoqIENhbGxzIG5nT25DaGFuZ2VzIHdpdGggYWxsIHRoZSBpbnB1dHMgdGhhdCBoYXZlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbC4gKi9cbiAgcHJvdGVjdGVkIGNhbGxOZ09uQ2hhbmdlcyhjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmltcGxlbWVudHNPbkNoYW5nZXMgfHwgdGhpcy5pbnB1dENoYW5nZXMgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDYWNoZSB0aGUgY2hhbmdlcyBhbmQgc2V0IGlucHV0Q2hhbmdlcyB0byBudWxsIHRvIGNhcHR1cmUgYW55IGNoYW5nZXMgdGhhdCBtaWdodCBvY2N1clxuICAgIC8vIGR1cmluZyBuZ09uQ2hhbmdlcy5cbiAgICBjb25zdCBpbnB1dENoYW5nZXMgPSB0aGlzLmlucHV0Q2hhbmdlcztcbiAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IG51bGw7XG4gICAgKGNvbXBvbmVudFJlZi5pbnN0YW5jZSBhcyBPbkNoYW5nZXMpLm5nT25DaGFuZ2VzKGlucHV0Q2hhbmdlcyk7XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIGNoYW5nZSBkZXRlY3Rpb24gdG8gcnVuIG9uIHRoZSBjb21wb25lbnQuXG4gICAqIElnbm9yZXMgc3Vic2VxdWVudCBjYWxscyBpZiBhbHJlYWR5IHNjaGVkdWxlZC5cbiAgICovXG4gIHByb3RlY3RlZCBzY2hlZHVsZURldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlZENoYW5nZURldGVjdGlvbkZuID0gc2NoZWR1bGVyLnNjaGVkdWxlQmVmb3JlUmVuZGVyKCgpID0+IHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkQ2hhbmdlRGV0ZWN0aW9uRm4gPSBudWxsO1xuICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyBpbnB1dCBjaGFuZ2VzIHNvIHRoYXQgdGhlIGNvbXBvbmVudCByZWNlaXZlcyBTaW1wbGVDaGFuZ2VzIGluIGl0cyBvbkNoYW5nZXMgZnVuY3Rpb24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVjb3JkSW5wdXRDaGFuZ2UocHJvcGVydHk6IHN0cmluZywgY3VycmVudFZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICAvLyBEbyBub3QgcmVjb3JkIHRoZSBjaGFuZ2UgaWYgdGhlIGNvbXBvbmVudCBkb2VzIG5vdCBpbXBsZW1lbnQgYE9uQ2hhbmdlc2AuXG4gICAgLy8gKFdlIGNhbiBvbmx5IGRldGVybWluZSB0aGF0IGFmdGVyIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkLilcbiAgICBpZiAodGhpcy5jb21wb25lbnRSZWYgIT09IG51bGwgJiYgIXRoaXMuaW1wbGVtZW50c09uQ2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlucHV0Q2hhbmdlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5pbnB1dENoYW5nZXMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBhbHJlYWR5IGlzIGEgY2hhbmdlLCBtb2RpZnkgdGhlIGN1cnJlbnQgdmFsdWUgdG8gbWF0Y2ggYnV0IGxlYXZlIHRoZSB2YWx1ZXMgZm9yXG4gICAgLy8gcHJldmlvdXNWYWx1ZSBhbmQgaXNGaXJzdENoYW5nZS5cbiAgICBjb25zdCBwZW5kaW5nQ2hhbmdlID0gdGhpcy5pbnB1dENoYW5nZXNbcHJvcGVydHldO1xuICAgIGlmIChwZW5kaW5nQ2hhbmdlKSB7XG4gICAgICBwZW5kaW5nQ2hhbmdlLmN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0ZpcnN0Q2hhbmdlID0gdGhpcy51bmNoYW5nZWRJbnB1dHMuaGFzKHByb3BlcnR5KTtcbiAgICB0aGlzLnVuY2hhbmdlZElucHV0cy5kZWxldGUocHJvcGVydHkpO1xuXG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGlzRmlyc3RDaGFuZ2UgPyB1bmRlZmluZWQgOiB0aGlzLmdldElucHV0VmFsdWUocHJvcGVydHkpO1xuICAgIHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BlcnR5XSA9IG5ldyBTaW1wbGVDaGFuZ2UocHJldmlvdXNWYWx1ZSwgY3VycmVudFZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgfVxuXG4gIC8qKiBSdW5zIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50UmVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsTmdPbkNoYW5nZXModGhpcy5jb21wb25lbnRSZWYpO1xuICAgIHRoaXMuY29tcG9uZW50UmVmLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxufVxuIl19