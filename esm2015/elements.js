/**
 * @license Angular v5.1.0-beta.0-200d92d
 * (c) 2010-2017 Google, Inc. https://angular.io/
 * License: MIT
 */
import { DOCUMENT } from '@angular/platform-browser';
import { ApplicationRef, EventEmitter, Injector, NgZone, SimpleChange, Version } from '@angular/core';

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
class NgElementApplicationContext {
    /**
     * @param {?} injector
     */
    constructor(injector) {
        this.injector = injector;
        this.applicationRef = this.injector.get(ApplicationRef);
        this.ngZone = this.injector.get(NgZone);
    }
    /**
     * @template R
     * @param {?} cb
     * @return {?}
     */
    runInNgZone(cb) { return this.ngZone.run(cb); }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
const elProto = /** @type {?} */ (Element.prototype);
const matches = elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
    elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
/**
 * Provide methods for scheduling the execution of a callback.
 */
const scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     * @param {?} cb
     * @param {?} delay
     * @return {?}
     */
    schedule(cb, delay) { const /** @type {?} */ id = window.setTimeout(cb, delay); return () => window.clearTimeout(id); },
    /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     * @param {?} cb
     * @return {?}
     */
    scheduleBeforeRender(cb) {
        // TODO(gkalpak): Implement a better way of accessing `requestAnimationFrame()`
        //                (e.g. accounting for vendor prefix, SSR-compatibility, etc).
        if (typeof window.requestAnimationFrame === 'undefined') {
            return scheduler.schedule(cb, 16);
        }
        const /** @type {?} */ id = window.requestAnimationFrame(cb);
        return () => window.cancelAnimationFrame(id);
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 * @param {?} input
 * @return {?}
 */
function camelToKebabCase(input) {
    return input.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
}
/**
 * Create a `CustomEvent` (even on browsers where `CustomEvent` is not a constructor).
 * @param {?} doc
 * @param {?} name
 * @param {?} detail
 * @return {?}
 */
function createCustomEvent(doc, name, detail) {
    const /** @type {?} */ bubbles = false;
    const /** @type {?} */ cancelable = false;
    // On IE9-11, `CustomEvent` is not a constructor.
    if (typeof CustomEvent !== 'function') {
        const /** @type {?} */ event = doc.createEvent('CustomEvent');
        event.initCustomEvent(name, bubbles, cancelable, detail);
        return event;
    }
    return new CustomEvent(name, { bubbles, cancelable, detail });
}
/**
 * Return the name of the component or the first line of its stringified version.
 * @param {?} component
 * @return {?}
 */
function getComponentName(component) {
    return (/** @type {?} */ (component)).overriddenName || component.name ||
        component.toString().split('\n', 1)[0];
}
/**
 * Check whether the input is an `Element`.
 * @param {?} node
 * @return {?}
 */
function isElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
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
 * Throw an error with the specified message.
 * (It provides a centralized place where it is easy to apply some change/behavior to all errors.)
 * @param {?} message
 * @return {?}
 */
function throwError(message) {
    throw Error(message);
}

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
// NOTE: This is a (slightly improved) version of what is used in ngUpgrade's
//       `DowngradeComponentAdapter`.
// TODO(gkalpak): Investigate if it makes sense to share the code.
/**
 * @param {?} host
 * @param {?} ngContentSelectors
 * @return {?}
 */
function extractProjectableNodes(host, ngContentSelectors) {
    const /** @type {?} */ nodes = host.childNodes;
    const /** @type {?} */ projectableNodes = ngContentSelectors.map(() => []);
    let /** @type {?} */ wildcardIndex = -1;
    ngContentSelectors.some((selector, i) => {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    });
    for (let /** @type {?} */ i = 0, /** @type {?} */ ii = nodes.length; i < ii; ++i) {
        const /** @type {?} */ node = nodes[i];
        const /** @type {?} */ ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
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
    let /** @type {?} */ matchingIndex = defaultIndex;
    if (isElement(node)) {
        selectors.some((selector, i) => {
            if ((selector !== '*') && matchesSelector(node, selector)) {
                matchingIndex = i;
                return true;
            }
            return false;
        });
    }
    return matchingIndex;
}

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
/**
 * TODO(gkalpak): Add docs.
 * \@experimental
 * @record
 */

/**
 * Represents an `NgElement` input.
 * Similar to a `ComponentFactory` input (`{propName: string, templateName: string}`),
 * except that `attrName` is derived by kebab-casing `templateName`.
 * @record
 */

/**
 * Represents an `NgElement` input.
 * Similar to a `ComponentFactory` output (`{propName: string, templateName: string}`),
 * except that `templateName` is renamed to `eventName`.
 * @record
 */

/**
 * @abstract
 */
class NgElementImpl extends HTMLElement {
    /**
     * @param {?} appContext
     * @param {?} componentFactory
     * @param {?} inputs
     * @param {?} outputs
     */
    constructor(appContext, componentFactory, inputs, outputs) {
        super();
        this.appContext = appContext;
        this.componentFactory = componentFactory;
        this.inputs = inputs;
        this.outputs = outputs;
        this.ngElement = null;
        this.componentRef = null;
        this.onConnected = new EventEmitter();
        this.onDisconnected = new EventEmitter();
        this.host = /** @type {?} */ (this);
        this.componentName = getComponentName(this.componentFactory.componentType);
        this.initialInputValues = new Map();
        this.uninitializedInputs = new Set();
        this.outputSubscriptions = new Map();
        this.inputChanges = null;
        this.implementsOnChanges = false;
        this.changeDetectionScheduled = false;
        this.lifecyclePhase = "unconnected" /* unconnected */;
        this.cancelDestruction = null;
    }
    /**
     * @param {?} attrName
     * @param {?} oldValue
     * @param {?} newValue
     * @param {?=} namespace
     * @return {?}
     */
    attributeChangedCallback(attrName, oldValue, newValue, namespace) {
        const /** @type {?} */ input = /** @type {?} */ ((this.inputs.find(input => input.attrName === attrName)));
        if (input) {
            this.setInputValue(input.propName, newValue);
        }
        else {
            throwError(`Calling 'attributeChangedCallback()' with unknown attribute '${attrName}' ` +
                `on component '${this.componentName}' is not allowed.`);
        }
    }
    /**
     * @param {?=} ignoreUpgraded
     * @return {?}
     */
    connectedCallback(ignoreUpgraded = false) {
        this.assertNotInPhase("disconnected" /* disconnected */, 'connectedCallback');
        if (this.cancelDestruction !== null) {
            this.cancelDestruction();
            this.cancelDestruction = null;
        }
        if (this.lifecyclePhase === "connected" /* connected */) {
            return;
        }
        const /** @type {?} */ host = /** @type {?} */ (this.host);
        if (host.ngElement) {
            if (ignoreUpgraded) {
                return;
            }
            const /** @type {?} */ existingNgElement = (/** @type {?} */ (host)).ngElement;
            const /** @type {?} */ existingComponentName = getComponentName(existingNgElement.componentRef.componentType);
            throwError(`Upgrading '${this.host.nodeName}' element to component '${this.componentName}' is not allowed, ` +
                `because the element is already upgraded to component '${existingComponentName}'.`);
        }
        this.appContext.runInNgZone(() => {
            this.lifecyclePhase = "connected" /* connected */;
            const /** @type {?} */ cThis = (/** @type {?} */ ((this)));
            const /** @type {?} */ childInjector = Injector.create([], cThis.appContext.injector);
            const /** @type {?} */ projectableNodes = extractProjectableNodes(cThis.host, cThis.componentFactory.ngContentSelectors);
            cThis.componentRef =
                cThis.componentFactory.create(childInjector, projectableNodes, cThis.host);
            cThis.implementsOnChanges =
                isFunction((/** @type {?} */ ((cThis.componentRef.instance))).ngOnChanges);
            cThis.initializeInputs();
            cThis.initializeOutputs();
            cThis.detectChanges();
            cThis.appContext.applicationRef.attachView(cThis.componentRef.hostView);
            // Ensure `ngElement` is set on the host too (even for manually upgraded elements)
            // in order to be able to detect that the element has been been upgraded.
            cThis.ngElement = host.ngElement = cThis;
            cThis.onConnected.emit();
        });
    }
    /**
     * @return {?}
     */
    detach() { this.disconnectedCallback(); }
    /**
     * @return {?}
     */
    detectChanges() {
        if (this.lifecyclePhase === "disconnected" /* disconnected */) {
            return;
        }
        this.assertNotInPhase("unconnected" /* unconnected */, 'detectChanges');
        this.appContext.runInNgZone(() => {
            const /** @type {?} */ cThis = /** @type {?} */ ((this));
            cThis.changeDetectionScheduled = false;
            cThis.callNgOnChanges();
            cThis.componentRef.changeDetectorRef.detectChanges();
        });
    }
    /**
     * @return {?}
     */
    disconnectedCallback() {
        if (this.lifecyclePhase === "disconnected" /* disconnected */ ||
            this.cancelDestruction !== null) {
            return;
        }
        this.assertNotInPhase("unconnected" /* unconnected */, 'disconnectedCallback');
        const /** @type {?} */ doDestroy = () => this.appContext.runInNgZone(() => this.destroy());
        this.cancelDestruction = scheduler.schedule(doDestroy, NgElementImpl.DESTROY_DELAY);
    }
    /**
     * @return {?}
     */
    getHost() { return this.host; }
    /**
     * @param {?} propName
     * @return {?}
     */
    getInputValue(propName) {
        this.assertNotInPhase("disconnected" /* disconnected */, 'getInputValue');
        if (this.lifecyclePhase === "unconnected" /* unconnected */) {
            return this.initialInputValues.get(propName);
        }
        const /** @type {?} */ cThis = /** @type {?} */ ((this));
        return (/** @type {?} */ (cThis.componentRef.instance))[propName];
    }
    /**
     * @return {?}
     */
    markDirty() {
        if (!this.changeDetectionScheduled) {
            this.changeDetectionScheduled = true;
            scheduler.scheduleBeforeRender(() => this.detectChanges());
        }
    }
    /**
     * @param {?} host
     * @return {?}
     */
    setHost(host) {
        this.assertNotInPhase("connected" /* connected */, 'setHost');
        this.assertNotInPhase("disconnected" /* disconnected */, 'setHost');
        this.host = host;
    }
    /**
     * @param {?} propName
     * @param {?} newValue
     * @return {?}
     */
    setInputValue(propName, newValue) {
        this.assertNotInPhase("disconnected" /* disconnected */, 'setInputValue');
        if (this.lifecyclePhase === "unconnected" /* unconnected */) {
            this.initialInputValues.set(propName, newValue);
            return;
        }
        const /** @type {?} */ cThis = /** @type {?} */ ((this));
        if (!strictEquals(newValue, cThis.getInputValue(propName))) {
            cThis.recordInputChange(propName, newValue);
            (/** @type {?} */ (cThis.componentRef.instance))[propName] = newValue;
            cThis.markDirty();
        }
    }
    /**
     * @param {?} phase
     * @param {?} caller
     * @return {?}
     */
    assertNotInPhase(phase, caller) {
        if (this.lifecyclePhase === phase) {
            throwError(`Calling '${caller}()' on ${phase} component '${this.componentName}' is not allowed.`);
        }
    }
    /**
     * @this {?}
     * @return {?}
     */
    callNgOnChanges() {
        if (this.implementsOnChanges && this.inputChanges !== null) {
            const /** @type {?} */ inputChanges = this.inputChanges;
            this.inputChanges = null;
            (/** @type {?} */ ((this.componentRef.instance))).ngOnChanges(inputChanges);
        }
    }
    /**
     * @return {?}
     */
    destroy() {
        const /** @type {?} */ cThis = /** @type {?} */ ((this));
        cThis.componentRef.destroy();
        cThis.outputs.forEach(output => cThis.unsubscribeFromOutput(output));
        this.ngElement = (/** @type {?} */ (this.host)).ngElement = null;
        cThis.host.innerHTML = '';
        cThis.lifecyclePhase = "disconnected" /* disconnected */;
        cThis.onDisconnected.emit();
    }
    /**
     * @param {?} eventName
     * @param {?} value
     * @return {?}
     */
    dispatchCustomEvent(eventName, value) {
        const /** @type {?} */ event = createCustomEvent(this.host.ownerDocument, eventName, value);
        this.dispatchEvent(event);
        if (this.host !== this) {
            this.host.dispatchEvent(event);
        }
    }
    /**
     * @return {?}
     */
    initializeInputs() {
        this.inputs.forEach(({ propName, attrName }) => {
            let /** @type {?} */ initialValue;
            if (this.initialInputValues.has(propName)) {
                // The property has already been set (prior to initialization).
                // Update the component instance.
                initialValue = this.initialInputValues.get(propName);
            }
            else if (this.host.hasAttribute(attrName)) {
                // A matching attribute exists.
                // Update the component instance.
                initialValue = this.host.getAttribute(attrName);
            }
            else {
                // The property does not have an initial value.
                this.uninitializedInputs.add(propName);
            }
            if (!this.uninitializedInputs.has(propName)) {
                // The property does have an initial value.
                // Forward it to the component instance.
                this.setInputValue(propName, initialValue);
            }
        });
        this.initialInputValues.clear();
    }
    /**
     * @this {?}
     * @return {?}
     */
    initializeOutputs() {
        this.outputs.forEach(output => this.subscribeToOutput(output));
    }
    /**
     * @param {?} propName
     * @param {?} currentValue
     * @return {?}
     */
    recordInputChange(propName, currentValue) {
        if (!this.implementsOnChanges) {
            // The component does not implement `OnChanges`. Ignore the change.
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        const /** @type {?} */ pendingChange = this.inputChanges[propName];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        const /** @type {?} */ isFirstChange = this.uninitializedInputs.has(propName);
        const /** @type {?} */ previousValue = isFirstChange ? undefined : this.getInputValue(propName);
        this.inputChanges[propName] = new SimpleChange(previousValue, currentValue, isFirstChange);
        if (isFirstChange) {
            this.uninitializedInputs.delete(propName);
        }
    }
    /**
     * @this {?}
     * @param {?} output
     * @return {?}
     */
    subscribeToOutput(output) {
        const { propName, eventName } = output;
        const /** @type {?} */ emitter = /** @type {?} */ ((/** @type {?} */ (this.componentRef.instance))[output.propName]);
        if (!emitter) {
            throwError(`Missing emitter '${propName}' on component '${this.componentName}'.`);
        }
        this.unsubscribeFromOutput(output);
        const /** @type {?} */ subscription = emitter.subscribe((value) => this.dispatchCustomEvent(eventName, value));
        this.outputSubscriptions.set(propName, subscription);
    }
    /**
     * @param {?} __0
     * @return {?}
     */
    unsubscribeFromOutput({ propName }) {
        if (!this.outputSubscriptions.has(propName)) {
            return;
        }
        const /** @type {?} */ subscription = /** @type {?} */ ((this.outputSubscriptions.get(propName)));
        this.outputSubscriptions.delete(propName);
        subscription.unsubscribe();
    }
}
NgElementImpl.DESTROY_DELAY = 10;

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
/**
 * TODO(gkalpak): Add docs.
 * \@experimental
 * @record
 */

/**
 * @record
 */

// For more info on `PotentialCustomElementName` rules see:
// https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
const PCEN_RE = createPcenRe();
const PCEN_BLACKLIST = [
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph',
];
/**
 * @template T, P
 * @param {?} appContext
 * @param {?} componentFactory
 * @return {?}
 */
function createNgElementConstructor(appContext, componentFactory) {
    const /** @type {?} */ selector = componentFactory.selector;
    if (!isPotentialCustomElementName(selector)) {
        throwError(`Using '${selector}' as a custom element name is not allowed. ` +
            'See https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name for more info.');
    }
    const /** @type {?} */ inputs = componentFactory.inputs.map(({ propName, templateName }) => ({
        propName,
        attrName: camelToKebabCase(templateName),
    }));
    const /** @type {?} */ outputs = componentFactory.outputs.map(({ propName, templateName }) => ({
        propName,
        // TODO(gkalpak): Verify this is what we want and document.
        eventName: templateName,
    }));
    class NgElementConstructorImpl extends NgElementImpl {
        constructor() {
            super(appContext, componentFactory, inputs, outputs);
            const /** @type {?} */ ngElement = /** @type {?} */ (this);
            this.onConnected.subscribe(() => NgElementConstructorImpl.onConnected.emit(ngElement));
            this.onDisconnected.subscribe(() => NgElementConstructorImpl.onDisconnected.emit(ngElement));
        }
        /**
         * @param {?} host
         * @param {?=} ignoreUpgraded
         * @return {?}
         */
        static upgrade(host, ignoreUpgraded = false) {
            const /** @type {?} */ ngElement = new NgElementConstructorImpl();
            ngElement.setHost(host);
            ngElement.connectedCallback(ignoreUpgraded);
            return /** @type {?} */ (ngElement);
        }
    }
    NgElementConstructorImpl.is = selector;
    NgElementConstructorImpl.observedAttributes = inputs.map(input => input.attrName);
    NgElementConstructorImpl.onConnected = new EventEmitter();
    NgElementConstructorImpl.onDisconnected = new EventEmitter();
    inputs.forEach(({ propName }) => {
        Object.defineProperty(NgElementConstructorImpl.prototype, propName, {
            get: function () { return this.getInputValue(propName); },
            set: function (newValue) {
                this.setInputValue(propName, newValue);
            },
            configurable: true,
            enumerable: true,
        });
    });
    return /** @type {?} */ (NgElementConstructorImpl);
}
/**
 * @return {?}
 */
function createPcenRe() {
    // According to [the
    // spec](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name),
    // `pcenChar` is allowed to contain Unicode characters in the 10000-EFFFF range. But in order to
    // match this characters with a RegExp, we need the implementation to support the `u` flag.
    // On browsers that do not support it, valid PotentialCustomElementNames using characters in the
    // 10000-EFFFF range will still cause an error (but these characters are not expected to be used
    // in practice).
    let /** @type {?} */ pcenChar = '-.0-9_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u037D\\u037F-\\u1FFF' +
        '\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF' +
        '\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
    let /** @type {?} */ flags = '';
    if (RegExp.prototype.hasOwnProperty('unicode')) {
        pcenChar += '\\u{10000}-\\u{EFFFF}';
        flags += 'u';
    }
    return RegExp(`^[a-z][${pcenChar}]*-[${pcenChar}]*$`, flags);
}
/**
 * @param {?} name
 * @return {?}
 */
function isPotentialCustomElementName(name) {
    return PCEN_RE.test(name) && (PCEN_BLACKLIST.indexOf(name) === -1);
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * TODO(gkalpak): Add docs.
 * \@experimental
 */
class NgElements {
    /**
     * @param {?} moduleRef
     * @param {?} customElementComponents
     */
    constructor(moduleRef, customElementComponents) {
        this.moduleRef = moduleRef;
        this.doc = this.moduleRef.injector.get(DOCUMENT);
        this.definitions = new Map();
        this.upgradedElements = new Set();
        this.appContext = new NgElementApplicationContext(this.moduleRef.injector);
        this.changeDetectionScheduled = false;
        const /** @type {?} */ resolver = moduleRef.componentFactoryResolver;
        customElementComponents.forEach(componentType => this.defineNgElement(this.appContext, resolver, componentType));
    }
    /**
     * @param {?=} root
     * @return {?}
     */
    detachAll(root = this.doc.documentElement) {
        const /** @type {?} */ upgradedElements = Array.from(this.upgradedElements.values());
        const /** @type {?} */ elementsToDetach = [];
        this.traverseTree(root, (node) => {
            upgradedElements.some(ngElement => {
                if (ngElement.getHost() === node) {
                    elementsToDetach.push(ngElement);
                    return true;
                }
                return false;
            });
        });
        // Detach in reverse traversal order.
        this.appContext.runInNgZone(() => elementsToDetach.reverse().forEach(ngElement => ngElement.detach()));
    }
    /**
     * @return {?}
     */
    detectChanges() {
        this.changeDetectionScheduled = false;
        this.appContext.runInNgZone(() => this.upgradedElements.forEach(ngElement => ngElement.detectChanges()));
    }
    /**
     * @param {?} cb
     * @return {?}
     */
    forEach(cb) {
        return this.definitions.forEach(cb);
    }
    /**
     * @template C, P
     * @param {?} selector
     * @return {?}
     */
    get(selector) {
        return this.definitions.get(selector);
    }
    /**
     * @return {?}
     */
    markDirty() {
        if (!this.changeDetectionScheduled) {
            this.changeDetectionScheduled = true;
            scheduler.scheduleBeforeRender(() => this.detectChanges());
        }
    }
    /**
     * @param {?=} customElements
     * @return {?}
     */
    register(customElements) {
        if (!customElements && (typeof window !== 'undefined')) {
            customElements = window.customElements;
        }
        if (!customElements) {
            throwError('Custom Elements are not supported in this environment.');
        }
        this.definitions.forEach(def => /** @type {?} */ ((customElements)).define(def.is, def));
    }
    /**
     * @param {?=} root
     * @return {?}
     */
    upgradeAll(root = this.doc.documentElement) {
        const /** @type {?} */ definitions = Array.from(this.definitions.values());
        this.appContext.runInNgZone(() => {
            this.traverseTree(root, (node) => {
                const /** @type {?} */ nodeName = node.nodeName.toLowerCase();
                definitions.some(def => {
                    if (def.is === nodeName) {
                        // TODO(gkalpak): What happens if `node` contains more custom elements
                        //                (as projectable content)?
                        def.upgrade(node, true);
                        return true;
                    }
                    return false;
                });
            });
        });
    }
    /**
     * @param {?} appContext
     * @param {?} resolver
     * @param {?} componentType
     * @return {?}
     */
    defineNgElement(appContext, resolver, componentType) {
        const /** @type {?} */ componentFactory = resolver.resolveComponentFactory(componentType);
        const /** @type {?} */ def = createNgElementConstructor(appContext, componentFactory);
        const /** @type {?} */ selector = def.is;
        if (this.definitions.has(selector)) {
            throwError(`Defining an Angular custom element with selector '${selector}' is not allowed, ` +
                'because one is already defined.');
        }
        def.onConnected.subscribe((ngElement) => this.upgradedElements.add(ngElement));
        def.onDisconnected.subscribe((ngElement) => this.upgradedElements.delete(ngElement));
        this.definitions.set(selector, def);
    }
    /**
     * @param {?} root
     * @param {?} cb
     * @return {?}
     */
    traverseTree(root, cb) {
        let /** @type {?} */ currentNode = root;
        const /** @type {?} */ getNextNonDescendant = (node) => {
            let /** @type {?} */ currNode = node;
            let /** @type {?} */ nextNode = null;
            while (!nextNode && currNode && (currNode !== root)) {
                nextNode = currNode.nextElementSibling;
                currNode = currNode.parentElement;
            }
            return nextNode;
        };
        while (currentNode) {
            if (currentNode instanceof HTMLElement) {
                cb(currentNode);
            }
            currentNode = currentNode.firstElementChild || getNextNonDescendant(currentNode);
        }
    }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @template T
 * @param {?} customElementComponents
 * @param {?} platformRefOrBootstrapFn
 * @param {?=} moduleFactory
 * @return {?}
 */
function registerAsCustomElements(customElementComponents, platformRefOrBootstrapFn, moduleFactory) {
    const /** @type {?} */ bootstrapFn = isFunction(platformRefOrBootstrapFn) ?
        platformRefOrBootstrapFn :
        () => platformRefOrBootstrapFn.bootstrapModuleFactory(/** @type {?} */ ((moduleFactory)));
    return bootstrapFn().then(moduleRef => {
        const /** @type {?} */ ngElements = new NgElements(moduleRef, customElementComponents);
        ngElements.register();
        return moduleRef;
    });
}

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
/**
 * \@experimental
 */
const VERSION = new Version('5.1.0-beta.0-200d92d');

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

// This file only reexports content of the `src` folder. Keep it that way.

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Generated bundle index. Do not edit.
 */

export { registerAsCustomElements, VERSION };
//# sourceMappingURL=elements.js.map
