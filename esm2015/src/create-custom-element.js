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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUF5Qm5HOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOztRQU1FOztXQUVHO1FBQ08sZ0NBQTJCLEdBQXNCLElBQUksQ0FBQztJQXNCbEUsQ0FBQztDQUFBO0FBZ0NEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFNBQW9CLEVBQUUsTUFBdUI7SUFDL0MsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5RCxNQUFNLGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFaEcsTUFBTSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RSxNQUFNLGFBQWMsU0FBUSxTQUFTO1FBNkNuQyxZQUE2QixRQUFtQjtZQUM5QyxLQUFLLEVBQUUsQ0FBQztZQURtQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBRWhELENBQUM7UUExQ0QsSUFBYyxpQkFBaUI7WUFDN0IsUUFBUTtZQUNSLDJGQUEyRjtZQUMzRixxRkFBcUY7WUFDckYsZ0NBQWdDO1lBQ2hDLEVBQUU7WUFDRiw2RkFBNkY7WUFDN0YseURBQXlEO1lBQ3pE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LENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFDRCxZQUFZLEVBQUUsSUFBSTtZQUNsQixVQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RvciwgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7Q29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudC1mYWN0b3J5LXN0cmF0ZWd5JztcbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7Y3JlYXRlQ3VzdG9tRXZlbnQsIGdldENvbXBvbmVudElucHV0cywgZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFByb3RvdHlwZSBmb3IgYSBjbGFzcyBjb25zdHJ1Y3RvciBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudFxuICogdGhhdCBjYW4gYmUgdXNlZCBmb3IgY3VzdG9tIGVsZW1lbnQgcmVnaXN0cmF0aW9uLiBJbXBsZW1lbnRlZCBhbmQgcmV0dXJuZWRcbiAqIGJ5IHRoZSB7QGxpbmsgY3JlYXRlQ3VzdG9tRWxlbWVudCBjcmVhdGVDdXN0b21FbGVtZW50KCkgZnVuY3Rpb259LlxuICpcbiAqIEBzZWUgW0FuZ3VsYXIgRWxlbWVudHMgT3ZlcnZpZXddKGd1aWRlL2VsZW1lbnRzIFwiVHVybmluZyBBbmd1bGFyIGNvbXBvbmVudHMgaW50byBjdXN0b20gZWxlbWVudHNcIilcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2Ygb2JzZXJ2ZWQgYXR0cmlidXRlIG5hbWVzIGZvciB0aGUgY3VzdG9tIGVsZW1lbnQsXG4gICAqIGRlcml2ZWQgYnkgdHJhbnNmb3JtaW5nIGlucHV0IHByb3BlcnR5IG5hbWVzIGZyb20gdGhlIHNvdXJjZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSBvYnNlcnZlZEF0dHJpYnV0ZXM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIGNvbnN0cnVjdG9yIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gaW5qZWN0b3IgSWYgcHJvdmlkZWQsIG92ZXJyaWRlcyB0aGUgY29uZmlndXJlZCBpbmplY3Rvci5cbiAgICovXG4gIG5ldyhpbmplY3Rvcj86IEluamVjdG9yKTogTmdFbGVtZW50JldpdGhQcm9wZXJ0aWVzPFA+O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciBhIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgLyoqXG4gICAqIFRoZSBzdHJhdGVneSB0aGF0IGNvbnRyb2xzIGhvdyBhIGNvbXBvbmVudCBpcyB0cmFuc2Zvcm1lZCBpbiBhIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRTdHJhdGVneSE6IE5nRWxlbWVudFN0cmF0ZWd5O1xuICAvKipcbiAgICogQSBzdWJzY3JpcHRpb24gdG8gY2hhbmdlLCBjb25uZWN0LCBhbmQgZGlzY29ubmVjdCBldmVudHMgaW4gdGhlIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIG5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIGEgY2hhbmdlIGluIGFuIG9ic2VydmVkIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdGhhdCBoYXMgY2hhbmdlZC5cbiAgICogQHBhcmFtIG9sZFZhbHVlIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgaW4gd2hpY2ggdGhlIGF0dHJpYnV0ZSBpcyBkZWZpbmVkLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgICAgYXR0ck5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZ3xudWxsLCBuZXdWYWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkO1xuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byB0aGUgaW5zZXJ0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGRlbGV0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBmcm9tIHRoZSBET00uXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkO1xufVxuXG4vKipcbiAqIEFkZGl0aW9uYWwgdHlwZSBpbmZvcm1hdGlvbiB0aGF0IGNhbiBiZSBhZGRlZCB0byB0aGUgTmdFbGVtZW50IGNsYXNzLFxuICogZm9yIHByb3BlcnRpZXMgdGhhdCBhcmUgYWRkZWQgYmFzZWRcbiAqIG9uIHRoZSBpbnB1dHMgYW5kIG1ldGhvZHMgb2YgdGhlIHVuZGVybHlpbmcgY29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgV2l0aFByb3BlcnRpZXM8UD4gPSB7XG4gIFtwcm9wZXJ0eSBpbiBrZXlvZiBQXTogUFtwcm9wZXJ0eV1cbn07XG5cbi8qKlxuICogQSBjb25maWd1cmF0aW9uIHRoYXQgaW5pdGlhbGl6ZXMgYW4gTmdFbGVtZW50Q29uc3RydWN0b3Igd2l0aCB0aGVcbiAqIGRlcGVuZGVuY2llcyBhbmQgc3RyYXRlZ3kgaXQgbmVlZHMgdG8gdHJhbnNmb3JtIGEgY29tcG9uZW50IGludG9cbiAqIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgaW5qZWN0b3IgdG8gdXNlIGZvciByZXRyaWV2aW5nIHRoZSBjb21wb25lbnQncyBmYWN0b3J5LlxuICAgKi9cbiAgaW5qZWN0b3I6IEluamVjdG9yO1xuICAvKipcbiAgICogQW4gb3B0aW9uYWwgY3VzdG9tIHN0cmF0ZWd5IGZhY3RvcnkgdG8gdXNlIGluc3RlYWQgb2YgdGhlIGRlZmF1bHQuXG4gICAqIFRoZSBzdHJhdGVneSBjb250cm9scyBob3cgdGhlIHRyYW5zZm9ybWF0aW9uIGlzIHBlcmZvcm1lZC5cbiAgICovXG4gIHN0cmF0ZWd5RmFjdG9yeT86IE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeTtcbn1cblxuLyoqXG4gKiAgQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBjdXN0b20gZWxlbWVudCBjbGFzcyBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudC5cbiAqXG4gKiBCdWlsZHMgYSBjbGFzcyB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgcHJvdmlkZWQgY29tcG9uZW50IGFuZFxuICogdXNlcyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiB0byBwcm92aWRlIG1vcmUgY29udGV4dCB0byB0aGUgY2xhc3MuXG4gKiBUYWtlcyB0aGUgY29tcG9uZW50IGZhY3RvcnkncyBpbnB1dHMgYW5kIG91dHB1dHMgdG8gY29udmVydCB0aGVtIHRvIHRoZSBwcm9wZXJcbiAqIGN1c3RvbSBlbGVtZW50IEFQSSBhbmQgYWRkIGhvb2tzIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogVGhlIGNvbmZpZ3VyYXRpb24ncyBpbmplY3RvciBpcyB0aGUgaW5pdGlhbCBpbmplY3RvciBzZXQgb24gdGhlIGNsYXNzLFxuICogYW5kIHVzZWQgYnkgZGVmYXVsdCBmb3IgZWFjaCBjcmVhdGVkIGluc3RhbmNlLlRoaXMgYmVoYXZpb3IgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCB0aGVcbiAqIHN0YXRpYyBwcm9wZXJ0eSB0byBhZmZlY3QgYWxsIG5ld2x5IGNyZWF0ZWQgaW5zdGFuY2VzLCBvciBhcyBhIGNvbnN0cnVjdG9yIGFyZ3VtZW50IGZvclxuICogb25lLW9mZiBjcmVhdGlvbnMuXG4gKlxuICogQHNlZSBbQW5ndWxhciBFbGVtZW50cyBPdmVydmlld10oZ3VpZGUvZWxlbWVudHMgXCJUdXJuaW5nIEFuZ3VsYXIgY29tcG9uZW50cyBpbnRvIGN1c3RvbSBlbGVtZW50c1wiKVxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0byB0cmFuc2Zvcm0uXG4gKiBAcGFyYW0gY29uZmlnIEEgY29uZmlndXJhdGlvbiB0aGF0IHByb3ZpZGVzIGluaXRpYWxpemF0aW9uIGluZm9ybWF0aW9uIHRvIHRoZSBjcmVhdGVkIGNsYXNzLlxuICogQHJldHVybnMgVGhlIGN1c3RvbS1lbGVtZW50IGNvbnN0cnVjdGlvbiBjbGFzcywgd2hpY2ggY2FuIGJlIHJlZ2lzdGVyZWQgd2l0aFxuICogYSBicm93c2VyJ3MgYEN1c3RvbUVsZW1lbnRSZWdpc3RyeWAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRWxlbWVudDxQPihcbiAgICBjb21wb25lbnQ6IFR5cGU8YW55PiwgY29uZmlnOiBOZ0VsZW1lbnRDb25maWcpOiBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPiB7XG4gIGNvbnN0IGlucHV0cyA9IGdldENvbXBvbmVudElucHV0cyhjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3Qgc3RyYXRlZ3lGYWN0b3J5ID1cbiAgICAgIGNvbmZpZy5zdHJhdGVneUZhY3RvcnkgfHwgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeShjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyA9IGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKGlucHV0cyk7XG5cbiAgY2xhc3MgTmdFbGVtZW50SW1wbCBleHRlbmRzIE5nRWxlbWVudCB7XG4gICAgLy8gV29yayBhcm91bmQgYSBidWcgaW4gY2xvc3VyZSB0eXBlZCBvcHRpbWl6YXRpb25zKGIvNzk1NTc0ODcpIHdoZXJlIGl0IGlzIG5vdCBob25vcmluZyBzdGF0aWNcbiAgICAvLyBmaWVsZCBleHRlcm5zLiBTbyB1c2luZyBxdW90ZWQgYWNjZXNzIHRvIGV4cGxpY2l0bHkgcHJldmVudCByZW5hbWluZy5cbiAgICBzdGF0aWMgcmVhZG9ubHlbJ29ic2VydmVkQXR0cmlidXRlcyddID0gT2JqZWN0LmtleXMoYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyk7XG5cbiAgICBwcm90ZWN0ZWQgZ2V0IG5nRWxlbWVudFN0cmF0ZWd5KCk6IE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgICAgIC8vIE5PVEU6XG4gICAgICAvLyBTb21lIHBvbHlmaWxscyAoZS5nLiBgZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudGApIGRvIG5vdCBjYWxsIHRoZSBjb25zdHJ1Y3RvciwgdGhlcmVmb3JlXG4gICAgICAvLyBpdCBpcyBub3Qgc2FmZSB0byBzZXQgYG5nRWxlbWVudFN0cmF0ZWd5YCBpbiB0aGUgY29uc3RydWN0b3IgYW5kIGFzc3VtZSBpdCB3aWxsIGJlXG4gICAgICAvLyBhdmFpbGFibGUgaW5zaWRlIHRoZSBtZXRob2RzLlxuICAgICAgLy9cbiAgICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogQWRkIGUyZSB0ZXN0cyB0aGF0IGNvdmVyIGNhc2VzIHdoZXJlIHRoZSBjb25zdHJ1Y3RvciBpc24ndCBjYWxsZWQuIEZvclxuICAgICAgLy8gbm93IHRoaXMgaXMgdGVzdGVkIHVzaW5nIGEgR29vZ2xlIGludGVybmFsIHRlc3Qgc3VpdGUuXG4gICAgICBpZiAoIXRoaXMuX25nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5fbmdFbGVtZW50U3RyYXRlZ3kgPVxuICAgICAgICAgICAgc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZSh0aGlzLmluamVjdG9yIHx8IGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgICAgICAgLy8gQ29sbGVjdCBwcmUtZXhpc3RpbmcgdmFsdWVzIG9uIHRoZSBlbGVtZW50IHRvIHJlLWFwcGx5IHRocm91Z2ggdGhlIHN0cmF0ZWd5LlxuICAgICAgICBjb25zdCBwcmVFeGlzdGluZ1ZhbHVlcyA9XG4gICAgICAgICAgICBpbnB1dHMuZmlsdGVyKCh7cHJvcE5hbWV9KSA9PiB0aGlzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkubWFwKCh7cHJvcE5hbWV9KTogW1xuICAgICAgICAgICAgICBzdHJpbmcsIGFueVxuICAgICAgICAgICAgXSA9PiBbcHJvcE5hbWUsICh0aGlzIGFzIGFueSlbcHJvcE5hbWVdXSk7XG5cbiAgICAgICAgLy8gSW4gc29tZSBicm93c2VycyAoZS5nLiBJRTEwKSwgYE9iamVjdC5zZXRQcm90b3R5cGVPZigpYCAod2hpY2ggaXMgcmVxdWlyZWQgYnkgc29tZSBDdXN0b21cbiAgICAgICAgLy8gRWxlbWVudHMgcG9seWZpbGxzKSBpcyBub3QgZGVmaW5lZCBhbmQgaXMgdGh1cyBwb2x5ZmlsbGVkIGluIGEgd2F5IHRoYXQgZG9lcyBub3QgcHJlc2VydmVcbiAgICAgICAgLy8gdGhlIHByb3RvdHlwZSBjaGFpbi4gSW4gc3VjaCBjYXNlcywgYHRoaXNgIHdpbGwgbm90IGJlIGFuIGluc3RhbmNlIG9mIGBOZ0VsZW1lbnRJbXBsYCBhbmRcbiAgICAgICAgLy8gdGh1cyBub3QgaGF2ZSB0aGUgY29tcG9uZW50IGlucHV0IGdldHRlcnMvc2V0dGVycyBkZWZpbmVkIG9uIGBOZ0VsZW1lbnRJbXBsLnByb3RvdHlwZWAuXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBOZ0VsZW1lbnRJbXBsKSkge1xuICAgICAgICAgIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzIHRvIHRoZSBpbnN0YW5jZSBpdHNlbGYgZm9yIGVhY2ggcHJvcGVydHkgaW5wdXQuXG4gICAgICAgICAgZGVmaW5lSW5wdXRHZXR0ZXJzU2V0dGVycyhpbnB1dHMsIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIERlbGV0ZSB0aGUgcHJvcGVydHkgZnJvbSB0aGUgaW5zdGFuY2UsIHNvIHRoYXQgaXQgY2FuIGdvIHRocm91Z2ggdGhlIGdldHRlcnMvc2V0dGVyc1xuICAgICAgICAgIC8vIHNldCBvbiBgTmdFbGVtZW50SW1wbC5wcm90b3R5cGVgLlxuICAgICAgICAgIHByZUV4aXN0aW5nVmFsdWVzLmZvckVhY2goKFtwcm9wTmFtZV0pID0+IGRlbGV0ZSAodGhpcyBhcyBhbnkpW3Byb3BOYW1lXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZS1hcHBseSBwcmUtZXhpc3RpbmcgdmFsdWVzIHRocm91Z2ggdGhlIHN0cmF0ZWd5LlxuICAgICAgICBwcmVFeGlzdGluZ1ZhbHVlcy5mb3JFYWNoKChbcHJvcE5hbWUsIHZhbHVlXSkgPT4gc3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgdmFsdWUpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX25nRWxlbWVudFN0cmF0ZWd5ITtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9uZ0VsZW1lbnRTdHJhdGVneT86IE5nRWxlbWVudFN0cmF0ZWd5O1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBpbmplY3Rvcj86IEluamVjdG9yKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgICAgYXR0ck5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZ3xudWxsLCBuZXdWYWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGNvbnN0IHByb3BOYW1lID0gYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c1thdHRyTmFtZV0hO1xuICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBuZXdWYWx1ZSk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICAvLyBGb3IgaGlzdG9yaWNhbCByZWFzb25zLCBzb21lIHN0cmF0ZWdpZXMgbWF5IG5vdCBoYXZlIGluaXRpYWxpemVkIHRoZSBgZXZlbnRzYCBwcm9wZXJ0eVxuICAgICAgLy8gdW50aWwgYWZ0ZXIgYGNvbm5lY3QoKWAgaXMgcnVuLiBTdWJzY3JpYmUgdG8gYGV2ZW50c2AgaWYgaXQgaXMgYXZhaWxhYmxlIGJlZm9yZSBydW5uaW5nXG4gICAgICAvLyBgY29ubmVjdCgpYCAoaW4gb3JkZXIgdG8gY2FwdHVyZSBldmVudHMgZW1pdHRlZCBzdXJpbmcgaW5pdHRpYWxpemF0aW9uKSwgb3RoZXJ3aXNlXG4gICAgICAvLyBzdWJzY3JpYmUgYWZ0ZXJ3YXJkcy5cbiAgICAgIC8vXG4gICAgICAvLyBUT0RPOiBDb25zaWRlciBkZXByZWNhdGluZy9yZW1vdmluZyB0aGUgcG9zdC1jb25uZWN0IHN1YnNjcmlwdGlvbiBpbiBhIGZ1dHVyZSBtYWpvciB2ZXJzaW9uXG4gICAgICAvLyAgICAgICAoZS5nLiB2MTEpLlxuXG4gICAgICBsZXQgc3Vic2NyaWJlZFRvRXZlbnRzID0gZmFsc2U7XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cykge1xuICAgICAgICAvLyBgZXZlbnRzYCBhcmUgYWxyZWFkeSBhdmFpbGFibGU6IFN1YnNjcmliZSB0byBpdCBhc2FwLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgICAgIHN1YnNjcmliZWRUb0V2ZW50cyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuY29ubmVjdCh0aGlzKTtcblxuICAgICAgaWYgKCFzdWJzY3JpYmVkVG9FdmVudHMpIHtcbiAgICAgICAgLy8gYGV2ZW50c2Agd2VyZSBub3QgaW5pdGlhbGl6ZWQgYmVmb3JlIHJ1bm5pbmcgYGNvbm5lY3QoKWA6IFN1YnNjcmliZSB0byB0aGVtIG5vdy5cbiAgICAgICAgLy8gVGhlIGV2ZW50cyBlbWl0dGVkIGR1cmluZyB0aGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uIGhhdmUgYmVlbiBtaXNzZWQsIGJ1dCBhdCBsZWFzdFxuICAgICAgICAvLyBmdXR1cmUgZXZlbnRzIHdpbGwgYmUgY2FwdHVyZWQuXG4gICAgICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIC8vIE5vdCB1c2luZyBgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneWAgdG8gYXZvaWQgdW5uZWNlc3NhcmlseSBjcmVhdGluZyB0aGUgYE5nRWxlbWVudFN0cmF0ZWd5YC5cbiAgICAgIGlmICh0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneS5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdWJzY3JpYmVUb0V2ZW50cygpOiB2b2lkIHtcbiAgICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gdGhlIHN0cmF0ZWd5IGFuZCBkaXNwYXRjaCB0aGVtIGFzIGN1c3RvbSBldmVudHMuXG4gICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZXZlbnRzLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudCh0aGlzLm93bmVyRG9jdW1lbnQhLCBlLm5hbWUsIGUudmFsdWUpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVHlwZVNjcmlwdCAzLjkrIGRlZmluZXMgZ2V0dGVycy9zZXR0ZXJzIGFzIGNvbmZpZ3VyYWJsZSBidXQgbm9uLWVudW1lcmFibGUgcHJvcGVydGllcyAoaW5cbiAgLy8gY29tcGxpYW5jZSB3aXRoIHRoZSBzcGVjKS4gVGhpcyBicmVha3MgZW11bGF0ZWQgaW5oZXJpdGFuY2UgaW4gRVM1IG9uIGVudmlyb25tZW50cyB0aGF0IGRvIG5vdFxuICAvLyBuYXRpdmVseSBzdXBwb3J0IGBPYmplY3Quc2V0UHJvdG90eXBlT2YoKWAgKHN1Y2ggYXMgSUUgOS0xMCkuXG4gIC8vIFVwZGF0ZSB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBvZiBgTmdFbGVtZW50SW1wbCNuZ0VsZW1lbnRTdHJhdGVneWAgdG8gbWFrZSBpdCBlbnVtZXJhYmxlLlxuICAvLyBUaGUgYmVsb3cgJ2NvbnN0Jywgc2hvdWxkbid0IGJlIG5lZWRlZCBidXQgY3VycmVudGx5IHRoaXMgYnJlYWtzIGJ1aWxkLW9wdGltaXplclxuICAvLyBCdWlsZC1vcHRpbWl6ZXIgY3VycmVudGx5IHVzZXMgVHlwZVNjcmlwdCAzLjYgd2hpY2ggaXMgdW5hYmxlIHRvIHJlc29sdmUgYW4gJ2FjY2Vzc29yJ1xuICAvLyBpbiAnZ2V0VHlwZU9mVmFyaWFibGVPclBhcmFtZXRlck9yUHJvcGVydHlXb3JrZXInLlxuICBjb25zdCBnZXR0ZXJOYW1lID0gJ25nRWxlbWVudFN0cmF0ZWd5JztcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE5nRWxlbWVudEltcGwucHJvdG90eXBlLCBnZXR0ZXJOYW1lLCB7ZW51bWVyYWJsZTogdHJ1ZX0pO1xuXG4gIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzIHRvIHRoZSBwcm90b3R5cGUgZm9yIGVhY2ggcHJvcGVydHkgaW5wdXQuXG4gIGRlZmluZUlucHV0R2V0dGVyc1NldHRlcnMoaW5wdXRzLCBOZ0VsZW1lbnRJbXBsLnByb3RvdHlwZSk7XG5cbiAgcmV0dXJuIChOZ0VsZW1lbnRJbXBsIGFzIGFueSkgYXMgTmdFbGVtZW50Q29uc3RydWN0b3I8UD47XG59XG5cbi8vIEhlbHBlcnNcbmZ1bmN0aW9uIGRlZmluZUlucHV0R2V0dGVyc1NldHRlcnMoXG4gICAgaW5wdXRzOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10sIHRhcmdldDogb2JqZWN0KTogdm9pZCB7XG4gIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzIGZvciBlYWNoIHByb3BlcnR5IGlucHV0LlxuICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lfSkgPT4ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BOYW1lLCB7XG4gICAgICBnZXQoKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZ2V0SW5wdXRWYWx1ZShwcm9wTmFtZSk7XG4gICAgICB9LFxuICAgICAgc2V0KG5ld1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBuZXdWYWx1ZSk7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB9KTtcbiAgfSk7XG59XG4iXX0=