/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
import { ComponentFactoryResolver } from '@angular/core';
var /** @type {?} */ elProto = /** @type {?} */ (Element.prototype);
var /** @type {?} */ matches = elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
    elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
/**
 * Provide methods for scheduling the execution of a callback.
 */
export var /** @type {?} */ scheduler = {
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
    function (taskFn, delay) { var /** @type {?} */ id = window.setTimeout(taskFn, delay); return function () { return window.clearTimeout(id); }; },
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
export function camelToDashCase(input) {
    return input.replace(/[A-Z]/g, function (char) { return "-" + char.toLowerCase(); });
}
/**
 * Create a `CustomEvent` (even on browsers where `CustomEvent` is not a constructor).
 * @param {?} doc
 * @param {?} name
 * @param {?} detail
 * @return {?}
 */
export function createCustomEvent(doc, name, detail) {
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
export function isElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}
/**
 * Check whether the input is a function.
 * @param {?} value
 * @return {?}
 */
export function isFunction(value) {
    return typeof value === 'function';
}
/**
 * Convert a kebab-cased string to camelCased.
 * @param {?} input
 * @return {?}
 */
export function kebabToCamelCase(input) {
    return input.replace(/-([a-z\d])/g, function (_, char) { return char.toUpperCase(); });
}
/**
 * Check whether an `Element` matches a CSS selector.
 * @param {?} element
 * @param {?} selector
 * @return {?}
 */
export function matchesSelector(element, selector) {
    return matches.call(element, selector);
}
/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 * @param {?} value1
 * @param {?} value2
 * @return {?}
 */
export function strictEquals(value1, value2) {
    return value1 === value2 || (value1 !== value1 && value2 !== value2);
}
/**
 * Gets a map of default set of attributes to observe and the properties they affect.
 * @param {?} inputs
 * @return {?}
 */
export function getDefaultAttributeToPropertyInputs(inputs) {
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
export function getComponentInputs(component, injector) {
    var /** @type {?} */ componentFactoryResolver = injector.get(ComponentFactoryResolver);
    var /** @type {?} */ componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}
//# sourceMappingURL=utils.js.map