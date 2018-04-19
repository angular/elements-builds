/**
 * @license Angular v6.0.0-rc.5-9757347
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */
import { __extends } from 'tslib';
import { ApplicationRef, ComponentFactoryResolver, Injector, SimpleChange, Version } from '@angular/core';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';

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
     *
     * Returns a function that when executed will cancel the scheduled function.
     */
    schedule: /**
     * Schedule a callback to be called after some delay.
     *
     * Returns a function that when executed will cancel the scheduled function.
     * @param {?} taskFn
     * @param {?} delay
     * @return {?}
     */
    function (taskFn, delay) { var /** @type {?} */ id = setTimeout(taskFn, delay); return function () { return clearTimeout(id); }; },
    /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     *
     * Returns a function that when executed will cancel the scheduled function.
     */
    scheduleBeforeRender: /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     *
     * Returns a function that when executed will cancel the scheduled function.
     * @param {?} taskFn
     * @return {?}
     */
    function (taskFn) {
        // TODO(gkalpak): Implement a better way of accessing `requestAnimationFrame()`
        //                (e.g. accounting for vendor prefix, SSR-compatibility, etc).
        if (typeof window === 'undefined') {
            // For SSR just schedule immediately.
            return scheduler.schedule(taskFn, 0);
        }
        if (typeof window.requestAnimationFrame === 'undefined') {
            var /** @type {?} */ frameMs = 16;
            return scheduler.schedule(taskFn, frameMs);
        }
        var /** @type {?} */ id = window.requestAnimationFrame(taskFn);
        return function () { return window.cancelAnimationFrame(id); };
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 * @param {?} input
 * @return {?}
 */
function camelToDashCase(input) {
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
 * Gets a map of default set of attributes to observe and the properties they affect.
 * @param {?} inputs
 * @return {?}
 */
function getDefaultAttributeToPropertyInputs(inputs) {
    var /** @type {?} */ attributeToPropertyInputs = {};
    inputs.forEach(function (_a) {
        var propName = _a.propName, templateName = _a.templateName;
        attributeToPropertyInputs[camelToDashCase(templateName)] = propName;
    });
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
    var /** @type {?} */ componentFactoryResolver = injector.get(ComponentFactoryResolver);
    var /** @type {?} */ componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
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
 * Time in milliseconds to wait before destroying the component ref when disconnected.
 */
var DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * \@experimental
 */
var ComponentNgElementStrategyFactory = /** @class */ (function () {
    function ComponentNgElementStrategyFactory(component, injector) {
        this.component = component;
        this.injector = injector;
        this.componentFactory =
            injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
    }
    /**
     * @param {?} injector
     * @return {?}
     */
    ComponentNgElementStrategyFactory.prototype.create = /**
     * @param {?} injector
     * @return {?}
     */
    function (injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector);
    };
    return ComponentNgElementStrategyFactory;
}());
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * \@experimental
 */
var ComponentNgElementStrategy = /** @class */ (function () {
    function ComponentNgElementStrategy(componentFactory, injector) {
        this.componentFactory = componentFactory;
        this.injector = injector;
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
         * Set of inputs that were not initially set when the component was created.
         */
        this.uninitializedInputs = new Set();
    }
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     */
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     * @param {?} element
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.connect = /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     * @param {?} element
     * @return {?}
     */
    function (element) {
        // If the element is marked to be destroyed, cancel the task since the component was reconnected
        if (this.scheduledDestroyFn !== null) {
            this.scheduledDestroyFn();
            this.scheduledDestroyFn = null;
            return;
        }
        if (!this.componentRef) {
            this.initializeComponent(element);
        }
    };
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     */
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.disconnect = /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     * @return {?}
     */
    function () {
        var _this = this;
        // Return if there is no componentRef or the component is already scheduled for destruction
        if (!this.componentRef || this.scheduledDestroyFn !== null) {
            return;
        }
        // Schedule the component to be destroyed after a small timeout in case it is being
        // moved elsewhere in the DOM
        this.scheduledDestroyFn = scheduler.schedule(function () {
            if (_this.componentRef) {
                /** @type {?} */ ((_this.componentRef)).destroy();
                _this.componentRef = null;
            }
        }, DESTROY_DELAY);
    };
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     */
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     * @param {?} property
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.getInputValue = /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     * @param {?} property
     * @return {?}
     */
    function (property) {
        if (!this.componentRef) {
            return this.initialInputValues.get(property);
        }
        return (/** @type {?} */ (this.componentRef.instance))[property];
    };
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.setInputValue = /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    function (property, value) {
        if (strictEquals(value, this.getInputValue(property))) {
            return;
        }
        if (!this.componentRef) {
            this.initialInputValues.set(property, value);
            return;
        }
        this.recordInputChange(property, value);
        (/** @type {?} */ (this.componentRef.instance))[property] = value;
        this.scheduleDetectChanges();
    };
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     */
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     * @param {?} element
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.initializeComponent = /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     * @param {?} element
     * @return {?}
     */
    function (element) {
        var /** @type {?} */ childInjector = Injector.create({ providers: [], parent: this.injector });
        var /** @type {?} */ projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.implementsOnChanges =
            isFunction((/** @type {?} */ ((this.componentRef.instance))).ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs();
        this.detectChanges();
        var /** @type {?} */ applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    };
    /** Set any stored initial inputs on the component's properties. */
    /**
     * Set any stored initial inputs on the component's properties.
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.initializeInputs = /**
     * Set any stored initial inputs on the component's properties.
     * @return {?}
     */
    function () {
        var _this = this;
        this.componentFactory.inputs.forEach(function (_a) {
            var propName = _a.propName;
            var /** @type {?} */ initialValue = _this.initialInputValues.get(propName);
            if (initialValue) {
                _this.setInputValue(propName, initialValue);
            }
            else {
                // Keep track of inputs that were not initialized in case we need to know this for
                // calling ngOnChanges with SimpleChanges
                // Keep track of inputs that were not initialized in case we need to know this for
                // calling ngOnChanges with SimpleChanges
                _this.uninitializedInputs.add(propName);
            }
        });
        this.initialInputValues.clear();
    };
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    /**
     * Sets up listeners for the component's outputs so that the events stream emits the events.
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.initializeOutputs = /**
     * Sets up listeners for the component's outputs so that the events stream emits the events.
     * @return {?}
     */
    function () {
        var _this = this;
        var /** @type {?} */ eventEmitters = this.componentFactory.outputs.map(function (_a) {
            var propName = _a.propName, templateName = _a.templateName;
            var /** @type {?} */ emitter = /** @type {?} */ ((/** @type {?} */ (((_this.componentRef)).instance))[propName]);
            return emitter.pipe(map(function (value) { return ({ name: templateName, value: value }); }));
        });
        this.events = merge.apply(void 0, eventEmitters);
    };
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    /**
     * Calls ngOnChanges with all the inputs that have changed since the last call.
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.callNgOnChanges = /**
     * Calls ngOnChanges with all the inputs that have changed since the last call.
     * @return {?}
     */
    function () {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        var /** @type {?} */ inputChanges = this.inputChanges;
        this.inputChanges = null;
        (/** @type {?} */ ((((this.componentRef)).instance))).ngOnChanges(inputChanges);
    };
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     */
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.scheduleDetectChanges = /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     * @return {?}
     */
    function () {
        var _this = this;
        if (this.scheduledChangeDetectionFn) {
            return;
        }
        this.scheduledChangeDetectionFn = scheduler.scheduleBeforeRender(function () {
            _this.scheduledChangeDetectionFn = null;
            _this.detectChanges();
        });
    };
    /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     */
    /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     * @param {?} property
     * @param {?} currentValue
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.recordInputChange = /**
     * Records input changes so that the component receives SimpleChanges in its onChanges function.
     * @param {?} property
     * @param {?} currentValue
     * @return {?}
     */
    function (property, currentValue) {
        // Do not record the change if the component does not implement `OnChanges`.
        if (this.componentRef && !this.implementsOnChanges) {
            return;
        }
        if (this.inputChanges === null) {
            this.inputChanges = {};
        }
        // If there already is a change, modify the current value to match but leave the values for
        // previousValue and isFirstChange.
        var /** @type {?} */ pendingChange = this.inputChanges[property];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        var /** @type {?} */ isFirstChange = this.uninitializedInputs.has(property);
        this.uninitializedInputs.delete(property);
        var /** @type {?} */ previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    };
    /** Runs change detection on the component. */
    /**
     * Runs change detection on the component.
     * @return {?}
     */
    ComponentNgElementStrategy.prototype.detectChanges = /**
     * Runs change detection on the component.
     * @return {?}
     */
    function () {
        if (!this.componentRef) {
            return;
        }
        this.callNgOnChanges(); /** @type {?} */
        ((this.componentRef)).changeDetectorRef.detectChanges();
    };
    return ComponentNgElementStrategy;
}());

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
 * Prototype for a class constructor based on an Angular component
 * that can be used for custom element registration. Implemented and returned
 * by the {\@link createCustomElement createCustomElement() function}.
 *
 * \@experimental
 * @record
 * @template P
 */

/**
 * Implements the functionality needed for a custom element.
 *
 * \@experimental
 * @abstract
 */
var NgElement = /** @class */ (function (_super) {
    __extends(NgElement, _super);
    function NgElement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * A subscription to change, connect, and disconnect events in the custom element.
         */
        _this.ngElementEventsSubscription = null;
        return _this;
    }
    return NgElement;
}(HTMLElement));
/**
 * A configuration that initializes an NgElementConstructor with the
 * dependencies and strategy it needs to transform a component into
 * a custom element class.
 *
 * \@experimental
 * @record
 */

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
function createCustomElement(component, config) {
    var /** @type {?} */ inputs = getComponentInputs(component, config.injector);
    var /** @type {?} */ strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
    var /** @type {?} */ attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
    var NgElementImpl = /** @class */ (function (_super) {
        __extends(NgElementImpl, _super);
        function NgElementImpl(injector) {
            var _this = _super.call(this) || this;
            _this.ngElementStrategy = strategyFactory.create(injector || config.injector);
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
            var /** @type {?} */ propName = /** @type {?} */ ((attributeToPropertyInputs[attrName]));
            this.ngElementStrategy.setInputValue(propName, newValue);
        };
        /**
         * @return {?}
         */
        NgElementImpl.prototype.connectedCallback = /**
         * @return {?}
         */
        function () {
            var _this = this;
            this.ngElementStrategy.connect(this);
            // Listen for events from the strategy and dispatch them as custom events
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(function (e) {
                var /** @type {?} */ customEvent = createCustomEvent(_this.ownerDocument, e.name, e.value);
                _this.dispatchEvent(customEvent);
            });
        };
        /**
         * @return {?}
         */
        NgElementImpl.prototype.disconnectedCallback = /**
         * @return {?}
         */
        function () {
            this.ngElementStrategy.disconnect();
            if (this.ngElementEventsSubscription) {
                this.ngElementEventsSubscription.unsubscribe();
                this.ngElementEventsSubscription = null;
            }
        };
        NgElementImpl.observedAttributes = Object.keys(attributeToPropertyInputs);
        return NgElementImpl;
    }(NgElement));
    inputs.map(function (_a) {
        var propName = _a.propName;
        return propName;
    }).forEach(function (property) {
        Object.defineProperty(NgElementImpl.prototype, property, {
            get: function () { return this.ngElementStrategy.getInputValue(property); },
            set: function (newValue) { this.ngElementStrategy.setInputValue(property, newValue); },
            configurable: true,
            enumerable: true,
        });
    });
    return /** @type {?} */ ((/** @type {?} */ (NgElementImpl)));
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
var VERSION = new Version('6.0.0-rc.5-9757347');

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

// This file only reexports content of the `src` folder. Keep it that way.

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Generated bundle index. Do not edit.
 */

export { NgElement, createCustomElement, VERSION };
//# sourceMappingURL=elements.js.map
