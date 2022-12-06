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
        constructor(injector) {
            super();
            this.injector = injector;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUF5QmhGOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOztRQUtFOztXQUVHO1FBQ08sZ0NBQTJCLEdBQXNCLElBQUksQ0FBQztJQXNCbEUsQ0FBQztDQUFBO0FBZ0NEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFNBQW9CLEVBQUUsTUFBdUI7SUFDL0MsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5RCxNQUFNLGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFaEcsTUFBTSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RSxNQUFNLGFBQWMsU0FBUSxTQUFTO1FBS25DLElBQXVCLGlCQUFpQjtZQUN0QyxRQUFRO1lBQ1IsMkZBQTJGO1lBQzNGLHFGQUFxRjtZQUNyRixnQ0FBZ0M7WUFDaEMsRUFBRTtZQUNGLDZGQUE2RjtZQUM3Rix5REFBeUQ7WUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtnQkFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGtCQUFrQjtvQkFDcEMsZUFBZSxDQUFD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QUFFLEVBQUU7UUFDNUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRTtZQUN2RCxHQUFHO2dCQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsR0FBRyxDQUFDLFFBQWE7Z0JBQ2YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUNELFlBQVksRUFBRSxJQUFJO1lBQ2xCLFVBQVUsRUFBRSxJQUFJO1NBQ2pCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBUSxhQUFnRCxDQUFDO0FBQzNELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RvciwgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7Q29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudC1mYWN0b3J5LXN0cmF0ZWd5JztcbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50SW5wdXRzLCBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c30gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogUHJvdG90eXBlIGZvciBhIGNsYXNzIGNvbnN0cnVjdG9yIGJhc2VkIG9uIGFuIEFuZ3VsYXIgY29tcG9uZW50XG4gKiB0aGF0IGNhbiBiZSB1c2VkIGZvciBjdXN0b20gZWxlbWVudCByZWdpc3RyYXRpb24uIEltcGxlbWVudGVkIGFuZCByZXR1cm5lZFxuICogYnkgdGhlIHtAbGluayBjcmVhdGVDdXN0b21FbGVtZW50IGNyZWF0ZUN1c3RvbUVsZW1lbnQoKSBmdW5jdGlvbn0uXG4gKlxuICogQHNlZSBbQW5ndWxhciBFbGVtZW50cyBPdmVydmlld10oZ3VpZGUvZWxlbWVudHMgXCJUdXJuaW5nIEFuZ3VsYXIgY29tcG9uZW50cyBpbnRvIGN1c3RvbSBlbGVtZW50c1wiKVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPiB7XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBvYnNlcnZlZCBhdHRyaWJ1dGUgbmFtZXMgZm9yIHRoZSBjdXN0b20gZWxlbWVudCxcbiAgICogZGVyaXZlZCBieSB0cmFuc2Zvcm1pbmcgaW5wdXQgcHJvcGVydHkgbmFtZXMgZnJvbSB0aGUgc291cmNlIGNvbXBvbmVudC5cbiAgICovXG4gIHJlYWRvbmx5IG9ic2VydmVkQXR0cmlidXRlczogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgY29uc3RydWN0b3IgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBpbmplY3RvciBJZiBwcm92aWRlZCwgb3ZlcnJpZGVzIHRoZSBjb25maWd1cmVkIGluamVjdG9yLlxuICAgKi9cbiAgbmV3KGluamVjdG9yPzogSW5qZWN0b3IpOiBOZ0VsZW1lbnQmV2l0aFByb3BlcnRpZXM8UD47XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyB0aGUgZnVuY3Rpb25hbGl0eSBuZWVkZWQgZm9yIGEgY3VzdG9tIGVsZW1lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmdFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAvKipcbiAgICogVGhlIHN0cmF0ZWd5IHRoYXQgY29udHJvbHMgaG93IGEgY29tcG9uZW50IGlzIHRyYW5zZm9ybWVkIGluIGEgY3VzdG9tIGVsZW1lbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgbmdFbGVtZW50U3RyYXRlZ3k6IE5nRWxlbWVudFN0cmF0ZWd5O1xuICAvKipcbiAgICogQSBzdWJzY3JpcHRpb24gdG8gY2hhbmdlLCBjb25uZWN0LCBhbmQgZGlzY29ubmVjdCBldmVudHMgaW4gdGhlIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIG5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIGEgY2hhbmdlIGluIGFuIG9ic2VydmVkIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdGhhdCBoYXMgY2hhbmdlZC5cbiAgICogQHBhcmFtIG9sZFZhbHVlIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgaW4gd2hpY2ggdGhlIGF0dHJpYnV0ZSBpcyBkZWZpbmVkLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgICAgYXR0ck5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZ3xudWxsLCBuZXdWYWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkO1xuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byB0aGUgaW5zZXJ0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGRlbGV0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBmcm9tIHRoZSBET00uXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkO1xufVxuXG4vKipcbiAqIEFkZGl0aW9uYWwgdHlwZSBpbmZvcm1hdGlvbiB0aGF0IGNhbiBiZSBhZGRlZCB0byB0aGUgTmdFbGVtZW50IGNsYXNzLFxuICogZm9yIHByb3BlcnRpZXMgdGhhdCBhcmUgYWRkZWQgYmFzZWRcbiAqIG9uIHRoZSBpbnB1dHMgYW5kIG1ldGhvZHMgb2YgdGhlIHVuZGVybHlpbmcgY29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgV2l0aFByb3BlcnRpZXM8UD4gPSB7XG4gIFtwcm9wZXJ0eSBpbiBrZXlvZiBQXTogUFtwcm9wZXJ0eV1cbn07XG5cbi8qKlxuICogQSBjb25maWd1cmF0aW9uIHRoYXQgaW5pdGlhbGl6ZXMgYW4gTmdFbGVtZW50Q29uc3RydWN0b3Igd2l0aCB0aGVcbiAqIGRlcGVuZGVuY2llcyBhbmQgc3RyYXRlZ3kgaXQgbmVlZHMgdG8gdHJhbnNmb3JtIGEgY29tcG9uZW50IGludG9cbiAqIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgaW5qZWN0b3IgdG8gdXNlIGZvciByZXRyaWV2aW5nIHRoZSBjb21wb25lbnQncyBmYWN0b3J5LlxuICAgKi9cbiAgaW5qZWN0b3I6IEluamVjdG9yO1xuICAvKipcbiAgICogQW4gb3B0aW9uYWwgY3VzdG9tIHN0cmF0ZWd5IGZhY3RvcnkgdG8gdXNlIGluc3RlYWQgb2YgdGhlIGRlZmF1bHQuXG4gICAqIFRoZSBzdHJhdGVneSBjb250cm9scyBob3cgdGhlIHRyYW5zZm9ybWF0aW9uIGlzIHBlcmZvcm1lZC5cbiAgICovXG4gIHN0cmF0ZWd5RmFjdG9yeT86IE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeTtcbn1cblxuLyoqXG4gKiAgQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBjdXN0b20gZWxlbWVudCBjbGFzcyBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudC5cbiAqXG4gKiBCdWlsZHMgYSBjbGFzcyB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgcHJvdmlkZWQgY29tcG9uZW50IGFuZFxuICogdXNlcyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiB0byBwcm92aWRlIG1vcmUgY29udGV4dCB0byB0aGUgY2xhc3MuXG4gKiBUYWtlcyB0aGUgY29tcG9uZW50IGZhY3RvcnkncyBpbnB1dHMgYW5kIG91dHB1dHMgdG8gY29udmVydCB0aGVtIHRvIHRoZSBwcm9wZXJcbiAqIGN1c3RvbSBlbGVtZW50IEFQSSBhbmQgYWRkIGhvb2tzIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogVGhlIGNvbmZpZ3VyYXRpb24ncyBpbmplY3RvciBpcyB0aGUgaW5pdGlhbCBpbmplY3RvciBzZXQgb24gdGhlIGNsYXNzLFxuICogYW5kIHVzZWQgYnkgZGVmYXVsdCBmb3IgZWFjaCBjcmVhdGVkIGluc3RhbmNlLlRoaXMgYmVoYXZpb3IgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCB0aGVcbiAqIHN0YXRpYyBwcm9wZXJ0eSB0byBhZmZlY3QgYWxsIG5ld2x5IGNyZWF0ZWQgaW5zdGFuY2VzLCBvciBhcyBhIGNvbnN0cnVjdG9yIGFyZ3VtZW50IGZvclxuICogb25lLW9mZiBjcmVhdGlvbnMuXG4gKlxuICogQHNlZSBbQW5ndWxhciBFbGVtZW50cyBPdmVydmlld10oZ3VpZGUvZWxlbWVudHMgXCJUdXJuaW5nIEFuZ3VsYXIgY29tcG9uZW50cyBpbnRvIGN1c3RvbSBlbGVtZW50c1wiKVxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0byB0cmFuc2Zvcm0uXG4gKiBAcGFyYW0gY29uZmlnIEEgY29uZmlndXJhdGlvbiB0aGF0IHByb3ZpZGVzIGluaXRpYWxpemF0aW9uIGluZm9ybWF0aW9uIHRvIHRoZSBjcmVhdGVkIGNsYXNzLlxuICogQHJldHVybnMgVGhlIGN1c3RvbS1lbGVtZW50IGNvbnN0cnVjdGlvbiBjbGFzcywgd2hpY2ggY2FuIGJlIHJlZ2lzdGVyZWQgd2l0aFxuICogYSBicm93c2VyJ3MgYEN1c3RvbUVsZW1lbnRSZWdpc3RyeWAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRWxlbWVudDxQPihcbiAgICBjb21wb25lbnQ6IFR5cGU8YW55PiwgY29uZmlnOiBOZ0VsZW1lbnRDb25maWcpOiBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPiB7XG4gIGNvbnN0IGlucHV0cyA9IGdldENvbXBvbmVudElucHV0cyhjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3Qgc3RyYXRlZ3lGYWN0b3J5ID1cbiAgICAgIGNvbmZpZy5zdHJhdGVneUZhY3RvcnkgfHwgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeShjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyA9IGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKGlucHV0cyk7XG5cbiAgY2xhc3MgTmdFbGVtZW50SW1wbCBleHRlbmRzIE5nRWxlbWVudCB7XG4gICAgLy8gV29yayBhcm91bmQgYSBidWcgaW4gY2xvc3VyZSB0eXBlZCBvcHRpbWl6YXRpb25zKGIvNzk1NTc0ODcpIHdoZXJlIGl0IGlzIG5vdCBob25vcmluZyBzdGF0aWNcbiAgICAvLyBmaWVsZCBleHRlcm5zLiBTbyB1c2luZyBxdW90ZWQgYWNjZXNzIHRvIGV4cGxpY2l0bHkgcHJldmVudCByZW5hbWluZy5cbiAgICBzdGF0aWMgcmVhZG9ubHlbJ29ic2VydmVkQXR0cmlidXRlcyddID0gT2JqZWN0LmtleXMoYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyk7XG5cbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgZ2V0IG5nRWxlbWVudFN0cmF0ZWd5KCk6IE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgICAgIC8vIE5PVEU6XG4gICAgICAvLyBTb21lIHBvbHlmaWxscyAoZS5nLiBgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudGApIGRvIG5vdCBjYWxsIHRoZSBjb25zdHJ1Y3RvciwgdGhlcmVmb3JlXG4gICAgICAvLyBpdCBpcyBub3Qgc2FmZSB0byBzZXQgYG5nRWxlbWVudFN0cmF0ZWd5YCBpbiB0aGUgY29uc3RydWN0b3IgYW5kIGFzc3VtZSBpdCB3aWxsIGJlXG4gICAgICAvLyBhdmFpbGFibGUgaW5zaWRlIHRoZSBtZXRob2RzLlxuICAgICAgLy9cbiAgICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogQWRkIGUyZSB0ZXN0cyB0aGF0IGNvdmVyIGNhc2VzIHdoZXJlIHRoZSBjb25zdHJ1Y3RvciBpc24ndCBjYWxsZWQuIEZvclxuICAgICAgLy8gbm93IHRoaXMgaXMgdGVzdGVkIHVzaW5nIGEgR29vZ2xlIGludGVybmFsIHRlc3Qgc3VpdGUuXG4gICAgICBpZiAoIXRoaXMuX25nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kgPVxuICAgICAgICAgICAgc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZSh0aGlzLmluamVjdG9yIHx8IGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgICAgICAgLy8gUmUtYXBwbHkgcHJlLWV4aXN0aW5nIGlucHV0IHZhbHVlcyAoc2V0IGFzIHByb3BlcnRpZXMgb24gdGhlIGVsZW1lbnQpIHRocm91Z2ggdGhlXG4gICAgICAgIC8vIHN0cmF0ZWd5LlxuICAgICAgICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lfSkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIE5vIHByZS1leGlzdGluZyB2YWx1ZSBmb3IgYHByb3BOYW1lYC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEZWxldGUgdGhlIHByb3BlcnR5IGZyb20gdGhlIGluc3RhbmNlIGFuZCByZS1hcHBseSBpdCB0aHJvdWdoIHRoZSBzdHJhdGVneS5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9ICh0aGlzIGFzIGFueSlbcHJvcE5hbWVdO1xuICAgICAgICAgIGRlbGV0ZSAodGhpcyBhcyBhbnkpW3Byb3BOYW1lXTtcbiAgICAgICAgICBzdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3khO1xuICAgIH1cblxuICAgIHByaXZhdGUgX25nRWxlbWVudFN0cmF0ZWd5PzogTmdFbGVtZW50U3RyYXRlZ3k7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGluamVjdG9yPzogSW5qZWN0b3IpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgICAgICBhdHRyTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nfG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgICAgY29uc3QgcHJvcE5hbWUgPSBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzW2F0dHJOYW1lXSE7XG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIG5ld1ZhbHVlKTtcbiAgICB9XG5cbiAgICBvdmVycmlkZSBjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIC8vIEZvciBoaXN0b3JpY2FsIHJlYXNvbnMsIHNvbWUgc3RyYXRlZ2llcyBtYXkgbm90IGhhdmUgaW5pdGlhbGl6ZWQgdGhlIGBldmVudHNgIHByb3BlcnR5XG4gICAgICAvLyB1bnRpbCBhZnRlciBgY29ubmVjdCgpYCBpcyBydW4uIFN1YnNjcmliZSB0byBgZXZlbnRzYCBpZiBpdCBpcyBhdmFpbGFibGUgYmVmb3JlIHJ1bm5pbmdcbiAgICAgIC8vIGBjb25uZWN0KClgIChpbiBvcmRlciB0byBjYXB0dXJlIGV2ZW50cyBlbWl0dGVkIGR1cmluZyBpbml0aWFsaXphdGlvbiksIG90aGVyd2lzZSBzdWJzY3JpYmVcbiAgICAgIC8vIGFmdGVyd2FyZHMuXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzogQ29uc2lkZXIgZGVwcmVjYXRpbmcvcmVtb3ZpbmcgdGhlIHBvc3QtY29ubmVjdCBzdWJzY3JpcHRpb24gaW4gYSBmdXR1cmUgbWFqb3IgdmVyc2lvblxuICAgICAgLy8gICAgICAgKGUuZy4gdjExKS5cblxuICAgICAgbGV0IHN1YnNjcmliZWRUb0V2ZW50cyA9IGZhbHNlO1xuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5ldmVudHMpIHtcbiAgICAgICAgLy8gYGV2ZW50c2AgYXJlIGFscmVhZHkgYXZhaWxhYmxlOiBTdWJzY3JpYmUgdG8gaXQgYXNhcC5cbiAgICAgICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgICAgICBzdWJzY3JpYmVkVG9FdmVudHMgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmNvbm5lY3QodGhpcyk7XG5cbiAgICAgIGlmICghc3Vic2NyaWJlZFRvRXZlbnRzKSB7XG4gICAgICAgIC8vIGBldmVudHNgIHdlcmUgbm90IGluaXRpYWxpemVkIGJlZm9yZSBydW5uaW5nIGBjb25uZWN0KClgOiBTdWJzY3JpYmUgdG8gdGhlbSBub3cuXG4gICAgICAgIC8vIFRoZSBldmVudHMgZW1pdHRlZCBkdXJpbmcgdGhlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbiBoYXZlIGJlZW4gbWlzc2VkLCBidXQgYXQgbGVhc3RcbiAgICAgICAgLy8gZnV0dXJlIGV2ZW50cyB3aWxsIGJlIGNhcHR1cmVkLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICAvLyBOb3QgdXNpbmcgYHRoaXMubmdFbGVtZW50U3RyYXRlZ3lgIHRvIGF2b2lkIHVubmVjZXNzYXJpbHkgY3JlYXRpbmcgdGhlIGBOZ0VsZW1lbnRTdHJhdGVneWAuXG4gICAgICBpZiAodGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3Vic2NyaWJlVG9FdmVudHMoKTogdm9pZCB7XG4gICAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIHRoZSBzdHJhdGVneSBhbmQgZGlzcGF0Y2ggdGhlbSBhcyBjdXN0b20gZXZlbnRzLlxuICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cy5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGUubmFtZSwge2RldGFpbDogZS52YWx1ZX0pO1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnMgdG8gdGhlIHByb3RvdHlwZSBmb3IgZWFjaCBwcm9wZXJ0eSBpbnB1dC5cbiAgaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZX0pID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTmdFbGVtZW50SW1wbC5wcm90b3R5cGUsIHByb3BOYW1lLCB7XG4gICAgICBnZXQoKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZ2V0SW5wdXRWYWx1ZShwcm9wTmFtZSk7XG4gICAgICB9LFxuICAgICAgc2V0KG5ld1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBuZXdWYWx1ZSk7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIChOZ0VsZW1lbnRJbXBsIGFzIGFueSkgYXMgTmdFbGVtZW50Q29uc3RydWN0b3I8UD47XG59XG4iXX0=