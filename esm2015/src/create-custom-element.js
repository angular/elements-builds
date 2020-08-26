/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentNgElementStrategyFactory } from './component-factory-strategy';
import { createCustomEvent, getComponentInputs, getDefaultAttributeToPropertyInputs } from './utils';
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
                // Collect pre-existing values on the element to re-apply through the strategy.
                const preExistingValues = inputs.filter(({ propName }) => this.hasOwnProperty(propName)).map(({ propName }) => [propName, this[propName]]);
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
                    preExistingValues.forEach(([propName]) => delete this[propName]);
                }
                // Re-apply pre-existing values through the strategy.
                preExistingValues.forEach(([propName, value]) => strategy.setInputValue(propName, value));
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
            // `connect()` (in order to capture events emitted suring inittialization), otherwise
            // subscribe afterwards.
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
                const customEvent = createCustomEvent(this.ownerDocument, e.name, e.value);
                this.dispatchEvent(customEvent);
            });
        }
    }
    // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
    // field externs. So using quoted access to explicitly prevent renaming.
    NgElementImpl['observedAttributes'] = Object.keys(attributeToPropertyInputs);
    // TypeScript 3.9+ defines getters/setters as configurable but non-enumerable properties (in
    // compliance with the spec). This breaks emulated inheritance in ES5 on environments that do not
    // natively support `Object.setPrototypeOf()` (such as IE 9-10).
    // Update the property descriptor of `NgElementImpl#ngElementStrategy` to make it enumerable.
    // The below 'const', shouldn't be needed but currently this breaks build-optimizer
    // Build-optimizer currently uses TypeScript 3.6 which is unable to resolve an 'accessor'
    // in 'getTypeOfVariableOrParameterOrPropertyWorker'.
    const getterName = 'ngElementStrategy';
    Object.defineProperty(NgElementImpl.prototype, getterName, { enumerable: true });
    // Add getters and setters to the prototype for each property input.
    defineInputGettersSetters(inputs, NgElementImpl.prototype);
    return NgElementImpl;
}
// Helpers
function defineInputGettersSetters(inputs, target) {
    // Add getters and setters for each property input.
    inputs.forEach(({ propName }) => {
        Object.defineProperty(target, propName, {
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUF5Qm5HOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOztRQUtFOztXQUVHO1FBQ08sZ0NBQTJCLEdBQXNCLElBQUksQ0FBQztJQXNCbEUsQ0FBQztDQUFBO0FBZ0NEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFNBQW9CLEVBQUUsTUFBdUI7SUFDL0MsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5RCxNQUFNLGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFaEcsTUFBTSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RSxNQUFNLGFBQWMsU0FBUSxTQUFTO1FBNkNuQyxZQUE2QixRQUFtQjtZQUM5QyxLQUFLLEVBQUUsQ0FBQztZQURtQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBRWhELENBQUM7UUExQ0QsSUFBYyxpQkFBaUI7WUFDN0IsUUFBUTtZQUNSLDJGQUEyRjtZQUMzRixxRkFBcUY7WUFDckYsZ0NBQWdDO1lBQ2hDLEVBQUU7WUFDRiw2RkFBNkY7WUFDN0YseURBQXlEO1lBQ3pE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LENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFDRCxZQUFZLEVBQUUsSUFBSTtZQUNsQixVQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RvciwgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7Q29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudC1mYWN0b3J5LXN0cmF0ZWd5JztcbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7Y3JlYXRlQ3VzdG9tRXZlbnQsIGdldENvbXBvbmVudElucHV0cywgZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFByb3RvdHlwZSBmb3IgYSBjbGFzcyBjb25zdHJ1Y3RvciBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudFxuICogdGhhdCBjYW4gYmUgdXNlZCBmb3IgY3VzdG9tIGVsZW1lbnQgcmVnaXN0cmF0aW9uLiBJbXBsZW1lbnRlZCBhbmQgcmV0dXJuZWRcbiAqIGJ5IHRoZSB7QGxpbmsgY3JlYXRlQ3VzdG9tRWxlbWVudCBjcmVhdGVDdXN0b21FbGVtZW50KCkgZnVuY3Rpb259LlxuICpcbiAqIEBzZWUgW0FuZ3VsYXIgRWxlbWVudHMgT3ZlcnZpZXddKGd1aWRlL2VsZW1lbnRzIFwiVHVybmluZyBBbmd1bGFyIGNvbXBvbmVudHMgaW50byBjdXN0b20gZWxlbWVudHNcIilcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2Ygb2JzZXJ2ZWQgYXR0cmlidXRlIG5hbWVzIGZvciB0aGUgY3VzdG9tIGVsZW1lbnQsXG4gICAqIGRlcml2ZWQgYnkgdHJhbnNmb3JtaW5nIGlucHV0IHByb3BlcnR5IG5hbWVzIGZyb20gdGhlIHNvdXJjZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSBvYnNlcnZlZEF0dHJpYnV0ZXM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIGNvbnN0cnVjdG9yIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gaW5qZWN0b3IgSWYgcHJvdmlkZWQsIG92ZXJyaWRlcyB0aGUgY29uZmlndXJlZCBpbmplY3Rvci5cbiAgICovXG4gIG5ldyhpbmplY3Rvcj86IEluamVjdG9yKTogTmdFbGVtZW50JldpdGhQcm9wZXJ0aWVzPFA+O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciBhIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgLyoqXG4gICAqIFRoZSBzdHJhdGVneSB0aGF0IGNvbnRyb2xzIGhvdyBhIGNvbXBvbmVudCBpcyB0cmFuc2Zvcm1lZCBpbiBhIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IG5nRWxlbWVudFN0cmF0ZWd5OiBOZ0VsZW1lbnRTdHJhdGVneTtcbiAgLyoqXG4gICAqIEEgc3Vic2NyaXB0aW9uIHRvIGNoYW5nZSwgY29ubmVjdCwgYW5kIGRpc2Nvbm5lY3QgZXZlbnRzIGluIHRoZSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byBhIGNoYW5nZSBpbiBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSBhdHRyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRoYXQgaGFzIGNoYW5nZWQuXG4gICAqIEBwYXJhbSBvbGRWYWx1ZSBUaGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIGluIHdoaWNoIHRoZSBhdHRyaWJ1dGUgaXMgZGVmaW5lZC5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGluc2VydGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBkZWxldGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgZnJvbSB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBZGRpdGlvbmFsIHR5cGUgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgYWRkZWQgdG8gdGhlIE5nRWxlbWVudCBjbGFzcyxcbiAqIGZvciBwcm9wZXJ0aWVzIHRoYXQgYXJlIGFkZGVkIGJhc2VkXG4gKiBvbiB0aGUgaW5wdXRzIGFuZCBtZXRob2RzIG9mIHRoZSB1bmRlcmx5aW5nIGNvbXBvbmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIFdpdGhQcm9wZXJ0aWVzPFA+ID0ge1xuICBbcHJvcGVydHkgaW4ga2V5b2YgUF06IFBbcHJvcGVydHldXG59O1xuXG4vKipcbiAqIEEgY29uZmlndXJhdGlvbiB0aGF0IGluaXRpYWxpemVzIGFuIE5nRWxlbWVudENvbnN0cnVjdG9yIHdpdGggdGhlXG4gKiBkZXBlbmRlbmNpZXMgYW5kIHN0cmF0ZWd5IGl0IG5lZWRzIHRvIHRyYW5zZm9ybSBhIGNvbXBvbmVudCBpbnRvXG4gKiBhIGN1c3RvbSBlbGVtZW50IGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIGluamVjdG9yIHRvIHVzZSBmb3IgcmV0cmlldmluZyB0aGUgY29tcG9uZW50J3MgZmFjdG9yeS5cbiAgICovXG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGN1c3RvbSBzdHJhdGVneSBmYWN0b3J5IHRvIHVzZSBpbnN0ZWFkIG9mIHRoZSBkZWZhdWx0LlxuICAgKiBUaGUgc3RyYXRlZ3kgY29udHJvbHMgaG93IHRoZSB0cmFuc2Zvcm1hdGlvbiBpcyBwZXJmb3JtZWQuXG4gICAqL1xuICBzdHJhdGVneUZhY3Rvcnk/OiBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnk7XG59XG5cbi8qKlxuICogIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnQuXG4gKlxuICogQnVpbGRzIGEgY2xhc3MgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHByb3ZpZGVkIGNvbXBvbmVudCBhbmRcbiAqIHVzZXMgdGhlIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdG8gcHJvdmlkZSBtb3JlIGNvbnRleHQgdG8gdGhlIGNsYXNzLlxuICogVGFrZXMgdGhlIGNvbXBvbmVudCBmYWN0b3J5J3MgaW5wdXRzIGFuZCBvdXRwdXRzIHRvIGNvbnZlcnQgdGhlbSB0byB0aGUgcHJvcGVyXG4gKiBjdXN0b20gZWxlbWVudCBBUEkgYW5kIGFkZCBob29rcyB0byBpbnB1dCBjaGFuZ2VzLlxuICpcbiAqIFRoZSBjb25maWd1cmF0aW9uJ3MgaW5qZWN0b3IgaXMgdGhlIGluaXRpYWwgaW5qZWN0b3Igc2V0IG9uIHRoZSBjbGFzcyxcbiAqIGFuZCB1c2VkIGJ5IGRlZmF1bHQgZm9yIGVhY2ggY3JlYXRlZCBpbnN0YW5jZS5UaGlzIGJlaGF2aW9yIGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlXG4gKiBzdGF0aWMgcHJvcGVydHkgdG8gYWZmZWN0IGFsbCBuZXdseSBjcmVhdGVkIGluc3RhbmNlcywgb3IgYXMgYSBjb25zdHJ1Y3RvciBhcmd1bWVudCBmb3JcbiAqIG9uZS1vZmYgY3JlYXRpb25zLlxuICpcbiAqIEBzZWUgW0FuZ3VsYXIgRWxlbWVudHMgT3ZlcnZpZXddKGd1aWRlL2VsZW1lbnRzIFwiVHVybmluZyBBbmd1bGFyIGNvbXBvbmVudHMgaW50byBjdXN0b20gZWxlbWVudHNcIilcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gdHJhbnNmb3JtLlxuICogQHBhcmFtIGNvbmZpZyBBIGNvbmZpZ3VyYXRpb24gdGhhdCBwcm92aWRlcyBpbml0aWFsaXphdGlvbiBpbmZvcm1hdGlvbiB0byB0aGUgY3JlYXRlZCBjbGFzcy5cbiAqIEByZXR1cm5zIFRoZSBjdXN0b20tZWxlbWVudCBjb25zdHJ1Y3Rpb24gY2xhc3MsIHdoaWNoIGNhbiBiZSByZWdpc3RlcmVkIHdpdGhcbiAqIGEgYnJvd3NlcidzIGBDdXN0b21FbGVtZW50UmVnaXN0cnlgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUVsZW1lbnQ8UD4oXG4gICAgY29tcG9uZW50OiBUeXBlPGFueT4sIGNvbmZpZzogTmdFbGVtZW50Q29uZmlnKTogTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICBjb25zdCBpbnB1dHMgPSBnZXRDb21wb25lbnRJbnB1dHMoY29tcG9uZW50LCBjb25maWcuaW5qZWN0b3IpO1xuXG4gIGNvbnN0IHN0cmF0ZWd5RmFjdG9yeSA9XG4gICAgICBjb25maWcuc3RyYXRlZ3lGYWN0b3J5IHx8IG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnkoY29tcG9uZW50LCBjb25maWcuaW5qZWN0b3IpO1xuXG4gIGNvbnN0IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMgPSBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyhpbnB1dHMpO1xuXG4gIGNsYXNzIE5nRWxlbWVudEltcGwgZXh0ZW5kcyBOZ0VsZW1lbnQge1xuICAgIC8vIFdvcmsgYXJvdW5kIGEgYnVnIGluIGNsb3N1cmUgdHlwZWQgb3B0aW1pemF0aW9ucyhiLzc5NTU3NDg3KSB3aGVyZSBpdCBpcyBub3QgaG9ub3Jpbmcgc3RhdGljXG4gICAgLy8gZmllbGQgZXh0ZXJucy4gU28gdXNpbmcgcXVvdGVkIGFjY2VzcyB0byBleHBsaWNpdGx5IHByZXZlbnQgcmVuYW1pbmcuXG4gICAgc3RhdGljIHJlYWRvbmx5WydvYnNlcnZlZEF0dHJpYnV0ZXMnXSA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMpO1xuXG4gICAgcHJvdGVjdGVkIGdldCBuZ0VsZW1lbnRTdHJhdGVneSgpOiBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gICAgICAvLyBOT1RFOlxuICAgICAgLy8gU29tZSBwb2x5ZmlsbHMgKGUuZy4gYGRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnRgKSBkbyBub3QgY2FsbCB0aGUgY29uc3RydWN0b3IsIHRoZXJlZm9yZVxuICAgICAgLy8gaXQgaXMgbm90IHNhZmUgdG8gc2V0IGBuZ0VsZW1lbnRTdHJhdGVneWAgaW4gdGhlIGNvbnN0cnVjdG9yIGFuZCBhc3N1bWUgaXQgd2lsbCBiZVxuICAgICAgLy8gYXZhaWxhYmxlIGluc2lkZSB0aGUgbWV0aG9kcy5cbiAgICAgIC8vXG4gICAgICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IEFkZCBlMmUgdGVzdHMgdGhhdCBjb3ZlciBjYXNlcyB3aGVyZSB0aGUgY29uc3RydWN0b3IgaXNuJ3QgY2FsbGVkLiBGb3JcbiAgICAgIC8vIG5vdyB0aGlzIGlzIHRlc3RlZCB1c2luZyBhIEdvb2dsZSBpbnRlcm5hbCB0ZXN0IHN1aXRlLlxuICAgICAgaWYgKCF0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuX25nRWxlbWVudFN0cmF0ZWd5ID1cbiAgICAgICAgICAgIHN0cmF0ZWd5RmFjdG9yeS5jcmVhdGUodGhpcy5pbmplY3RvciB8fCBjb25maWcuaW5qZWN0b3IpO1xuXG4gICAgICAgIC8vIENvbGxlY3QgcHJlLWV4aXN0aW5nIHZhbHVlcyBvbiB0aGUgZWxlbWVudCB0byByZS1hcHBseSB0aHJvdWdoIHRoZSBzdHJhdGVneS5cbiAgICAgICAgY29uc3QgcHJlRXhpc3RpbmdWYWx1ZXMgPVxuICAgICAgICAgICAgaW5wdXRzLmZpbHRlcigoe3Byb3BOYW1lfSkgPT4gdGhpcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpLm1hcCgoe3Byb3BOYW1lfSk6IFtcbiAgICAgICAgICAgICAgc3RyaW5nLCBhbnlcbiAgICAgICAgICAgIF0gPT4gW3Byb3BOYW1lLCAodGhpcyBhcyBhbnkpW3Byb3BOYW1lXV0pO1xuXG4gICAgICAgIC8vIEluIHNvbWUgYnJvd3NlcnMgKGUuZy4gSUUxMCksIGBPYmplY3Quc2V0UHJvdG90eXBlT2YoKWAgKHdoaWNoIGlzIHJlcXVpcmVkIGJ5IHNvbWUgQ3VzdG9tXG4gICAgICAgIC8vIEVsZW1lbnRzIHBvbHlmaWxscykgaXMgbm90IGRlZmluZWQgYW5kIGlzIHRodXMgcG9seWZpbGxlZCBpbiBhIHdheSB0aGF0IGRvZXMgbm90IHByZXNlcnZlXG4gICAgICAgIC8vIHRoZSBwcm90b3R5cGUgY2hhaW4uIEluIHN1Y2ggY2FzZXMsIGB0aGlzYCB3aWxsIG5vdCBiZSBhbiBpbnN0YW5jZSBvZiBgTmdFbGVtZW50SW1wbGAgYW5kXG4gICAgICAgIC8vIHRodXMgbm90IGhhdmUgdGhlIGNvbXBvbmVudCBpbnB1dCBnZXR0ZXJzL3NldHRlcnMgZGVmaW5lZCBvbiBgTmdFbGVtZW50SW1wbC5wcm90b3R5cGVgLlxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTmdFbGVtZW50SW1wbCkpIHtcbiAgICAgICAgICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVycyB0byB0aGUgaW5zdGFuY2UgaXRzZWxmIGZvciBlYWNoIHByb3BlcnR5IGlucHV0LlxuICAgICAgICAgIGRlZmluZUlucHV0R2V0dGVyc1NldHRlcnMoaW5wdXRzLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBEZWxldGUgdGhlIHByb3BlcnR5IGZyb20gdGhlIGluc3RhbmNlLCBzbyB0aGF0IGl0IGNhbiBnbyB0aHJvdWdoIHRoZSBnZXR0ZXJzL3NldHRlcnNcbiAgICAgICAgICAvLyBzZXQgb24gYE5nRWxlbWVudEltcGwucHJvdG90eXBlYC5cbiAgICAgICAgICBwcmVFeGlzdGluZ1ZhbHVlcy5mb3JFYWNoKChbcHJvcE5hbWVdKSA9PiBkZWxldGUgKHRoaXMgYXMgYW55KVtwcm9wTmFtZV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmUtYXBwbHkgcHJlLWV4aXN0aW5nIHZhbHVlcyB0aHJvdWdoIHRoZSBzdHJhdGVneS5cbiAgICAgICAgcHJlRXhpc3RpbmdWYWx1ZXMuZm9yRWFjaCgoW3Byb3BOYW1lLCB2YWx1ZV0pID0+IHN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIHZhbHVlKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbmdFbGVtZW50U3RyYXRlZ3k/OiBOZ0VsZW1lbnRTdHJhdGVneTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaW5qZWN0b3I/OiBJbmplY3Rvcikge1xuICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soXG4gICAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICBjb25zdCBwcm9wTmFtZSA9IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHNbYXR0ck5hbWVdITtcbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgbmV3VmFsdWUpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgLy8gRm9yIGhpc3RvcmljYWwgcmVhc29ucywgc29tZSBzdHJhdGVnaWVzIG1heSBub3QgaGF2ZSBpbml0aWFsaXplZCB0aGUgYGV2ZW50c2AgcHJvcGVydHlcbiAgICAgIC8vIHVudGlsIGFmdGVyIGBjb25uZWN0KClgIGlzIHJ1bi4gU3Vic2NyaWJlIHRvIGBldmVudHNgIGlmIGl0IGlzIGF2YWlsYWJsZSBiZWZvcmUgcnVubmluZ1xuICAgICAgLy8gYGNvbm5lY3QoKWAgKGluIG9yZGVyIHRvIGNhcHR1cmUgZXZlbnRzIGVtaXR0ZWQgc3VyaW5nIGluaXR0aWFsaXphdGlvbiksIG90aGVyd2lzZVxuICAgICAgLy8gc3Vic2NyaWJlIGFmdGVyd2FyZHMuXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzogQ29uc2lkZXIgZGVwcmVjYXRpbmcvcmVtb3ZpbmcgdGhlIHBvc3QtY29ubmVjdCBzdWJzY3JpcHRpb24gaW4gYSBmdXR1cmUgbWFqb3IgdmVyc2lvblxuICAgICAgLy8gICAgICAgKGUuZy4gdjExKS5cblxuICAgICAgbGV0IHN1YnNjcmliZWRUb0V2ZW50cyA9IGZhbHNlO1xuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5ldmVudHMpIHtcbiAgICAgICAgLy8gYGV2ZW50c2AgYXJlIGFscmVhZHkgYXZhaWxhYmxlOiBTdWJzY3JpYmUgdG8gaXQgYXNhcC5cbiAgICAgICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgICAgICBzdWJzY3JpYmVkVG9FdmVudHMgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmNvbm5lY3QodGhpcyk7XG5cbiAgICAgIGlmICghc3Vic2NyaWJlZFRvRXZlbnRzKSB7XG4gICAgICAgIC8vIGBldmVudHNgIHdlcmUgbm90IGluaXRpYWxpemVkIGJlZm9yZSBydW5uaW5nIGBjb25uZWN0KClgOiBTdWJzY3JpYmUgdG8gdGhlbSBub3cuXG4gICAgICAgIC8vIFRoZSBldmVudHMgZW1pdHRlZCBkdXJpbmcgdGhlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbiBoYXZlIGJlZW4gbWlzc2VkLCBidXQgYXQgbGVhc3RcbiAgICAgICAgLy8gZnV0dXJlIGV2ZW50cyB3aWxsIGJlIGNhcHR1cmVkLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICAvLyBOb3QgdXNpbmcgYHRoaXMubmdFbGVtZW50U3RyYXRlZ3lgIHRvIGF2b2lkIHVubmVjZXNzYXJpbHkgY3JlYXRpbmcgdGhlIGBOZ0VsZW1lbnRTdHJhdGVneWAuXG4gICAgICBpZiAodGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3Vic2NyaWJlVG9FdmVudHMoKTogdm9pZCB7XG4gICAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIHRoZSBzdHJhdGVneSBhbmQgZGlzcGF0Y2ggdGhlbSBhcyBjdXN0b20gZXZlbnRzLlxuICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cy5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQodGhpcy5vd25lckRvY3VtZW50ISwgZS5uYW1lLCBlLnZhbHVlKTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFR5cGVTY3JpcHQgMy45KyBkZWZpbmVzIGdldHRlcnMvc2V0dGVycyBhcyBjb25maWd1cmFibGUgYnV0IG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgKGluXG4gIC8vIGNvbXBsaWFuY2Ugd2l0aCB0aGUgc3BlYykuIFRoaXMgYnJlYWtzIGVtdWxhdGVkIGluaGVyaXRhbmNlIGluIEVTNSBvbiBlbnZpcm9ubWVudHMgdGhhdCBkbyBub3RcbiAgLy8gbmF0aXZlbHkgc3VwcG9ydCBgT2JqZWN0LnNldFByb3RvdHlwZU9mKClgIChzdWNoIGFzIElFIDktMTApLlxuICAvLyBVcGRhdGUgdGhlIHByb3BlcnR5IGRlc2NyaXB0b3Igb2YgYE5nRWxlbWVudEltcGwjbmdFbGVtZW50U3RyYXRlZ3lgIHRvIG1ha2UgaXQgZW51bWVyYWJsZS5cbiAgLy8gVGhlIGJlbG93ICdjb25zdCcsIHNob3VsZG4ndCBiZSBuZWVkZWQgYnV0IGN1cnJlbnRseSB0aGlzIGJyZWFrcyBidWlsZC1vcHRpbWl6ZXJcbiAgLy8gQnVpbGQtb3B0aW1pemVyIGN1cnJlbnRseSB1c2VzIFR5cGVTY3JpcHQgMy42IHdoaWNoIGlzIHVuYWJsZSB0byByZXNvbHZlIGFuICdhY2Nlc3NvcidcbiAgLy8gaW4gJ2dldFR5cGVPZlZhcmlhYmxlT3JQYXJhbWV0ZXJPclByb3BlcnR5V29ya2VyJy5cbiAgY29uc3QgZ2V0dGVyTmFtZSA9ICduZ0VsZW1lbnRTdHJhdGVneSc7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOZ0VsZW1lbnRJbXBsLnByb3RvdHlwZSwgZ2V0dGVyTmFtZSwge2VudW1lcmFibGU6IHRydWV9KTtcblxuICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVycyB0byB0aGUgcHJvdG90eXBlIGZvciBlYWNoIHByb3BlcnR5IGlucHV0LlxuICBkZWZpbmVJbnB1dEdldHRlcnNTZXR0ZXJzKGlucHV0cywgTmdFbGVtZW50SW1wbC5wcm90b3R5cGUpO1xuXG4gIHJldHVybiAoTmdFbGVtZW50SW1wbCBhcyBhbnkpIGFzIE5nRWxlbWVudENvbnN0cnVjdG9yPFA+O1xufVxuXG4vLyBIZWxwZXJzXG5mdW5jdGlvbiBkZWZpbmVJbnB1dEdldHRlcnNTZXR0ZXJzKFxuICAgIGlucHV0czoge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdLCB0YXJnZXQ6IG9iamVjdCk6IHZvaWQge1xuICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVycyBmb3IgZWFjaCBwcm9wZXJ0eSBpbnB1dC5cbiAgaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZX0pID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wTmFtZSwge1xuICAgICAgZ2V0KCk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmdldElucHV0VmFsdWUocHJvcE5hbWUpO1xuICAgICAgfSxcbiAgICAgIHNldChuZXdWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgbmV3VmFsdWUpO1xuICAgICAgfSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgfSk7XG4gIH0pO1xufVxuIl19