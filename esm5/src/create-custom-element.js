/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends, __read } from "tslib";
import { ComponentNgElementStrategyFactory } from './component-factory-strategy';
import { createCustomEvent, getComponentInputs, getDefaultAttributeToPropertyInputs } from './utils';
/**
 * Implements the functionality needed for a custom element.
 *
 * @publicApi
 */
var NgElement = /** @class */ (function (_super) {
    __extends(NgElement, _super);
    function NgElement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * A subscription to change, connect, and disconnect events in the custom element.
         */
        _this.ngElementEventsSubscription = null;
        return _this;
    }
    return NgElement;
}(HTMLElement));
export { NgElement };
/**
 *  @description Creates a custom element class based on an Angular component.
 *
 * Builds a class that encapsulates the functionality of the provided component and
 * uses the configuration information to provide more context to the class.
 * Takes the component factory's inputs and outputs to convert them to the proper
 * custom element API and add hooks to input changes.
 *
 * The configuration's injector is the initial injector set on the class,
 * and used by default for each created instance.This behavior can be overridden with the
 * static property to affect all newly created instances, or as a constructor argument for
 * one-off creations.
 *
 * @param component The component to transform.
 * @param config A configuration that provides initialization information to the created class.
 * @returns The custom-element construction class, which can be registered with
 * a browser's `CustomElementRegistry`.
 *
 * @publicApi
 */
