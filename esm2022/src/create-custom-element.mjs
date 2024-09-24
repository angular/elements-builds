/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
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
        // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
        // field externs. So using quoted access to explicitly prevent renaming.
        static { this['observedAttributes'] = Object.keys(attributeToPropertyInputs); }
        get ngElementStrategy() {
            // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
            // now this is tested using a Google internal test suite.
            if (!this._ngElementStrategy) {
                const strategy = (this._ngElementStrategy = strategyFactory.create(this.injector || config.injector));
                // Re-apply pre-existing input values (set as properties on the element) through the
                // strategy.
                inputs.forEach(({ propName, transform }) => {
                    if (!this.hasOwnProperty(propName)) {
                        // No pre-existing value for `propName`.
                        return;
                    }
                    // Delete the property from the instance and re-apply it through the strategy.
                    const value = this[propName];
                    delete this[propName];
                    strategy.setInputValue(propName, value, transform);
                });
            }
            return this._ngElementStrategy;
        }
        constructor(injector) {
            super();
            this.injector = injector;
        }
        attributeChangedCallback(attrName, oldValue, newValue, namespace) {
            const [propName, transform] = attributeToPropertyInputs[attrName];
            this.ngElementStrategy.setInputValue(propName, newValue, transform);
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
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe((e) => {
                const customEvent = new CustomEvent(e.name, { detail: e.value });
                this.dispatchEvent(customEvent);
            });
        }
    }
    // Add getters and setters to the prototype for each property input.
    inputs.forEach(({ propName, transform }) => {
        Object.defineProperty(NgElementImpl.prototype, propName, {
            get() {
                return this.ngElementStrategy.getInputValue(propName);
            },
            set(newValue) {
                this.ngElementStrategy.setInputValue(propName, newValue, transform);
            },
            configurable: true,
            enumerable: true,
        });
    });
    return NgElementImpl;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUF5QmhGOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOztRQUtFOztXQUVHO1FBQ08sZ0NBQTJCLEdBQXdCLElBQUksQ0FBQztJQTBCcEUsQ0FBQztDQUFBO0FBZ0NEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQ2pDLFNBQW9CLEVBQ3BCLE1BQXVCO0lBRXZCLE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFOUQsTUFBTSxlQUFlLEdBQ25CLE1BQU0sQ0FBQyxlQUFlLElBQUksSUFBSSxpQ0FBaUMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTlGLE1BQU0seUJBQXlCLEdBQUcsbUNBQW1DLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUUsTUFBTSxhQUFjLFNBQVEsU0FBUztRQUNuQywrRkFBK0Y7UUFDL0Ysd0VBQXdFO2lCQUN4RCxLQUFDLG9CQUFvQixDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBRWhGLElBQXVCLGlCQUFpQjtZQUN0Qyw2RkFBNkY7WUFDN0YseURBQXlEO1lBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxRQUFR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Q0wsQ0FBQzs7SUFHSCxvRUFBb0U7SUFDcEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFFLFNBQVMsRUFBQyxFQUFFLEVBQUU7UUFDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRTtZQUN2RCxHQUFHO2dCQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsR0FBRyxDQUFDLFFBQWE7Z0JBQ2YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFDRCxZQUFZLEVBQUUsSUFBSTtZQUNsQixVQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sYUFBK0MsQ0FBQztBQUN6RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vY29tcG9uZW50LWZhY3Rvcnktc3RyYXRlZ3knO1xuaW1wb3J0IHtOZ0VsZW1lbnRTdHJhdGVneSwgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2VsZW1lbnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtnZXRDb21wb25lbnRJbnB1dHMsIGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBQcm90b3R5cGUgZm9yIGEgY2xhc3MgY29uc3RydWN0b3IgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnRcbiAqIHRoYXQgY2FuIGJlIHVzZWQgZm9yIGN1c3RvbSBlbGVtZW50IHJlZ2lzdHJhdGlvbi4gSW1wbGVtZW50ZWQgYW5kIHJldHVybmVkXG4gKiBieSB0aGUge0BsaW5rIGNyZWF0ZUN1c3RvbUVsZW1lbnQgY3JlYXRlQ3VzdG9tRWxlbWVudCgpIGZ1bmN0aW9ufS5cbiAqXG4gKiBAc2VlIFtBbmd1bGFyIEVsZW1lbnRzIE92ZXJ2aWV3XShndWlkZS9lbGVtZW50cyBcIlR1cm5pbmcgQW5ndWxhciBjb21wb25lbnRzIGludG8gY3VzdG9tIGVsZW1lbnRzXCIpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudENvbnN0cnVjdG9yPFA+IHtcbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIG9ic2VydmVkIGF0dHJpYnV0ZSBuYW1lcyBmb3IgdGhlIGN1c3RvbSBlbGVtZW50LFxuICAgKiBkZXJpdmVkIGJ5IHRyYW5zZm9ybWluZyBpbnB1dCBwcm9wZXJ0eSBuYW1lcyBmcm9tIHRoZSBzb3VyY2UgY29tcG9uZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgb2JzZXJ2ZWRBdHRyaWJ1dGVzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBjb25zdHJ1Y3RvciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGluamVjdG9yIElmIHByb3ZpZGVkLCBvdmVycmlkZXMgdGhlIGNvbmZpZ3VyZWQgaW5qZWN0b3IuXG4gICAqL1xuICBuZXcgKGluamVjdG9yPzogSW5qZWN0b3IpOiBOZ0VsZW1lbnQgJiBXaXRoUHJvcGVydGllczxQPjtcbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBmdW5jdGlvbmFsaXR5IG5lZWRlZCBmb3IgYSBjdXN0b20gZWxlbWVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ0VsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIC8qKlxuICAgKiBUaGUgc3RyYXRlZ3kgdGhhdCBjb250cm9scyBob3cgYSBjb21wb25lbnQgaXMgdHJhbnNmb3JtZWQgaW4gYSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBuZ0VsZW1lbnRTdHJhdGVneTogTmdFbGVtZW50U3RyYXRlZ3k7XG4gIC8qKlxuICAgKiBBIHN1YnNjcmlwdGlvbiB0byBjaGFuZ2UsIGNvbm5lY3QsIGFuZCBkaXNjb25uZWN0IGV2ZW50cyBpbiB0aGUgY3VzdG9tIGVsZW1lbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgbmdFbGVtZW50RXZlbnRzU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byBhIGNoYW5nZSBpbiBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSBhdHRyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRoYXQgaGFzIGNoYW5nZWQuXG4gICAqIEBwYXJhbSBvbGRWYWx1ZSBUaGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIGluIHdoaWNoIHRoZSBhdHRyaWJ1dGUgaXMgZGVmaW5lZC5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICBhdHRyTmFtZTogc3RyaW5nLFxuICAgIG9sZFZhbHVlOiBzdHJpbmcgfCBudWxsLFxuICAgIG5ld1ZhbHVlOiBzdHJpbmcsXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nLFxuICApOiB2b2lkO1xuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byB0aGUgaW5zZXJ0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGRlbGV0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBmcm9tIHRoZSBET00uXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkO1xufVxuXG4vKipcbiAqIEFkZGl0aW9uYWwgdHlwZSBpbmZvcm1hdGlvbiB0aGF0IGNhbiBiZSBhZGRlZCB0byB0aGUgTmdFbGVtZW50IGNsYXNzLFxuICogZm9yIHByb3BlcnRpZXMgdGhhdCBhcmUgYWRkZWQgYmFzZWRcbiAqIG9uIHRoZSBpbnB1dHMgYW5kIG1ldGhvZHMgb2YgdGhlIHVuZGVybHlpbmcgY29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgV2l0aFByb3BlcnRpZXM8UD4gPSB7XG4gIFtwcm9wZXJ0eSBpbiBrZXlvZiBQXTogUFtwcm9wZXJ0eV07XG59O1xuXG4vKipcbiAqIEEgY29uZmlndXJhdGlvbiB0aGF0IGluaXRpYWxpemVzIGFuIE5nRWxlbWVudENvbnN0cnVjdG9yIHdpdGggdGhlXG4gKiBkZXBlbmRlbmNpZXMgYW5kIHN0cmF0ZWd5IGl0IG5lZWRzIHRvIHRyYW5zZm9ybSBhIGNvbXBvbmVudCBpbnRvXG4gKiBhIGN1c3RvbSBlbGVtZW50IGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIGluamVjdG9yIHRvIHVzZSBmb3IgcmV0cmlldmluZyB0aGUgY29tcG9uZW50J3MgZmFjdG9yeS5cbiAgICovXG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGN1c3RvbSBzdHJhdGVneSBmYWN0b3J5IHRvIHVzZSBpbnN0ZWFkIG9mIHRoZSBkZWZhdWx0LlxuICAgKiBUaGUgc3RyYXRlZ3kgY29udHJvbHMgaG93IHRoZSB0cmFuc2Zvcm1hdGlvbiBpcyBwZXJmb3JtZWQuXG4gICAqL1xuICBzdHJhdGVneUZhY3Rvcnk/OiBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnk7XG59XG5cbi8qKlxuICogIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnQuXG4gKlxuICogQnVpbGRzIGEgY2xhc3MgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHByb3ZpZGVkIGNvbXBvbmVudCBhbmRcbiAqIHVzZXMgdGhlIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdG8gcHJvdmlkZSBtb3JlIGNvbnRleHQgdG8gdGhlIGNsYXNzLlxuICogVGFrZXMgdGhlIGNvbXBvbmVudCBmYWN0b3J5J3MgaW5wdXRzIGFuZCBvdXRwdXRzIHRvIGNvbnZlcnQgdGhlbSB0byB0aGUgcHJvcGVyXG4gKiBjdXN0b20gZWxlbWVudCBBUEkgYW5kIGFkZCBob29rcyB0byBpbnB1dCBjaGFuZ2VzLlxuICpcbiAqIFRoZSBjb25maWd1cmF0aW9uJ3MgaW5qZWN0b3IgaXMgdGhlIGluaXRpYWwgaW5qZWN0b3Igc2V0IG9uIHRoZSBjbGFzcyxcbiAqIGFuZCB1c2VkIGJ5IGRlZmF1bHQgZm9yIGVhY2ggY3JlYXRlZCBpbnN0YW5jZS5UaGlzIGJlaGF2aW9yIGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlXG4gKiBzdGF0aWMgcHJvcGVydHkgdG8gYWZmZWN0IGFsbCBuZXdseSBjcmVhdGVkIGluc3RhbmNlcywgb3IgYXMgYSBjb25zdHJ1Y3RvciBhcmd1bWVudCBmb3JcbiAqIG9uZS1vZmYgY3JlYXRpb25zLlxuICpcbiAqIEBzZWUgW0FuZ3VsYXIgRWxlbWVudHMgT3ZlcnZpZXddKGd1aWRlL2VsZW1lbnRzIFwiVHVybmluZyBBbmd1bGFyIGNvbXBvbmVudHMgaW50byBjdXN0b20gZWxlbWVudHNcIilcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gdHJhbnNmb3JtLlxuICogQHBhcmFtIGNvbmZpZyBBIGNvbmZpZ3VyYXRpb24gdGhhdCBwcm92aWRlcyBpbml0aWFsaXphdGlvbiBpbmZvcm1hdGlvbiB0byB0aGUgY3JlYXRlZCBjbGFzcy5cbiAqIEByZXR1cm5zIFRoZSBjdXN0b20tZWxlbWVudCBjb25zdHJ1Y3Rpb24gY2xhc3MsIHdoaWNoIGNhbiBiZSByZWdpc3RlcmVkIHdpdGhcbiAqIGEgYnJvd3NlcidzIGBDdXN0b21FbGVtZW50UmVnaXN0cnlgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUVsZW1lbnQ8UD4oXG4gIGNvbXBvbmVudDogVHlwZTxhbnk+LFxuICBjb25maWc6IE5nRWxlbWVudENvbmZpZyxcbik6IE5nRWxlbWVudENvbnN0cnVjdG9yPFA+IHtcbiAgY29uc3QgaW5wdXRzID0gZ2V0Q29tcG9uZW50SW5wdXRzKGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBzdHJhdGVneUZhY3RvcnkgPVxuICAgIGNvbmZpZy5zdHJhdGVneUZhY3RvcnkgfHwgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeShjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyA9IGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKGlucHV0cyk7XG5cbiAgY2xhc3MgTmdFbGVtZW50SW1wbCBleHRlbmRzIE5nRWxlbWVudCB7XG4gICAgLy8gV29yayBhcm91bmQgYSBidWcgaW4gY2xvc3VyZSB0eXBlZCBvcHRpbWl6YXRpb25zKGIvNzk1NTc0ODcpIHdoZXJlIGl0IGlzIG5vdCBob25vcmluZyBzdGF0aWNcbiAgICAvLyBmaWVsZCBleHRlcm5zLiBTbyB1c2luZyBxdW90ZWQgYWNjZXNzIHRvIGV4cGxpY2l0bHkgcHJldmVudCByZW5hbWluZy5cbiAgICBzdGF0aWMgcmVhZG9ubHkgWydvYnNlcnZlZEF0dHJpYnV0ZXMnXSA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMpO1xuXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIGdldCBuZ0VsZW1lbnRTdHJhdGVneSgpOiBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gICAgICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IEFkZCBlMmUgdGVzdHMgdGhhdCBjb3ZlciBjYXNlcyB3aGVyZSB0aGUgY29uc3RydWN0b3IgaXNuJ3QgY2FsbGVkLiBGb3JcbiAgICAgIC8vIG5vdyB0aGlzIGlzIHRlc3RlZCB1c2luZyBhIEdvb2dsZSBpbnRlcm5hbCB0ZXN0IHN1aXRlLlxuICAgICAgaWYgKCF0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICBjb25zdCBzdHJhdGVneSA9ICh0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSA9IHN0cmF0ZWd5RmFjdG9yeS5jcmVhdGUoXG4gICAgICAgICAgdGhpcy5pbmplY3RvciB8fCBjb25maWcuaW5qZWN0b3IsXG4gICAgICAgICkpO1xuXG4gICAgICAgIC8vIFJlLWFwcGx5IHByZS1leGlzdGluZyBpbnB1dCB2YWx1ZXMgKHNldCBhcyBwcm9wZXJ0aWVzIG9uIHRoZSBlbGVtZW50KSB0aHJvdWdoIHRoZVxuICAgICAgICAvLyBzdHJhdGVneS5cbiAgICAgICAgaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZSwgdHJhbnNmb3JtfSkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIE5vIHByZS1leGlzdGluZyB2YWx1ZSBmb3IgYHByb3BOYW1lYC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEZWxldGUgdGhlIHByb3BlcnR5IGZyb20gdGhlIGluc3RhbmNlIGFuZCByZS1hcHBseSBpdCB0aHJvdWdoIHRoZSBzdHJhdGVneS5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9ICh0aGlzIGFzIGFueSlbcHJvcE5hbWVdO1xuICAgICAgICAgIGRlbGV0ZSAodGhpcyBhcyBhbnkpW3Byb3BOYW1lXTtcbiAgICAgICAgICBzdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCB2YWx1ZSwgdHJhbnNmb3JtKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbmdFbGVtZW50U3RyYXRlZ3k/OiBOZ0VsZW1lbnRTdHJhdGVneTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaW5qZWN0b3I/OiBJbmplY3Rvcikge1xuICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBvdmVycmlkZSBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soXG4gICAgICBhdHRyTmFtZTogc3RyaW5nLFxuICAgICAgb2xkVmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgICBuZXdWYWx1ZTogc3RyaW5nLFxuICAgICAgbmFtZXNwYWNlPzogc3RyaW5nLFxuICAgICk6IHZvaWQge1xuICAgICAgY29uc3QgW3Byb3BOYW1lLCB0cmFuc2Zvcm1dID0gYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c1thdHRyTmFtZV0hO1xuICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBuZXdWYWx1ZSwgdHJhbnNmb3JtKTtcbiAgICB9XG5cbiAgICBvdmVycmlkZSBjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIC8vIEZvciBoaXN0b3JpY2FsIHJlYXNvbnMsIHNvbWUgc3RyYXRlZ2llcyBtYXkgbm90IGhhdmUgaW5pdGlhbGl6ZWQgdGhlIGBldmVudHNgIHByb3BlcnR5XG4gICAgICAvLyB1bnRpbCBhZnRlciBgY29ubmVjdCgpYCBpcyBydW4uIFN1YnNjcmliZSB0byBgZXZlbnRzYCBpZiBpdCBpcyBhdmFpbGFibGUgYmVmb3JlIHJ1bm5pbmdcbiAgICAgIC8vIGBjb25uZWN0KClgIChpbiBvcmRlciB0byBjYXB0dXJlIGV2ZW50cyBlbWl0dGVkIGR1cmluZyBpbml0aWFsaXphdGlvbiksIG90aGVyd2lzZSBzdWJzY3JpYmVcbiAgICAgIC8vIGFmdGVyd2FyZHMuXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzogQ29uc2lkZXIgZGVwcmVjYXRpbmcvcmVtb3ZpbmcgdGhlIHBvc3QtY29ubmVjdCBzdWJzY3JpcHRpb24gaW4gYSBmdXR1cmUgbWFqb3IgdmVyc2lvblxuICAgICAgLy8gICAgICAgKGUuZy4gdjExKS5cblxuICAgICAgbGV0IHN1YnNjcmliZWRUb0V2ZW50cyA9IGZhbHNlO1xuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5ldmVudHMpIHtcbiAgICAgICAgLy8gYGV2ZW50c2AgYXJlIGFscmVhZHkgYXZhaWxhYmxlOiBTdWJzY3JpYmUgdG8gaXQgYXNhcC5cbiAgICAgICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgICAgICBzdWJzY3JpYmVkVG9FdmVudHMgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmNvbm5lY3QodGhpcyk7XG5cbiAgICAgIGlmICghc3Vic2NyaWJlZFRvRXZlbnRzKSB7XG4gICAgICAgIC8vIGBldmVudHNgIHdlcmUgbm90IGluaXRpYWxpemVkIGJlZm9yZSBydW5uaW5nIGBjb25uZWN0KClgOiBTdWJzY3JpYmUgdG8gdGhlbSBub3cuXG4gICAgICAgIC8vIFRoZSBldmVudHMgZW1pdHRlZCBkdXJpbmcgdGhlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbiBoYXZlIGJlZW4gbWlzc2VkLCBidXQgYXQgbGVhc3RcbiAgICAgICAgLy8gZnV0dXJlIGV2ZW50cyB3aWxsIGJlIGNhcHR1cmVkLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGUgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICAvLyBOb3QgdXNpbmcgYHRoaXMubmdFbGVtZW50U3RyYXRlZ3lgIHRvIGF2b2lkIHVubmVjZXNzYXJpbHkgY3JlYXRpbmcgdGhlIGBOZ0VsZW1lbnRTdHJhdGVneWAuXG4gICAgICBpZiAodGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3Vic2NyaWJlVG9FdmVudHMoKTogdm9pZCB7XG4gICAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIHRoZSBzdHJhdGVneSBhbmQgZGlzcGF0Y2ggdGhlbSBhcyBjdXN0b20gZXZlbnRzLlxuICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cy5zdWJzY3JpYmUoKGUpID0+IHtcbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZS5uYW1lLCB7ZGV0YWlsOiBlLnZhbHVlfSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVycyB0byB0aGUgcHJvdG90eXBlIGZvciBlYWNoIHByb3BlcnR5IGlucHV0LlxuICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lLCB0cmFuc2Zvcm19KSA9PiB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE5nRWxlbWVudEltcGwucHJvdG90eXBlLCBwcm9wTmFtZSwge1xuICAgICAgZ2V0KCk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmdldElucHV0VmFsdWUocHJvcE5hbWUpO1xuICAgICAgfSxcbiAgICAgIHNldChuZXdWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgbmV3VmFsdWUsIHRyYW5zZm9ybSk7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIE5nRWxlbWVudEltcGwgYXMgYW55IGFzIE5nRWxlbWVudENvbnN0cnVjdG9yPFA+O1xufVxuIl19