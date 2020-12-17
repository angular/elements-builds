/**
 * @license Angular v9.1.13
 * (c) 2010-2020 Google LLC. https://angular.io/
 * License: MIT
 */

import { ComponentFactoryResolver, Injector, ApplicationRef, SimpleChange, Version } from '@angular/core';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/utils.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
const ɵ0 = /**
 * @return {?}
 */
() => {
    /** @type {?} */
    const elProto = (/** @type {?} */ (Element.prototype));
    return elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
        elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
};
/** @type {?} */
const matches = ((ɵ0))();
/**
 * Provide methods for scheduling the execution of a callback.
 * @type {?}
 */
const scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     *
     * Returns a function that when executed will cancel the scheduled function.
     * @param {?} taskFn
     * @param {?} delay
     * @return {?}
     */
    schedule(taskFn, delay) {
        /** @type {?} */
        const id = setTimeout(taskFn, delay);
        return (/**
         * @return {?}
         */
        () => clearTimeout(id));
    },
    /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     *
     * Returns a function that when executed will cancel the scheduled function.
     * @param {?} taskFn
     * @return {?}
     */
    scheduleBeforeRender(taskFn) {
        // TODO(gkalpak): Implement a better way of accessing `requestAnimationFrame()`
        //                (e.g. accounting for vendor prefix, SSR-compatibility, etc).
        if (typeof window === 'undefined') {
            // For SSR just schedule immediately.
            return scheduler.schedule(taskFn, 0);
        }
        if (typeof window.requestAnimationFrame === 'undefined') {
            /** @type {?} */
            const frameMs = 16;
            return scheduler.schedule(taskFn, frameMs);
        }
        /** @type {?} */
        const id = window.requestAnimationFrame(taskFn);
        return (/**
         * @return {?}
         */
        () => window.cancelAnimationFrame(id));
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 * @param {?} input
 * @return {?}
 */
function camelToDashCase(input) {
    return input.replace(/[A-Z]/g, (/**
     * @param {?} char
     * @return {?}
     */
    char => `-${char.toLowerCase()}`));
}
/**
 * Create a `CustomEvent` (even on browsers where `CustomEvent` is not a constructor).
 * @param {?} doc
 * @param {?} name
 * @param {?} detail
 * @return {?}
 */
function createCustomEvent(doc, name, detail) {
    /** @type {?} */
    const bubbles = false;
    /** @type {?} */
    const cancelable = false;
    // On IE9-11, `CustomEvent` is not a constructor.
    if (typeof CustomEvent !== 'function') {
        /** @type {?} */
        const event = doc.createEvent('CustomEvent');
        event.initCustomEvent(name, bubbles, cancelable, detail);
        return event;
    }
    return new CustomEvent(name, { bubbles, cancelable, detail });
}
/**
 * Check whether the input is an `Element`.
 * @param {?} node
 * @return {?}
 */
function isElement(node) {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
}
/**
 * Check whether the input is a function.
 * @param {?} value
 * @return {?}
 */
function isFunction(value) {
    return typeof value === 'function';
}
/**
 * Convert a kebab-cased string to camelCased.
 * @param {?} input
 * @return {?}
 */
function kebabToCamelCase(input) {
    return input.replace(/-([a-z\d])/g, (/**
     * @param {?} _
     * @param {?} char
     * @return {?}
     */
    (_, char) => char.toUpperCase()));
}
/**
 * Check whether an `Element` matches a CSS selector.
 * @param {?} element
 * @param {?} selector
 * @return {?}
 */
function matchesSelector(element, selector) {
    return matches.call(element, selector);
}
/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 * @param {?} value1
 * @param {?} value2
 * @return {?}
 */
function strictEquals(value1, value2) {
    return value1 === value2 || (value1 !== value1 && value2 !== value2);
}
/**
 * Gets a map of default set of attributes to observe and the properties they affect.
 * @param {?} inputs
 * @return {?}
 */
function getDefaultAttributeToPropertyInputs(inputs) {
    /** @type {?} */
    const attributeToPropertyInputs = {};
    inputs.forEach((/**
     * @param {?} __0
     * @return {?}
     */
    ({ propName, templateName }) => {
        attributeToPropertyInputs[camelToDashCase(templateName)] = propName;
    }));
    return attributeToPropertyInputs;
}
/**
 * Gets a component's set of inputs. Uses the injector to get the component factory where the inputs
 * are defined.
 * @param {?} component
 * @param {?} injector
 * @return {?}
 */
function getComponentInputs(component, injector) {
    /** @type {?} */
    const componentFactoryResolver = injector.get(ComponentFactoryResolver);
    /** @type {?} */
    const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}

/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/extract-projectable-nodes.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @param {?} host
 * @param {?} ngContentSelectors
 * @return {?}
 */
function extractProjectableNodes(host, ngContentSelectors) {
    /** @type {?} */
    const nodes = host.childNodes;
    /** @type {?} */
    const projectableNodes = ngContentSelectors.map((/**
     * @return {?}
     */
    () => []));
    /** @type {?} */
    let wildcardIndex = -1;
    ngContentSelectors.some((/**
     * @param {?} selector
     * @param {?} i
     * @return {?}
     */
    (selector, i) => {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    }));
    for (let i = 0, ii = nodes.length; i < ii; ++i) {
        /** @type {?} */
        const node = nodes[i];
        /** @type {?} */
        const ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
        if (ngContentIndex !== -1) {
            projectableNodes[ngContentIndex].push(node);
        }
    }
    return projectableNodes;
}
/**
 * @param {?} node
 * @param {?} selectors
 * @param {?} defaultIndex
 * @return {?}
 */
function findMatchingIndex(node, selectors, defaultIndex) {
    /** @type {?} */
    let matchingIndex = defaultIndex;
    if (isElement(node)) {
        selectors.some((/**
         * @param {?} selector
         * @param {?} i
         * @return {?}
         */
        (selector, i) => {
            if ((selector !== '*') && matchesSelector(node, selector)) {
                matchingIndex = i;
                return true;
            }
            return false;
        }));
    }
    return matchingIndex;
}

/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/component-factory-strategy.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Time in milliseconds to wait before destroying the component ref when disconnected.
 * @type {?}
 */
const DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * \@publicApi
 */
class ComponentNgElementStrategyFactory {
    /**
     * @param {?} component
     * @param {?} injector
     */
    constructor(component, injector) {
        this.componentFactory =
            injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
    }
    /**
     * @param {?} injector
     * @return {?}
     */
    create(injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector);
    }
}
if (false) {
    /** @type {?} */
    ComponentNgElementStrategyFactory.prototype.componentFactory;
}
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * \@publicApi
 */