export function createCustomElement(component, config) {
    var inputs = getComponentInputs(component, config.injector);
    var strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
    var attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
    var NgElementImpl = /** @class */ (function (_super) {
        __extends(NgElementImpl, _super);
        function NgElementImpl(injector) {
            var _this = _super.call(this) || this;
            _this.injector = injector;
            return _this;
        }
        Object.defineProperty(NgElementImpl.prototype, "ngElementStrategy", {
            get: function () {
                var _this = this;
                // NOTE:
                // Some polyfills (e.g. `document-register-element`) do not call the constructor, therefore
                // it is not safe to set `ngElementStrategy` in the constructor and assume it will be
                // available inside the methods.
                //
                // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
                // now this is tested using a Google internal test suite.
                if (!this._ngElementStrategy) {
                    var strategy_1 = this._ngElementStrategy =
                        strategyFactory.create(this.injector || config.injector);
                    // Collect pre-existing values on the element to re-apply through the strategy.
                    var preExistingValues = inputs.filter(function (_a) {
                        var propName = _a.propName;
                        return _this.hasOwnProperty(propName);
                    }).map(function (_a) {
                        var propName = _a.propName;
                        return [propName, _this[propName]];
                    });
                    // In some browsers (e.g. IE10), `Object.setPrototypeOf()` (which is required by some Custom
                    // Elements polyfills) is not defined and is thus polyfilled in a way that does not preserve
                    // the prototype chain. In such cases, `this` will not be an instance of `NgElementImpl` and
                    // thus not have the component input getters/setters defined on `NgElementImpl.prototype`.
                    if (!(this instanceof NgElementImpl)) {
                        // Add getters and setters to the instance itself for each property input.
                        defineInputGettersSetters(inputs, this);
                    }
                    else {
                        // Delete the property from the instance, so that it can go through the getters/setters
                        // set on `NgElementImpl.prototype`.
                        preExistingValues.forEach(function (_a) {
                            var _b = __read(_a, 1), propName = _b[0];
                            return delete _this[propName];
                        });
                    }
                    // Re-apply pre-existing values through the strategy.
                    preExistingValues.forEach(function (_a) {
                        var _b = __read(_a, 2), propName = _b[0], value = _b[1];
                        return strategy_1.setInputValue(propName, value);
                    });
                }
                return this._ngElementStrategy;
            },
            enumerable: true,
            configurable: true
        });
        NgElementImpl.prototype.attributeChangedCallback = function (attrName, oldValue, newValue, namespace) {
            var propName = attributeToPropertyInputs[attrName];
            this.ngElementStrategy.setInputValue(propName, newValue);
        };
        NgElementImpl.prototype.connectedCallback = function () {
            var _this = this;
            // Listen for events from the strategy and dispatch them as custom events
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(function (e) {
                var customEvent = createCustomEvent(_this.ownerDocument, e.name, e.value);
                _this.dispatchEvent(customEvent);
            });
            this.ngElementStrategy.connect(this);
        };
        NgElementImpl.prototype.disconnectedCallback = function () {
            // Not using `this.ngElementStrategy` to avoid unnecessarily creating the `NgElementStrategy`.
            if (this._ngElementStrategy) {
                this._ngElementStrategy.disconnect();
            }
            if (this.ngElementEventsSubscription) {
                this.ngElementEventsSubscription.unsubscribe();
                this.ngElementEventsSubscription = null;
            }
        };
        // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
        // field externs. So using quoted access to explicitly prevent renaming.
        NgElementImpl['observedAttributes'] = Object.keys(attributeToPropertyInputs);
        return NgElementImpl;
    }(NgElement));
    // Add getters and setters to the prototype for each property input.
    defineInputGettersSetters(inputs, NgElementImpl.prototype);
    return NgElementImpl;
}
// Helpers
function defineInputGettersSetters(inputs, target) {
    // Add getters and setters for each property input.
    inputs.forEach(function (_a) {
        var propName = _a.propName;
        Object.defineProperty(target, propName, {
            get: function () {
                return this.ngElementStrategy.getInputValue(propName);
            },
            set: function (newValue) {
                this.ngElementStrategy.setInputValue(propName, newValue);
            },
            configurable: true,
            enumerable: true,
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBS0gsT0FBTyxFQUFDLGlDQUFpQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFL0UsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG1DQUFtQyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBdUJuRzs7OztHQUlHO0FBQ0g7SUFBd0MsNkJBQVc7SUFBbkQ7UUFBQSxxRUErQkM7UUF6QkM7O1dBRUc7UUFDTyxpQ0FBMkIsR0FBc0IsSUFBSSxDQUFDOztJQXNCbEUsQ0FBQztJQUFELGdCQUFDO0FBQUQsQ0FBQyxBQS9CRCxDQUF3QyxXQUFXLEdBK0JsRDs7QUFnQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFNBQW9CLEVBQUUsTUFBdUI7SUFDL0MsSUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5RCxJQUFNLGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFaEcsSUFBTSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RTtRQUE0QixpQ0FBUztRQTZDbkMsdUJBQTZCLFFBQW1CO1lBQWhELFlBQ0UsaUJBQU8sU0FDUjtZQUY0QixjQUFRLEdBQVIsUUFBUSxDQUFXOztRQUVoRCxDQUFDO1FBMUNELHNCQUFjLDRDQUFpQjtpQkFBL0I7Z0JBQUEsaUJBb0NDO2dCQW5DQyxRQUFRO2dCQUNSLDJGQUEyRjtn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QUErRjtRQUMvRix3RUFBd0U7UUFDekQsY0FBQyxvQkFBb0IsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQXlFakYsb0JBQUM7S0FBQSxBQTVFRCxDQUE0QixTQUFTLEdBNEVwQztJQUVELG9FQUFvRTtJQUNwRSx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRTNELE9BQVEsYUFBZ0QsQ0FBQztBQUMzRCxDQUFDO0FBRUQsVUFBVTtBQUNWLFNBQVMseUJBQXlCLENBQzlCLE1BQWtELEVBQUUsTUFBYztJQUNwRSxtREFBbUQ7SUFDbkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEVBQVU7WUFBVCxzQkFBUTtRQUN2QixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7WUFDdEMsR0FBRyxFQUFIO2dCQUNFLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsR0FBRyxFQUFILFVBQUksUUFBYTtnQkFDZixJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBQ0QsWUFBWSxFQUFFLElBQUk7WUFDbEIsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3knO1xuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtjcmVhdGVDdXN0b21FdmVudCwgZ2V0Q29tcG9uZW50SW5wdXRzLCBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c30gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogUHJvdG90eXBlIGZvciBhIGNsYXNzIGNvbnN0cnVjdG9yIGJhc2VkIG9uIGFuIEFuZ3VsYXIgY29tcG9uZW50XG4gKiB0aGF0IGNhbiBiZSB1c2VkIGZvciBjdXN0b20gZWxlbWVudCByZWdpc3RyYXRpb24uIEltcGxlbWVudGVkIGFuZCByZXR1cm5lZFxuICogYnkgdGhlIHtAbGluayBjcmVhdGVDdXN0b21FbGVtZW50IGNyZWF0ZUN1c3RvbUVsZW1lbnQoKSBmdW5jdGlvbn0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudENvbnN0cnVjdG9yPFA+IHtcbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIG9ic2VydmVkIGF0dHJpYnV0ZSBuYW1lcyBmb3IgdGhlIGN1c3RvbSBlbGVtZW50LFxuICAgKiBkZXJpdmVkIGJ5IHRyYW5zZm9ybWluZyBpbnB1dCBwcm9wZXJ0eSBuYW1lcyBmcm9tIHRoZSBzb3VyY2UgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgb2JzZXJ2ZWRBdHRyaWJ1dGVzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBjb25zdHJ1Y3RvciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGluamVjdG9yIElmIHByb3ZpZGVkLCBvdmVycmlkZXMgdGhlIGNvbmZpZ3VyZWQgaW5qZWN0b3IuXG4gICAqL1xuICBuZXcoaW5qZWN0b3I/OiBJbmplY3Rvcik6IE5nRWxlbWVudCZXaXRoUHJvcGVydGllczxQPjtcbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBmdW5jdGlvbmFsaXR5IG5lZWRlZCBmb3IgYSBjdXN0b20gZWxlbWVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ0VsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIC8qKlxuICAgKiBUaGUgc3RyYXRlZ3kgdGhhdCBjb250cm9scyBob3cgYSBjb21wb25lbnQgaXMgdHJhbnNmb3JtZWQgaW4gYSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcm90ZWN0ZWQgbmdFbGVtZW50U3RyYXRlZ3khOiBOZ0VsZW1lbnRTdHJhdGVneTtcbiAgLyoqXG4gICAqIEEgc3Vic2NyaXB0aW9uIHRvIGNoYW5nZSwgY29ubmVjdCwgYW5kIGRpc2Nvbm5lY3QgZXZlbnRzIGluIHRoZSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byBhIGNoYW5nZSBpbiBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSBhdHRyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRoYXQgaGFzIGNoYW5nZWQuXG4gICAqIEBwYXJhbSBvbGRWYWx1ZSBUaGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIGluIHdoaWNoIHRoZSBhdHRyaWJ1dGUgaXMgZGVmaW5lZC5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGluc2VydGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBkZWxldGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgZnJvbSB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBZGRpdGlvbmFsIHR5cGUgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgYWRkZWQgdG8gdGhlIE5nRWxlbWVudCBjbGFzcyxcbiAqIGZvciBwcm9wZXJ0aWVzIHRoYXQgYXJlIGFkZGVkIGJhc2VkXG4gKiBvbiB0aGUgaW5wdXRzIGFuZCBtZXRob2RzIG9mIHRoZSB1bmRlcmx5aW5nIGNvbXBvbmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIFdpdGhQcm9wZXJ0aWVzPFA+ID0ge1xuICBbcHJvcGVydHkgaW4ga2V5b2YgUF06IFBbcHJvcGVydHldXG59O1xuXG4vKipcbiAqIEEgY29uZmlndXJhdGlvbiB0aGF0IGluaXRpYWxpemVzIGFuIE5nRWxlbWVudENvbnN0cnVjdG9yIHdpdGggdGhlXG4gKiBkZXBlbmRlbmNpZXMgYW5kIHN0cmF0ZWd5IGl0IG5lZWRzIHRvIHRyYW5zZm9ybSBhIGNvbXBvbmVudCBpbnRvXG4gKiBhIGN1c3RvbSBlbGVtZW50IGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIGluamVjdG9yIHRvIHVzZSBmb3IgcmV0cmlldmluZyB0aGUgY29tcG9uZW50J3MgZmFjdG9yeS5cbiAgICovXG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGN1c3RvbSBzdHJhdGVneSBmYWN0b3J5IHRvIHVzZSBpbnN0ZWFkIG9mIHRoZSBkZWZhdWx0LlxuICAgKiBUaGUgc3RyYXRlZ3kgY29udHJvbHMgaG93IHRoZSB0cmFuc2Zvcm1hdGlvbiBpcyBwZXJmb3JtZWQuXG4gICAqL1xuICBzdHJhdGVneUZhY3Rvcnk/OiBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnk7XG59XG5cbi8qKlxuICogIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnQuXG4gKlxuICogQnVpbGRzIGEgY2xhc3MgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHByb3ZpZGVkIGNvbXBvbmVudCBhbmRcbiAqIHVzZXMgdGhlIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdG8gcHJvdmlkZSBtb3JlIGNvbnRleHQgdG8gdGhlIGNsYXNzLlxuICogVGFrZXMgdGhlIGNvbXBvbmVudCBmYWN0b3J5J3MgaW5wdXRzIGFuZCBvdXRwdXRzIHRvIGNvbnZlcnQgdGhlbSB0byB0aGUgcHJvcGVyXG4gKiBjdXN0b20gZWxlbWVudCBBUEkgYW5kIGFkZCBob29rcyB0byBpbnB1dCBjaGFuZ2VzLlxuICpcbiAqIFRoZSBjb25maWd1cmF0aW9uJ3MgaW5qZWN0b3IgaXMgdGhlIGluaXRpYWwgaW5qZWN0b3Igc2V0IG9uIHRoZSBjbGFzcyxcbiAqIGFuZCB1c2VkIGJ5IGRlZmF1bHQgZm9yIGVhY2ggY3JlYXRlZCBpbnN0YW5jZS5UaGlzIGJlaGF2aW9yIGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlXG4gKiBzdGF0aWMgcHJvcGVydHkgdG8gYWZmZWN0IGFsbCBuZXdseSBjcmVhdGVkIGluc3RhbmNlcywgb3IgYXMgYSBjb25zdHJ1Y3RvciBhcmd1bWVudCBmb3JcbiAqIG9uZS1vZmYgY3JlYXRpb25zLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0byB0cmFuc2Zvcm0uXG4gKiBAcGFyYW0gY29uZmlnIEEgY29uZmlndXJhdGlvbiB0aGF0IHByb3ZpZGVzIGluaXRpYWxpemF0aW9uIGluZm9ybWF0aW9uIHRvIHRoZSBjcmVhdGVkIGNsYXNzLlxuICogQHJldHVybnMgVGhlIGN1c3RvbS1lbGVtZW50IGNvbnN0cnVjdGlvbiBjbGFzcywgd2hpY2ggY2FuIGJlIHJlZ2lzdGVyZWQgd2l0aFxuICogYSBicm93c2VyJ3MgYEN1c3RvbUVsZW1lbnRSZWdpc3RyeWAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRWxlbWVudDxQPihcbiAgICBjb21wb25lbnQ6IFR5cGU8YW55PiwgY29uZmlnOiBOZ0VsZW1lbnRDb25maWcpOiBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPiB7XG4gIGNvbnN0IGlucHV0cyA9IGdldENvbXBvbmVudElucHV0cyhjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3Qgc3RyYXRlZ3lGYWN0b3J5ID1cbiAgICAgIGNvbmZpZy5zdHJhdGVneUZhY3RvcnkgfHwgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeShjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyA9IGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKGlucHV0cyk7XG5cbiAgY2xhc3MgTmdFbGVtZW50SW1wbCBleHRlbmRzIE5nRWxlbWVudCB7XG4gICAgLy8gV29yayBhcm91bmQgYSBidWcgaW4gY2xvc3VyZSB0eXBlZCBvcHRpbWl6YXRpb25zKGIvNzk1NTc0ODcpIHdoZXJlIGl0IGlzIG5vdCBob25vcmluZyBzdGF0aWNcbiAgICAvLyBmaWVsZCBleHRlcm5zLiBTbyB1c2luZyBxdW90ZWQgYWNjZXNzIHRvIGV4cGxpY2l0bHkgcHJldmVudCByZW5hbWluZy5cbiAgICBzdGF0aWMgcmVhZG9ubHlbJ29ic2VydmVkQXR0cmlidXRlcyddID0gT2JqZWN0LmtleXMoYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyk7XG5cbiAgICBwcm90ZWN0ZWQgZ2V0IG5nRWxlbWVudFN0cmF0ZWd5KCk6IE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgICAgIC8vIE5PVEU6XG4gICAgICAvLyBTb21lIHBvbHlmaWxscyAoZS5nLiBgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudGApIGRvIG5vdCBjYWxsIHRoZSBjb25zdHJ1Y3RvciwgdGhlcmVmb3JlXG4gICAgICAvLyBpdCBpcyBub3Qgc2FmZSB0byBzZXQgYG5nRWxlbWVudFN0cmF0ZWd5YCBpbiB0aGUgY29uc3RydWN0b3IgYW5kIGFzc3VtZSBpdCB3aWxsIGJlXG4gICAgICAvLyBhdmFpbGFibGUgaW5zaWRlIHRoZSBtZXRob2RzLlxuICAgICAgLy9cbiAgICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogQWRkIGUyZSB0ZXN0cyB0aGF0IGNvdmVyIGNhc2VzIHdoZXJlIHRoZSBjb25zdHJ1Y3RvciBpc24ndCBjYWxsZWQuIEZvclxuICAgICAgLy8gbm93IHRoaXMgaXMgdGVzdGVkIHVzaW5nIGEgR29vZ2xlIGludGVybmFsIHRlc3Qgc3VpdGUuXG4gICAgICBpZiAoIXRoaXMuX25nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kgPVxuICAgICAgICAgICAgc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZSh0aGlzLmluamVjdG9yIHx8IGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgICAgICAgLy8gQ29sbGVjdCBwcmUtZXhpc3RpbmcgdmFsdWVzIG9uIHRoZSBlbGVtZW50IHRvIHJlLWFwcGx5IHRocm91Z2ggdGhlIHN0cmF0ZWd5LlxuICAgICAgICBjb25zdCBwcmVFeGlzdGluZ1ZhbHVlcyA9XG4gICAgICAgICAgICBpbnB1dHMuZmlsdGVyKCh7cHJvcE5hbWV9KSA9PiB0aGlzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkubWFwKCh7cHJvcE5hbWV9KTogW1xuICAgICAgICAgICAgICBzdHJpbmcsIGFueVxuICAgICAgICAgICAgXSA9PiBbcHJvcE5hbWUsICh0aGlzIGFzIGFueSlbcHJvcE5hbWVdXSk7XG5cbiAgICAgICAgLy8gSW4gc29tZSBicm93c2VycyAoZS5nLiBJRTEwKSwgYE9iamVjdC5zZXRQcm90b3R5cGVPZigpYCAod2hpY2ggaXMgcmVxdWlyZWQgYnkgc29tZSBDdXN0b21cbiAgICAgICAgLy8gRWxlbWVudHMgcG9seWZpbGxzKSBpcyBub3QgZGVmaW5lZCBhbmQgaXMgdGh1cyBwb2x5ZmlsbGVkIGluIGEgd2F5IHRoYXQgZG9lcyBub3QgcHJlc2VydmVcbiAgICAgICAgLy8gdGhlIHByb3RvdHlwZSBjaGFpbi4gSW4gc3VjaCBjYXNlcywgYHRoaXNgIHdpbGwgbm90IGJlIGFuIGluc3RhbmNlIG9mIGBOZ0VsZW1lbnRJbXBsYCBhbmRcbiAgICAgICAgLy8gdGh1cyBub3QgaGF2ZSB0aGUgY29tcG9uZW50IGlucHV0IGdldHRlcnMvc2V0dGVycyBkZWZpbmVkIG9uIGBOZ0VsZW1lbnRJbXBsLnByb3RvdHlwZWAuXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBOZ0VsZW1lbnRJbXBsKSkge1xuICAgICAgICAgIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzIHRvIHRoZSBpbnN0YW5jZSBpdHNlbGYgZm9yIGVhY2ggcHJvcGVydHkgaW5wdXQuXG4gICAgICAgICAgZGVmaW5lSW5wdXRHZXR0ZXJzU2V0dGVycyhpbnB1dHMsIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIERlbGV0ZSB0aGUgcHJvcGVydHkgZnJvbSB0aGUgaW5zdGFuY2UsIHNvIHRoYXQgaXQgY2FuIGdvIHRocm91Z2ggdGhlIGdldHRlcnMvc2V0dGVyc1xuICAgICAgICAgIC8vIHNldCBvbiBgTmdFbGVtZW50SW1wbC5wcm90b3R5cGVgLlxuICAgICAgICAgIHByZUV4aXN0aW5nVmFsdWVzLmZvckVhY2goKFtwcm9wTmFtZV0pID0+IGRlbGV0ZSAodGhpcyBhcyBhbnkpW3Byb3BOYW1lXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZS1hcHBseSBwcmUtZXhpc3RpbmcgdmFsdWVzIHRocm91Z2ggdGhlIHN0cmF0ZWd5LlxuICAgICAgICBwcmVFeGlzdGluZ1ZhbHVlcy5mb3JFYWNoKChbcHJvcE5hbWUsIHZhbHVlXSkgPT4gc3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgdmFsdWUpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX25nRWxlbWVudFN0cmF0ZWd5ITtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9uZ0VsZW1lbnRTdHJhdGVneT86IE5nRWxlbWVudFN0cmF0ZWd5O1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBpbmplY3Rvcj86IEluamVjdG9yKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgICAgYXR0ck5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZ3xudWxsLCBuZXdWYWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGNvbnN0IHByb3BOYW1lID0gYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c1thdHRyTmFtZV0hO1xuICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBuZXdWYWx1ZSk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIHRoZSBzdHJhdGVneSBhbmQgZGlzcGF0Y2ggdGhlbSBhcyBjdXN0b20gZXZlbnRzXG4gICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZXZlbnRzLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudCh0aGlzLm93bmVyRG9jdW1lbnQhLCBlLm5hbWUsIGUudmFsdWUpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIC8vIE5vdCB1c2luZyBgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneWAgdG8gYXZvaWQgdW5uZWNlc3NhcmlseSBjcmVhdGluZyB0aGUgYE5nRWxlbWVudFN0cmF0ZWd5YC5cbiAgICAgIGlmICh0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneS5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnMgdG8gdGhlIHByb3RvdHlwZSBmb3IgZWFjaCBwcm9wZXJ0eSBpbnB1dC5cbiAgZGVmaW5lSW5wdXRHZXR0ZXJzU2V0dGVycyhpbnB1dHMsIE5nRWxlbWVudEltcGwucHJvdG90eXBlKTtcblxuICByZXR1cm4gKE5nRWxlbWVudEltcGwgYXMgYW55KSBhcyBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPjtcbn1cblxuLy8gSGVscGVyc1xuZnVuY3Rpb24gZGVmaW5lSW5wdXRHZXR0ZXJzU2V0dGVycyhcbiAgICBpbnB1dHM6IHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXSwgdGFyZ2V0OiBvYmplY3QpOiB2b2lkIHtcbiAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnMgZm9yIGVhY2ggcHJvcGVydHkgaW5wdXQuXG4gIGlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWV9KSA9PiB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcE5hbWUsIHtcbiAgICAgIGdldCgpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5nZXRJbnB1dFZhbHVlKHByb3BOYW1lKTtcbiAgICAgIH0sXG4gICAgICBzZXQobmV3VmFsdWU6IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIG5ld1ZhbHVlKTtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIH0pO1xuICB9KTtcbn1cbiJdfQ==