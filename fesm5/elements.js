/**
 * @license Angular v9.1.13
 * (c) 2010-2020 Google LLC. https://angular.io/
 * License: MIT
 */

import { __spread, __extends, __read } from 'tslib';
import { ComponentFactoryResolver, Injector, ApplicationRef, SimpleChange, Version } from '@angular/core';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var ɵ0 = function () {
    var elProto = Element.prototype;
    return elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
        elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
};
var matches = (ɵ0)();
/**
 * Provide methods for scheduling the execution of a callback.
 */
var scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     *
     * Returns a function that when executed will cancel the scheduled function.
     */
    schedule: function (taskFn, delay) {
        var id = setTimeout(taskFn, delay);
        return function () { return clearTimeout(id); };
    },
    /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     *
     * Returns a function that when executed will cancel the scheduled function.
     */
    scheduleBeforeRender: function (taskFn) {
        // TODO(gkalpak): Implement a better way of accessing `requestAnimationFrame()`
        //                (e.g. accounting for vendor prefix, SSR-compatibility, etc).
        if (typeof window === 'undefined') {
            // For SSR just schedule immediately.
            return scheduler.schedule(taskFn, 0);
        }
        if (typeof window.requestAnimationFrame === 'undefined') {
            var frameMs = 16;
            return scheduler.schedule(taskFn, frameMs);
        }
        var id = window.requestAnimationFrame(taskFn);
        return function () { return window.cancelAnimationFrame(id); };
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 */
function camelToDashCase(input) {
    return input.replace(/[A-Z]/g, function (char) { return "-" + char.toLowerCase(); });
}
/**
 * Create a `CustomEvent` (even on browsers where `CustomEvent` is not a constructor).
 */
function createCustomEvent(doc, name, detail) {
    var bubbles = false;
    var cancelable = false;
    // On IE9-11, `CustomEvent` is not a constructor.
    if (typeof CustomEvent !== 'function') {
        var event_1 = doc.createEvent('CustomEvent');
        event_1.initCustomEvent(name, bubbles, cancelable, detail);
        return event_1;
    }
    return new CustomEvent(name, { bubbles: bubbles, cancelable: cancelable, detail: detail });
}
/**
 * Check whether the input is an `Element`.
 */
function isElement(node) {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
}
/**
 * Check whether the input is a function.
 */
function isFunction(value) {
    return typeof value === 'function';
}
/**
 * Convert a kebab-cased string to camelCased.
 */
function kebabToCamelCase(input) {
    return input.replace(/-([a-z\d])/g, function (_, char) { return char.toUpperCase(); });
}
/**
 * Check whether an `Element` matches a CSS selector.
 */
function matchesSelector(element, selector) {
    return matches.call(element, selector);
}
/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 */
function strictEquals(value1, value2) {
    return value1 === value2 || (value1 !== value1 && value2 !== value2);
}
/** Gets a map of default set of attributes to observe and the properties they affect. */
function getDefaultAttributeToPropertyInputs(inputs) {
    var attributeToPropertyInputs = {};
    inputs.forEach(function (_a) {
        var propName = _a.propName, templateName = _a.templateName;
        attributeToPropertyInputs[camelToDashCase(templateName)] = propName;
    });
    return attributeToPropertyInputs;
}
/**
 * Gets a component's set of inputs. Uses the injector to get the component factory where the inputs
 * are defined.
 */
function getComponentInputs(component, injector) {
    var componentFactoryResolver = injector.get(ComponentFactoryResolver);
    var componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function extractProjectableNodes(host, ngContentSelectors) {
    var nodes = host.childNodes;
    var projectableNodes = ngContentSelectors.map(function () { return []; });
    var wildcardIndex = -1;
    ngContentSelectors.some(function (selector, i) {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    });
    for (var i = 0, ii = nodes.length; i < ii; ++i) {
        var node = nodes[i];
        var ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
        if (ngContentIndex !== -1) {
            projectableNodes[ngContentIndex].push(node);
        }
    }
    return projectableNodes;
}
function findMatchingIndex(node, selectors, defaultIndex) {
    var matchingIndex = defaultIndex;
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
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Time in milliseconds to wait before destroying the component ref when disconnected. */
var DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 *
 * @publicApi
 */
var ComponentNgElementStrategyFactory = /** @class */ (function () {
    function ComponentNgElementStrategyFactory(component, injector) {
        this.componentFactory =
            injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
    }
    ComponentNgElementStrategyFactory.prototype.create = function (injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector);
    };
    return ComponentNgElementStrategyFactory;
}());
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 *
 * @publicApi
 */
var ComponentNgElementStrategy = /** @class */ (function () {
    function ComponentNgElementStrategy(componentFactory, injector) {
        this.componentFactory = componentFactory;
        this.injector = injector;
        /** Reference to the component that was created on connect. */
        this.componentRef = null;
        /** Changes that have been made to the component ref since the last time onChanges was called. */
        this.inputChanges = null;
        /** Whether the created component implements the onChanges function. */
        this.implementsOnChanges = false;
        /** Whether a change detection has been scheduled to run on the component. */
        this.scheduledChangeDetectionFn = null;
        /** Callback function that when called will cancel a scheduled destruction on the component. */
        this.scheduledDestroyFn = null;
        /** Initial input values that were set before the component was created. */
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
     */
    ComponentNgElementStrategy.prototype.connect = function (element) {
        // If the element is marked to be destroyed, cancel the task since the component was reconnected
        if (this.scheduledDestroyFn !== null) {
            this.scheduledDestroyFn();
            this.scheduledDestroyFn = null;
            return;
        }
        if (this.componentRef === null) {
            this.initializeComponent(element);
        }
    };
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     */
    ComponentNgElementStrategy.prototype.disconnect = function () {
        var _this = this;
        // Return if there is no componentRef or the component is already scheduled for destruction
        if (this.componentRef === null || this.scheduledDestroyFn !== null) {
            return;
        }
        // Schedule the component to be destroyed after a small timeout in case it is being
        // moved elsewhere in the DOM
        this.scheduledDestroyFn = scheduler.schedule(function () {
            if (_this.componentRef !== null) {
                _this.componentRef.destroy();
                _this.componentRef = null;
            }
        }, DESTROY_DELAY);
    };
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     */
    ComponentNgElementStrategy.prototype.getInputValue = function (property) {
        if (this.componentRef === null) {
            return this.initialInputValues.get(property);
        }
        return this.componentRef.instance[property];
    };
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    ComponentNgElementStrategy.prototype.setInputValue = function (property, value) {
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
    };
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     */
    ComponentNgElementStrategy.prototype.initializeComponent = function (element) {
        var childInjector = Injector.create({ providers: [], parent: this.injector });
        var projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.implementsOnChanges = isFunction(this.componentRef.instance.ngOnChanges);
        this.initializeInputs();
        this.initializeOutputs(this.componentRef);
        this.detectChanges();
        var applicationRef = this.injector.get(ApplicationRef);
        applicationRef.attachView(this.componentRef.hostView);
    };
    /** Set any stored initial inputs on the component's properties. */
    ComponentNgElementStrategy.prototype.initializeInputs = function () {
        var _this = this;
        this.componentFactory.inputs.forEach(function (_a) {
            var propName = _a.propName;
            if (_this.implementsOnChanges) {
                // If the component implements `ngOnChanges()`, keep track of which inputs have never
                // changed so far.
                _this.unchangedInputs.add(propName);
            }
            if (_this.initialInputValues.has(propName)) {
                // Call `setInputValue()` now that the component has been instantiated to update its
                // properties and fire `ngOnChanges()`.
                _this.setInputValue(propName, _this.initialInputValues.get(propName));
            }
        });
        this.initialInputValues.clear();
    };
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    ComponentNgElementStrategy.prototype.initializeOutputs = function (componentRef) {
        var eventEmitters = this.componentFactory.outputs.map(function (_a) {
            var propName = _a.propName, templateName = _a.templateName;
            var emitter = componentRef.instance[propName];
            return emitter.pipe(map(function (value) { return ({ name: templateName, value: value }); }));
        });
        this.events = merge.apply(void 0, __spread(eventEmitters));
    };
    /** Calls ngOnChanges with all the inputs that have changed since the last call. */
    ComponentNgElementStrategy.prototype.callNgOnChanges = function (componentRef) {
        if (!this.implementsOnChanges || this.inputChanges === null) {
            return;
        }
        // Cache the changes and set inputChanges to null to capture any changes that might occur
        // during ngOnChanges.
        var inputChanges = this.inputChanges;
        this.inputChanges = null;
        componentRef.instance.ngOnChanges(inputChanges);
    };
    /**
     * Schedules change detection to run on the component.
     * Ignores subsequent calls if already scheduled.
     */
    ComponentNgElementStrategy.prototype.scheduleDetectChanges = function () {
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
    ComponentNgElementStrategy.prototype.recordInputChange = function (property, currentValue) {
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
        var pendingChange = this.inputChanges[property];
        if (pendingChange) {
            pendingChange.currentValue = currentValue;
            return;
        }
        var isFirstChange = this.unchangedInputs.has(property);
        this.unchangedInputs.delete(property);
        var previousValue = isFirstChange ? undefined : this.getInputValue(property);
        this.inputChanges[property] = new SimpleChange(previousValue, currentValue, isFirstChange);
    };
    /** Runs change detection on the component. */
    ComponentNgElementStrategy.prototype.detectChanges = function () {
        if (this.componentRef === null) {
            return;
        }
        this.callNgOnChanges(this.componentRef);
        this.componentRef.changeDetectorRef.detectChanges();
    };
    return ComponentNgElementStrategy;
}());

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Implements the functionality needed for a custom element.
 *
 * @publicApi
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
 * @param component The component to transform.
 * @param config A configuration that provides initialization information to the created class.
 * @returns The custom-element construction class, which can be registered with
 * a browser's `CustomElementRegistry`.
 *
 * @publicApi
 */
function createCustomElement(component, config) {
    var inputs = getComponentInputs(component, config.injector);
    var strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
    var attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
    var NgElementImpl = /** @class */ (function (_super) {
        __extends(NgElementImpl, _super);
        function NgElementImpl(injector) {
            var _this = _super.call(this) || this;
            _this.injector = injector;
            return _this;
        }
        Object.defineProperty(NgElementImpl.prototype, "ngElementStrategy", {
            get: function () {
                var _this = this;
                // NOTE:
                // Some polyfills (e.g. `document-register-element`) do not call the constructor, therefore
                // it is not safe to set `ngElementStrategy` in the constructor and assume it will be
                // available inside the methods.
                //
                // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
                // now this is tested using a Google internal test suite.
                if (!this._ngElementStrategy) {
                    var strategy_1 = this._ngElementStrategy =
                        strategyFactory.create(this.injector || config.injector);
                    // Collect pre-existing values on the element to re-apply through the strategy.
                    var preExistingValues = inputs.filter(function (_a) {
                        var propName = _a.propName;
                        return _this.hasOwnProperty(propName);
                    }).map(function (_a) {
                        var propName = _a.propName;
                        return [propName, _this[propName]];
                    });
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
                        preExistingValues.forEach(function (_a) {
                            var _b = __read(_a, 1), propName = _b[0];
                            return delete _this[propName];
                        });
                    }
                    // Re-apply pre-existing values through the strategy.
                    preExistingValues.forEach(function (_a) {
                        var _b = __read(_a, 2), propName = _b[0], value = _b[1];
                        return strategy_1.setInputValue(propName, value);
                    });
                }
                return this._ngElementStrategy;
            },
            enumerable: true,
            configurable: true
        });
        NgElementImpl.prototype.attributeChangedCallback = function (attrName, oldValue, newValue, namespace) {
            var propName = attributeToPropertyInputs[attrName];
            this.ngElementStrategy.setInputValue(propName, newValue);
        };
        NgElementImpl.prototype.connectedCallback = function () {
            var _this = this;
            this.ngElementStrategy.connect(this);
            // Listen for events from the strategy and dispatch them as custom events
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(function (e) {
                var customEvent = createCustomEvent(_this.ownerDocument, e.name, e.value);
                _this.dispatchEvent(customEvent);
            });
        };
        NgElementImpl.prototype.disconnectedCallback = function () {
            // Not using `this.ngElementStrategy` to avoid unnecessarily creating the `NgElementStrategy`.
            if (this._ngElementStrategy) {
                this._ngElementStrategy.disconnect();
            }
            if (this.ngElementEventsSubscription) {
                this.ngElementEventsSubscription.unsubscribe();
                this.ngElementEventsSubscription = null;
            }
        };
        // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
        // field externs. So using quoted access to explicitly prevent renaming.
        NgElementImpl['observedAttributes'] = Object.keys(attributeToPropertyInputs);
        return NgElementImpl;
    }(NgElement));
    // Add getters and setters to the prototype for each property input.
    defineInputGettersSetters(inputs, NgElementImpl.prototype);
    return NgElementImpl;
}
// Helpers
function defineInputGettersSetters(inputs, target) {
    // Add getters and setters for each property input.
    inputs.forEach(function (_a) {
        var propName = _a.propName;
        Object.defineProperty(target, propName, {
            get: function () {
                return this.ngElementStrategy.getInputValue(propName);
            },
            set: function (newValue) {
                this.ngElementStrategy.setInputValue(propName, newValue);
            },
            configurable: true,
            enumerable: true,
        });
    });
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @publicApi
 */
var VERSION = new Version('9.1.13');

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// This file only reexports content of the `src` folder. Keep it that way.

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgElement, VERSION, createCustomElement };
//# sourceMappingURL=elements.js.map
