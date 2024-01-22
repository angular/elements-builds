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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUF5QmhGOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOztRQUtFOztXQUVHO1FBQ08sZ0NBQTJCLEdBQXdCLElBQUksQ0FBQztJQTBCcEUsQ0FBQztDQUFBO0FBZ0NEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQ2pDLFNBQW9CLEVBQ3BCLE1BQXVCO0lBRXZCLE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFOUQsTUFBTSxlQUFlLEdBQ25CLE1BQU0sQ0FBQyxlQUFlLElBQUksSUFBSSxpQ0FBaUMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTlGLE1BQU0seUJBQXlCLEdBQUcsbUNBQW1DLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUUsTUFBTSxhQUFjLFNBQVEsU0FBUztRQUNuQywrRkFBK0Y7UUFDL0Ysd0VBQXdFO2lCQUN4RCxLQUFDLG9CQUFvQixDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBRWhGLElBQXVCLGlCQUFpQjtZQUN0Qyw2RkFBNkY7WUFDN0YseURBQXlEO1lBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxRQUFR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Q0wsQ0FBQzs7SUFHSCxvRUFBb0U7SUFDcEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFFLFNBQVMsRUFBQyxFQUFFLEVBQUU7UUFDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRTtZQUN2RCxHQUFHO2dCQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsR0FBRyxDQUFDLFFBQWE7Z0JBQ2YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFDRCxZQUFZLEVBQUUsSUFBSTtZQUNsQixVQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sYUFBK0MsQ0FBQztBQUN6RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3IsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0NvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9jb21wb25lbnQtZmFjdG9yeS1zdHJhdGVneSc7XG5pbXBvcnQge05nRWxlbWVudFN0cmF0ZWd5LCBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2dldENvbXBvbmVudElucHV0cywgZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFByb3RvdHlwZSBmb3IgYSBjbGFzcyBjb25zdHJ1Y3RvciBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudFxuICogdGhhdCBjYW4gYmUgdXNlZCBmb3IgY3VzdG9tIGVsZW1lbnQgcmVnaXN0cmF0aW9uLiBJbXBsZW1lbnRlZCBhbmQgcmV0dXJuZWRcbiAqIGJ5IHRoZSB7QGxpbmsgY3JlYXRlQ3VzdG9tRWxlbWVudCBjcmVhdGVDdXN0b21FbGVtZW50KCkgZnVuY3Rpb259LlxuICpcbiAqIEBzZWUgW0FuZ3VsYXIgRWxlbWVudHMgT3ZlcnZpZXddKGd1aWRlL2VsZW1lbnRzIFwiVHVybmluZyBBbmd1bGFyIGNvbXBvbmVudHMgaW50byBjdXN0b20gZWxlbWVudHNcIilcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2Ygb2JzZXJ2ZWQgYXR0cmlidXRlIG5hbWVzIGZvciB0aGUgY3VzdG9tIGVsZW1lbnQsXG4gICAqIGRlcml2ZWQgYnkgdHJhbnNmb3JtaW5nIGlucHV0IHByb3BlcnR5IG5hbWVzIGZyb20gdGhlIHNvdXJjZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSBvYnNlcnZlZEF0dHJpYnV0ZXM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIGNvbnN0cnVjdG9yIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gaW5qZWN0b3IgSWYgcHJvdmlkZWQsIG92ZXJyaWRlcyB0aGUgY29uZmlndXJlZCBpbmplY3Rvci5cbiAgICovXG4gIG5ldyAoaW5qZWN0b3I/OiBJbmplY3Rvcik6IE5nRWxlbWVudCAmIFdpdGhQcm9wZXJ0aWVzPFA+O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciBhIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgLyoqXG4gICAqIFRoZSBzdHJhdGVneSB0aGF0IGNvbnRyb2xzIGhvdyBhIGNvbXBvbmVudCBpcyB0cmFuc2Zvcm1lZCBpbiBhIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IG5nRWxlbWVudFN0cmF0ZWd5OiBOZ0VsZW1lbnRTdHJhdGVneTtcbiAgLyoqXG4gICAqIEEgc3Vic2NyaXB0aW9uIHRvIGNoYW5nZSwgY29ubmVjdCwgYW5kIGRpc2Nvbm5lY3QgZXZlbnRzIGluIHRoZSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIGEgY2hhbmdlIGluIGFuIG9ic2VydmVkIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdGhhdCBoYXMgY2hhbmdlZC5cbiAgICogQHBhcmFtIG9sZFZhbHVlIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgaW4gd2hpY2ggdGhlIGF0dHJpYnV0ZSBpcyBkZWZpbmVkLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgIGF0dHJOYW1lOiBzdHJpbmcsXG4gICAgb2xkVmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgbmV3VmFsdWU6IHN0cmluZyxcbiAgICBuYW1lc3BhY2U/OiBzdHJpbmcsXG4gICk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBpbnNlcnRpb24gb2YgdGhlIGN1c3RvbSBlbGVtZW50IGluIHRoZSBET00uXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkO1xuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byB0aGUgZGVsZXRpb24gb2YgdGhlIGN1c3RvbSBlbGVtZW50IGZyb20gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGRpc2Nvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQWRkaXRpb25hbCB0eXBlIGluZm9ybWF0aW9uIHRoYXQgY2FuIGJlIGFkZGVkIHRvIHRoZSBOZ0VsZW1lbnQgY2xhc3MsXG4gKiBmb3IgcHJvcGVydGllcyB0aGF0IGFyZSBhZGRlZCBiYXNlZFxuICogb24gdGhlIGlucHV0cyBhbmQgbWV0aG9kcyBvZiB0aGUgdW5kZXJseWluZyBjb21wb25lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBXaXRoUHJvcGVydGllczxQPiA9IHtcbiAgW3Byb3BlcnR5IGluIGtleW9mIFBdOiBQW3Byb3BlcnR5XTtcbn07XG5cbi8qKlxuICogQSBjb25maWd1cmF0aW9uIHRoYXQgaW5pdGlhbGl6ZXMgYW4gTmdFbGVtZW50Q29uc3RydWN0b3Igd2l0aCB0aGVcbiAqIGRlcGVuZGVuY2llcyBhbmQgc3RyYXRlZ3kgaXQgbmVlZHMgdG8gdHJhbnNmb3JtIGEgY29tcG9uZW50IGludG9cbiAqIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgaW5qZWN0b3IgdG8gdXNlIGZvciByZXRyaWV2aW5nIHRoZSBjb21wb25lbnQncyBmYWN0b3J5LlxuICAgKi9cbiAgaW5qZWN0b3I6IEluamVjdG9yO1xuICAvKipcbiAgICogQW4gb3B0aW9uYWwgY3VzdG9tIHN0cmF0ZWd5IGZhY3RvcnkgdG8gdXNlIGluc3RlYWQgb2YgdGhlIGRlZmF1bHQuXG4gICAqIFRoZSBzdHJhdGVneSBjb250cm9scyBob3cgdGhlIHRyYW5zZm9ybWF0aW9uIGlzIHBlcmZvcm1lZC5cbiAgICovXG4gIHN0cmF0ZWd5RmFjdG9yeT86IE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeTtcbn1cblxuLyoqXG4gKiAgQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBjdXN0b20gZWxlbWVudCBjbGFzcyBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudC5cbiAqXG4gKiBCdWlsZHMgYSBjbGFzcyB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgcHJvdmlkZWQgY29tcG9uZW50IGFuZFxuICogdXNlcyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiB0byBwcm92aWRlIG1vcmUgY29udGV4dCB0byB0aGUgY2xhc3MuXG4gKiBUYWtlcyB0aGUgY29tcG9uZW50IGZhY3RvcnkncyBpbnB1dHMgYW5kIG91dHB1dHMgdG8gY29udmVydCB0aGVtIHRvIHRoZSBwcm9wZXJcbiAqIGN1c3RvbSBlbGVtZW50IEFQSSBhbmQgYWRkIGhvb2tzIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogVGhlIGNvbmZpZ3VyYXRpb24ncyBpbmplY3RvciBpcyB0aGUgaW5pdGlhbCBpbmplY3RvciBzZXQgb24gdGhlIGNsYXNzLFxuICogYW5kIHVzZWQgYnkgZGVmYXVsdCBmb3IgZWFjaCBjcmVhdGVkIGluc3RhbmNlLlRoaXMgYmVoYXZpb3IgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCB0aGVcbiAqIHN0YXRpYyBwcm9wZXJ0eSB0byBhZmZlY3QgYWxsIG5ld2x5IGNyZWF0ZWQgaW5zdGFuY2VzLCBvciBhcyBhIGNvbnN0cnVjdG9yIGFyZ3VtZW50IGZvclxuICogb25lLW9mZiBjcmVhdGlvbnMuXG4gKlxuICogQHNlZSBbQW5ndWxhciBFbGVtZW50cyBPdmVydmlld10oZ3VpZGUvZWxlbWVudHMgXCJUdXJuaW5nIEFuZ3VsYXIgY29tcG9uZW50cyBpbnRvIGN1c3RvbSBlbGVtZW50c1wiKVxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0byB0cmFuc2Zvcm0uXG4gKiBAcGFyYW0gY29uZmlnIEEgY29uZmlndXJhdGlvbiB0aGF0IHByb3ZpZGVzIGluaXRpYWxpemF0aW9uIGluZm9ybWF0aW9uIHRvIHRoZSBjcmVhdGVkIGNsYXNzLlxuICogQHJldHVybnMgVGhlIGN1c3RvbS1lbGVtZW50IGNvbnN0cnVjdGlvbiBjbGFzcywgd2hpY2ggY2FuIGJlIHJlZ2lzdGVyZWQgd2l0aFxuICogYSBicm93c2VyJ3MgYEN1c3RvbUVsZW1lbnRSZWdpc3RyeWAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRWxlbWVudDxQPihcbiAgY29tcG9uZW50OiBUeXBlPGFueT4sXG4gIGNvbmZpZzogTmdFbGVtZW50Q29uZmlnLFxuKTogTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICBjb25zdCBpbnB1dHMgPSBnZXRDb21wb25lbnRJbnB1dHMoY29tcG9uZW50LCBjb25maWcuaW5qZWN0b3IpO1xuXG4gIGNvbnN0IHN0cmF0ZWd5RmFjdG9yeSA9XG4gICAgY29uZmlnLnN0cmF0ZWd5RmFjdG9yeSB8fCBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5KGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzID0gZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMoaW5wdXRzKTtcblxuICBjbGFzcyBOZ0VsZW1lbnRJbXBsIGV4dGVuZHMgTmdFbGVtZW50IHtcbiAgICAvLyBXb3JrIGFyb3VuZCBhIGJ1ZyBpbiBjbG9zdXJlIHR5cGVkIG9wdGltaXphdGlvbnMoYi83OTU1NzQ4Nykgd2hlcmUgaXQgaXMgbm90IGhvbm9yaW5nIHN0YXRpY1xuICAgIC8vIGZpZWxkIGV4dGVybnMuIFNvIHVzaW5nIHF1b3RlZCBhY2Nlc3MgdG8gZXhwbGljaXRseSBwcmV2ZW50IHJlbmFtaW5nLlxuICAgIHN0YXRpYyByZWFkb25seSBbJ29ic2VydmVkQXR0cmlidXRlcyddID0gT2JqZWN0LmtleXMoYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyk7XG5cbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgZ2V0IG5nRWxlbWVudFN0cmF0ZWd5KCk6IE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogQWRkIGUyZSB0ZXN0cyB0aGF0IGNvdmVyIGNhc2VzIHdoZXJlIHRoZSBjb25zdHJ1Y3RvciBpc24ndCBjYWxsZWQuIEZvclxuICAgICAgLy8gbm93IHRoaXMgaXMgdGVzdGVkIHVzaW5nIGEgR29vZ2xlIGludGVybmFsIHRlc3Qgc3VpdGUuXG4gICAgICBpZiAoIXRoaXMuX25nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIGNvbnN0IHN0cmF0ZWd5ID0gKHRoaXMuX25nRWxlbWVudFN0cmF0ZWd5ID0gc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZShcbiAgICAgICAgICB0aGlzLmluamVjdG9yIHx8IGNvbmZpZy5pbmplY3RvcixcbiAgICAgICAgKSk7XG5cbiAgICAgICAgLy8gUmUtYXBwbHkgcHJlLWV4aXN0aW5nIGlucHV0IHZhbHVlcyAoc2V0IGFzIHByb3BlcnRpZXMgb24gdGhlIGVsZW1lbnQpIHRocm91Z2ggdGhlXG4gICAgICAgIC8vIHN0cmF0ZWd5LlxuICAgICAgICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lLCB0cmFuc2Zvcm19KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgLy8gTm8gcHJlLWV4aXN0aW5nIHZhbHVlIGZvciBgcHJvcE5hbWVgLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERlbGV0ZSB0aGUgcHJvcGVydHkgZnJvbSB0aGUgaW5zdGFuY2UgYW5kIHJlLWFwcGx5IGl0IHRocm91Z2ggdGhlIHN0cmF0ZWd5LlxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gKHRoaXMgYXMgYW55KVtwcm9wTmFtZV07XG4gICAgICAgICAgZGVsZXRlICh0aGlzIGFzIGFueSlbcHJvcE5hbWVdO1xuICAgICAgICAgIHN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIHZhbHVlLCB0cmFuc2Zvcm0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX25nRWxlbWVudFN0cmF0ZWd5ITtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9uZ0VsZW1lbnRTdHJhdGVneT86IE5nRWxlbWVudFN0cmF0ZWd5O1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBpbmplY3Rvcj86IEluamVjdG9yKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIG92ZXJyaWRlIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgIGF0dHJOYW1lOiBzdHJpbmcsXG4gICAgICBvbGRWYWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICAgIG5ld1ZhbHVlOiBzdHJpbmcsXG4gICAgICBuYW1lc3BhY2U/OiBzdHJpbmcsXG4gICAgKTogdm9pZCB7XG4gICAgICBjb25zdCBbcHJvcE5hbWUsIHRyYW5zZm9ybV0gPSBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzW2F0dHJOYW1lXSE7XG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIG5ld1ZhbHVlLCB0cmFuc2Zvcm0pO1xuICAgIH1cblxuICAgIG92ZXJyaWRlIGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgLy8gRm9yIGhpc3RvcmljYWwgcmVhc29ucywgc29tZSBzdHJhdGVnaWVzIG1heSBub3QgaGF2ZSBpbml0aWFsaXplZCB0aGUgYGV2ZW50c2AgcHJvcGVydHlcbiAgICAgIC8vIHVudGlsIGFmdGVyIGBjb25uZWN0KClgIGlzIHJ1bi4gU3Vic2NyaWJlIHRvIGBldmVudHNgIGlmIGl0IGlzIGF2YWlsYWJsZSBiZWZvcmUgcnVubmluZ1xuICAgICAgLy8gYGNvbm5lY3QoKWAgKGluIG9yZGVyIHRvIGNhcHR1cmUgZXZlbnRzIGVtaXR0ZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uKSwgb3RoZXJ3aXNlIHN1YnNjcmliZVxuICAgICAgLy8gYWZ0ZXJ3YXJkcy5cbiAgICAgIC8vXG4gICAgICAvLyBUT0RPOiBDb25zaWRlciBkZXByZWNhdGluZy9yZW1vdmluZyB0aGUgcG9zdC1jb25uZWN0IHN1YnNjcmlwdGlvbiBpbiBhIGZ1dHVyZSBtYWpvciB2ZXJzaW9uXG4gICAgICAvLyAgICAgICAoZS5nLiB2MTEpLlxuXG4gICAgICBsZXQgc3Vic2NyaWJlZFRvRXZlbnRzID0gZmFsc2U7XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cykge1xuICAgICAgICAvLyBgZXZlbnRzYCBhcmUgYWxyZWFkeSBhdmFpbGFibGU6IFN1YnNjcmliZSB0byBpdCBhc2FwLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgICAgIHN1YnNjcmliZWRUb0V2ZW50cyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuY29ubmVjdCh0aGlzKTtcblxuICAgICAgaWYgKCFzdWJzY3JpYmVkVG9FdmVudHMpIHtcbiAgICAgICAgLy8gYGV2ZW50c2Agd2VyZSBub3QgaW5pdGlhbGl6ZWQgYmVmb3JlIHJ1bm5pbmcgYGNvbm5lY3QoKWA6IFN1YnNjcmliZSB0byB0aGVtIG5vdy5cbiAgICAgICAgLy8gVGhlIGV2ZW50cyBlbWl0dGVkIGR1cmluZyB0aGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uIGhhdmUgYmVlbiBtaXNzZWQsIGJ1dCBhdCBsZWFzdFxuICAgICAgICAvLyBmdXR1cmUgZXZlbnRzIHdpbGwgYmUgY2FwdHVyZWQuXG4gICAgICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZSBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIC8vIE5vdCB1c2luZyBgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneWAgdG8gYXZvaWQgdW5uZWNlc3NhcmlseSBjcmVhdGluZyB0aGUgYE5nRWxlbWVudFN0cmF0ZWd5YC5cbiAgICAgIGlmICh0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLl9uZ0VsZW1lbnRTdHJhdGVneS5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdWJzY3JpYmVUb0V2ZW50cygpOiB2b2lkIHtcbiAgICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gdGhlIHN0cmF0ZWd5IGFuZCBkaXNwYXRjaCB0aGVtIGFzIGN1c3RvbSBldmVudHMuXG4gICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZXZlbnRzLnN1YnNjcmliZSgoZSkgPT4ge1xuICAgICAgICBjb25zdCBjdXN0b21FdmVudCA9IG5ldyBDdXN0b21FdmVudChlLm5hbWUsIHtkZXRhaWw6IGUudmFsdWV9KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzIHRvIHRoZSBwcm90b3R5cGUgZm9yIGVhY2ggcHJvcGVydHkgaW5wdXQuXG4gIGlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWUsIHRyYW5zZm9ybX0pID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTmdFbGVtZW50SW1wbC5wcm90b3R5cGUsIHByb3BOYW1lLCB7XG4gICAgICBnZXQoKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZ2V0SW5wdXRWYWx1ZShwcm9wTmFtZSk7XG4gICAgICB9LFxuICAgICAgc2V0KG5ld1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBuZXdWYWx1ZSwgdHJhbnNmb3JtKTtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gTmdFbGVtZW50SW1wbCBhcyBhbnkgYXMgTmdFbGVtZW50Q29uc3RydWN0b3I8UD47XG59XG4iXX0=