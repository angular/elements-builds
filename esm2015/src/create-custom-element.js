/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
/**
 * An array of observed attribute names for the custom element,
 * derived by transforming input property names from the source component.
 * @type {?}
 */
NgElementConstructor.prototype.observedAttributes;
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
if (false) {
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
/** @typedef {?} */
var WithProperties;
export { WithProperties };
/**
 * A configuration that initializes an NgElementConstructor with the
 * dependencies and strategy it needs to transform a component into
 * a custom element class.
 *
 * \@experimental
 * @record
 */
export function NgElementConfig() { }
/**
 * The injector to use for retrieving the component's factory.
 * @type {?}
 */
NgElementConfig.prototype.injector;
/**
 * An optional custom strategy factory to use instead of the default.
 * The strategy controls how the transformation is performed.
 * @type {?|undefined}
 */
NgElementConfig.prototype.strategyFactory;
/**
 * \@description Creates a custom element class based on an Angular component.
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
    /** @type {?} */
    const inputs = getComponentInputs(component, config.injector);
    /** @type {?} */
    const strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
    /** @type {?} */
    const attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
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
            /** @type {?} */
            const propName = /** @type {?} */ ((attributeToPropertyInputs[attrName]));
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
                /** @type {?} */
                const customEvent = createCustomEvent(this.ownerDocument, e.name, e.value);
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
    if (false) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVdBLE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRS9FLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxtQ0FBbUMsRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0Qm5HLE1BQU0sZ0JBQTBCLFNBQVEsV0FBVzs7Ozs7OzJDQVNVLElBQUk7O0NBc0JoRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9ERCxNQUFNLDhCQUNGLFNBQW9CLEVBQUUsTUFBdUI7O0lBQy9DLE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O0lBRTlELE1BQU0sZUFBZSxHQUNqQixNQUFNLENBQUMsZUFBZSxJQUFJLElBQUksaUNBQWlDLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7SUFFaEcsTUFBTSx5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RSxtQkFBb0IsU0FBUSxTQUFTOzs7O1FBS25DLFlBQVksUUFBbUI7WUFDN0IsS0FBSyxFQUFFLENBQUM7Ozs7O1lBTVIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM5RTs7Ozs7Ozs7UUFFRCx3QkFBd0IsQ0FDcEIsUUFBZ0IsRUFBRSxRQUFxQixFQUFFLFFBQWdCLEVBQUUsU0FBa0I7WUFDL0UsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ2xFOztZQUVELE1BQU0sUUFBUSxzQkFBRyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsR0FBRztZQUN2RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUMxRDs7OztRQUVELGlCQUFpQjtZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNsRTtZQUVELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7O1lBR3JDLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTs7Z0JBQzdFLE1BQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNFLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDakMsQ0FBQyxDQUFDO1NBQ0o7Ozs7UUFFRCxvQkFBb0I7WUFDbEIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQzthQUNyQztZQUVELElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO2dCQUNwQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7YUFDekM7U0FDRjs7a0JBN0NlLG9CQUFvQixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUM7Ozs7Ozs7O0lBa0RoRixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3RELE1BQU0sQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUU7WUFDdkQsR0FBRyxFQUFFLGNBQWEsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7WUFDMUUsR0FBRyxFQUFFLFVBQVMsUUFBYSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7WUFDMUYsWUFBWSxFQUFFLElBQUk7WUFDbEIsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0lBRUgseUJBQU8sbUJBQUMsYUFBb0IsRUFBNEIsRUFBQztDQUMxRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RvciwgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7Q29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudC1mYWN0b3J5LXN0cmF0ZWd5JztcbmltcG9ydCB7TmdFbGVtZW50U3RyYXRlZ3ksIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9lbGVtZW50LXN0cmF0ZWd5JztcbmltcG9ydCB7Y3JlYXRlQ3VzdG9tRXZlbnQsIGdldENvbXBvbmVudElucHV0cywgZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFByb3RvdHlwZSBmb3IgYSBjbGFzcyBjb25zdHJ1Y3RvciBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudFxuICogdGhhdCBjYW4gYmUgdXNlZCBmb3IgY3VzdG9tIGVsZW1lbnQgcmVnaXN0cmF0aW9uLiBJbXBsZW1lbnRlZCBhbmQgcmV0dXJuZWRcbiAqIGJ5IHRoZSB7QGxpbmsgY3JlYXRlQ3VzdG9tRWxlbWVudCBjcmVhdGVDdXN0b21FbGVtZW50KCkgZnVuY3Rpb259LlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPiB7XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBvYnNlcnZlZCBhdHRyaWJ1dGUgbmFtZXMgZm9yIHRoZSBjdXN0b20gZWxlbWVudCxcbiAgICogZGVyaXZlZCBieSB0cmFuc2Zvcm1pbmcgaW5wdXQgcHJvcGVydHkgbmFtZXMgZnJvbSB0aGUgc291cmNlIGNvbXBvbmVudC5cbiAgICovXG4gIHJlYWRvbmx5IG9ic2VydmVkQXR0cmlidXRlczogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgY29uc3RydWN0b3IgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBpbmplY3RvciBUaGUgc291cmNlIGNvbXBvbmVudCdzIGluamVjdG9yLlxuICAgKi9cbiAgbmV3IChpbmplY3RvcjogSW5qZWN0b3IpOiBOZ0VsZW1lbnQmV2l0aFByb3BlcnRpZXM8UD47XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyB0aGUgZnVuY3Rpb25hbGl0eSBuZWVkZWQgZm9yIGEgY3VzdG9tIGVsZW1lbnQuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmdFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAvKipcbiAgICogVGhlIHN0cmF0ZWd5IHRoYXQgY29udHJvbHMgaG93IGEgY29tcG9uZW50IGlzIHRyYW5zZm9ybWVkIGluIGEgY3VzdG9tIGVsZW1lbnQuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJvdGVjdGVkIG5nRWxlbWVudFN0cmF0ZWd5ICE6IE5nRWxlbWVudFN0cmF0ZWd5O1xuICAvKipcbiAgICogQSBzdWJzY3JpcHRpb24gdG8gY2hhbmdlLCBjb25uZWN0LCBhbmQgZGlzY29ubmVjdCBldmVudHMgaW4gdGhlIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIG5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byBhIGNoYW5nZSBpbiBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUuXG4gICAgKiBAcGFyYW0gYXR0ck5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0aGF0IGhhcyBjaGFuZ2VkLlxuICAgICogQHBhcmFtIG9sZFZhbHVlIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBpbiB3aGljaCB0aGUgYXR0cmlidXRlIGlzIGRlZmluZWQuXG4gICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgICovXG4gIGFic3RyYWN0IGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGluc2VydGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBkZWxldGlvbiBvZiB0aGUgY3VzdG9tIGVsZW1lbnQgZnJvbSB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgZGlzY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBZGRpdGlvbmFsIHR5cGUgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgYWRkZWQgdG8gdGhlIE5nRWxlbWVudCBjbGFzcyxcbiAqIGZvciBwcm9wZXJ0aWVzIHRoYXQgYXJlIGFkZGVkIGJhc2VkXG4gKiBvbiB0aGUgaW5wdXRzIGFuZCBtZXRob2RzIG9mIHRoZSB1bmRlcmx5aW5nIGNvbXBvbmVudC5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCB0eXBlIFdpdGhQcm9wZXJ0aWVzPFA+ID0ge1xuICBbcHJvcGVydHkgaW4ga2V5b2YgUF06IFBbcHJvcGVydHldXG59O1xuXG4vKipcbiAqIEEgY29uZmlndXJhdGlvbiB0aGF0IGluaXRpYWxpemVzIGFuIE5nRWxlbWVudENvbnN0cnVjdG9yIHdpdGggdGhlXG4gKiBkZXBlbmRlbmNpZXMgYW5kIHN0cmF0ZWd5IGl0IG5lZWRzIHRvIHRyYW5zZm9ybSBhIGNvbXBvbmVudCBpbnRvXG4gKiBhIGN1c3RvbSBlbGVtZW50IGNsYXNzLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIGluamVjdG9yIHRvIHVzZSBmb3IgcmV0cmlldmluZyB0aGUgY29tcG9uZW50J3MgZmFjdG9yeS5cbiAgICovXG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGN1c3RvbSBzdHJhdGVneSBmYWN0b3J5IHRvIHVzZSBpbnN0ZWFkIG9mIHRoZSBkZWZhdWx0LlxuICAgKiBUaGUgc3RyYXRlZ3kgY29udHJvbHMgaG93IHRoZSB0cmFuc2Zvcm1hdGlvbiBpcyBwZXJmb3JtZWQuXG4gICAqL1xuICBzdHJhdGVneUZhY3Rvcnk/OiBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnk7XG59XG5cbi8qKlxuICogIEBkZXNjcmlwdGlvbiBDcmVhdGVzIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnQuXG4gKlxuICogQnVpbGRzIGEgY2xhc3MgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHByb3ZpZGVkIGNvbXBvbmVudCBhbmRcbiAqIHVzZXMgdGhlIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdG8gcHJvdmlkZSBtb3JlIGNvbnRleHQgdG8gdGhlIGNsYXNzLlxuICogVGFrZXMgdGhlIGNvbXBvbmVudCBmYWN0b3J5J3MgaW5wdXRzIGFuZCBvdXRwdXRzIHRvIGNvbnZlcnQgdGhlbSB0byB0aGUgcHJvcGVyXG4gKiBjdXN0b20gZWxlbWVudCBBUEkgYW5kIGFkZCBob29rcyB0byBpbnB1dCBjaGFuZ2VzLlxuICpcbiAqIFRoZSBjb25maWd1cmF0aW9uJ3MgaW5qZWN0b3IgaXMgdGhlIGluaXRpYWwgaW5qZWN0b3Igc2V0IG9uIHRoZSBjbGFzcyxcbiAqIGFuZCB1c2VkIGJ5IGRlZmF1bHQgZm9yIGVhY2ggY3JlYXRlZCBpbnN0YW5jZS5UaGlzIGJlaGF2aW9yIGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlXG4gKiBzdGF0aWMgcHJvcGVydHkgdG8gYWZmZWN0IGFsbCBuZXdseSBjcmVhdGVkIGluc3RhbmNlcywgb3IgYXMgYSBjb25zdHJ1Y3RvciBhcmd1bWVudCBmb3JcbiAqIG9uZS1vZmYgY3JlYXRpb25zLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0byB0cmFuc2Zvcm0uXG4gKiBAcGFyYW0gY29uZmlnIEEgY29uZmlndXJhdGlvbiB0aGF0IHByb3ZpZGVzIGluaXRpYWxpemF0aW9uIGluZm9ybWF0aW9uIHRvIHRoZSBjcmVhdGVkIGNsYXNzLlxuICogQHJldHVybnMgVGhlIGN1c3RvbS1lbGVtZW50IGNvbnN0cnVjdGlvbiBjbGFzcywgd2hpY2ggY2FuIGJlIHJlZ2lzdGVyZWQgd2l0aFxuICogYSBicm93c2VyJ3MgYEN1c3RvbUVsZW1lbnRSZWdpc3RyeWAuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRWxlbWVudDxQPihcbiAgICBjb21wb25lbnQ6IFR5cGU8YW55PiwgY29uZmlnOiBOZ0VsZW1lbnRDb25maWcpOiBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPiB7XG4gIGNvbnN0IGlucHV0cyA9IGdldENvbXBvbmVudElucHV0cyhjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3Qgc3RyYXRlZ3lGYWN0b3J5ID1cbiAgICAgIGNvbmZpZy5zdHJhdGVneUZhY3RvcnkgfHwgbmV3IENvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeShjb21wb25lbnQsIGNvbmZpZy5pbmplY3Rvcik7XG5cbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyA9IGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKGlucHV0cyk7XG5cbiAgY2xhc3MgTmdFbGVtZW50SW1wbCBleHRlbmRzIE5nRWxlbWVudCB7XG4gICAgLy8gV29yayBhcm91bmQgYSBidWcgaW4gY2xvc3VyZSB0eXBlZCBvcHRpbWl6YXRpb25zKGIvNzk1NTc0ODcpIHdoZXJlIGl0IGlzIG5vdCBob25vcmluZyBzdGF0aWNcbiAgICAvLyBmaWVsZCBleHRlcm5zLiBTbyB1c2luZyBxdW90ZWQgYWNjZXNzIHRvIGV4cGxpY2l0bHkgcHJldmVudCByZW5hbWluZy5cbiAgICBzdGF0aWMgcmVhZG9ubHlbJ29ic2VydmVkQXR0cmlidXRlcyddID0gT2JqZWN0LmtleXMoYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyk7XG5cbiAgICBjb25zdHJ1Y3RvcihpbmplY3Rvcj86IEluamVjdG9yKSB7XG4gICAgICBzdXBlcigpO1xuXG4gICAgICAvLyBOb3RlIHRoYXQgc29tZSBwb2x5ZmlsbHMgKGUuZy4gZG9jdW1lbnQtcmVnaXN0ZXItZWxlbWVudCkgZG8gbm90IGNhbGwgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgLy8gRG8gbm90IGFzc3VtZSB0aGlzIHN0cmF0ZWd5IGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IEFkZCBlMmUgdGVzdHMgdGhhdCBjb3ZlciBjYXNlcyB3aGVyZSB0aGUgY29uc3RydWN0b3IgaXNuJ3QgY2FsbGVkLiBGb3JcbiAgICAgIC8vIG5vdyB0aGlzIGlzIHRlc3RlZCB1c2luZyBhIEdvb2dsZSBpbnRlcm5hbCB0ZXN0IHN1aXRlLlxuICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneSA9IHN0cmF0ZWd5RmFjdG9yeS5jcmVhdGUoaW5qZWN0b3IgfHwgY29uZmlnLmluamVjdG9yKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soXG4gICAgICAgIGF0dHJOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmd8bnVsbCwgbmV3VmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICBpZiAoIXRoaXMubmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneSA9IHN0cmF0ZWd5RmFjdG9yeS5jcmVhdGUoY29uZmlnLmluamVjdG9yKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvcE5hbWUgPSBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzW2F0dHJOYW1lXSAhO1xuICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5zZXRJbnB1dFZhbHVlKHByb3BOYW1lLCBuZXdWYWx1ZSk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgICBpZiAoIXRoaXMubmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneSA9IHN0cmF0ZWd5RmFjdG9yeS5jcmVhdGUoY29uZmlnLmluamVjdG9yKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5jb25uZWN0KHRoaXMpO1xuXG4gICAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIHRoZSBzdHJhdGVneSBhbmQgZGlzcGF0Y2ggdGhlbSBhcyBjdXN0b20gZXZlbnRzXG4gICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZXZlbnRzLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudCh0aGlzLm93bmVyRG9jdW1lbnQsIGUubmFtZSwgZS52YWx1ZSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzIHRvIHRoZSBwcm90b3R5cGUgZm9yIGVhY2ggcHJvcGVydHkgaW5wdXQuIElmIHRoZSBjb25maWcgZG9lcyBub3RcbiAgLy8gY29udGFpbiBwcm9wZXJ0eSBpbnB1dHMsIHVzZSBhbGwgaW5wdXRzIGJ5IGRlZmF1bHQuXG4gIGlucHV0cy5tYXAoKHtwcm9wTmFtZX0pID0+IHByb3BOYW1lKS5mb3JFYWNoKHByb3BlcnR5ID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTmdFbGVtZW50SW1wbC5wcm90b3R5cGUsIHByb3BlcnR5LCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KTsgfSxcbiAgICAgIHNldDogZnVuY3Rpb24obmV3VmFsdWU6IGFueSkgeyB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcGVydHksIG5ld1ZhbHVlKTsgfSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiAoTmdFbGVtZW50SW1wbCBhcyBhbnkpIGFzIE5nRWxlbWVudENvbnN0cnVjdG9yPFA+O1xufVxuIl19