class ComponentNgElementStrategy {
    /**
     * @param {?} componentFactory
     * @param {?} injector
     */
    constructor(componentFactory, injector) {
        this.componentFactory = componentFactory;
        this.injector = injector;
        /**
         * Reference to the component that was created on connect.
         */
        this.componentRef = null;
        /**
         * Changes that have been made to the component ref since the last time onChanges was called.
         */
        this.inputChanges = null;
        /**
         * Whether the created component implements the onChanges function.
         */
        this.implementsOnChanges = false;
        /**
         * Whether a change detection has been scheduled to run on the component.
         */
        this.scheduledChangeDetectionFn = null;
        /**
         * Callback function that when called will cancel a scheduled destruction on the component.
         */
        this.scheduledDestroyFn = null;
        /**
         * Initial input values that were set before the component was created.
         */
        this.initialInputValues = new Map();
        /**
         * Set of component inputs that have not yet changed, i.e. for which `ngOnChanges()` has not
         * fired. (This is used to determine the value of `fistChange` in `SimpleChange` instances.)
         */
        this.unchangedInputs = new Set();
    }
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     * @param {?} element
     * @return {?}
     */
    connect(element) {
        // If the element is marked to be destroyed, cancel the task since the component was reconnected
        if (this.scheduledDestroyFn !== null) {
            this.scheduledDestroyFn();
            this.scheduledDestroyFn = null;
            return;
        }
        if (this.componentRef === null) {
            this.initializeComponent(element);
        }
    }
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     * @return {?}
     */
    disconnect() {
        // Return if there is no componentRef or the component is already scheduled for destruction
        if (this.componentRef === null || this.scheduledDestroyFn !== null) {
            return;
        }
        // Schedule the component to be destroyed after a small timeout in case it is being
        // moved elsewhere in the DOM
        this.scheduledDestroyFn = scheduler.schedule((/**
         * @return {?}
         */
        () => {
            if (this.componentRef !== null) {
                this.componentRef.destroy();
                this.componentRef = null;
            }
        }), DESTROY_DELAY);
    }
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     * @param {?} property
     * @return {?}
     */
    getInputValue(property) {
        if (this.componentRef === null) {
            return this.initialInputValues.get(property);
        }
        return this.componentRef.instance[property];
    }
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    setInputValue(property, value) {
        if (this.componentRef === null) {
            this.initialInputValues.set(property, value);
            return;
        }
        // Ignore the value if it is strictly equal to the current value, except if it is `undefined`
        // and this is the first change to the value (because an explicit `undefined` _is_ strictly
        // equal to not having a value set at all, but we still need to record this as a change).
        if (strictEquals(value, this.getInputValue(property)) &&
            !((value === undefined) && this.unchangedInputs.has(property))) {
            return;
        }
        this.recordInputChange(property, value);
        this.componentRef.instance[property] = value;
        this.scheduleDetectChanges();
    }
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     * @protected
     * @param {?} element
     * @return {?}
     */
    initializeComponent(element) {
        /** @type {?} */
        const childInjector = Injector.create({ providers: [], parent: this.injector });
        /** @type {?} */
        const projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.implementsOnChanges = isFunction(((/** @type {?} */ (this.componentRef.instance))).ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs(this.componentRef);
        this.detectChanges();
        /** @type {?} */
        const applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    }
    /**
     * Set any stored initial inputs on the component's properties.
     * @protected
     * @return {?}
     */
    initializeInputs() {
        this.componentFactory.inputs.forEach((/**
         * @param {?} __0
         * @return {?}
         */
        ({ propName }) => {
            if (this.implementsOnChanges) {
                // If the component implements `ngOnChanges()`, keep track of which inputs have never
                // changed so far.
                this.unchangedInputs.add(propName);
            }
            if (this.initialInputValues.has(propName)) {
                // Call `setInputValue()` now that the component has been instantiated to update its
                // properties and fire `ngOnChanges()`.
                this.setInputValue(propName, this.initialInputValues.get(propName));
            }
        }));
        this.initialInputValues.clear();
    }
    /**
     * Sets up listeners for the component's outputs so that the events stream emits the events.
     * @protected
     * @param {?} componentRef
     * @return {?}
     */
    initializeOutputs(componentRef) {
        /** @type {?} */
        const eventEmitters = this.componentFactory.outputs.map((/**
         * @param {?} __0
         * @return {?}
         */
        ({ propName, templateName }) => {
            /** @type {?} */
            const emitter = componentRef.instance[propName];
            return emitter.pipe(map((/**
             * @param {?} value
             * @return {?}
             */
            value => ({ name: templateName, value }))));
        }));
        this.events = merge(...eventEmitters);
    }
    /**
     * Calls ngOnChanges with all the inputs that have changed since the last call.
     * @protected
     * @param {?} componentRef
     * @return {?}
     */
    callNgOnChanges(componentRef) {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        /** @type {?} */
        const inputChanges = this.inputChanges;
        this.inputChanges = null;
        ((/** @type {?} */ (componentRef.instance))).ngOnChanges(inputChanges);
    }
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     * @protected
     * @return {?}
     */
    scheduleDetectChanges() {
        if (this.scheduledChangeDetectionFn) {
            return;
        }
        this.scheduledChangeDetectionFn = scheduler.scheduleBeforeRender((/**
         * @return {?}
         */
        () => {
            this.scheduledChangeDetectionFn = null;
            this.detectChanges();
        }));
    }
    /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     * @protected
     * @param {?} property
     * @param {?} currentValue
     * @return {?}
     */
    recordInputChange(property, currentValue) {
        // Do not record the change if the component does not implement `OnChanges`.
        // (We can only determine that after the component has been instantiated.)
        if (this.componentRef !== null && !this.implementsOnChanges) {
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        // If there already is a change, modify the current value to match but leave the values for
        // previousValue and isFirstChange.
        /** @type {?} */
        const pendingChange = this.inputChanges[property];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        /** @type {?} */
        const isFirstChange = this.unchangedInputs.has(property);
        this.unchangedInputs.delete(property);
        /** @type {?} */
        const previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    }
    /**
     * Runs change detection on the component.
     * @protected
     * @return {?}
     */
    detectChanges() {
        if (this.componentRef === null) {
            return;
        }
        this.callNgOnChanges(this.componentRef);
        this.componentRef.changeDetectorRef.detectChanges();
    }
}
if (false) {
    /**
     * Merged stream of the component's output events.
     * @type {?}
     */
    ComponentNgElementStrategy.prototype.events;
    /**
     * Reference to the component that was created on connect.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.componentRef;
    /**
     * Changes that have been made to the component ref since the last time onChanges was called.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.inputChanges;
    /**
     * Whether the created component implements the onChanges function.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.implementsOnChanges;
    /**
     * Whether a change detection has been scheduled to run on the component.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.scheduledChangeDetectionFn;
    /**
     * Callback function that when called will cancel a scheduled destruction on the component.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.scheduledDestroyFn;
    /**
     * Initial input values that were set before the component was created.
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.initialInputValues;
    /**
     * Set of component inputs that have not yet changed, i.e. for which `ngOnChanges()` has not
     * fired. (This is used to determine the value of `fistChange` in `SimpleChange` instances.)
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.unchangedInputs;
    /**
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.componentFactory;
    /**
     * @type {?}
     * @private
     */
    ComponentNgElementStrategy.prototype.injector;
}

/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/create-custom-element.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Prototype for a class constructor based on an Angular component
 * that can be used for custom element registration. Implemented and returned
 * by the {\@link createCustomElement createCustomElement() function}.
 *
 * \@publicApi
 * @record
 * @template P
 */
function NgElementConstructor() { }
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
class NgElement extends HTMLElement {
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
function NgElementConfig() { }
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
function createCustomElement(component, config) {
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
            this.injector = injector;
        }
        /**
         * @protected
         * @return {?}
         */
        get ngElementStrategy() {
            // NOTE:
            // Some polyfills (e.g. `document-register-element`) do not call the constructor, therefore
            // it is not safe to set `ngElementStrategy` in the constructor and assume it will be
            // available inside the methods.
            //
            // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
            // now this is tested using a Google internal test suite.
            if (!this._ngElementStrategy) {
                /** @type {?} */
                const strategy = this._ngElementStrategy =
                    strategyFactory.create(this.injector || config.injector);
                // Collect pre-existing values on the element to re-apply through the strategy.
                /** @type {?} */
                const preExistingValues = inputs.filter((/**
                 * @param {?} __0
                 * @return {?}
                 */
                ({ propName }) => this.hasOwnProperty(propName))).map((/**
                 * @param {?} __0
                 * @return {?}
                 */
                ({ propName }) => [propName, ((/** @type {?} */ (this)))[propName]]));
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
                    preExistingValues.forEach((/**
                     * @param {?} __0
                     * @return {?}
                     */
                    ([propName]) => delete ((/** @type {?} */ (this)))[propName]));
                }
                // Re-apply pre-existing values through the strategy.
                preExistingValues.forEach((/**
                 * @param {?} __0
                 * @return {?}
                 */
                ([propName, value]) => strategy.setInputValue(propName, value)));
            }
            return (/** @type {?} */ (this._ngElementStrategy));
        }
        /**
         * @param {?} attrName
         * @param {?} oldValue
         * @param {?} newValue
         * @param {?=} namespace
         * @return {?}
         */
        attributeChangedCallback(attrName, oldValue, newValue, namespace) {
            /** @type {?} */
            const propName = (/** @type {?} */ (attributeToPropertyInputs[attrName]));
            this.ngElementStrategy.setInputValue(propName, newValue);
        }
        /**
         * @return {?}
         */
        connectedCallback() {
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
            // Not using `this.ngElementStrategy` to avoid unnecessarily creating the `NgElementStrategy`.
            if (this._ngElementStrategy) {
                this._ngElementStrategy.disconnect();
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
        /**
         * @type {?}
         * @private
         */
        NgElementImpl.prototype._ngElementStrategy;
        /**
         * @type {?}
         * @private
         */
        NgElementImpl.prototype.injector;
    }
    // Add getters and setters to the prototype for each property input.
    defineInputGettersSetters(inputs, NgElementImpl.prototype);
    return (/** @type {?} */ (((/** @type {?} */ (NgElementImpl)))));
}
// Helpers
/**
 * @param {?} inputs
 * @param {?} target
 * @return {?}
 */
function defineInputGettersSetters(inputs, target) {
    // Add getters and setters for each property input.
    inputs.forEach((/**
     * @param {?} __0
     * @return {?}
     */
    ({ propName }) => {
        Object.defineProperty(target, propName, {
            /**
             * @return {?}
             */
            get() {
                return this.ngElementStrategy.getInputValue(propName);
            },
            /**
             * @param {?} newValue
             * @return {?}
             */
            set(newValue) {
                this.ngElementStrategy.setInputValue(propName, newValue);
            },
            configurable: true,
            enumerable: true,
        });
    }));
}

/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/version.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * \@publicApi
 * @type {?}
 */
const VERSION = new Version('9.1.13');

/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/public_api.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/index.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgElement, VERSION, createCustomElement };
//# sourceMappingURL=elements.js.map
