/**
 * @license Angular v5.1.0-beta.0-21bfaf2
 * (c) 2010-2017 Google, Inc. https://angular.io/
 * License: MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/platform-browser'), require('@angular/core')) :
	typeof define === 'function' && define.amd ? define('@angular/elements', ['exports', '@angular/platform-browser', '@angular/core'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.elements = {}),global.ng.platformBrowser,global.ng.core));
}(this, (function (exports,_angular_platformBrowser,_angular_core) { 'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/**
 * @license Angular v5.1.0-beta.0-21bfaf2
 * (c) 2010-2017 Google, Inc. https://angular.io/
 * License: MIT
 */
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
var NgElementApplicationContext = (function () {
    function NgElementApplicationContext(injector) {
        this.injector = injector;
        this.applicationRef = this.injector.get(_angular_core.ApplicationRef);
        this.ngZone = this.injector.get(_angular_core.NgZone);
    }
    /**
     * @template R
     * @param {?} cb
     * @return {?}
     */
    NgElementApplicationContext.prototype.runInNgZone = /**
     * @template R
     * @param {?} cb
     * @return {?}
     */
    function (cb) { return this.ngZone.run(cb); };
    return NgElementApplicationContext;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var elProto = /** @type {?} */ (Element.prototype);
var matches = elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
    elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
/**
 * Provide methods for scheduling the execution of a callback.
 */
var scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     */
    schedule: /**
     * Schedule a callback to be called after some delay.
     * @param {?} cb
     * @param {?} delay
     * @return {?}
     */
    function (cb, delay) { var /** @type {?} */ id = window.setTimeout(cb, delay); return function () { return window.clearTimeout(id); }; },
    /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     */
    scheduleBeforeRender: /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     * @param {?} cb
     * @return {?}
     */
    function (cb) {
        // TODO(gkalpak): Implement a better way of accessing `requestAnimationFrame()`
        //                (e.g. accounting for vendor prefix, SSR-compatibility, etc).
        if (typeof window.requestAnimationFrame === 'undefined') {
            return scheduler.schedule(cb, 16);
        }
        var /** @type {?} */ id = window.requestAnimationFrame(cb);
        return function () { return window.cancelAnimationFrame(id); };
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 * @param {?} input
 * @return {?}
 */
function camelToKebabCase(input) {
    return input.replace(/[A-Z]/g, function (char) { return "-" + char.toLowerCase(); });
}
/**
 * Create a `CustomEvent` (even on browsers where `CustomEvent` is not a constructor).
 * @param {?} doc
 * @param {?} name
 * @param {?} detail
 * @return {?}
 */
function createCustomEvent(doc, name, detail) {
    var /** @type {?} */ bubbles = false;
    var /** @type {?} */ cancelable = false;
    // On IE9-11, `CustomEvent` is not a constructor.
    if (typeof CustomEvent !== 'function') {
        var /** @type {?} */ event_1 = doc.createEvent('CustomEvent');
        event_1.initCustomEvent(name, bubbles, cancelable, detail);
        return event_1;
    }
    return new CustomEvent(name, { bubbles: bubbles, cancelable: cancelable, detail: detail });
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
    var /** @type {?} */ nodes = host.childNodes;
    var /** @type {?} */ projectableNodes = ngContentSelectors.map(function () { return []; });
    var /** @type {?} */ wildcardIndex = -1;
    ngContentSelectors.some(function (selector, i) {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    });
    for (var /** @type {?} */ i = 0, /** @type {?} */ ii = nodes.length; i < ii; ++i) {
        var /** @type {?} */ node = nodes[i];
        var /** @type {?} */ ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
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
    var /** @type {?} */ matchingIndex = defaultIndex;
    if (isElement(node)) {
        selectors.some(function (selector, i) {
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
var NgElementImpl = (function (_super) {
    __extends(NgElementImpl, _super);
    function NgElementImpl(appContext, componentFactory, inputs, outputs) {
        var _this = _super.call(this) || this;
        _this.appContext = appContext;
        _this.componentFactory = componentFactory;
        _this.inputs = inputs;
        _this.outputs = outputs;
        _this.ngElement = null;
        _this.componentRef = null;
        _this.onConnected = new _angular_core.EventEmitter();
        _this.onDisconnected = new _angular_core.EventEmitter();
        _this.host = /** @type {?} */ (_this);
        _this.componentName = getComponentName(_this.componentFactory.componentType);
        _this.initialInputValues = new Map();
        _this.uninitializedInputs = new Set();
        _this.outputSubscriptions = new Map();
        _this.inputChanges = null;
        _this.implementsOnChanges = false;
        _this.changeDetectionScheduled = false;
        _this.lifecyclePhase = "unconnected" /* unconnected */;
        _this.cancelDestruction = null;
        return _this;
    }
    /**
     * @param {?} attrName
     * @param {?} oldValue
     * @param {?} newValue
     * @param {?=} namespace
     * @return {?}
     */
    NgElementImpl.prototype.attributeChangedCallback = /**
     * @param {?} attrName
     * @param {?} oldValue
     * @param {?} newValue
     * @param {?=} namespace
     * @return {?}
     */
    function (attrName, oldValue, newValue, namespace) {
        var /** @type {?} */ input = /** @type {?} */ ((this.inputs.find(function (input) { return input.attrName === attrName; })));
        if (input) {
            this.setInputValue(input.propName, newValue);
        }
        else {
            throwError("Calling 'attributeChangedCallback()' with unknown attribute '" + attrName + "' " +
                ("on component '" + this.componentName + "' is not allowed."));
        }
    };
    /**
     * @param {?=} ignoreUpgraded
     * @return {?}
     */
    NgElementImpl.prototype.connectedCallback = /**
     * @param {?=} ignoreUpgraded
     * @return {?}
     */
    function (ignoreUpgraded) {
        var _this = this;
        if (ignoreUpgraded === void 0) { ignoreUpgraded = false; }
        this.assertNotInPhase("disconnected" /* disconnected */, 'connectedCallback');
        if (this.cancelDestruction !== null) {
            this.cancelDestruction();
            this.cancelDestruction = null;
        }
        if (this.lifecyclePhase === "connected" /* connected */) {
            return;
        }
        var /** @type {?} */ host = /** @type {?} */ (this.host);
        if (host.ngElement) {
            if (ignoreUpgraded) {
                return;
            }
            var /** @type {?} */ existingNgElement = (/** @type {?} */ (host)).ngElement;
            var /** @type {?} */ existingComponentName = getComponentName(existingNgElement.componentRef.componentType);
            throwError("Upgrading '" + this.host.nodeName + "' element to component '" + this.componentName + "' is not allowed, " +
                ("because the element is already upgraded to component '" + existingComponentName + "'."));
        }
        this.appContext.runInNgZone(function () {
            _this.lifecyclePhase = "connected" /* connected */;
            var /** @type {?} */ cThis = (/** @type {?} */ ((_this)));
            var /** @type {?} */ childInjector = _angular_core.Injector.create([], cThis.appContext.injector);
            var /** @type {?} */ projectableNodes = extractProjectableNodes(cThis.host, cThis.componentFactory.ngContentSelectors);
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
    };
    /**
     * @return {?}
     */
    NgElementImpl.prototype.detach = /**
     * @return {?}
     */
    function () { this.disconnectedCallback(); };
    /**
     * @return {?}
     */
    NgElementImpl.prototype.detectChanges = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (this.lifecyclePhase === "disconnected" /* disconnected */) {
            return;
        }
        this.assertNotInPhase("unconnected" /* unconnected */, 'detectChanges');
        this.appContext.runInNgZone(function () {
            var /** @type {?} */ cThis = /** @type {?} */ ((_this));
            cThis.changeDetectionScheduled = false;
            cThis.callNgOnChanges();
            cThis.componentRef.changeDetectorRef.detectChanges();
        });
    };
    /**
     * @return {?}
     */
    NgElementImpl.prototype.disconnectedCallback = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (this.lifecyclePhase === "disconnected" /* disconnected */ ||
            this.cancelDestruction !== null) {
            return;
        }
        this.assertNotInPhase("unconnected" /* unconnected */, 'disconnectedCallback');
        var /** @type {?} */ doDestroy = function () { return _this.appContext.runInNgZone(function () { return _this.destroy(); }); };
        this.cancelDestruction = scheduler.schedule(doDestroy, NgElementImpl.DESTROY_DELAY);
    };
    /**
     * @return {?}
     */
    NgElementImpl.prototype.getHost = /**
     * @return {?}
     */
    function () { return this.host; };
    /**
     * @param {?} propName
     * @return {?}
     */
    NgElementImpl.prototype.getInputValue = /**
     * @param {?} propName
     * @return {?}
     */
    function (propName) {
        this.assertNotInPhase("disconnected" /* disconnected */, 'getInputValue');
        if (this.lifecyclePhase === "unconnected" /* unconnected */) {
            return this.initialInputValues.get(propName);
        }
        var /** @type {?} */ cThis = /** @type {?} */ ((this));
        return (/** @type {?} */ (cThis.componentRef.instance))[propName];
    };
    /**
     * @return {?}
     */
    NgElementImpl.prototype.markDirty = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this.changeDetectionScheduled) {
            this.changeDetectionScheduled = true;
            scheduler.scheduleBeforeRender(function () { return _this.detectChanges(); });
        }
    };
    /**
     * @param {?} host
     * @return {?}
     */
    NgElementImpl.prototype.setHost = /**
     * @param {?} host
     * @return {?}
     */
    function (host) {
        this.assertNotInPhase("connected" /* connected */, 'setHost');
        this.assertNotInPhase("disconnected" /* disconnected */, 'setHost');
        this.host = host;
    };
    /**
     * @param {?} propName
     * @param {?} newValue
     * @return {?}
     */
    NgElementImpl.prototype.setInputValue = /**
     * @param {?} propName
     * @param {?} newValue
     * @return {?}
     */
    function (propName, newValue) {
        this.assertNotInPhase("disconnected" /* disconnected */, 'setInputValue');
        if (this.lifecyclePhase === "unconnected" /* unconnected */) {
            this.initialInputValues.set(propName, newValue);
            return;
        }
        var /** @type {?} */ cThis = /** @type {?} */ ((this));
        if (!strictEquals(newValue, cThis.getInputValue(propName))) {
            cThis.recordInputChange(propName, newValue);
            (/** @type {?} */ (cThis.componentRef.instance))[propName] = newValue;
            cThis.markDirty();
        }
    };
    /**
     * @param {?} phase
     * @param {?} caller
     * @return {?}
     */
    NgElementImpl.prototype.assertNotInPhase = /**
     * @param {?} phase
     * @param {?} caller
     * @return {?}
     */
    function (phase, caller) {
        if (this.lifecyclePhase === phase) {
            throwError("Calling '" + caller + "()' on " + phase + " component '" + this.componentName + "' is not allowed.");
        }
    };
    /**
     * @this {?}
     * @return {?}
     */
    NgElementImpl.prototype.callNgOnChanges = /**
     * @this {?}
     * @return {?}
     */
    function () {
        if (this.implementsOnChanges && this.inputChanges !== null) {
            var /** @type {?} */ inputChanges = this.inputChanges;
            this.inputChanges = null;
            (/** @type {?} */ ((this.componentRef.instance))).ngOnChanges(inputChanges);
        }
    };
    /**
     * @return {?}
     */
    NgElementImpl.prototype.destroy = /**
     * @return {?}
     */
    function () {
        var /** @type {?} */ cThis = /** @type {?} */ ((this));
        cThis.componentRef.destroy();
        cThis.outputs.forEach(function (output) { return cThis.unsubscribeFromOutput(output); });
        this.ngElement = (/** @type {?} */ (this.host)).ngElement = null;
        cThis.host.innerHTML = '';
        cThis.lifecyclePhase = "disconnected" /* disconnected */;
        cThis.onDisconnected.emit();
    };
    /**
     * @param {?} eventName
     * @param {?} value
     * @return {?}
     */
    NgElementImpl.prototype.dispatchCustomEvent = /**
     * @param {?} eventName
     * @param {?} value
     * @return {?}
     */
    function (eventName, value) {
        var /** @type {?} */ event = createCustomEvent(this.host.ownerDocument, eventName, value);
        this.dispatchEvent(event);
        if (this.host !== this) {
            this.host.dispatchEvent(event);
        }
    };
    /**
     * @return {?}
     */
    NgElementImpl.prototype.initializeInputs = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this.inputs.forEach(function (_a) {
            var propName = _a.propName, attrName = _a.attrName;
            var /** @type {?} */ initialValue;
            if (_this.initialInputValues.has(propName)) {
                // The property has already been set (prior to initialization).
                // Update the component instance.
                initialValue = _this.initialInputValues.get(propName);
            }
            else if (_this.host.hasAttribute(attrName)) {
                // A matching attribute exists.
                // Update the component instance.
                initialValue = _this.host.getAttribute(attrName);
            }
            else {
                // The property does not have an initial value.
                // The property does not have an initial value.
                _this.uninitializedInputs.add(propName);
            }
            if (!_this.uninitializedInputs.has(propName)) {
                // The property does have an initial value.
                // Forward it to the component instance.
                // The property does have an initial value.
                // Forward it to the component instance.
                _this.setInputValue(propName, initialValue);
            }
        });
        this.initialInputValues.clear();
    };
    /**
     * @this {?}
     * @return {?}
     */
    NgElementImpl.prototype.initializeOutputs = /**
     * @this {?}
     * @return {?}
     */
    function () {
        var _this = this;
        this.outputs.forEach(function (output) { return _this.subscribeToOutput(output); });
    };
    /**
     * @param {?} propName
     * @param {?} currentValue
     * @return {?}
     */
    NgElementImpl.prototype.recordInputChange = /**
     * @param {?} propName
     * @param {?} currentValue
     * @return {?}
     */
    function (propName, currentValue) {
        if (!this.implementsOnChanges) {
            // The component does not implement `OnChanges`. Ignore the change.
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        var /** @type {?} */ pendingChange = this.inputChanges[propName];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        var /** @type {?} */ isFirstChange = this.uninitializedInputs.has(propName);
        var /** @type {?} */ previousValue = isFirstChange ? undefined : this.getInputValue(propName);
        this.inputChanges[propName] = new _angular_core.SimpleChange(previousValue, currentValue, isFirstChange);
        if (isFirstChange) {
            this.uninitializedInputs.delete(propName);
        }
    };
    /**
     * @this {?}
     * @param {?} output
     * @return {?}
     */
    NgElementImpl.prototype.subscribeToOutput = /**
     * @this {?}
     * @param {?} output
     * @return {?}
     */
    function (output) {
        var _this = this;
        var propName = output.propName, eventName = output.eventName;
        var /** @type {?} */ emitter = /** @type {?} */ ((/** @type {?} */ (this.componentRef.instance))[output.propName]);
        if (!emitter) {
            throwError("Missing emitter '" + propName + "' on component '" + this.componentName + "'.");
        }
        this.unsubscribeFromOutput(output);
        var /** @type {?} */ subscription = emitter.subscribe(function (value) { return _this.dispatchCustomEvent(eventName, value); });
        this.outputSubscriptions.set(propName, subscription);
    };
    /**
     * @param {?} __0
     * @return {?}
     */
    NgElementImpl.prototype.unsubscribeFromOutput = /**
     * @param {?} __0
     * @return {?}
     */
    function (_a) {
        var propName = _a.propName;
        if (!this.outputSubscriptions.has(propName)) {
            return;
        }
        var /** @type {?} */ subscription = /** @type {?} */ ((this.outputSubscriptions.get(propName)));
        this.outputSubscriptions.delete(propName);
        subscription.unsubscribe();
    };
    NgElementImpl.DESTROY_DELAY = 10;
    return NgElementImpl;
}(HTMLElement));

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
var PCEN_RE = createPcenRe();
var PCEN_BLACKLIST = [
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
    var /** @type {?} */ selector = componentFactory.selector;
    if (!isPotentialCustomElementName(selector)) {
        throwError("Using '" + selector + "' as a custom element name is not allowed. " +
            'See https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name for more info.');
    }
    var /** @type {?} */ inputs = componentFactory.inputs.map(function (_a) {
        var propName = _a.propName, templateName = _a.templateName;
        return ({
            propName: propName,
            attrName: camelToKebabCase(templateName),
        });
    });
    var /** @type {?} */ outputs = componentFactory.outputs.map(function (_a) {
        var propName = _a.propName, templateName = _a.templateName;
        return ({
            propName: propName,
            // TODO(gkalpak): Verify this is what we want and document.
            eventName: templateName,
        });
    });
    var NgElementConstructorImpl = (function (_super) {
        __extends(NgElementConstructorImpl, _super);
        function NgElementConstructorImpl() {
            var _this = _super.call(this, appContext, componentFactory, inputs, outputs) || this;
            var /** @type {?} */ ngElement = /** @type {?} */ (_this);
            _this.onConnected.subscribe(function () { return NgElementConstructorImpl.onConnected.emit(ngElement); });
            _this.onDisconnected.subscribe(function () { return NgElementConstructorImpl.onDisconnected.emit(ngElement); });
            return _this;
        }
        /**
         * @param {?} host
         * @param {?=} ignoreUpgraded
         * @return {?}
         */
        NgElementConstructorImpl.upgrade = /**
         * @param {?} host
         * @param {?=} ignoreUpgraded
         * @return {?}
         */
        function (host, ignoreUpgraded) {
            if (ignoreUpgraded === void 0) { ignoreUpgraded = false; }
            var /** @type {?} */ ngElement = new NgElementConstructorImpl();
            ngElement.setHost(host);
            ngElement.connectedCallback(ignoreUpgraded);
            return /** @type {?} */ (ngElement);
        };
        NgElementConstructorImpl.is = selector;
        NgElementConstructorImpl.observedAttributes = inputs.map(function (input) { return input.attrName; });
        NgElementConstructorImpl.onConnected = new _angular_core.EventEmitter();
        NgElementConstructorImpl.onDisconnected = new _angular_core.EventEmitter();
        return NgElementConstructorImpl;
    }(NgElementImpl));
    inputs.forEach(function (_a) {
        var propName = _a.propName;
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
    var /** @type {?} */ pcenChar = '-.0-9_a-z\\u00B7\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u037D\\u037F-\\u1FFF' +
        '\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF' +
        '\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
    var /** @type {?} */ flags = '';
    if (RegExp.prototype.hasOwnProperty('unicode')) {
        pcenChar += '\\u{10000}-\\u{EFFFF}';
        flags += 'u';
    }
    return RegExp("^[a-z][" + pcenChar + "]*-[" + pcenChar + "]*$", flags);
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
var NgElements = (function () {
    function NgElements(moduleRef, customElementComponents) {
        var _this = this;
        this.moduleRef = moduleRef;
        this.doc = this.moduleRef.injector.get(_angular_platformBrowser.DOCUMENT);
        this.definitions = new Map();
        this.upgradedElements = new Set();
        this.appContext = new NgElementApplicationContext(this.moduleRef.injector);
        this.changeDetectionScheduled = false;
        var /** @type {?} */ resolver = moduleRef.componentFactoryResolver;
        customElementComponents.forEach(function (componentType) { return _this.defineNgElement(_this.appContext, resolver, componentType); });
    }
    /**
     * @param {?=} root
     * @return {?}
     */
    NgElements.prototype.detachAll = /**
     * @param {?=} root
     * @return {?}
     */
    function (root) {
        if (root === void 0) { root = this.doc.documentElement; }
        var /** @type {?} */ upgradedElements = Array.from(this.upgradedElements.values());
        var /** @type {?} */ elementsToDetach = [];
        this.traverseTree(root, function (node) {
            upgradedElements.some(function (ngElement) {
                if (ngElement.getHost() === node) {
                    elementsToDetach.push(ngElement);
                    return true;
                }
                return false;
            });
        });
        // Detach in reverse traversal order.
        this.appContext.runInNgZone(function () { return elementsToDetach.reverse().forEach(function (ngElement) { return ngElement.detach(); }); });
    };
    /**
     * @return {?}
     */
    NgElements.prototype.detectChanges = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this.changeDetectionScheduled = false;
        this.appContext.runInNgZone(function () { return _this.upgradedElements.forEach(function (ngElement) { return ngElement.detectChanges(); }); });
    };
    /**
     * @param {?} cb
     * @return {?}
     */
    NgElements.prototype.forEach = /**
     * @param {?} cb
     * @return {?}
     */
    function (cb) {
        return this.definitions.forEach(cb);
    };
    /**
     * @template C, P
     * @param {?} selector
     * @return {?}
     */
    NgElements.prototype.get = /**
     * @template C, P
     * @param {?} selector
     * @return {?}
     */
    function (selector) {
        return this.definitions.get(selector);
    };
    /**
     * @return {?}
     */
    NgElements.prototype.markDirty = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this.changeDetectionScheduled) {
            this.changeDetectionScheduled = true;
            scheduler.scheduleBeforeRender(function () { return _this.detectChanges(); });
        }
    };
    /**
     * @param {?=} customElements
     * @return {?}
     */
    NgElements.prototype.register = /**
     * @param {?=} customElements
     * @return {?}
     */
    function (customElements) {
        if (!customElements && (typeof window !== 'undefined')) {
            customElements = window.customElements;
        }
        if (!customElements) {
            throwError('Custom Elements are not supported in this environment.');
        }
        this.definitions.forEach(function (def) { return /** @type {?} */ ((customElements)).define(def.is, def); });
    };
    /**
     * @param {?=} root
     * @return {?}
     */
    NgElements.prototype.upgradeAll = /**
     * @param {?=} root
     * @return {?}
     */
    function (root) {
        var _this = this;
        if (root === void 0) { root = this.doc.documentElement; }
        var /** @type {?} */ definitions = Array.from(this.definitions.values());
        this.appContext.runInNgZone(function () {
            _this.traverseTree(root, function (node) {
                var /** @type {?} */ nodeName = node.nodeName.toLowerCase();
                definitions.some(function (def) {
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
    };
    /**
     * @param {?} appContext
     * @param {?} resolver
     * @param {?} componentType
     * @return {?}
     */
    NgElements.prototype.defineNgElement = /**
     * @param {?} appContext
     * @param {?} resolver
     * @param {?} componentType
     * @return {?}
     */
    function (appContext, resolver, componentType) {
        var _this = this;
        var /** @type {?} */ componentFactory = resolver.resolveComponentFactory(componentType);
        var /** @type {?} */ def = createNgElementConstructor(appContext, componentFactory);
        var /** @type {?} */ selector = def.is;
        if (this.definitions.has(selector)) {
            throwError("Defining an Angular custom element with selector '" + selector + "' is not allowed, " +
                'because one is already defined.');
        }
        def.onConnected.subscribe(function (ngElement) { return _this.upgradedElements.add(ngElement); });
        def.onDisconnected.subscribe(function (ngElement) { return _this.upgradedElements.delete(ngElement); });
        this.definitions.set(selector, def);
    };
    /**
     * @param {?} root
     * @param {?} cb
     * @return {?}
     */
    NgElements.prototype.traverseTree = /**
     * @param {?} root
     * @param {?} cb
     * @return {?}
     */
    function (root, cb) {
        var /** @type {?} */ currentNode = root;
        var /** @type {?} */ getNextNonDescendant = function (node) {
            var /** @type {?} */ currNode = node;
            var /** @type {?} */ nextNode = null;
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
    };
    return NgElements;
}());

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
    var /** @type {?} */ bootstrapFn = isFunction(platformRefOrBootstrapFn) ?
        platformRefOrBootstrapFn :
        function () { return platformRefOrBootstrapFn.bootstrapModuleFactory(/** @type {?} */ ((moduleFactory))); };
    return bootstrapFn().then(function (moduleRef) {
        var /** @type {?} */ ngElements = new NgElements(moduleRef, customElementComponents);
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
var VERSION = new _angular_core.Version('5.1.0-beta.0-21bfaf2');

exports.registerAsCustomElements = registerAsCustomElements;
exports.VERSION = VERSION;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=elements.umd.js.map
