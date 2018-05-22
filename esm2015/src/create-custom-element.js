/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentNgElementStrategyFactory } from './component-factory-strategy';
import { createCustomEvent, getComponentInputs, getDefaultAttributeToPropertyInputs } from './utils';
/**
 * Prototype for a class constructor based on an Angular component
 * that can be used for custom element registration. Implemented and returned
 * by the {\@link createCustomElement createCustomElement() function}.
 *
 * \@experimental
 * @record
 * @template P
 */
export function NgElementConstructor() { }
function NgElementConstructor_tsickle_Closure_declarations() {
    /**
     * An array of observed attribute names for the custom element,
     * derived by transforming input property names from the source component.
     * @type {?}
     */
    NgElementConstructor.prototype.observedAttributes;
    /* TODO: handle strange member:
    new (injector: Injector): NgElement&WithProperties<P>;
    */
}
/**
 * Implements the functionality needed for a custom element.
 *
 * \@experimental
 * @abstract
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
function NgElement_tsickle_Closure_declarations() {
    /**
     * The strategy that controls how a component is transformed in a custom element.
     * @type {?}
     */
    NgElement.prototype.ngElementStrategy;
    /**
     * A subscription to change, connect, and disconnect events in the custom element.
     * @type {?}
     */
    NgElement.prototype.ngElementEventsSubscription;
    /**
     * Prototype for a handler that responds to a change in an observed attribute.
     * @abstract
     * @param {?} attrName The name of the attribute that has changed.
     * @param {?} oldValue The previous value of the attribute.
     * @param {?} newValue The new value of the attribute.
     * @param {?=} namespace The namespace in which the attribute is defined.
     * @return {?} Nothing.
     */
    NgElement.prototype.attributeChangedCallback = function (attrName, oldValue, newValue, namespace) { };
    /**
     * Prototype for a handler that responds to the insertion of the custom element in the DOM.
     * @abstract
     * @return {?} Nothing.
     */
    NgElement.prototype.connectedCallback = function () { };
    /**
     * Prototype for a handler that responds to the deletion of the custom element from the DOM.
     * @abstract
     * @return {?} Nothing.
     */
    NgElement.prototype.disconnectedCallback = function () { };
}
/**
 * A configuration that initializes an NgElementConstructor with the
 * dependencies and strategy it needs to transform a component into
 * a custom element class.
 *
 * \@experimental
 * @record
 */
export function NgElementConfig() { }
function NgElementConfig_tsickle_Closure_declarations() {
    /**
     * The injector to use for retrieving the component's factory.
     * @type {?}
     */
    NgElementConfig.prototype.injector;
    /**
     * An optional custom strategy factory to use instead of the default.
     * The strategy controls how the tranformation is performed.
     * @type {?|undefined}
     */
    NgElementConfig.prototype.strategyFactory;
}
/**
 *  \@description Creates a custom element class based on an Angular component.
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
 * \@experimental
 * @template P
 * @param {?} component The component to transform.
 * @param {?} config A configuration that provides initialization information to the created class.
 * @return {?} The custom-element construction class, which can be registered with
 * a browser's `CustomElementRegistry`.
 *
 */
