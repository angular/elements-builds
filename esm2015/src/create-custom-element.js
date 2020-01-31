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
    /* Skipping unhandled member: new (injector: Injector): NgElement&WithProperties<P>;*/
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
            function () { return this.ngElementStrategy.getInputValue(property); }),
            set: (/**
             * @param {?} newValue
             * @return {?}
             */
            function (newValue) { this.ngElementStrategy.setInputValue(property, newValue); }),
            configurable: true,
            enumerable: true,
        });
    }));
    return (/** @type {?} */ (((/** @type {?} */ (NgElementImpl)))));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWN1c3RvbS1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZWxlbWVudHMvc3JjL2NyZWF0ZS1jdXN0b20tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFXQSxPQUFPLEVBQUMsaUNBQWlDLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7Ozs7Ozs7QUFTbkcsMENBWUM7Ozs7Ozs7SUFQQyxrREFBc0M7Ozs7Ozs7OztBQWN4QyxNQUFNLE9BQWdCLFNBQVUsU0FBUSxXQUFXO0lBQW5EOzs7OztRQVNZLGdDQUEyQixHQUFzQixJQUFJLENBQUM7SUFzQmxFLENBQUM7Q0FBQTs7Ozs7OztJQTFCQyxzQ0FBaUQ7Ozs7OztJQUlqRCxnREFBZ0U7Ozs7Ozs7Ozs7SUFVaEUsc0dBQ3lGOzs7Ozs7SUFLekYsd0RBQW1DOzs7Ozs7SUFLbkMsMkRBQXNDOzs7Ozs7Ozs7O0FBcUJ4QyxxQ0FVQzs7Ozs7O0lBTkMsbUNBQW1COzs7Ozs7SUFLbkIsMENBQTJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCN0MsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixTQUFvQixFQUFFLE1BQXVCOztVQUN6QyxNQUFNLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUM7O1VBRXZELGVBQWUsR0FDakIsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDOztVQUV6Rix5QkFBeUIsR0FBRyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUM7SUFFN0UsTUFBTSxhQUFjLFNBQVEsU0FBUzs7OztRQUtuQyxZQUFZLFFBQW1CO1lBQzdCLEtBQUssRUFBRSxDQUFDO1lBRVIseUZBQXlGO1lBQ3pGLGdEQUFnRDtZQUNoRCw2RkFBNkY7WUFDN0YseURBQXlEO1lBQ3pELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0UsQ0FBQzs7Ozs7Ozs7UUFFRCx3QkFBd0IsQ0FDcEIsUUFBZ0IsRUFBRSxRQUFxQixFQUFFLFFBQWdCLEVBQUUsU0FBa0I7WUFDL0UsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ2xFOztrQkFFSyxRQUFRLEdBQUcsbUJBQUEseUJBQXlCLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDdEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDM0QsQ0FBQzs7OztRQUVELGlCQUFpQjtZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNsRTtZQUVELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFckMseUVBQXlFO1lBQ3pFLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFNBQVM7Ozs7WUFBQyxDQUFDLENBQUMsRUFBRTs7c0JBQ3ZFLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxtQkFBQSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUM1RSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2xDLENBQUMsRUFBQyxDQUFDO1FBQ0wsQ0FBQzs7OztRQUVELG9CQUFvQjtZQUNsQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDMUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDO2FBQ3JDO1lBRUQsSUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7Z0JBQ3BDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLDJCQUEyQixHQUFHLElBQUksQ0FBQzthQUN6QztRQUNILENBQUM7Ozs7SUE3Q2MsY0FBQyxvQkFBb0IsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQzs7Ozs7SUFnRGpGLDJGQUEyRjtJQUMzRixzREFBc0Q7SUFDdEQsTUFBTSxDQUFDLEdBQUc7Ozs7SUFBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBQyxDQUFDLE9BQU87Ozs7SUFBQyxRQUFRLENBQUMsRUFBRTtRQUN0RCxNQUFNLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFO1lBQ3ZELEdBQUc7OztZQUFFLGNBQWEsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQzFFLEdBQUc7Ozs7WUFBRSxVQUFTLFFBQWEsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUMxRixZQUFZLEVBQUUsSUFBSTtZQUNsQixVQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDLEVBQUMsQ0FBQztJQUVILE9BQU8sbUJBQUEsQ0FBQyxtQkFBQSxhQUFhLEVBQU8sQ0FBQyxFQUEyQixDQUFDO0FBQzNELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3IsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0NvbXBvbmVudE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeX0gZnJvbSAnLi9jb21wb25lbnQtZmFjdG9yeS1zdHJhdGVneSc7XG5pbXBvcnQge05nRWxlbWVudFN0cmF0ZWd5LCBOZ0VsZW1lbnRTdHJhdGVneUZhY3Rvcnl9IGZyb20gJy4vZWxlbWVudC1zdHJhdGVneSc7XG5pbXBvcnQge2NyZWF0ZUN1c3RvbUV2ZW50LCBnZXRDb21wb25lbnRJbnB1dHMsIGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBQcm90b3R5cGUgZm9yIGEgY2xhc3MgY29uc3RydWN0b3IgYmFzZWQgb24gYW4gQW5ndWxhciBjb21wb25lbnRcbiAqIHRoYXQgY2FuIGJlIHVzZWQgZm9yIGN1c3RvbSBlbGVtZW50IHJlZ2lzdHJhdGlvbi4gSW1wbGVtZW50ZWQgYW5kIHJldHVybmVkXG4gKiBieSB0aGUge0BsaW5rIGNyZWF0ZUN1c3RvbUVsZW1lbnQgY3JlYXRlQ3VzdG9tRWxlbWVudCgpIGZ1bmN0aW9ufS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2Ygb2JzZXJ2ZWQgYXR0cmlidXRlIG5hbWVzIGZvciB0aGUgY3VzdG9tIGVsZW1lbnQsXG4gICAqIGRlcml2ZWQgYnkgdHJhbnNmb3JtaW5nIGlucHV0IHByb3BlcnR5IG5hbWVzIGZyb20gdGhlIHNvdXJjZSBjb21wb25lbnQuXG4gICAqL1xuICByZWFkb25seSBvYnNlcnZlZEF0dHJpYnV0ZXM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIGNvbnN0cnVjdG9yIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gaW5qZWN0b3IgVGhlIHNvdXJjZSBjb21wb25lbnQncyBpbmplY3Rvci5cbiAgICovXG4gIG5ldyAoaW5qZWN0b3I6IEluamVjdG9yKTogTmdFbGVtZW50JldpdGhQcm9wZXJ0aWVzPFA+O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciBhIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgLyoqXG4gICAqIFRoZSBzdHJhdGVneSB0aGF0IGNvbnRyb2xzIGhvdyBhIGNvbXBvbmVudCBpcyB0cmFuc2Zvcm1lZCBpbiBhIGN1c3RvbSBlbGVtZW50LlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRTdHJhdGVneSAhOiBOZ0VsZW1lbnRTdHJhdGVneTtcbiAgLyoqXG4gICAqIEEgc3Vic2NyaXB0aW9uIHRvIGNoYW5nZSwgY29ubmVjdCwgYW5kIGRpc2Nvbm5lY3QgZXZlbnRzIGluIHRoZSBjdXN0b20gZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBuZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcblxuICAvKipcbiAgICAqIFByb3RvdHlwZSBmb3IgYSBoYW5kbGVyIHRoYXQgcmVzcG9uZHMgdG8gYSBjaGFuZ2UgaW4gYW4gb2JzZXJ2ZWQgYXR0cmlidXRlLlxuICAgICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdGhhdCBoYXMgY2hhbmdlZC5cbiAgICAqIEBwYXJhbSBvbGRWYWx1ZSBUaGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgaW4gd2hpY2ggdGhlIGF0dHJpYnV0ZSBpcyBkZWZpbmVkLlxuICAgICogQHJldHVybnMgTm90aGluZy5cbiAgICAqL1xuICBhYnN0cmFjdCBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soXG4gICAgICBhdHRyTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nfG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQ7XG4gIC8qKlxuICAgKiBQcm90b3R5cGUgZm9yIGEgaGFuZGxlciB0aGF0IHJlc3BvbmRzIHRvIHRoZSBpbnNlcnRpb24gb2YgdGhlIGN1c3RvbSBlbGVtZW50IGluIHRoZSBET00uXG4gICAqIEByZXR1cm5zIE5vdGhpbmcuXG4gICAqL1xuICBhYnN0cmFjdCBjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkO1xuICAvKipcbiAgICogUHJvdG90eXBlIGZvciBhIGhhbmRsZXIgdGhhdCByZXNwb25kcyB0byB0aGUgZGVsZXRpb24gb2YgdGhlIGN1c3RvbSBlbGVtZW50IGZyb20gdGhlIERPTS5cbiAgICogQHJldHVybnMgTm90aGluZy5cbiAgICovXG4gIGFic3RyYWN0IGRpc2Nvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQWRkaXRpb25hbCB0eXBlIGluZm9ybWF0aW9uIHRoYXQgY2FuIGJlIGFkZGVkIHRvIHRoZSBOZ0VsZW1lbnQgY2xhc3MsXG4gKiBmb3IgcHJvcGVydGllcyB0aGF0IGFyZSBhZGRlZCBiYXNlZFxuICogb24gdGhlIGlucHV0cyBhbmQgbWV0aG9kcyBvZiB0aGUgdW5kZXJseWluZyBjb21wb25lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBXaXRoUHJvcGVydGllczxQPiA9IHtcbiAgW3Byb3BlcnR5IGluIGtleW9mIFBdOiBQW3Byb3BlcnR5XVxufTtcblxuLyoqXG4gKiBBIGNvbmZpZ3VyYXRpb24gdGhhdCBpbml0aWFsaXplcyBhbiBOZ0VsZW1lbnRDb25zdHJ1Y3RvciB3aXRoIHRoZVxuICogZGVwZW5kZW5jaWVzIGFuZCBzdHJhdGVneSBpdCBuZWVkcyB0byB0cmFuc2Zvcm0gYSBjb21wb25lbnQgaW50b1xuICogYSBjdXN0b20gZWxlbWVudCBjbGFzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50Q29uZmlnIHtcbiAgLyoqXG4gICAqIFRoZSBpbmplY3RvciB0byB1c2UgZm9yIHJldHJpZXZpbmcgdGhlIGNvbXBvbmVudCdzIGZhY3RvcnkuXG4gICAqL1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBjdXN0b20gc3RyYXRlZ3kgZmFjdG9yeSB0byB1c2UgaW5zdGVhZCBvZiB0aGUgZGVmYXVsdC5cbiAgICogVGhlIHN0cmF0ZWd5IGNvbnRyb2xzIGhvdyB0aGUgdHJhbnNmb3JtYXRpb24gaXMgcGVyZm9ybWVkLlxuICAgKi9cbiAgc3RyYXRlZ3lGYWN0b3J5PzogTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5O1xufVxuXG4vKipcbiAqICBAZGVzY3JpcHRpb24gQ3JlYXRlcyBhIGN1c3RvbSBlbGVtZW50IGNsYXNzIGJhc2VkIG9uIGFuIEFuZ3VsYXIgY29tcG9uZW50LlxuICpcbiAqIEJ1aWxkcyBhIGNsYXNzIHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHRoZSBwcm92aWRlZCBjb21wb25lbnQgYW5kXG4gKiB1c2VzIHRoZSBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uIHRvIHByb3ZpZGUgbW9yZSBjb250ZXh0IHRvIHRoZSBjbGFzcy5cbiAqIFRha2VzIHRoZSBjb21wb25lbnQgZmFjdG9yeSdzIGlucHV0cyBhbmQgb3V0cHV0cyB0byBjb252ZXJ0IHRoZW0gdG8gdGhlIHByb3BlclxuICogY3VzdG9tIGVsZW1lbnQgQVBJIGFuZCBhZGQgaG9va3MgdG8gaW5wdXQgY2hhbmdlcy5cbiAqXG4gKiBUaGUgY29uZmlndXJhdGlvbidzIGluamVjdG9yIGlzIHRoZSBpbml0aWFsIGluamVjdG9yIHNldCBvbiB0aGUgY2xhc3MsXG4gKiBhbmQgdXNlZCBieSBkZWZhdWx0IGZvciBlYWNoIGNyZWF0ZWQgaW5zdGFuY2UuVGhpcyBiZWhhdmlvciBjYW4gYmUgb3ZlcnJpZGRlbiB3aXRoIHRoZVxuICogc3RhdGljIHByb3BlcnR5IHRvIGFmZmVjdCBhbGwgbmV3bHkgY3JlYXRlZCBpbnN0YW5jZXMsIG9yIGFzIGEgY29uc3RydWN0b3IgYXJndW1lbnQgZm9yXG4gKiBvbmUtb2ZmIGNyZWF0aW9ucy5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gdHJhbnNmb3JtLlxuICogQHBhcmFtIGNvbmZpZyBBIGNvbmZpZ3VyYXRpb24gdGhhdCBwcm92aWRlcyBpbml0aWFsaXphdGlvbiBpbmZvcm1hdGlvbiB0byB0aGUgY3JlYXRlZCBjbGFzcy5cbiAqIEByZXR1cm5zIFRoZSBjdXN0b20tZWxlbWVudCBjb25zdHJ1Y3Rpb24gY2xhc3MsIHdoaWNoIGNhbiBiZSByZWdpc3RlcmVkIHdpdGhcbiAqIGEgYnJvd3NlcidzIGBDdXN0b21FbGVtZW50UmVnaXN0cnlgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUVsZW1lbnQ8UD4oXG4gICAgY29tcG9uZW50OiBUeXBlPGFueT4sIGNvbmZpZzogTmdFbGVtZW50Q29uZmlnKTogTmdFbGVtZW50Q29uc3RydWN0b3I8UD4ge1xuICBjb25zdCBpbnB1dHMgPSBnZXRDb21wb25lbnRJbnB1dHMoY29tcG9uZW50LCBjb25maWcuaW5qZWN0b3IpO1xuXG4gIGNvbnN0IHN0cmF0ZWd5RmFjdG9yeSA9XG4gICAgICBjb25maWcuc3RyYXRlZ3lGYWN0b3J5IHx8IG5ldyBDb21wb25lbnROZ0VsZW1lbnRTdHJhdGVneUZhY3RvcnkoY29tcG9uZW50LCBjb25maWcuaW5qZWN0b3IpO1xuXG4gIGNvbnN0IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMgPSBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyhpbnB1dHMpO1xuXG4gIGNsYXNzIE5nRWxlbWVudEltcGwgZXh0ZW5kcyBOZ0VsZW1lbnQge1xuICAgIC8vIFdvcmsgYXJvdW5kIGEgYnVnIGluIGNsb3N1cmUgdHlwZWQgb3B0aW1pemF0aW9ucyhiLzc5NTU3NDg3KSB3aGVyZSBpdCBpcyBub3QgaG9ub3Jpbmcgc3RhdGljXG4gICAgLy8gZmllbGQgZXh0ZXJucy4gU28gdXNpbmcgcXVvdGVkIGFjY2VzcyB0byBleHBsaWNpdGx5IHByZXZlbnQgcmVuYW1pbmcuXG4gICAgc3RhdGljIHJlYWRvbmx5WydvYnNlcnZlZEF0dHJpYnV0ZXMnXSA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMpO1xuXG4gICAgY29uc3RydWN0b3IoaW5qZWN0b3I/OiBJbmplY3Rvcikge1xuICAgICAgc3VwZXIoKTtcblxuICAgICAgLy8gTm90ZSB0aGF0IHNvbWUgcG9seWZpbGxzIChlLmcuIGRvY3VtZW50LXJlZ2lzdGVyLWVsZW1lbnQpIGRvIG5vdCBjYWxsIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgIC8vIERvIG5vdCBhc3N1bWUgdGhpcyBzdHJhdGVneSBoYXMgYmVlbiBjcmVhdGVkLlxuICAgICAgLy8gVE9ETyhhbmRyZXdzZWd1aW4pOiBBZGQgZTJlIHRlc3RzIHRoYXQgY292ZXIgY2FzZXMgd2hlcmUgdGhlIGNvbnN0cnVjdG9yIGlzbid0IGNhbGxlZC4gRm9yXG4gICAgICAvLyBub3cgdGhpcyBpcyB0ZXN0ZWQgdXNpbmcgYSBHb29nbGUgaW50ZXJuYWwgdGVzdCBzdWl0ZS5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kgPSBzdHJhdGVneUZhY3RvcnkuY3JlYXRlKGluamVjdG9yIHx8IGNvbmZpZy5pbmplY3Rvcik7XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgICAgICBhdHRyTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nfG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgICAgaWYgKCF0aGlzLm5nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kgPSBzdHJhdGVneUZhY3RvcnkuY3JlYXRlKGNvbmZpZy5pbmplY3Rvcik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb3BOYW1lID0gYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c1thdHRyTmFtZV0gITtcbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuc2V0SW5wdXRWYWx1ZShwcm9wTmFtZSwgbmV3VmFsdWUpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCk6IHZvaWQge1xuICAgICAgaWYgKCF0aGlzLm5nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kgPSBzdHJhdGVneUZhY3RvcnkuY3JlYXRlKGNvbmZpZy5pbmplY3Rvcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuY29ubmVjdCh0aGlzKTtcblxuICAgICAgLy8gTGlzdGVuIGZvciBldmVudHMgZnJvbSB0aGUgc3RyYXRlZ3kgYW5kIGRpc3BhdGNoIHRoZW0gYXMgY3VzdG9tIGV2ZW50c1xuICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LmV2ZW50cy5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQodGhpcy5vd25lckRvY3VtZW50ICEsIGUubmFtZSwgZS52YWx1ZSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICAgIGlmICh0aGlzLm5nRWxlbWVudFN0cmF0ZWd5KSB7XG4gICAgICAgIHRoaXMubmdFbGVtZW50U3RyYXRlZ3kuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5uZ0VsZW1lbnRFdmVudHNTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzIHRvIHRoZSBwcm90b3R5cGUgZm9yIGVhY2ggcHJvcGVydHkgaW5wdXQuIElmIHRoZSBjb25maWcgZG9lcyBub3RcbiAgLy8gY29udGFpbiBwcm9wZXJ0eSBpbnB1dHMsIHVzZSBhbGwgaW5wdXRzIGJ5IGRlZmF1bHQuXG4gIGlucHV0cy5tYXAoKHtwcm9wTmFtZX0pID0+IHByb3BOYW1lKS5mb3JFYWNoKHByb3BlcnR5ID0+IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTmdFbGVtZW50SW1wbC5wcm90b3R5cGUsIHByb3BlcnR5LCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5uZ0VsZW1lbnRTdHJhdGVneS5nZXRJbnB1dFZhbHVlKHByb3BlcnR5KTsgfSxcbiAgICAgIHNldDogZnVuY3Rpb24obmV3VmFsdWU6IGFueSkgeyB0aGlzLm5nRWxlbWVudFN0cmF0ZWd5LnNldElucHV0VmFsdWUocHJvcGVydHksIG5ld1ZhbHVlKTsgfSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiAoTmdFbGVtZW50SW1wbCBhcyBhbnkpIGFzIE5nRWxlbWVudENvbnN0cnVjdG9yPFA+O1xufVxuIl19