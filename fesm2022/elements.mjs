/**
 * @license Angular v21.0.0-next.8+sha-fcf7eee
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */

import { ComponentFactoryResolver, NgZone, ApplicationRef, ɵChangeDetectionScheduler as _ChangeDetectionScheduler, ɵisViewDirty as _isViewDirty, ɵmarkForRefresh as _markForRefresh, Injector, isSignal, Version } from '@angular/core';
import { ReplaySubject, merge, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * Provide methods for scheduling the execution of a callback.
 */
const scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     *
     * Returns a function that when executed will cancel the scheduled function.
     */
    schedule(taskFn, delay) {
        const id = setTimeout(taskFn, delay);
        return () => clearTimeout(id);
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 */
function camelToDashCase(input) {
    return input.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
/**
 * Check whether the input is an `Element`.
 */
function isElement(node) {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
}
let _matches;
/**
 * Check whether an `Element` matches a CSS selector.
 * NOTE: this is duplicated from @angular/upgrade, and can
 * be consolidated in the future
 */
function matchesSelector(el, selector) {
    if (!_matches) {
        const elProto = Element.prototype;
        _matches =
            elProto.matches ||
                elProto.matchesSelector ||
                elProto.mozMatchesSelector ||
                elProto.msMatchesSelector ||
                elProto.oMatchesSelector ||
                elProto.webkitMatchesSelector;
    }
    return el.nodeType === Node.ELEMENT_NODE ? _matches.call(el, selector) : false;
}
/** Gets a map of default set of attributes to observe and the properties they affect. */
function getDefaultAttributeToPropertyInputs(inputs) {
    const attributeToPropertyInputs = {};
    inputs.forEach(({ propName, templateName, transform }) => {
        attributeToPropertyInputs[camelToDashCase(templateName)] = [propName, transform];
    });
    return attributeToPropertyInputs;
}
/**
 * Gets a component's set of inputs. Uses the injector to get the component factory where the inputs
 * are defined.
 */
function getComponentInputs(component, injector) {
    const componentFactoryResolver = injector.get(ComponentFactoryResolver);
    const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}

// NOTE: This is a (slightly improved) version of what is used in ngUpgrade's
//       `DowngradeComponentAdapter`.
// TODO(gkalpak): Investigate if it makes sense to share the code.
function extractProjectableNodes(host, ngContentSelectors) {
    const nodes = host.childNodes;
    const projectableNodes = ngContentSelectors.map(() => []);
    let wildcardIndex = -1;
    ngContentSelectors.some((selector, i) => {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    });
    for (let i = 0, ii = nodes.length; i < ii; ++i) {
        const node = nodes[i];
        const ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
        if (ngContentIndex !== -1) {
            projectableNodes[ngContentIndex].push(node);
        }
    }
    return projectableNodes;
}
function findMatchingIndex(node, selectors, defaultIndex) {
    let matchingIndex = defaultIndex;
    if (isElement(node)) {
        selectors.some((selector, i) => {
            if (selector !== '*' && matchesSelector(node, selector)) {
                matchingIndex = i;
                return true;
            }
            return false;
        });
    }
    return matchingIndex;
}

/** Time in milliseconds to wait before destroying the component ref when disconnected. */
const DESTROY_DELAY = 10;
/**
 * Factory that creates new ComponentNgElementStrategy instance. Gets the component factory with the
 * constructor's injector's factory resolver and passes that factory to each strategy.
 */
class ComponentNgElementStrategyFactory {
    componentFactory;
    inputMap = new Map();
    constructor(component, injector) {
        this.componentFactory = injector
            .get(ComponentFactoryResolver)
            .resolveComponentFactory(component);
        for (const input of this.componentFactory.inputs) {
            this.inputMap.set(input.propName, input.templateName);
        }
    }
    create(injector) {
        return new ComponentNgElementStrategy(this.componentFactory, injector, this.inputMap);
    }
}
/**
 * Creates and destroys a component ref using a component factory and handles change detection
 * in response to input changes.
 */
class ComponentNgElementStrategy {
    componentFactory;
    injector;
    inputMap;
    // Subject of `NgElementStrategyEvent` observables corresponding to the component's outputs.
    eventEmitters = new ReplaySubject(1);
    /** Merged stream of the component's output events. */
    events = this.eventEmitters.pipe(switchMap((emitters) => merge(...emitters)));
    /** Reference to the component that was created on connect. */
    componentRef = null;
    /** Callback function that when called will cancel a scheduled destruction on the component. */
    scheduledDestroyFn = null;
    /** Initial input values that were set before the component was created. */
    initialInputValues = new Map();
    /** Service for setting zone context. */
    ngZone;
    /** The zone the element was created in or `null` if Zone.js is not loaded. */
    elementZone;
    /**
     * The `ApplicationRef` shared by all instances of this custom element (and potentially others).
     */
    appRef;
    /**
     * Angular's change detection scheduler, which works independently of zone.js.
     */
    cdScheduler;
    constructor(componentFactory, injector, inputMap) {
        this.componentFactory = componentFactory;
        this.injector = injector;
        this.inputMap = inputMap;
        this.ngZone = this.injector.get(NgZone);
        this.appRef = this.injector.get(ApplicationRef);
        this.cdScheduler = injector.get(_ChangeDetectionScheduler);
        this.elementZone = typeof Zone === 'undefined' ? null : this.ngZone.run(() => Zone.current);
    }
    /**
     * Initializes a new component if one has not yet been created and cancels any scheduled
     * destruction.
     */
    connect(element) {
        this.runInZone(() => {
            // If the element is marked to be destroyed, cancel the task since the component was
            // reconnected
            if (this.scheduledDestroyFn !== null) {
                this.scheduledDestroyFn();
                this.scheduledDestroyFn = null;
                return;
            }
            if (this.componentRef === null) {
                this.initializeComponent(element);
            }
        });
    }
    /**
     * Schedules the component to be destroyed after some small delay in case the element is just
     * being moved across the DOM.
     */
    disconnect() {
        this.runInZone(() => {
            // Return if there is no componentRef or the component is already scheduled for destruction
            if (this.componentRef === null || this.scheduledDestroyFn !== null) {
                return;
            }
            // Schedule the component to be destroyed after a small timeout in case it is being
            // moved elsewhere in the DOM
            this.scheduledDestroyFn = scheduler.schedule(() => {
                if (this.componentRef !== null) {
                    this.componentRef.destroy();
                    this.componentRef = null;
                }
            }, DESTROY_DELAY);
        });
    }
    /**
     * Returns the component property value. If the component has not yet been created, the value is
     * retrieved from the cached initialization values.
     */
    getInputValue(property) {
        return this.runInZone(() => {
            if (this.componentRef === null) {
                return this.initialInputValues.get(property);
            }
            return this.componentRef.instance[property];
        });
    }
    /**
     * Sets the input value for the property. If the component has not yet been created, the value is
     * cached and set when the component is created.
     */
    setInputValue(property, value) {
        if (this.componentRef === null) {
            this.initialInputValues.set(property, value);
            return;
        }
        this.runInZone(() => {
            this.componentRef.setInput(this.inputMap.get(property) ?? property, value);
            // `setInput` won't mark the view dirty if the input didn't change from its previous value.
            if (_isViewDirty(this.componentRef.hostView)) {
                // `setInput` will have marked the view dirty already, but also mark it for refresh. This
                // guarantees the view will be checked even if the input is being set from within change
                // detection. This provides backwards compatibility, since we used to unconditionally
                // schedule change detection in addition to the current zone run.
                _markForRefresh(this.componentRef.changeDetectorRef);
                // Notifying the scheduler with `NotificationSource.CustomElement` causes a `tick()` to be
                // scheduled unconditionally, even if the scheduler is otherwise disabled.
                this.cdScheduler.notify(6 /* NotificationSource.CustomElement */);
            }
        });
    }
    /**
     * Creates a new component through the component factory with the provided element host and
     * sets up its initial inputs, listens for outputs changes, and runs an initial change detection.
     */
    initializeComponent(element) {
        const childInjector = Injector.create({ providers: [], parent: this.injector });
        const projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
        this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
        this.initializeInputs();
        this.initializeOutputs(this.componentRef);
        this.appRef.attachView(this.componentRef.hostView);
        this.componentRef.hostView.detectChanges();
    }
    /** Set any stored initial inputs on the component's properties. */
    initializeInputs() {
        for (const [propName, value] of this.initialInputValues) {
            this.setInputValue(propName, value);
        }
        this.initialInputValues.clear();
    }
    /** Sets up listeners for the component's outputs so that the events stream emits the events. */
    initializeOutputs(componentRef) {
        const eventEmitters = this.componentFactory.outputs.map(({ propName, templateName }) => {
            const emitter = componentRef.instance[propName];
            return new Observable((observer) => {
                const sub = emitter.subscribe((value) => observer.next({ name: templateName, value }));
                return () => sub.unsubscribe();
            });
        });
        this.eventEmitters.next(eventEmitters);
    }
    /** Runs in the angular zone, if present. */
    runInZone(fn) {
        return this.elementZone && Zone.current !== this.elementZone ? this.ngZone.run(fn) : fn();
    }
}

/**
 * Implements the functionality needed for a custom element.
 *
 * @publicApi
 */
class NgElement extends HTMLElement {
    /**
     * A subscription to change, connect, and disconnect events in the custom element.
     */
    ngElementEventsSubscription = null;
}
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
 * @see [Angular Elements Overview](guide/elements "Turning Angular components into custom elements")
 *
 * @param component The component to transform.
 * @param config A configuration that provides initialization information to the created class.
 * @returns The custom-element construction class, which can be registered with
 * a browser's `CustomElementRegistry`.
 *
 * @publicApi
 */
function createCustomElement(component, config) {
    const inputs = getComponentInputs(component, config.injector);
    const strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
    const attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
    class NgElementImpl extends NgElement {
        injector;
        // Work around a bug in closure typed optimizations(b/79557487) where it is not honoring static
        // field externs. So using quoted access to explicitly prevent renaming.
        static ['observedAttributes'] = Object.keys(attributeToPropertyInputs);
        get ngElementStrategy() {
            // TODO(andrewseguin): Add e2e tests that cover cases where the constructor isn't called. For
            // now this is tested using a Google internal test suite.
            if (!this._ngElementStrategy) {
                const strategy = (this._ngElementStrategy = strategyFactory.create(this.injector || config.injector));
                // Re-apply pre-existing input values (set as properties on the element) through the
                // strategy.
                // TODO(alxhub): why are we doing this? this makes no sense.
                inputs.forEach(({ propName, transform }) => {
                    if (!this.hasOwnProperty(propName)) {
                        // No pre-existing value for `propName`.
                        return;
                    }
                    // Delete the property from the DOM node and re-apply it through the strategy.
                    const value = this[propName];
                    delete this[propName];
                    strategy.setInputValue(propName, value, transform);
                });
            }
            return this._ngElementStrategy;
        }
        _ngElementStrategy;
        constructor(injector) {
            super();
            this.injector = injector;
        }
        attributeChangedCallback(attrName, oldValue, newValue, namespace) {
            const [propName, transform] = attributeToPropertyInputs[attrName];
            this.ngElementStrategy.setInputValue(propName, newValue, transform);
        }
        connectedCallback() {
            // For historical reasons, some strategies may not have initialized the `events` property
            // until after `connect()` is run. Subscribe to `events` if it is available before running
            // `connect()` (in order to capture events emitted during initialization), otherwise subscribe
            // afterwards.
            //
            // TODO: Consider deprecating/removing the post-connect subscription in a future major version
            //       (e.g. v11).
            let subscribedToEvents = false;
            if (this.ngElementStrategy.events) {
                // `events` are already available: Subscribe to it asap.
                this.subscribeToEvents();
                subscribedToEvents = true;
            }
            this.ngElementStrategy.connect(this);
            if (!subscribedToEvents) {
                // `events` were not initialized before running `connect()`: Subscribe to them now.
                // The events emitted during the component initialization have been missed, but at least
                // future events will be captured.
                this.subscribeToEvents();
            }
        }
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
        subscribeToEvents() {
            // Listen for events from the strategy and dispatch them as custom events.
            this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe((e) => {
                const customEvent = new CustomEvent(e.name, { detail: e.value });
                this.dispatchEvent(customEvent);
            });
        }
    }
    // Add getters and setters to the prototype for each property input.
    inputs.forEach(({ propName, transform, isSignal: _isSignal }) => {
        Object.defineProperty(NgElementImpl.prototype, propName, {
            get() {
                const inputValue = this.ngElementStrategy.getInputValue(propName);
                return _isSignal && isSignal(inputValue) ? inputValue() : inputValue;
            },
            set(newValue) {
                this.ngElementStrategy.setInputValue(propName, newValue, transform);
            },
            configurable: true,
            enumerable: true,
        });
    });
    return NgElementImpl;
}

/**
 * @publicApi
 */
const VERSION = new Version('21.0.0-next.8+sha-fcf7eee');

export { NgElement, VERSION, createCustomElement };
//# sourceMappingURL=elements.mjs.map
