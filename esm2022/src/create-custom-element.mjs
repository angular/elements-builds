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
        // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
        // field externs. So using quoted access to explicitly prevent renaming.
        static { this['observedAttributes'] = Object.keys(attributeToPropertyInputs); }
        get ngElementStrategy() {
            // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
            // now this is tested using a Google internal test suite.
            if (!this._ngElementStrategy) {
                const strategy = this._ngElementStrategy =
                    strategyFactory.create(this.injector || config.injector);
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
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(e => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUF5QmhGOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOztRQUtFOztXQUVHO1FBQ08sZ0NBQTJCLEdBQXNCLElBQUksQ0FBQztJQXNCbEUsQ0FBQztDQUFBO0FBZ0NEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFNBQW9CLEVBQUUsTUFBdUI7SUFDL0MsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5RCxNQUFNLGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFaEcsTUFBTSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RSxNQUFNLGFBQWMsU0FBUSxTQUFTO1FBQ25DLCtGQUErRjtRQUMvRix3RUFBd0U7aUJBQ3pELEtBQUMsb0JBQW9CLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFFL0UsSUFBdUIsaUJBQWlCO1lBQ3RDLDZGQUE2RjtZQUM3Rix5REFBeUQ7WUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtnQkFDNUIsTUFBTSxRQUFRLEdBQUcs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QUFFLEVBQUU7UUFDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRTtZQUN2RCxHQUFHO2dCQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsR0FBRyxDQUFDLFFBQWE7Z0JBQ2YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFDRCxZQUFZLEVBQUUsSUFBSTtZQUNsQixVQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQVEsYUFBZ0QsQ0FBQztBQUMzRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3IsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0NvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9jb21wb25lbnQtZmFjdG9yeS1zdHJhdGVneSc7XG5pbXBvcnQge05nRWxlbWVudFN0cmF0ZWd5LCBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2dldENvbXBvbmVudElucHV0cywgZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFByb3RvdHlwZSBmb3IgYSBjbGFzcyBjb25zdHJ1Y3RvciBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudFxuICogdGhhdCBjYW4gYmUgdXNlZCBmb3IgY3VzdG9tIGVsZW1lbnQgcmVnaXN0cmF0aW9uLiBJbXBsZW1lbnRlZCBhbmQgcmV0dXJuZWRcbiAqIGJ5IHRoZSB7QGxpbmsgY3JlYXRlQ3VzdG9tRWxlbWVudCBjcmVhdGVDdXN0b21FbGVtZW50KCkgZnVuY3Rpb259LlxuICpcbiAqIEBzZWUgW0FuZ3VsYXIgRWxlbWVudHMgT3ZlcnZpZXddKGd1aWRlL2VsZW1lbnRzIFwiVHVybmluZyBBbmd1bGFyIGNvbXBvbmVudHMgaW50byBjdXN0b20gZWxlbWVudHNcIilcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2Ygb2JzZXJ2ZWQgYXR0cmlidXRlIG5hbWVzIGZvciB0aGUgY3VzdG9tIGVsZW1lbnQsXG4gICAqIGRlcml2ZWQgYnkgdHJhbnNmb3JtaW5nIGlucHV0IHByb3BlcnR5IG5hbWVzIGZyb20gdGhlIHNvdXJjZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSBvYnNlcnZlZEF0dHJpYnV0ZXM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIGNvbnN0cnVjdG9yIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gaW5qZWN0b3IgSWYgcHJvdmlkZWQsIG92ZXJyaWRlcyB0aGUgY29uZmlndXJlZCBpbmplY3Rvci5cbiAgICovXG4gIG5ldyhpbmplY3Rvcj86IEluamVjdG9yKTogTmdFbGVtZW50JldpdGhQcm9wZXJ0aWVzPFA+O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciBhIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgLyoqXG4gICAqIFRoZSBzdHJhdGVneSB0aGF0IGNvbnRyb2xzIGhvdyBhIGNvbXBvbmVudCBpcyB0cmFuc2Zvcm1lZCBpbiBhIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IG5nRWxlbWVudFN0cmF0ZWd5OiBOZ0VsZW1lbnRTdHJhdGVneTtcbiAgLyoqXG4gICAqIEEgc3Vic2NyaXB0aW9uIHRvIGNoYW5nZSwgY29ubmVjdCwgYW5kIGRpc2Nvbm5lY3QgZXZlbnRzIGluIHRoZSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byBhIGNoYW5nZSBpbiBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSBhdHRyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRoYXQgaGFzIGNoYW5nZWQuXG4gICAqIEBwYXJhbSBvbGRWYWx1ZSBUaGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIGluIHdoaWNoIHRoZSBhdHRyaWJ1dGUgaXMgZGVmaW5lZC5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGluc2VydGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBkZWxldGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgZnJvbSB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBZGRpdGlvbmFsIHR5cGUgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgYWRkZWQgdG8gdGhlIE5nRWxlbWVudCBjbGFzcyxcbiAqIGZvciBwcm9wZXJ0aWVzIHRoYXQgYXJlIGFkZGVkIGJhc2VkXG4gKiBvbiB0aGUgaW5wdXRzIGFuZCBtZXRob2RzIG9mIHRoZSB1bmRlcmx5aW5nIGNvbXBvbmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIFdpdGhQcm9wZXJ0aWVzPFA+ID0ge1xuICBbcHJvcGVydHkgaW4ga2V5b2YgUF06IFBbcHJvcGVydHldXG59O1xuXG4vKipcbiAqIEEgY29uZmlndXJhdGlvbiB0aGF0IGluaXRpYWxpemVzIGFuIE5nRWxlbWVudENvbnN0cnVjdG9yIHdpdGggdGhlXG4gKiBkZXBlbmRlbmNpZXMgYW5kIHN0cmF0ZWd5IGl0IG5lZWRzIHRvIHRyYW5zZm9ybSBhIGNvbXBvbmVudCBpbnRvXG4gKiBhIGN1c3RvbSBlbGVtZW50IGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIGluamVjdG9yIHRvIHVzZSBmb3IgcmV0cmlldmluZyB0aGUgY29tcG9uZW50J3MgZmFjdG9yeS5cbiAgICovXG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGN1c3RvbSBzdHJhdGVneSBmYWN0b3J5IHRvIHVzZSBpbnN0ZWFkIG9mIHRoZSBkZWZhdWx0LlxuICAgKiBUaGUgc3RyYXRlZ3kgY29udHJvbHMgaG93IHRoZSB0cmFuc2Zvcm1hdGlvbiBpcyBwZXJmb3JtZWQuXG4gICAqL1xuICBzdHJhdGVneUZhY3Rvcnk/OiBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnk7XG59XG5cbi8qKlxuICogIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnQuXG4gKlxuICogQnVpbGRzIGEgY2xhc3MgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHByb3ZpZGVkIGNvbXBvbmVudCBhbmRcbiAqIHVzZXMgdGhlIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdG8gcHJvdmlkZSBtb3JlIGNvbnRleHQgdG8gdGhlIGNsYXNzLlxuICogVGFrZXMgdGhlIGNvbXBvbmVudCBmYWN0b3J5J3MgaW5wdXRzIGFuZCBvdXRwdXRzIHRvIGNvbnZlcnQgdGhlbSB0byB0aGUgcHJvcGVyXG4gKiBjdXN0b20gZWxlbWVudCBBUEkgYW5kIGFkZCBob29rcyB0byBpbnB1dCBjaGFuZ2VzLlxuICpcbiAqIFRoZSBjb25maWd1cmF0aW9uJ3MgaW5qZWN0b3IgaXMgdGhlIGluaXRpYWwgaW5qZWN0b3Igc2V0IG9uIHRoZSBjbGFzcyxcbiAqIGFuZCB1c2VkIGJ5IGRlZmF1bHQgZm9yIGVhY2ggY3JlYXRlZCBpbnN0YW5jZS5UaGlzIGJlaGF2aW9yIGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlXG4gKiBzdGF0aWMgcHJvcGVydHkgdG8gYWZmZWN0IGFsbCBuZXdseSBjcmVhdGVkIGluc3RhbmNlcywgb3IgYXMgYSBjb25zdHJ1Y3RvciBhcmd1bWVudCBmb3JcbiAqIG9uZS1vZmYgY3JlYXRpb25zLlxuICpcbiAqIEBzZWUgW0FuZ3VsYXIgRWxlbWVudHMgT3ZlcnZpZXddKGd1aWRlL2VsZW1lbnRzIFwiVHVybmluZyBBbmd1bGFyIGNvbXBvbmVudHMgaW50byBjdXN0b20gZWxlbWVudHNcIilcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gdHJhbnNmb3JtLlxuICogQHBhcmFtIGNvbmZpZyBBIGNvbmZpZ3VyYXRpb24gdGhhdCBwcm92aWRlcyBpbml0aWFsaXphdGlvbiBpbmZvcm1hdGlvbiB0byB0aGUgY3JlYXRlZCBjbGFzcy5cbiAqIEByZXR1cm5zIFRoZSBjdXN0b20tZWxlbWVudCBjb25zdHJ1Y3Rpb24gY2xhc3MsIHdoaWNoIGNhbiBiZSByZWdpc3RlcmVkIHdpdGhcbiAqIGEgYnJvd3NlcidzIGBDdXN0b21FbGVtZW50UmVnaXN0cnlgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUVsZW1lbnQ8UD4oXG4gICAgY29tcG9uZW50OiBUeXBlPGFueT4sIGNvbmZpZzogTmdFbGVtZW50Q29uZmlnKTogTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICBjb25zdCBpbnB1dHMgPSBnZXRDb21wb25lbnRJbnB1dHMoY29tcG9uZW50LCBjb25maWcuaW5qZWN0b3IpO1xuXG4gIGNvbnN0IHN0cmF0ZWd5RmFjdG9yeSA9XG4gICAgICBjb25maWcuc3RyYXRlZ3lGYWN0b3J5IHx8IG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnkoY29tcG9uZW50LCBjb25maWcuaW5qZWN0b3IpO1xuXG4gIGNvbnN0IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMgPSBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyhpbnB1dHMpO1xuXG4gIGNsYXNzIE5nRWxlbWVudEltcGwgZXh0ZW5kcyBOZ0VsZW1lbnQge1xuICAgIC8vIFdvcmsgYXJvdW5kIGEgYnVnIGluIGNsb3N1cmUgdHlwZWQgb3B0aW1pemF0aW9ucyhiLzc5NTU3NDg3KSB3aGVyZSBpdCBpcyBub3QgaG9ub3Jpbmcgc3RhdGljXG4gICAgLy8gZmllbGQgZXh0ZXJucy4gU28gdXNpbmcgcXVvdGVkIGFjY2VzcyB0byBleHBsaWNpdGx5IHByZXZlbnQgcmVuYW1pbmcuXG4gICAgc3RhdGljIHJlYWRvbmx5WydvYnNlcnZlZEF0dHJpYnV0ZXMnXSA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMpO1xuXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIGdldCBuZ0VsZW1lbnRTdHJhdGVneSgpOiBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gICAgICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IEFkZCBlMmUgdGVzdHMgdGhhdCBjb3ZlciBjYXNlcyB3aGVyZSB0aGUgY29uc3RydWN0b3IgaXNuJ3QgY2FsbGVkLiBGb3JcbiAgICAgIC8vIG5vdyB0aGlzIGlzIHRlc3RlZCB1c2luZyBhIEdvb2dsZSBpbnRlcm5hbCB0ZXN0IHN1aXRlLlxuICAgICAgaWYgKCF0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuX25nRWxlbWVudFN0cmF0ZWd5ID1cbiAgICAgICAgICAgIHN0cmF0ZWd5RmFjdG9yeS5jcmVhdGUodGhpcy5pbmplY3RvciB8fCBjb25maWcuaW5qZWN0b3IpO1xuXG4gICAgICAgIC8vIFJlLWFwcGx5IHByZS1leGlzdGluZyBpbnB1dCB2YWx1ZXMgKHNldCBhcyBwcm9wZXJ0aWVzIG9uIHRoZSBlbGVtZW50KSB0aHJvdWdoIHRoZVxuICAgICAgICAvLyBzdHJhdGVneS5cbiAgICAgICAgaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZSwgdHJhbnNmb3JtfSkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIE5vIHByZS1leGlzdGluZyB2YWx1ZSBmb3IgYHByb3BOYW1lYC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEZWxldGUgdGhlIHByb3BlcnR5IGZyb20gdGhlIGluc3RhbmNlIGFuZCByZS1hcHBseSBpdCB0aHJvdWdoIHRoZSBzdHJhdGVneS5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9ICh0aGlzIGFzIGFueSlbcHJvcE5hbWVdO1xuICAgICAgICAgIGRlbGV0ZSAodGhpcyBhcyBhbnkpW3Byb3BOYW1lXTtcbiAgICAgICAgICBzdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCB2YWx1ZSwgdHJhbnNmb3JtKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbmdFbGVtZW50U3RyYXRlZ3k/OiBOZ0VsZW1lbnRTdHJhdGVneTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaW5qZWN0b3I/OiBJbmplY3Rvcikge1xuICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBvdmVycmlkZSBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soXG4gICAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICBjb25zdCBbcHJvcE5hbWUsIHRyYW5zZm9ybV0gPSBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzW2F0dHJOYW1lXSE7XG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIG5ld1ZhbHVlLCB0cmFuc2Zvcm0pO1xuICAgIH1cblxuICAgIG92ZXJyaWRlIGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgLy8gRm9yIGhpc3RvcmljYWwgcmVhc29ucywgc29tZSBzdHJhdGVnaWVzIG1heSBub3QgaGF2ZSBpbml0aWFsaXplZCB0aGUgYGV2ZW50c2AgcHJvcGVydHlcbiAgICAgIC8vIHVudGlsIGFmdGVyIGBjb25uZWN0KClgIGlzIHJ1bi4gU3Vic2NyaWJlIHRvIGBldmVudHNgIGlmIGl0IGlzIGF2YWlsYWJsZSBiZWZvcmUgcnVubmluZ1xuICAgICAgLy8gYGNvbm5lY3QoKWAgKGluIG9yZGVyIHRvIGNhcHR1cmUgZXZlbnRzIGVtaXR0ZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uKSwgb3RoZXJ3aXNlIHN1YnNjcmliZVxuICAgICAgLy8gYWZ0ZXJ3YXJkcy5cbiAgICAgIC8vXG4gICAgICAvLyBUT0RPOiBDb25zaWRlciBkZXByZWNhdGluZy9yZW1vdmluZyB0aGUgcG9zdC1jb25uZWN0IHN1YnNjcmlwdGlvbiBpbiBhIGZ1dHVyZSBtYWpvciB2ZXJzaW9uXG4gICAgICAvLyAgICAgICAoZS5nLiB2MTEpLlxuXG4gICAgICBsZXQgc3Vic2NyaWJlZFRvRXZlbnRzID0gZmFsc2U7XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cykge1xuICAgICAgICAvLyBgZXZlbnRzYCBhcmUgYWxyZWFkeSBhdmFpbGFibGU6IFN1YnNjcmliZSB0byBpdCBhc2FwLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgICAgIHN1YnNjcmliZWRUb0V2ZW50cyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuY29ubmVjdCh0aGlzKTtcblxuICAgICAgaWYgKCFzdWJzY3JpYmVkVG9FdmVudHMpIHtcbiAgICAgICAgLy8gYGV2ZW50c2Agd2VyZSBub3QgaW5pdGlhbGl6ZWQgYmVmb3JlIHJ1bm5pbmcgYGNvbm5lY3QoKWA6IFN1YnNjcmliZSB0byB0aGVtIG5vdy5cbiAgICAgICAgLy8gVGhlIGV2ZW50cyBlbWl0dGVkIGR1cmluZyB0aGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uIGhhdmUgYmVlbiBtaXNzZWQsIGJ1dCBhdCBsZWFzdFxuICAgICAgICAvLyBmdXR1cmUgZXZlbnRzIHdpbGwgYmUgY2FwdHVyZWQuXG4gICAgICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZSBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIC8vIE5vdCB1c2luZyBgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneWAgdG8gYXZvaWQgdW5uZWNlc3NhcmlseSBjcmVhdGluZyB0aGUgYE5nRWxlbWVudFN0cmF0ZWd5YC5cbiAgICAgIGlmICh0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneS5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdWJzY3JpYmVUb0V2ZW50cygpOiB2b2lkIHtcbiAgICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gdGhlIHN0cmF0ZWd5IGFuZCBkaXNwYXRjaCB0aGVtIGFzIGN1c3RvbSBldmVudHMuXG4gICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZXZlbnRzLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZS5uYW1lLCB7ZGV0YWlsOiBlLnZhbHVlfSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVycyB0byB0aGUgcHJvdG90eXBlIGZvciBlYWNoIHByb3BlcnR5IGlucHV0LlxuICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lLCB0cmFuc2Zvcm19KSA9PiB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE5nRWxlbWVudEltcGwucHJvdG90eXBlLCBwcm9wTmFtZSwge1xuICAgICAgZ2V0KCk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmdldElucHV0VmFsdWUocHJvcE5hbWUpO1xuICAgICAgfSxcbiAgICAgIHNldChuZXdWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgbmV3VmFsdWUsIHRyYW5zZm9ybSk7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIChOZ0VsZW1lbnRJbXBsIGFzIGFueSkgYXMgTmdFbGVtZW50Q29uc3RydWN0b3I8UD47XG59XG4iXX0=