export function createCustomElement(component, config) {
    const /** @type {?} */ inputs = getComponentInputs(component, config.injector);
    const /** @type {?} */ strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
    const /** @type {?} */ attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
    class NgElementImpl extends NgElement {
        /**
         * @param {?=} injector
         */
        constructor(injector) {
            super();
            // Note that some polyfills (e.g. document-register-element) do not call the constructor.
            // Do not assume this strategy has been created.
            // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
            // now this is tested using a Google internal test suite.
            this.ngElementStrategy = strategyFactory.create(injector || config.injector);
        }
        /**
         * @param {?} attrName
         * @param {?} oldValue
         * @param {?} newValue
         * @param {?=} namespace
         * @return {?}
         */
        attributeChangedCallback(attrName, oldValue, newValue, namespace) {
            if (!this.ngElementStrategy) {
                this.ngElementStrategy = strategyFactory.create(config.injector);
            }
            const /** @type {?} */ propName = /** @type {?} */ ((attributeToPropertyInputs[attrName]));
            this.ngElementStrategy.setInputValue(propName, newValue);
        }
        /**
         * @return {?}
         */
        connectedCallback() {
            if (!this.ngElementStrategy) {
                this.ngElementStrategy = strategyFactory.create(config.injector);
            }
            this.ngElementStrategy.connect(this);
            // Listen for events from the strategy and dispatch them as custom events
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(e => {
                const /** @type {?} */ customEvent = createCustomEvent(this.ownerDocument, e.name, e.value);
                this.dispatchEvent(customEvent);
            });
        }
        /**
         * @return {?}
         */
        disconnectedCallback() {
            if (this.ngElementStrategy) {
                this.ngElementStrategy.disconnect();
            }
            if (this.ngElementEventsSubscription) {
                this.ngElementEventsSubscription.unsubscribe();
                this.ngElementEventsSubscription = null;
            }
        }
    }
    NgElementImpl['observedAttributes'] = Object.keys(attributeToPropertyInputs);
    function NgElementImpl_tsickle_Closure_declarations() {
        /* TODO: handle strange member:
        static readonly['observedAttributes'] = Object.keys(attributeToPropertyInputs);
        */
    }
    // Add getters and setters to the prototype for each property input. If the config does not
    // contain property inputs, use all inputs by default.
    inputs.map(({ propName }) => propName).forEach(property => {
        Object.defineProperty(NgElementImpl.prototype, property, {
            get: function () { return this.ngElementStrategy.getInputValue(property); },
            set: function (newValue) { this.ngElementStrategy.setInputValue(property, newValue); },
            configurable: true,
            enumerable: true,
        });
    });
    return /** @type {?} */ ((/** @type {?} */ (NgElementImpl)));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVdBLE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRS9FLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxtQ0FBbUMsRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRCbkcsTUFBTSxnQkFBMEIsU0FBUSxXQUFXOzs7Ozs7MkNBUVUsSUFBSTs7Q0FzQmhFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvREQsTUFBTSw4QkFDRixTQUFvQixFQUFFLE1BQXVCO0lBQy9DLHVCQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTlELHVCQUFNLGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFaEcsdUJBQU0seUJBQXlCLEdBQUcsbUNBQW1DLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUUsbUJBQW9CLFNBQVEsU0FBUzs7OztRQUtuQyxZQUFZLFFBQW1CO1lBQzdCLEtBQUssRUFBRSxDQUFDOzs7OztZQU1SLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDOUU7Ozs7Ozs7O1FBRUQsd0JBQXdCLENBQ3BCLFFBQWdCLEVBQUUsUUFBcUIsRUFBRSxRQUFnQixFQUFFLFNBQWtCO1lBQy9FLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNsRTtZQUVELHVCQUFNLFFBQVEsc0JBQUcseUJBQXlCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUN2RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUMxRDs7OztRQUVELGlCQUFpQjtZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNsRTtZQUVELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7O1lBR3JDLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDN0UsdUJBQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNFLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDakMsQ0FBQyxDQUFDO1NBQ0o7Ozs7UUFFRCxvQkFBb0I7WUFDbEIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQzthQUNyQztZQUVELElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO2dCQUNwQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7YUFDekM7U0FDRjs7a0JBN0NlLG9CQUFvQixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUM7Ozs7Ozs7O0lBa0RoRixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3RELE1BQU0sQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUU7WUFDdkQsR0FBRyxFQUFFLGNBQWEsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7WUFDMUUsR0FBRyxFQUFFLFVBQVMsUUFBYSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7WUFDMUYsWUFBWSxFQUFFLElBQUk7WUFDbEIsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0lBRUgseUJBQU8sbUJBQUMsYUFBb0IsRUFBNEIsRUFBQztDQUMxRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RvciwgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7Q29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudC1mYWN0b3J5LXN0cmF0ZWd5JztcbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7Y3JlYXRlQ3VzdG9tRXZlbnQsIGdldENvbXBvbmVudElucHV0cywgZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFByb3RvdHlwZSBmb3IgYSBjbGFzcyBjb25zdHJ1Y3RvciBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudFxuICogdGhhdCBjYW4gYmUgdXNlZCBmb3IgY3VzdG9tIGVsZW1lbnQgcmVnaXN0cmF0aW9uLiBJbXBsZW1lbnRlZCBhbmQgcmV0dXJuZWRcbiAqIGJ5IHRoZSB7QGxpbmsgY3JlYXRlQ3VzdG9tRWxlbWVudCBjcmVhdGVDdXN0b21FbGVtZW50KCkgZnVuY3Rpb259LlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPiB7XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBvYnNlcnZlZCBhdHRyaWJ1dGUgbmFtZXMgZm9yIHRoZSBjdXN0b20gZWxlbWVudCxcbiAgICogZGVyaXZlZCBieSB0cmFuc2Zvcm1pbmcgaW5wdXQgcHJvcGVydHkgbmFtZXMgZnJvbSB0aGUgc291cmNlIGNvbXBvbmVudC5cbiAgICovXG4gIHJlYWRvbmx5IG9ic2VydmVkQXR0cmlidXRlczogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgY29uc3RydWN0b3IgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBpbmplY3RvciBUaGUgc291cmNlIGNvbXBvbmVudCdzIGluamVjdG9yLlxuICAgKi9cbiAgbmV3IChpbmplY3RvcjogSW5qZWN0b3IpOiBOZ0VsZW1lbnQmV2l0aFByb3BlcnRpZXM8UD47XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyB0aGUgZnVuY3Rpb25hbGl0eSBuZWVkZWQgZm9yIGEgY3VzdG9tIGVsZW1lbnQuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmdFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAvKipcbiAgICogVGhlIHN0cmF0ZWd5IHRoYXQgY29udHJvbHMgaG93IGEgY29tcG9uZW50IGlzIHRyYW5zZm9ybWVkIGluIGEgY3VzdG9tIGVsZW1lbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgbmdFbGVtZW50U3RyYXRlZ3k6IE5nRWxlbWVudFN0cmF0ZWd5O1xuICAvKipcbiAgICogQSBzdWJzY3JpcHRpb24gdG8gY2hhbmdlLCBjb25uZWN0LCBhbmQgZGlzY29ubmVjdCBldmVudHMgaW4gdGhlIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIG5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byBhIGNoYW5nZSBpbiBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUuXG4gICAgKiBAcGFyYW0gYXR0ck5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0aGF0IGhhcyBjaGFuZ2VkLlxuICAgICogQHBhcmFtIG9sZFZhbHVlIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBpbiB3aGljaCB0aGUgYXR0cmlidXRlIGlzIGRlZmluZWQuXG4gICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgICovXG4gIGFic3RyYWN0IGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGluc2VydGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBkZWxldGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgZnJvbSB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBZGRpdGlvbmFsIHR5cGUgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgYWRkZWQgdG8gdGhlIE5nRWxlbWVudCBjbGFzcyxcbiAqIGZvciBwcm9wZXJ0aWVzIHRoYXQgYXJlIGFkZGVkIGJhc2VkXG4gKiBvbiB0aGUgaW5wdXRzIGFuZCBtZXRob2RzIG9mIHRoZSB1bmRlcmx5aW5nIGNvbXBvbmVudC5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCB0eXBlIFdpdGhQcm9wZXJ0aWVzPFA+ID0ge1xuICBbcHJvcGVydHkgaW4ga2V5b2YgUF06IFBbcHJvcGVydHldXG59O1xuXG4vKipcbiAqIEEgY29uZmlndXJhdGlvbiB0aGF0IGluaXRpYWxpemVzIGFuIE5nRWxlbWVudENvbnN0cnVjdG9yIHdpdGggdGhlXG4gKiBkZXBlbmRlbmNpZXMgYW5kIHN0cmF0ZWd5IGl0IG5lZWRzIHRvIHRyYW5zZm9ybSBhIGNvbXBvbmVudCBpbnRvXG4gKiBhIGN1c3RvbSBlbGVtZW50IGNsYXNzLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIGluamVjdG9yIHRvIHVzZSBmb3IgcmV0cmlldmluZyB0aGUgY29tcG9uZW50J3MgZmFjdG9yeS5cbiAgICovXG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGN1c3RvbSBzdHJhdGVneSBmYWN0b3J5IHRvIHVzZSBpbnN0ZWFkIG9mIHRoZSBkZWZhdWx0LlxuICAgKiBUaGUgc3RyYXRlZ3kgY29udHJvbHMgaG93IHRoZSB0cmFuZm9ybWF0aW9uIGlzIHBlcmZvcm1lZC5cbiAgICovXG4gIHN0cmF0ZWd5RmFjdG9yeT86IE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeTtcbn1cblxuLyoqXG4gKiAgQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBjdXN0b20gZWxlbWVudCBjbGFzcyBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudC5cbiAqXG4gKiBCdWlsZHMgYSBjbGFzcyB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgcHJvdmlkZWQgY29tcG9uZW50IGFuZFxuICogdXNlcyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiB0byBwcm92aWRlIG1vcmUgY29udGV4dCB0byB0aGUgY2xhc3MuXG4gKiBUYWtlcyB0aGUgY29tcG9uZW50IGZhY3RvcnkncyBpbnB1dHMgYW5kIG91dHB1dHMgdG8gY29udmVydCB0aGVtIHRvIHRoZSBwcm9wZXJcbiAqIGN1c3RvbSBlbGVtZW50IEFQSSBhbmQgYWRkIGhvb2tzIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogVGhlIGNvbmZpZ3VyYXRpb24ncyBpbmplY3RvciBpcyB0aGUgaW5pdGlhbCBpbmplY3RvciBzZXQgb24gdGhlIGNsYXNzLFxuICogYW5kIHVzZWQgYnkgZGVmYXVsdCBmb3IgZWFjaCBjcmVhdGVkIGluc3RhbmNlLlRoaXMgYmVoYXZpb3IgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCB0aGVcbiAqIHN0YXRpYyBwcm9wZXJ0eSB0byBhZmZlY3QgYWxsIG5ld2x5IGNyZWF0ZWQgaW5zdGFuY2VzLCBvciBhcyBhIGNvbnN0cnVjdG9yIGFyZ3VtZW50IGZvclxuICogb25lLW9mZiBjcmVhdGlvbnMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHRvIHRyYW5zZm9ybS5cbiAqIEBwYXJhbSBjb25maWcgQSBjb25maWd1cmF0aW9uIHRoYXQgcHJvdmlkZXMgaW5pdGlhbGl6YXRpb24gaW5mb3JtYXRpb24gdG8gdGhlIGNyZWF0ZWQgY2xhc3MuXG4gKiBAcmV0dXJucyBUaGUgY3VzdG9tLWVsZW1lbnQgY29uc3RydWN0aW9uIGNsYXNzLCB3aGljaCBjYW4gYmUgcmVnaXN0ZXJlZCB3aXRoXG4gKiBhIGJyb3dzZXIncyBgQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5YC5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDdXN0b21FbGVtZW50PFA+KFxuICAgIGNvbXBvbmVudDogVHlwZTxhbnk+LCBjb25maWc6IE5nRWxlbWVudENvbmZpZyk6IE5nRWxlbWVudENvbnN0cnVjdG9yPFA+IHtcbiAgY29uc3QgaW5wdXRzID0gZ2V0Q29tcG9uZW50SW5wdXRzKGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBzdHJhdGVneUZhY3RvcnkgPVxuICAgICAgY29uZmlnLnN0cmF0ZWd5RmFjdG9yeSB8fCBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5KGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzID0gZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMoaW5wdXRzKTtcblxuICBjbGFzcyBOZ0VsZW1lbnRJbXBsIGV4dGVuZHMgTmdFbGVtZW50IHtcbiAgICAvLyBXb3JrIGFyb3VuZCBhIGJ1ZyBpbiBjbG9zdXJlIHR5cGVkIG9wdGltaXphdGlvbnMoYi83OTU1NzQ4Nykgd2hlcmUgaXQgaXMgbm90IGhvbm9yaW5nIHN0YXRpY1xuICAgIC8vIGZpZWxkIGV4dGVybnMuIFNvIHVzaW5nIHF1b3RlZCBhY2Nlc3MgdG8gZXhwbGljaXRseSBwcmV2ZW50IHJlbmFtaW5nLlxuICAgIHN0YXRpYyByZWFkb25seVsnb2JzZXJ2ZWRBdHRyaWJ1dGVzJ10gPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKTtcblxuICAgIGNvbnN0cnVjdG9yKGluamVjdG9yPzogSW5qZWN0b3IpIHtcbiAgICAgIHN1cGVyKCk7XG5cbiAgICAgIC8vIE5vdGUgdGhhdCBzb21lIHBvbHlmaWxscyAoZS5nLiBkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50KSBkbyBub3QgY2FsbCB0aGUgY29uc3RydWN0b3IuXG4gICAgICAvLyBEbyBub3QgYXNzdW1lIHRoaXMgc3RyYXRlZ3kgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogQWRkIGUyZSB0ZXN0cyB0aGF0IGNvdmVyIGNhc2VzIHdoZXJlIHRoZSBjb25zdHJ1Y3RvciBpc24ndCBjYWxsZWQuIEZvclxuICAgICAgLy8gbm93IHRoaXMgaXMgdGVzdGVkIHVzaW5nIGEgR29vZ2xlIGludGVybmFsIHRlc3Qgc3VpdGUuXG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5ID0gc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZShpbmplY3RvciB8fCBjb25maWcuaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgICAgYXR0ck5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZ3xudWxsLCBuZXdWYWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGlmICghdGhpcy5uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5ID0gc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZShjb25maWcuaW5qZWN0b3IpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9wTmFtZSA9IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHNbYXR0ck5hbWVdICE7XG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcE5hbWUsIG5ld1ZhbHVlKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIGlmICghdGhpcy5uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5ID0gc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZShjb25maWcuaW5qZWN0b3IpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmNvbm5lY3QodGhpcyk7XG5cbiAgICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gdGhlIHN0cmF0ZWd5IGFuZCBkaXNwYXRjaCB0aGVtIGFzIGN1c3RvbSBldmVudHNcbiAgICAgIHRoaXMubmdFbGVtZW50RXZlbnRzU3Vic2NyaXB0aW9uID0gdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5ldmVudHMuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgICBjb25zdCBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KHRoaXMub3duZXJEb2N1bWVudCwgZS5uYW1lLCBlLnZhbHVlKTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgaWYgKHRoaXMubmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnMgdG8gdGhlIHByb3RvdHlwZSBmb3IgZWFjaCBwcm9wZXJ0eSBpbnB1dC4gSWYgdGhlIGNvbmZpZyBkb2VzIG5vdFxuICAvLyBjb250YWluIHByb3BlcnR5IGlucHV0cywgdXNlIGFsbCBpbnB1dHMgYnkgZGVmYXVsdC5cbiAgaW5wdXRzLm1hcCgoe3Byb3BOYW1lfSkgPT4gcHJvcE5hbWUpLmZvckVhY2gocHJvcGVydHkgPT4ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOZ0VsZW1lbnRJbXBsLnByb3RvdHlwZSwgcHJvcGVydHksIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmdldElucHV0VmFsdWUocHJvcGVydHkpOyB9LFxuICAgICAgc2V0OiBmdW5jdGlvbihuZXdWYWx1ZTogYW55KSB7IHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wZXJ0eSwgbmV3VmFsdWUpOyB9LFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIChOZ0VsZW1lbnRJbXBsIGFzIGFueSkgYXMgTmdFbGVtZW50Q29uc3RydWN0b3I8UD47XG59Il19