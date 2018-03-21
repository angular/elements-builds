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
 * Class constructor based on an Angular Component to be used for custom element registration.
 *
 * \@experimental
 * @record
 * @template P
 */
export function NgElementConstructor() { }
function NgElementConstructor_tsickle_Closure_declarations() {
    /** @type {?} */
    NgElementConstructor.prototype.observedAttributes;
    /* TODO: handle strange member:
    new (injector: Injector): NgElement&WithProperties<P>;
    */
}
/**
 * Class that extends HTMLElement and implements the functionality needed for a custom element.
 *
 * \@experimental
 * @abstract
 */
export class NgElement extends HTMLElement {
    constructor() {
        super(...arguments);
        this.ngElementEventsSubscription = null;
    }
}
function NgElement_tsickle_Closure_declarations() {
    /** @type {?} */
    NgElement.prototype.ngElementStrategy;
    /** @type {?} */
    NgElement.prototype.ngElementEventsSubscription;
    /**
     * @abstract
     * @param {?} attrName
     * @param {?} oldValue
     * @param {?} newValue
     * @param {?=} namespace
     * @return {?}
     */
    NgElement.prototype.attributeChangedCallback = function (attrName, oldValue, newValue, namespace) { };
    /**
     * @abstract
     * @return {?}
     */
    NgElement.prototype.connectedCallback = function () { };
    /**
     * @abstract
     * @return {?}
     */
    NgElement.prototype.disconnectedCallback = function () { };
}
/**
 * Initialization configuration for the NgElementConstructor which contains the injector to be used
 * for retrieving the component's factory as well as the default context for the component. May
 * provide a custom strategy factory to be used instead of the default.
 *
 * \@experimental
 * @record
 */
export function NgElementConfig() { }
function NgElementConfig_tsickle_Closure_declarations() {
    /** @type {?} */
    NgElementConfig.prototype.injector;
    /** @type {?|undefined} */
    NgElementConfig.prototype.strategyFactory;
}
/**
 * \@whatItDoes Creates a custom element class based on an Angular Component. Takes a configuration
 * that provides initialization information to the created class. E.g. the configuration's injector
 * will be the initial injector set on the class which will be used for each created instance.
 *
 * \@description Builds a class that encapsulates the functionality of the provided component and
 * uses the config's information to provide more context to the class. Takes the component factory's
 * inputs and outputs to convert them to the proper custom element API and add hooks to input
 * changes. Passes the config's injector to each created instance (may be overridden with the
 * static property to affect all newly created instances, or as a constructor argument for
 * one-off creations).
 *
 * \@experimental
 * @template P
 * @param {?} component
 * @param {?} config
 * @return {?}
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
            const /** @type {?} */ propName = /** @type {?} */ ((attributeToPropertyInputs[attrName]));
            this.ngElementStrategy.setInputValue(propName, newValue);
        }
        /**
         * @return {?}
         */
        connectedCallback() {
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
            this.ngElementStrategy.disconnect();
            if (this.ngElementEventsSubscription) {
                this.ngElementEventsSubscription.unsubscribe();
                this.ngElementEventsSubscription = null;
            }
        }
    }
    NgElementImpl.observedAttributes = Object.keys(attributeToPropertyInputs);
    function NgElementImpl_tsickle_Closure_declarations() {
        /** @type {?} */
        NgElementImpl.observedAttributes;
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
//# sourceMappingURL=create-custom-element.js.map