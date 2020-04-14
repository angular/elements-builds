/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/utils.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentFactoryResolver } from '@angular/core';
/** @type {?} */
const matches = ((/**
 * @return {?}
 */
() => {
    /** @type {?} */
    const elProto = (/** @type {?} */ (Element.prototype));
    return elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
        elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
}))();
/**
 * Provide methods for scheduling the execution of a callback.
 * @type {?}
 */
export const scheduler = {
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
export function camelToDashCase(input) {
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
export function createCustomEvent(doc, name, detail) {
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
export function isElement(node) {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
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
export function getComponentInputs(component, injector) {
    /** @type {?} */
    const componentFactoryResolver = injector.get(ComponentFactoryResolver);
    /** @type {?} */
    const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLHdCQUF3QixFQUFpQixNQUFNLGVBQWUsQ0FBQzs7TUFFakUsT0FBTyxHQUFHOzs7QUFBQyxHQUFHLEVBQUU7O1VBQ2QsT0FBTyxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxTQUFTLEVBQU87SUFDeEMsT0FBTyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFDLGtCQUFrQjtRQUMzRSxPQUFPLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztBQUM3RixDQUFDLEVBQUMsRUFBRTs7Ozs7QUFLSixNQUFNLE9BQU8sU0FBUyxHQUFHOzs7Ozs7Ozs7SUFNdkIsUUFBUSxDQUFDLE1BQWtCLEVBQUUsS0FBYTs7Y0FDbEMsRUFBRSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO1FBQ3BDOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEVBQUM7SUFDaEMsQ0FBQzs7Ozs7Ozs7O0lBUUQsb0JBQW9CLENBQUMsTUFBa0I7UUFDckMsK0VBQStFO1FBQy9FLDhFQUE4RTtRQUM5RSxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRTtZQUNqQyxxQ0FBcUM7WUFDckMsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN0QztRQUVELElBQUksT0FBTyxNQUFNLENBQUMscUJBQXFCLEtBQUssV0FBVyxFQUFFOztrQkFDakQsT0FBTyxHQUFHLEVBQUU7WUFDbEIsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM1Qzs7Y0FFSyxFQUFFLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQztRQUMvQzs7O1FBQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxFQUFDO0lBQy9DLENBQUM7Q0FDRjs7Ozs7O0FBS0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFhO0lBQzNDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFROzs7O0lBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFDLENBQUM7QUFDbkUsQ0FBQzs7Ozs7Ozs7QUFLRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsR0FBYSxFQUFFLElBQVksRUFBRSxNQUFXOztVQUNsRSxPQUFPLEdBQUcsS0FBSzs7VUFDZixVQUFVLEdBQUcsS0FBSztJQUV4QixpREFBaUQ7SUFDakQsSUFBSSxPQUFPLFdBQVcsS0FBSyxVQUFVLEVBQUU7O2NBQy9CLEtBQUssR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUM1QyxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDOzs7Ozs7QUFLRCxNQUFNLFVBQVUsU0FBUyxDQUFDLElBQWU7SUFDdkMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQztBQUN2RCxDQUFDOzs7Ozs7QUFLRCxNQUFNLFVBQVUsVUFBVSxDQUFDLEtBQVU7SUFDbkMsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQzs7Ozs7O0FBS0QsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQWE7SUFDNUMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWE7Ozs7O0lBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUMsQ0FBQztBQUN2RSxDQUFDOzs7Ozs7O0FBS0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUFnQixFQUFFLFFBQWdCO0lBQ2hFLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDekMsQ0FBQzs7Ozs7OztBQUtELE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVyxFQUFFLE1BQVc7SUFDbkQsT0FBTyxNQUFNLEtBQUssTUFBTSxJQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLEtBQUssTUFBTSxDQUFDLENBQUM7QUFDdkUsQ0FBQzs7Ozs7O0FBR0QsTUFBTSxVQUFVLG1DQUFtQyxDQUMvQyxNQUFrRDs7VUFDOUMseUJBQXlCLEdBQTRCLEVBQUU7SUFDN0QsTUFBTSxDQUFDLE9BQU87Ozs7SUFBQyxDQUFDLEVBQUMsUUFBUSxFQUFFLFlBQVksRUFBQyxFQUFFLEVBQUU7UUFDMUMseUJBQXlCLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO0lBQ3RFLENBQUMsRUFBQyxDQUFDO0lBRUgsT0FBTyx5QkFBeUIsQ0FBQztBQUNuQyxDQUFDOzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsU0FBb0IsRUFBRSxRQUFrQjs7VUFDcEMsd0JBQXdCLEdBQTZCLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUM7O1VBQzNGLGdCQUFnQixHQUFHLHdCQUF3QixDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQztJQUNwRixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIEluamVjdG9yLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuY29uc3QgbWF0Y2hlcyA9ICgoKSA9PiB7XG4gIGNvbnN0IGVsUHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZSBhcyBhbnk7XG4gIHJldHVybiBlbFByb3RvLm1hdGNoZXMgfHwgZWxQcm90by5tYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by5tb3pNYXRjaGVzU2VsZWN0b3IgfHxcbiAgICAgIGVsUHJvdG8ubXNNYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by5vTWF0Y2hlc1NlbGVjdG9yIHx8IGVsUHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yO1xufSkoKTtcblxuLyoqXG4gKiBQcm92aWRlIG1ldGhvZHMgZm9yIHNjaGVkdWxpbmcgdGhlIGV4ZWN1dGlvbiBvZiBhIGNhbGxiYWNrLlxuICovXG5leHBvcnQgY29uc3Qgc2NoZWR1bGVyID0ge1xuICAvKipcbiAgICogU2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgYWZ0ZXIgc29tZSBkZWxheS5cbiAgICpcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBleGVjdXRlZCB3aWxsIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2NoZWR1bGUodGFza0ZuOiAoKSA9PiB2b2lkLCBkZWxheTogbnVtYmVyKTogKCkgPT4gdm9pZCB7XG4gICAgY29uc3QgaWQgPSBzZXRUaW1lb3V0KHRhc2tGbiwgZGVsYXkpO1xuICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQoaWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhlIG5leHQgcmVuZGVyLlxuICAgKiAoSWYgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWAgaXMgbm90IGF2YWlsYWJsZSwgdXNlIGBzY2hlZHVsZXIuc2NoZWR1bGUoKWAgaW5zdGVhZC4pXG4gICAqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdoZW4gZXhlY3V0ZWQgd2lsbCBjYW5jZWwgdGhlIHNjaGVkdWxlZCBmdW5jdGlvbi5cbiAgICovXG4gIHNjaGVkdWxlQmVmb3JlUmVuZGVyKHRhc2tGbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgIC8vIFRPRE8oZ2thbHBhayk6IEltcGxlbWVudCBhIGJldHRlciB3YXkgb2YgYWNjZXNzaW5nIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWBcbiAgICAvLyAgICAgICAgICAgICAgICAoZS5nLiBhY2NvdW50aW5nIGZvciB2ZW5kb3IgcHJlZml4LCBTU1ItY29tcGF0aWJpbGl0eSwgZXRjKS5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIEZvciBTU1IganVzdCBzY2hlZHVsZSBpbW1lZGlhdGVseS5cbiAgICAgIHJldHVybiBzY2hlZHVsZXIuc2NoZWR1bGUodGFza0ZuLCAwKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb25zdCBmcmFtZU1zID0gMTY7XG4gICAgICByZXR1cm4gc2NoZWR1bGVyLnNjaGVkdWxlKHRhc2tGbiwgZnJhbWVNcyk7XG4gICAgfVxuXG4gICAgY29uc3QgaWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRhc2tGbik7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH0sXG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBjYW1lbENhc2VkIHN0cmluZyB0byBrZWJhYi1jYXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbWVsVG9EYXNoQ2FzZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1tBLVpdL2csIGNoYXIgPT4gYC0ke2NoYXIudG9Mb3dlckNhc2UoKX1gKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBgQ3VzdG9tRXZlbnRgIChldmVuIG9uIGJyb3dzZXJzIHdoZXJlIGBDdXN0b21FdmVudGAgaXMgbm90IGEgY29uc3RydWN0b3IpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRXZlbnQoZG9jOiBEb2N1bWVudCwgbmFtZTogc3RyaW5nLCBkZXRhaWw6IGFueSk6IEN1c3RvbUV2ZW50IHtcbiAgY29uc3QgYnViYmxlcyA9IGZhbHNlO1xuICBjb25zdCBjYW5jZWxhYmxlID0gZmFsc2U7XG5cbiAgLy8gT24gSUU5LTExLCBgQ3VzdG9tRXZlbnRgIGlzIG5vdCBhIGNvbnN0cnVjdG9yLlxuICBpZiAodHlwZW9mIEN1c3RvbUV2ZW50ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgZXZlbnQgPSBkb2MuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZXZlbnQuaW5pdEN1c3RvbUV2ZW50KG5hbWUsIGJ1YmJsZXMsIGNhbmNlbGFibGUsIGRldGFpbCk7XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDdXN0b21FdmVudChuYW1lLCB7YnViYmxlcywgY2FuY2VsYWJsZSwgZGV0YWlsfSk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgaW5wdXQgaXMgYW4gYEVsZW1lbnRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFbGVtZW50KG5vZGU6IE5vZGV8bnVsbCk6IG5vZGUgaXMgRWxlbWVudCB7XG4gIHJldHVybiAhIW5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREU7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgaW5wdXQgaXMgYSBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWU6IGFueSk6IHZhbHVlIGlzIEZ1bmN0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEga2ViYWItY2FzZWQgc3RyaW5nIHRvIGNhbWVsQ2FzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBrZWJhYlRvQ2FtZWxDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvLShbYS16XFxkXSkvZywgKF8sIGNoYXIpID0+IGNoYXIudG9VcHBlckNhc2UoKSk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBgRWxlbWVudGAgbWF0Y2hlcyBhIENTUyBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoZXNTZWxlY3RvcihlbGVtZW50OiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBtYXRjaGVzLmNhbGwoZWxlbWVudCwgc2VsZWN0b3IpO1xufVxuXG4vKipcbiAqIFRlc3QgdHdvIHZhbHVlcyBmb3Igc3RyaWN0IGVxdWFsaXR5LCBhY2NvdW50aW5nIGZvciB0aGUgZmFjdCB0aGF0IGBOYU4gIT09IE5hTmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpY3RFcXVhbHModmFsdWUxOiBhbnksIHZhbHVlMjogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB2YWx1ZTEgPT09IHZhbHVlMiB8fCAodmFsdWUxICE9PSB2YWx1ZTEgJiYgdmFsdWUyICE9PSB2YWx1ZTIpO1xufVxuXG4vKiogR2V0cyBhIG1hcCBvZiBkZWZhdWx0IHNldCBvZiBhdHRyaWJ1dGVzIHRvIG9ic2VydmUgYW5kIHRoZSBwcm9wZXJ0aWVzIHRoZXkgYWZmZWN0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKFxuICAgIGlucHV0czoge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdKSB7XG4gIGNvbnN0IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gIGlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pID0+IHtcbiAgICBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzW2NhbWVsVG9EYXNoQ2FzZSh0ZW1wbGF0ZU5hbWUpXSA9IHByb3BOYW1lO1xuICB9KTtcblxuICByZXR1cm4gYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cztcbn1cblxuLyoqXG4gKiBHZXRzIGEgY29tcG9uZW50J3Mgc2V0IG9mIGlucHV0cy4gVXNlcyB0aGUgaW5qZWN0b3IgdG8gZ2V0IHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aGVyZSB0aGUgaW5wdXRzXG4gKiBhcmUgZGVmaW5lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudElucHV0cyhcbiAgICBjb21wb25lbnQ6IFR5cGU8YW55PiwgaW5qZWN0b3I6IEluamVjdG9yKToge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdIHtcbiAgY29uc3QgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBpbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeS5pbnB1dHM7XG59XG4iXX0=