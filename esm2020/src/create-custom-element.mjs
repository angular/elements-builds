/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentNgElementStrategyFactory } from './component-factory-strategy';
import { getComponentInputs, getDefaultAttributeToPropertyInputs } from './utils';
/**
 * Implements the functionality needed for a custom element.
 *
 * @publicApi
 */
export class NgElement extends HTMLElement {
    constructor() {
        super(...arguments);
        /**
         * A subscription to change, connect, and disconnect events in the custom element.
         */
        this.ngElementEventsSubscription = null;
    }
}
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
 * @see [Angular Elements Overview](guide/elements "Turning Angular components into custom elements")
 *
 * @param component The component to transform.
 * @param config A configuration that provides initialization information to the created class.
 * @returns The custom-element construction class, which can be registered with
 * a browser's `CustomElementRegistry`.
 *
 * @publicApi
 */
export function createCustomElement(component, config) {
    const inputs = getComponentInputs(component, config.injector);
    const strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
    const attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
    class NgElementImpl extends NgElement {
        constructor(injector) {
            super();
            this.injector = injector;
        }
        get ngElementStrategy() {
            // NOTE:
            // Some polyfills (e.g. `document-register-element`) do not call the constructor, therefore
            // it is not safe to set `ngElementStrategy` in the constructor and assume it will be
            // available inside the methods.
            //
            // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
            // now this is tested using a Google internal test suite.
            if (!this._ngElementStrategy) {
                const strategy = this._ngElementStrategy =
                    strategyFactory.create(this.injector || config.injector);
                // Re-apply pre-existing input values (set as properties on the element) through the
                // strategy.
                inputs.forEach(({ propName }) => {
                    if (!this.hasOwnProperty(propName)) {
                        // No pre-existing value for `propName`.
                        return;
                    }
                    // Delete the property from the instance and re-apply it through the strategy.
                    const value = this[propName];
                    delete this[propName];
                    strategy.setInputValue(propName, value);
                });
            }
            return this._ngElementStrategy;
        }
        attributeChangedCallback(attrName, oldValue, newValue, namespace) {
            const propName = attributeToPropertyInputs[attrName];
            this.ngElementStrategy.setInputValue(propName, newValue);
        }
        connectedCallback() {
            // For historical reasons, some strategies may not have initialized the `events` property
            // until after `connect()` is run. Subscribe to `events` if it is available before running
            // `connect()` (in order to capture events emitted during initialization), otherwise subscribe
            // afterwards.
            //
            // TODO: Consider deprecating/removing the post-connect subscription in a future major version
            //       (e.g. v11).
            let subscribedToEvents = false;
            if (this.ngElementStrategy.events) {
                // `events` are already available: Subscribe to it asap.
                this.subscribeToEvents();
                subscribedToEvents = true;
            }
            this.ngElementStrategy.connect(this);
            if (!subscribedToEvents) {
                // `events` were not initialized before running `connect()`: Subscribe to them now.
                // The events emitted during the component initialization have been missed, but at least
                // future events will be captured.
                this.subscribeToEvents();
            }
        }
        disconnectedCallback() {
            // Not using `this.ngElementStrategy` to avoid unnecessarily creating the `NgElementStrategy`.
            if (this._ngElementStrategy) {
                this._ngElementStrategy.disconnect();
            }
            if (this.ngElementEventsSubscription) {
                this.ngElementEventsSubscription.unsubscribe();
                this.ngElementEventsSubscription = null;
            }
        }
        subscribeToEvents() {
            // Listen for events from the strategy and dispatch them as custom events.
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(e => {
                const customEvent = new CustomEvent(e.name, { detail: e.value });
                this.dispatchEvent(customEvent);
            });
        }
    }
    // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
    // field externs. So using quoted access to explicitly prevent renaming.
    NgElementImpl['observedAttributes'] = Object.keys(attributeToPropertyInputs);
    // Add getters and setters to the prototype for each property input.
    inputs.forEach(({ propName }) => {
        Object.defineProperty(NgElementImpl.prototype, propName, {
            get() {
                return this.ngElementStrategy.getInputValue(propName);
            },
            set(newValue) {
                this.ngElementStrategy.setInputValue(propName, newValue);
            },
            configurable: true,
            enumerable: true,
        });
    });
    return NgElementImpl;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUF5QmhGOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOztRQUtFOztXQUVHO1FBQ08sZ0NBQTJCLEdBQXNCLElBQUksQ0FBQztJQXNCbEUsQ0FBQztDQUFBO0FBZ0NEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFNBQW9CLEVBQUUsTUFBdUI7SUFDL0MsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5RCxNQUFNLGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFaEcsTUFBTSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RSxNQUFNLGFBQWMsU0FBUSxTQUFTO1FBcUNuQyxZQUE2QixRQUFtQjtZQUM5QyxLQUFLLEVBQUUsQ0FBQztZQURtQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBRWhELENBQUM7UUFsQ0QsSUFBdUIsaUJBQWlCO1lBQ3RDLFFBQVE7WUFDUiwyRkFBMkY7WUFDM0YscUZBQXFGO1lBQ3JGLGdDQUFnQztZQUNoQyxFQUFFO1lBQ0YsNkZBQTZGO1lBQzdGLHlEQUF5RDtZQUN6RCxJQUFJLENBQUMs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LEVBQUUsRUFBRTtRQUM1QixNQUFNLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFO1lBQ3ZELEdBQUc7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFDRCxHQUFHLENBQUMsUUFBYTtnQkFDZixJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBQ0QsWUFBWSxFQUFFLElBQUk7WUFDbEIsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFRLGFBQWdELENBQUM7QUFDM0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3knO1xuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtnZXRDb21wb25lbnRJbnB1dHMsIGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBQcm90b3R5cGUgZm9yIGEgY2xhc3MgY29uc3RydWN0b3IgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnRcbiAqIHRoYXQgY2FuIGJlIHVzZWQgZm9yIGN1c3RvbSBlbGVtZW50IHJlZ2lzdHJhdGlvbi4gSW1wbGVtZW50ZWQgYW5kIHJldHVybmVkXG4gKiBieSB0aGUge0BsaW5rIGNyZWF0ZUN1c3RvbUVsZW1lbnQgY3JlYXRlQ3VzdG9tRWxlbWVudCgpIGZ1bmN0aW9ufS5cbiAqXG4gKiBAc2VlIFtBbmd1bGFyIEVsZW1lbnRzIE92ZXJ2aWV3XShndWlkZS9lbGVtZW50cyBcIlR1cm5pbmcgQW5ndWxhciBjb21wb25lbnRzIGludG8gY3VzdG9tIGVsZW1lbnRzXCIpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudENvbnN0cnVjdG9yPFA+IHtcbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIG9ic2VydmVkIGF0dHJpYnV0ZSBuYW1lcyBmb3IgdGhlIGN1c3RvbSBlbGVtZW50LFxuICAgKiBkZXJpdmVkIGJ5IHRyYW5zZm9ybWluZyBpbnB1dCBwcm9wZXJ0eSBuYW1lcyBmcm9tIHRoZSBzb3VyY2UgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgb2JzZXJ2ZWRBdHRyaWJ1dGVzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBjb25zdHJ1Y3RvciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGluamVjdG9yIElmIHByb3ZpZGVkLCBvdmVycmlkZXMgdGhlIGNvbmZpZ3VyZWQgaW5qZWN0b3IuXG4gICAqL1xuICBuZXcoaW5qZWN0b3I/OiBJbmplY3Rvcik6IE5nRWxlbWVudCZXaXRoUHJvcGVydGllczxQPjtcbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBmdW5jdGlvbmFsaXR5IG5lZWRlZCBmb3IgYSBjdXN0b20gZWxlbWVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ0VsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIC8qKlxuICAgKiBUaGUgc3RyYXRlZ3kgdGhhdCBjb250cm9scyBob3cgYSBjb21wb25lbnQgaXMgdHJhbnNmb3JtZWQgaW4gYSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBuZ0VsZW1lbnRTdHJhdGVneTogTmdFbGVtZW50U3RyYXRlZ3k7XG4gIC8qKlxuICAgKiBBIHN1YnNjcmlwdGlvbiB0byBjaGFuZ2UsIGNvbm5lY3QsIGFuZCBkaXNjb25uZWN0IGV2ZW50cyBpbiB0aGUgY3VzdG9tIGVsZW1lbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgbmdFbGVtZW50RXZlbnRzU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gYSBjaGFuZ2UgaW4gYW4gb2JzZXJ2ZWQgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gYXR0ck5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0aGF0IGhhcyBjaGFuZ2VkLlxuICAgKiBAcGFyYW0gb2xkVmFsdWUgVGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBpbiB3aGljaCB0aGUgYXR0cmlidXRlIGlzIGRlZmluZWQuXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soXG4gICAgICBhdHRyTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nfG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBpbnNlcnRpb24gb2YgdGhlIGN1c3RvbSBlbGVtZW50IGluIHRoZSBET00uXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkO1xuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byB0aGUgZGVsZXRpb24gb2YgdGhlIGN1c3RvbSBlbGVtZW50IGZyb20gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGRpc2Nvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQWRkaXRpb25hbCB0eXBlIGluZm9ybWF0aW9uIHRoYXQgY2FuIGJlIGFkZGVkIHRvIHRoZSBOZ0VsZW1lbnQgY2xhc3MsXG4gKiBmb3IgcHJvcGVydGllcyB0aGF0IGFyZSBhZGRlZCBiYXNlZFxuICogb24gdGhlIGlucHV0cyBhbmQgbWV0aG9kcyBvZiB0aGUgdW5kZXJseWluZyBjb21wb25lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBXaXRoUHJvcGVydGllczxQPiA9IHtcbiAgW3Byb3BlcnR5IGluIGtleW9mIFBdOiBQW3Byb3BlcnR5XVxufTtcblxuLyoqXG4gKiBBIGNvbmZpZ3VyYXRpb24gdGhhdCBpbml0aWFsaXplcyBhbiBOZ0VsZW1lbnRDb25zdHJ1Y3RvciB3aXRoIHRoZVxuICogZGVwZW5kZW5jaWVzIGFuZCBzdHJhdGVneSBpdCBuZWVkcyB0byB0cmFuc2Zvcm0gYSBjb21wb25lbnQgaW50b1xuICogYSBjdXN0b20gZWxlbWVudCBjbGFzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uZmlnIHtcbiAgLyoqXG4gICAqIFRoZSBpbmplY3RvciB0byB1c2UgZm9yIHJldHJpZXZpbmcgdGhlIGNvbXBvbmVudCdzIGZhY3RvcnkuXG4gICAqL1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBjdXN0b20gc3RyYXRlZ3kgZmFjdG9yeSB0byB1c2UgaW5zdGVhZCBvZiB0aGUgZGVmYXVsdC5cbiAgICogVGhlIHN0cmF0ZWd5IGNvbnRyb2xzIGhvdyB0aGUgdHJhbnNmb3JtYXRpb24gaXMgcGVyZm9ybWVkLlxuICAgKi9cbiAgc3RyYXRlZ3lGYWN0b3J5PzogTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5O1xufVxuXG4vKipcbiAqICBAZGVzY3JpcHRpb24gQ3JlYXRlcyBhIGN1c3RvbSBlbGVtZW50IGNsYXNzIGJhc2VkIG9uIGFuIEFuZ3VsYXIgY29tcG9uZW50LlxuICpcbiAqIEJ1aWxkcyBhIGNsYXNzIHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHRoZSBwcm92aWRlZCBjb21wb25lbnQgYW5kXG4gKiB1c2VzIHRoZSBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uIHRvIHByb3ZpZGUgbW9yZSBjb250ZXh0IHRvIHRoZSBjbGFzcy5cbiAqIFRha2VzIHRoZSBjb21wb25lbnQgZmFjdG9yeSdzIGlucHV0cyBhbmQgb3V0cHV0cyB0byBjb252ZXJ0IHRoZW0gdG8gdGhlIHByb3BlclxuICogY3VzdG9tIGVsZW1lbnQgQVBJIGFuZCBhZGQgaG9va3MgdG8gaW5wdXQgY2hhbmdlcy5cbiAqXG4gKiBUaGUgY29uZmlndXJhdGlvbidzIGluamVjdG9yIGlzIHRoZSBpbml0aWFsIGluamVjdG9yIHNldCBvbiB0aGUgY2xhc3MsXG4gKiBhbmQgdXNlZCBieSBkZWZhdWx0IGZvciBlYWNoIGNyZWF0ZWQgaW5zdGFuY2UuVGhpcyBiZWhhdmlvciBjYW4gYmUgb3ZlcnJpZGRlbiB3aXRoIHRoZVxuICogc3RhdGljIHByb3BlcnR5IHRvIGFmZmVjdCBhbGwgbmV3bHkgY3JlYXRlZCBpbnN0YW5jZXMsIG9yIGFzIGEgY29uc3RydWN0b3IgYXJndW1lbnQgZm9yXG4gKiBvbmUtb2ZmIGNyZWF0aW9ucy5cbiAqXG4gKiBAc2VlIFtBbmd1bGFyIEVsZW1lbnRzIE92ZXJ2aWV3XShndWlkZS9lbGVtZW50cyBcIlR1cm5pbmcgQW5ndWxhciBjb21wb25lbnRzIGludG8gY3VzdG9tIGVsZW1lbnRzXCIpXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHRvIHRyYW5zZm9ybS5cbiAqIEBwYXJhbSBjb25maWcgQSBjb25maWd1cmF0aW9uIHRoYXQgcHJvdmlkZXMgaW5pdGlhbGl6YXRpb24gaW5mb3JtYXRpb24gdG8gdGhlIGNyZWF0ZWQgY2xhc3MuXG4gKiBAcmV0dXJucyBUaGUgY3VzdG9tLWVsZW1lbnQgY29uc3RydWN0aW9uIGNsYXNzLCB3aGljaCBjYW4gYmUgcmVnaXN0ZXJlZCB3aXRoXG4gKiBhIGJyb3dzZXIncyBgQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5YC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDdXN0b21FbGVtZW50PFA+KFxuICAgIGNvbXBvbmVudDogVHlwZTxhbnk+LCBjb25maWc6IE5nRWxlbWVudENvbmZpZyk6IE5nRWxlbWVudENvbnN0cnVjdG9yPFA+IHtcbiAgY29uc3QgaW5wdXRzID0gZ2V0Q29tcG9uZW50SW5wdXRzKGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBzdHJhdGVneUZhY3RvcnkgPVxuICAgICAgY29uZmlnLnN0cmF0ZWd5RmFjdG9yeSB8fCBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5KGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzID0gZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMoaW5wdXRzKTtcblxuICBjbGFzcyBOZ0VsZW1lbnRJbXBsIGV4dGVuZHMgTmdFbGVtZW50IHtcbiAgICAvLyBXb3JrIGFyb3VuZCBhIGJ1ZyBpbiBjbG9zdXJlIHR5cGVkIG9wdGltaXphdGlvbnMoYi83OTU1NzQ4Nykgd2hlcmUgaXQgaXMgbm90IGhvbm9yaW5nIHN0YXRpY1xuICAgIC8vIGZpZWxkIGV4dGVybnMuIFNvIHVzaW5nIHF1b3RlZCBhY2Nlc3MgdG8gZXhwbGljaXRseSBwcmV2ZW50IHJlbmFtaW5nLlxuICAgIHN0YXRpYyByZWFkb25seVsnb2JzZXJ2ZWRBdHRyaWJ1dGVzJ10gPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKTtcblxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBnZXQgbmdFbGVtZW50U3RyYXRlZ3koKTogTmdFbGVtZW50U3RyYXRlZ3kge1xuICAgICAgLy8gTk9URTpcbiAgICAgIC8vIFNvbWUgcG9seWZpbGxzIChlLmcuIGBkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50YCkgZG8gbm90IGNhbGwgdGhlIGNvbnN0cnVjdG9yLCB0aGVyZWZvcmVcbiAgICAgIC8vIGl0IGlzIG5vdCBzYWZlIHRvIHNldCBgbmdFbGVtZW50U3RyYXRlZ3lgIGluIHRoZSBjb25zdHJ1Y3RvciBhbmQgYXNzdW1lIGl0IHdpbGwgYmVcbiAgICAgIC8vIGF2YWlsYWJsZSBpbnNpZGUgdGhlIG1ldGhvZHMuXG4gICAgICAvL1xuICAgICAgLy8gVE9ETyhhbmRyZXdzZWd1aW4pOiBBZGQgZTJlIHRlc3RzIHRoYXQgY292ZXIgY2FzZXMgd2hlcmUgdGhlIGNvbnN0cnVjdG9yIGlzbid0IGNhbGxlZC4gRm9yXG4gICAgICAvLyBub3cgdGhpcyBpcyB0ZXN0ZWQgdXNpbmcgYSBHb29nbGUgaW50ZXJuYWwgdGVzdCBzdWl0ZS5cbiAgICAgIGlmICghdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgY29uc3Qgc3RyYXRlZ3kgPSB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSA9XG4gICAgICAgICAgICBzdHJhdGVneUZhY3RvcnkuY3JlYXRlKHRoaXMuaW5qZWN0b3IgfHwgY29uZmlnLmluamVjdG9yKTtcblxuICAgICAgICAvLyBSZS1hcHBseSBwcmUtZXhpc3RpbmcgaW5wdXQgdmFsdWVzIChzZXQgYXMgcHJvcGVydGllcyBvbiB0aGUgZWxlbWVudCkgdGhyb3VnaCB0aGVcbiAgICAgICAgLy8gc3RyYXRlZ3kuXG4gICAgICAgIGlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWV9KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgLy8gTm8gcHJlLWV4aXN0aW5nIHZhbHVlIGZvciBgcHJvcE5hbWVgLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERlbGV0ZSB0aGUgcHJvcGVydHkgZnJvbSB0aGUgaW5zdGFuY2UgYW5kIHJlLWFwcGx5IGl0IHRocm91Z2ggdGhlIHN0cmF0ZWd5LlxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gKHRoaXMgYXMgYW55KVtwcm9wTmFtZV07XG4gICAgICAgICAgZGVsZXRlICh0aGlzIGFzIGFueSlbcHJvcE5hbWVdO1xuICAgICAgICAgIHN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbmdFbGVtZW50U3RyYXRlZ3k/OiBOZ0VsZW1lbnRTdHJhdGVneTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaW5qZWN0b3I/OiBJbmplY3Rvcikge1xuICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBvdmVycmlkZSBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soXG4gICAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICBjb25zdCBwcm9wTmFtZSA9IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHNbYXR0ck5hbWVdITtcbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgbmV3VmFsdWUpO1xuICAgIH1cblxuICAgIG92ZXJyaWRlIGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgLy8gRm9yIGhpc3RvcmljYWwgcmVhc29ucywgc29tZSBzdHJhdGVnaWVzIG1heSBub3QgaGF2ZSBpbml0aWFsaXplZCB0aGUgYGV2ZW50c2AgcHJvcGVydHlcbiAgICAgIC8vIHVudGlsIGFmdGVyIGBjb25uZWN0KClgIGlzIHJ1bi4gU3Vic2NyaWJlIHRvIGBldmVudHNgIGlmIGl0IGlzIGF2YWlsYWJsZSBiZWZvcmUgcnVubmluZ1xuICAgICAgLy8gYGNvbm5lY3QoKWAgKGluIG9yZGVyIHRvIGNhcHR1cmUgZXZlbnRzIGVtaXR0ZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uKSwgb3RoZXJ3aXNlIHN1YnNjcmliZVxuICAgICAgLy8gYWZ0ZXJ3YXJkcy5cbiAgICAgIC8vXG4gICAgICAvLyBUT0RPOiBDb25zaWRlciBkZXByZWNhdGluZy9yZW1vdmluZyB0aGUgcG9zdC1jb25uZWN0IHN1YnNjcmlwdGlvbiBpbiBhIGZ1dHVyZSBtYWpvciB2ZXJzaW9uXG4gICAgICAvLyAgICAgICAoZS5nLiB2MTEpLlxuXG4gICAgICBsZXQgc3Vic2NyaWJlZFRvRXZlbnRzID0gZmFsc2U7XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cykge1xuICAgICAgICAvLyBgZXZlbnRzYCBhcmUgYWxyZWFkeSBhdmFpbGFibGU6IFN1YnNjcmliZSB0byBpdCBhc2FwLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgICAgIHN1YnNjcmliZWRUb0V2ZW50cyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuY29ubmVjdCh0aGlzKTtcblxuICAgICAgaWYgKCFzdWJzY3JpYmVkVG9FdmVudHMpIHtcbiAgICAgICAgLy8gYGV2ZW50c2Agd2VyZSBub3QgaW5pdGlhbGl6ZWQgYmVmb3JlIHJ1bm5pbmcgYGNvbm5lY3QoKWA6IFN1YnNjcmliZSB0byB0aGVtIG5vdy5cbiAgICAgICAgLy8gVGhlIGV2ZW50cyBlbWl0dGVkIGR1cmluZyB0aGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uIGhhdmUgYmVlbiBtaXNzZWQsIGJ1dCBhdCBsZWFzdFxuICAgICAgICAvLyBmdXR1cmUgZXZlbnRzIHdpbGwgYmUgY2FwdHVyZWQuXG4gICAgICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZSBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIC8vIE5vdCB1c2luZyBgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneWAgdG8gYXZvaWQgdW5uZWNlc3NhcmlseSBjcmVhdGluZyB0aGUgYE5nRWxlbWVudFN0cmF0ZWd5YC5cbiAgICAgIGlmICh0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneS5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdWJzY3JpYmVUb0V2ZW50cygpOiB2b2lkIHtcbiAgICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gdGhlIHN0cmF0ZWd5IGFuZCBkaXNwYXRjaCB0aGVtIGFzIGN1c3RvbSBldmVudHMuXG4gICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZXZlbnRzLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZS5uYW1lLCB7ZGV0YWlsOiBlLnZhbHVlfSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVycyB0byB0aGUgcHJvdG90eXBlIGZvciBlYWNoIHByb3BlcnR5IGlucHV0LlxuICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lfSkgPT4ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOZ0VsZW1lbnRJbXBsLnByb3RvdHlwZSwgcHJvcE5hbWUsIHtcbiAgICAgIGdldCgpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5nZXRJbnB1dFZhbHVlKHByb3BOYW1lKTtcbiAgICAgIH0sXG4gICAgICBzZXQobmV3VmFsdWU6IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIG5ld1ZhbHVlKTtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gKE5nRWxlbWVudEltcGwgYXMgYW55KSBhcyBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPjtcbn1cbiJdfQ==