/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/create-custom-element.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
 * \@publicApi
 * @record
 * @template P
 */
export function NgElementConstructor() { }
if (false) {
    /**
     * An array of observed attribute names for the custom element,
     * derived by transforming input property names from the source component.
     * @type {?}
     */
    NgElementConstructor.prototype.observedAttributes;
    /* Skipping unhandled member: new(injector?: Injector): NgElement&WithProperties<P>;*/
}
/**
 * Implements the functionality needed for a custom element.
 *
 * \@publicApi
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
     * @protected
     */
    NgElement.prototype.ngElementStrategy;
    /**
     * A subscription to change, connect, and disconnect events in the custom element.
     * @type {?}
     * @protected
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
 * \@publicApi
 * @record
 */
export function NgElementConfig() { }
if (false) {
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
}
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
 * \@publicApi
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
            const propName = (/** @type {?} */ (attributeToPropertyInputs[attrName]));
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
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe((/**
             * @param {?} e
             * @return {?}
             */
            e => {
                /** @type {?} */
                const customEvent = createCustomEvent((/** @type {?} */ (this.ownerDocument)), e.name, e.value);
                this.dispatchEvent(customEvent);
            }));
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
    // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
    // field externs. So using quoted access to explicitly prevent renaming.
    NgElementImpl['observedAttributes'] = Object.keys(attributeToPropertyInputs);
    if (false) {
        /* Skipping unnamed member:
        static readonly['observedAttributes'] = Object.keys(attributeToPropertyInputs);*/
    }
    // Add getters and setters to the prototype for each property input. If the config does not
    // contain property inputs, use all inputs by default.
    inputs.map((/**
     * @param {?} __0
     * @return {?}
     */
    ({ propName }) => propName)).forEach((/**
     * @param {?} property
     * @return {?}
     */
    property => {
        Object.defineProperty(NgElementImpl.prototype, property, {
            get: (/**
             * @return {?}
             */
            function () {
                return this.ngElementStrategy.getInputValue(property);
            }),
            set: (/**
             * @param {?} newValue
             * @return {?}
             */
            function (newValue) {
                this.ngElementStrategy.setInputValue(property, newValue);
            }),
            configurable: true,
            enumerable: true,
        });
    }));
    return (/** @type {?} */ (((/** @type {?} */ (NgElementImpl)))));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFXQSxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7Ozs7Ozs7QUFTbkcsMENBWUM7Ozs7Ozs7SUFQQyxrREFBc0M7Ozs7Ozs7OztBQWN4QyxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOzs7OztRQVNZLGdDQUEyQixHQUFzQixJQUFJLENBQUM7SUFzQmxFLENBQUM7Q0FBQTs7Ozs7OztJQTFCQyxzQ0FBZ0Q7Ozs7OztJQUloRCxnREFBZ0U7Ozs7Ozs7Ozs7SUFVaEUsc0dBQ3lGOzs7Ozs7SUFLekYsd0RBQW1DOzs7Ozs7SUFLbkMsMkRBQXNDOzs7Ozs7Ozs7O0FBcUJ4QyxxQ0FVQzs7Ozs7O0lBTkMsbUNBQW1COzs7Ozs7SUFLbkIsMENBQTJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCN0MsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixTQUFvQixFQUFFLE1BQXVCOztVQUN6QyxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUM7O1VBRXZELGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDOztVQUV6Rix5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUM7SUFFN0UsTUFBTSxhQUFjLFNBQVEsU0FBUzs7OztRQUtuQyxZQUFZLFFBQW1CO1lBQzdCLEtBQUssRUFBRSxDQUFDO1lBRVIs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QWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3IsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0NvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9jb21wb25lbnQtZmFjdG9yeS1zdHJhdGVneSc7XG5pbXBvcnQge05nRWxlbWVudFN0cmF0ZWd5LCBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2NyZWF0ZUN1c3RvbUV2ZW50LCBnZXRDb21wb25lbnRJbnB1dHMsIGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBQcm90b3R5cGUgZm9yIGEgY2xhc3MgY29uc3RydWN0b3IgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnRcbiAqIHRoYXQgY2FuIGJlIHVzZWQgZm9yIGN1c3RvbSBlbGVtZW50IHJlZ2lzdHJhdGlvbi4gSW1wbGVtZW50ZWQgYW5kIHJldHVybmVkXG4gKiBieSB0aGUge0BsaW5rIGNyZWF0ZUN1c3RvbUVsZW1lbnQgY3JlYXRlQ3VzdG9tRWxlbWVudCgpIGZ1bmN0aW9ufS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2Ygb2JzZXJ2ZWQgYXR0cmlidXRlIG5hbWVzIGZvciB0aGUgY3VzdG9tIGVsZW1lbnQsXG4gICAqIGRlcml2ZWQgYnkgdHJhbnNmb3JtaW5nIGlucHV0IHByb3BlcnR5IG5hbWVzIGZyb20gdGhlIHNvdXJjZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSBvYnNlcnZlZEF0dHJpYnV0ZXM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIGNvbnN0cnVjdG9yIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gaW5qZWN0b3IgSWYgcHJvdmlkZWQsIG92ZXJyaWRlcyB0aGUgY29uZmlndXJlZCBpbmplY3Rvci5cbiAgICovXG4gIG5ldyhpbmplY3Rvcj86IEluamVjdG9yKTogTmdFbGVtZW50JldpdGhQcm9wZXJ0aWVzPFA+O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciBhIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgLyoqXG4gICAqIFRoZSBzdHJhdGVneSB0aGF0IGNvbnRyb2xzIGhvdyBhIGNvbXBvbmVudCBpcyB0cmFuc2Zvcm1lZCBpbiBhIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRTdHJhdGVneSE6IE5nRWxlbWVudFN0cmF0ZWd5O1xuICAvKipcbiAgICogQSBzdWJzY3JpcHRpb24gdG8gY2hhbmdlLCBjb25uZWN0LCBhbmQgZGlzY29ubmVjdCBldmVudHMgaW4gdGhlIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIG5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIGEgY2hhbmdlIGluIGFuIG9ic2VydmVkIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdGhhdCBoYXMgY2hhbmdlZC5cbiAgICogQHBhcmFtIG9sZFZhbHVlIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgaW4gd2hpY2ggdGhlIGF0dHJpYnV0ZSBpcyBkZWZpbmVkLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgICAgYXR0ck5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZ3xudWxsLCBuZXdWYWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkO1xuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byB0aGUgaW5zZXJ0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcmV0dXJucyBOb3RoaW5nLlxuICAgKi9cbiAgYWJzdHJhY3QgY29ubmVjdGVkQ2FsbGJhY2soKTogdm9pZDtcbiAgLyoqXG4gICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gdGhlIGRlbGV0aW9uIG9mIHRoZSBjdXN0b20gZWxlbWVudCBmcm9tIHRoZSBET00uXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkO1xufVxuXG4vKipcbiAqIEFkZGl0aW9uYWwgdHlwZSBpbmZvcm1hdGlvbiB0aGF0IGNhbiBiZSBhZGRlZCB0byB0aGUgTmdFbGVtZW50IGNsYXNzLFxuICogZm9yIHByb3BlcnRpZXMgdGhhdCBhcmUgYWRkZWQgYmFzZWRcbiAqIG9uIHRoZSBpbnB1dHMgYW5kIG1ldGhvZHMgb2YgdGhlIHVuZGVybHlpbmcgY29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgV2l0aFByb3BlcnRpZXM8UD4gPSB7XG4gIFtwcm9wZXJ0eSBpbiBrZXlvZiBQXTogUFtwcm9wZXJ0eV1cbn07XG5cbi8qKlxuICogQSBjb25maWd1cmF0aW9uIHRoYXQgaW5pdGlhbGl6ZXMgYW4gTmdFbGVtZW50Q29uc3RydWN0b3Igd2l0aCB0aGVcbiAqIGRlcGVuZGVuY2llcyBhbmQgc3RyYXRlZ3kgaXQgbmVlZHMgdG8gdHJhbnNmb3JtIGEgY29tcG9uZW50IGludG9cbiAqIGEgY3VzdG9tIGVsZW1lbnQgY2xhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgaW5qZWN0b3IgdG8gdXNlIGZvciByZXRyaWV2aW5nIHRoZSBjb21wb25lbnQncyBmYWN0b3J5LlxuICAgKi9cbiAgaW5qZWN0b3I6IEluamVjdG9yO1xuICAvKipcbiAgICogQW4gb3B0aW9uYWwgY3VzdG9tIHN0cmF0ZWd5IGZhY3RvcnkgdG8gdXNlIGluc3RlYWQgb2YgdGhlIGRlZmF1bHQuXG4gICAqIFRoZSBzdHJhdGVneSBjb250cm9scyBob3cgdGhlIHRyYW5zZm9ybWF0aW9uIGlzIHBlcmZvcm1lZC5cbiAgICovXG4gIHN0cmF0ZWd5RmFjdG9yeT86IE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeTtcbn1cblxuLyoqXG4gKiAgQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBjdXN0b20gZWxlbWVudCBjbGFzcyBiYXNlZCBvbiBhbiBBbmd1bGFyIGNvbXBvbmVudC5cbiAqXG4gKiBCdWlsZHMgYSBjbGFzcyB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgcHJvdmlkZWQgY29tcG9uZW50IGFuZFxuICogdXNlcyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiB0byBwcm92aWRlIG1vcmUgY29udGV4dCB0byB0aGUgY2xhc3MuXG4gKiBUYWtlcyB0aGUgY29tcG9uZW50IGZhY3RvcnkncyBpbnB1dHMgYW5kIG91dHB1dHMgdG8gY29udmVydCB0aGVtIHRvIHRoZSBwcm9wZXJcbiAqIGN1c3RvbSBlbGVtZW50IEFQSSBhbmQgYWRkIGhvb2tzIHRvIGlucHV0IGNoYW5nZXMuXG4gKlxuICogVGhlIGNvbmZpZ3VyYXRpb24ncyBpbmplY3RvciBpcyB0aGUgaW5pdGlhbCBpbmplY3RvciBzZXQgb24gdGhlIGNsYXNzLFxuICogYW5kIHVzZWQgYnkgZGVmYXVsdCBmb3IgZWFjaCBjcmVhdGVkIGluc3RhbmNlLlRoaXMgYmVoYXZpb3IgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCB0aGVcbiAqIHN0YXRpYyBwcm9wZXJ0eSB0byBhZmZlY3QgYWxsIG5ld2x5IGNyZWF0ZWQgaW5zdGFuY2VzLCBvciBhcyBhIGNvbnN0cnVjdG9yIGFyZ3VtZW50IGZvclxuICogb25lLW9mZiBjcmVhdGlvbnMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHRvIHRyYW5zZm9ybS5cbiAqIEBwYXJhbSBjb25maWcgQSBjb25maWd1cmF0aW9uIHRoYXQgcHJvdmlkZXMgaW5pdGlhbGl6YXRpb24gaW5mb3JtYXRpb24gdG8gdGhlIGNyZWF0ZWQgY2xhc3MuXG4gKiBAcmV0dXJucyBUaGUgY3VzdG9tLWVsZW1lbnQgY29uc3RydWN0aW9uIGNsYXNzLCB3aGljaCBjYW4gYmUgcmVnaXN0ZXJlZCB3aXRoXG4gKiBhIGJyb3dzZXIncyBgQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5YC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDdXN0b21FbGVtZW50PFA+KFxuICAgIGNvbXBvbmVudDogVHlwZTxhbnk+LCBjb25maWc6IE5nRWxlbWVudENvbmZpZyk6IE5nRWxlbWVudENvbnN0cnVjdG9yPFA+IHtcbiAgY29uc3QgaW5wdXRzID0gZ2V0Q29tcG9uZW50SW5wdXRzKGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBzdHJhdGVneUZhY3RvcnkgPVxuICAgICAgY29uZmlnLnN0cmF0ZWd5RmFjdG9yeSB8fCBuZXcgQ29tcG9uZW50TmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5KGNvbXBvbmVudCwgY29uZmlnLmluamVjdG9yKTtcblxuICBjb25zdCBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzID0gZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMoaW5wdXRzKTtcblxuICBjbGFzcyBOZ0VsZW1lbnRJbXBsIGV4dGVuZHMgTmdFbGVtZW50IHtcbiAgICAvLyBXb3JrIGFyb3VuZCBhIGJ1ZyBpbiBjbG9zdXJlIHR5cGVkIG9wdGltaXphdGlvbnMoYi83OTU1NzQ4Nykgd2hlcmUgaXQgaXMgbm90IGhvbm9yaW5nIHN0YXRpY1xuICAgIC8vIGZpZWxkIGV4dGVybnMuIFNvIHVzaW5nIHF1b3RlZCBhY2Nlc3MgdG8gZXhwbGljaXRseSBwcmV2ZW50IHJlbmFtaW5nLlxuICAgIHN0YXRpYyByZWFkb25seVsnb2JzZXJ2ZWRBdHRyaWJ1dGVzJ10gPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKTtcblxuICAgIGNvbnN0cnVjdG9yKGluamVjdG9yPzogSW5qZWN0b3IpIHtcbiAgICAgIHN1cGVyKCk7XG5cbiAgICAgIC8vIE5vdGUgdGhhdCBzb21lIHBvbHlmaWxscyAoZS5nLiBkb2N1bWVudC1yZWdpc3Rlci1lbGVtZW50KSBkbyBub3QgY2FsbCB0aGUgY29uc3RydWN0b3IuXG4gICAgICAvLyBEbyBub3QgYXNzdW1lIHRoaXMgc3RyYXRlZ3kgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogQWRkIGUyZSB0ZXN0cyB0aGF0IGNvdmVyIGNhc2VzIHdoZXJlIHRoZSBjb25zdHJ1Y3RvciBpc24ndCBjYWxsZWQuIEZvclxuICAgICAgLy8gbm93IHRoaXMgaXMgdGVzdGVkIHVzaW5nIGEgR29vZ2xlIGludGVybmFsIHRlc3Qgc3VpdGUuXG4gICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5ID0gc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZShpbmplY3RvciB8fCBjb25maWcuaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICAgICAgYXR0ck5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZ3xudWxsLCBuZXdWYWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGlmICghdGhpcy5uZ0VsZW1lbnRTdHJhdGVneSkge1xuICAgICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5ID0gc3RyYXRlZ3lGYWN0b3J5LmNyZWF0ZShjb25maWcuaW5qZWN0b3IpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9wTmFtZSA9IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHNbYXR0ck5hbWVdITtcbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgbmV3VmFsdWUpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgaWYgKCF0aGlzLm5nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kgPSBzdHJhdGVneUZhY3RvcnkuY3JlYXRlKGNvbmZpZy5pbmplY3Rvcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuY29ubmVjdCh0aGlzKTtcblxuICAgICAgLy8gTGlzdGVuIGZvciBldmVudHMgZnJvbSB0aGUgc3RyYXRlZ3kgYW5kIGRpc3BhdGNoIHRoZW0gYXMgY3VzdG9tIGV2ZW50c1xuICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cy5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQodGhpcy5vd25lckRvY3VtZW50ISwgZS5uYW1lLCBlLnZhbHVlKTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgaWYgKHRoaXMubmdFbGVtZW50U3RyYXRlZ3kpIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5kaXNjb25uZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLm5nRWxlbWVudEV2ZW50c1N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnMgdG8gdGhlIHByb3RvdHlwZSBmb3IgZWFjaCBwcm9wZXJ0eSBpbnB1dC4gSWYgdGhlIGNvbmZpZyBkb2VzIG5vdFxuICAvLyBjb250YWluIHByb3BlcnR5IGlucHV0cywgdXNlIGFsbCBpbnB1dHMgYnkgZGVmYXVsdC5cbiAgaW5wdXRzLm1hcCgoe3Byb3BOYW1lfSkgPT4gcHJvcE5hbWUpLmZvckVhY2gocHJvcGVydHkgPT4ge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOZ0VsZW1lbnRJbXBsLnByb3RvdHlwZSwgcHJvcGVydHksIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmdldElucHV0VmFsdWUocHJvcGVydHkpO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24obmV3VmFsdWU6IGFueSkge1xuICAgICAgICB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcGVydHksIG5ld1ZhbHVlKTtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gKE5nRWxlbWVudEltcGwgYXMgYW55KSBhcyBOZ0VsZW1lbnRDb25zdHJ1Y3RvcjxQPjtcbn1cbiJdfQ==