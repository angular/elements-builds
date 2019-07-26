/**
 * @fileoverview added by tsickle
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
export const scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     *
     * Returns a function that when executed will cancel the scheduled function.
     * @param {?} taskFn
     * @param {?} delay
     * @return {?}
     */
    schedule(taskFn, delay) { /** @type {?} */
    const id = setTimeout(taskFn, delay); return (/**
     * @return {?}
     */
    () => clearTimeout(id)); },
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
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsd0JBQXdCLEVBQWlCLE1BQU0sZUFBZSxDQUFDOzs7O0FBRXRELEdBQUcsRUFBRTs7VUFDZCxPQUFPLEdBQUcsbUJBQUEsT0FBTyxDQUFDLFNBQVMsRUFBTztJQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUMsa0JBQWtCO1FBQzNFLE9BQU8sQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLElBQUksT0FBTyxDQUFDLHFCQUFxQixDQUFDO0FBQzdGLENBQUM7O01BSkssT0FBTyxHQUFHLE1BSWQsRUFBRTs7Ozs7QUFLSixNQUFNLE9BQU8sU0FBUyxHQUFHOzs7Ozs7Ozs7SUFNdkIsUUFBUSxDQUFDLE1BQWtCLEVBQUUsS0FBYTtVQUMzQixFQUFFLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTs7O0lBQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUEsQ0FBQzs7Ozs7Ozs7O0lBUTlFLG9CQUFvQixDQUFDLE1BQWtCO1FBQ3JDLCtFQUErRTtRQUMvRSw4RUFBOEU7UUFDOUUsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDakMscUNBQXFDO1lBQ3JDLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDdEM7UUFFRCxJQUFJLE9BQU8sTUFBTSxDQUFDLHFCQUFxQixLQUFLLFdBQVcsRUFBRTs7a0JBQ2pELE9BQU8sR0FBRyxFQUFFO1lBQ2xCLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDNUM7O2NBRUssRUFBRSxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUM7UUFDL0M7OztRQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsRUFBQztJQUMvQyxDQUFDO0NBQ0Y7Ozs7OztBQUtELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBYTtJQUMzQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUTs7OztJQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsRUFBQyxDQUFDO0FBQ25FLENBQUM7Ozs7Ozs7O0FBS0QsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEdBQWEsRUFBRSxJQUFZLEVBQUUsTUFBVzs7VUFDbEUsT0FBTyxHQUFHLEtBQUs7O1VBQ2YsVUFBVSxHQUFHLEtBQUs7SUFFeEIsaURBQWlEO0lBQ2pELElBQUksT0FBTyxXQUFXLEtBQUssVUFBVSxFQUFFOztjQUMvQixLQUFLLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDNUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RCxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQzs7Ozs7O0FBS0QsTUFBTSxVQUFVLFNBQVMsQ0FBQyxJQUFpQjtJQUN6QyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3ZELENBQUM7Ozs7OztBQUtELE1BQU0sVUFBVSxVQUFVLENBQUMsS0FBVTtJQUNuQyxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDOzs7Ozs7QUFLRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBYTtJQUM1QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYTs7Ozs7SUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBQyxDQUFDO0FBQ3ZFLENBQUM7Ozs7Ozs7QUFLRCxNQUFNLFVBQVUsZUFBZSxDQUFDLE9BQWdCLEVBQUUsUUFBZ0I7SUFDaEUsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN6QyxDQUFDOzs7Ozs7O0FBS0QsTUFBTSxVQUFVLFlBQVksQ0FBQyxNQUFXLEVBQUUsTUFBVztJQUNuRCxPQUFPLE1BQU0sS0FBSyxNQUFNLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQztBQUN2RSxDQUFDOzs7Ozs7QUFHRCxNQUFNLFVBQVUsbUNBQW1DLENBQy9DLE1BQWtEOztVQUM5Qyx5QkFBeUIsR0FBNEIsRUFBRTtJQUM3RCxNQUFNLENBQUMsT0FBTzs7OztJQUFDLENBQUMsRUFBQyxRQUFRLEVBQUUsWUFBWSxFQUFDLEVBQUUsRUFBRTtRQUMxQyx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7SUFDdEUsQ0FBQyxFQUFDLENBQUM7SUFFSCxPQUFPLHlCQUF5QixDQUFDO0FBQ25DLENBQUM7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixTQUFvQixFQUFFLFFBQWtCOztVQUNwQyx3QkFBd0IsR0FBNkIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQzs7VUFDM0YsZ0JBQWdCLEdBQUcsd0JBQXdCLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDO0lBQ3BGLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0FBQ2pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgSW5qZWN0b3IsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5jb25zdCBtYXRjaGVzID0gKCgpID0+IHtcbiAgY29uc3QgZWxQcm90byA9IEVsZW1lbnQucHJvdG90eXBlIGFzIGFueTtcbiAgcmV0dXJuIGVsUHJvdG8ubWF0Y2hlcyB8fCBlbFByb3RvLm1hdGNoZXNTZWxlY3RvciB8fCBlbFByb3RvLm1vek1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgZWxQcm90by5tc01hdGNoZXNTZWxlY3RvciB8fCBlbFByb3RvLm9NYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by53ZWJraXRNYXRjaGVzU2VsZWN0b3I7XG59KSgpO1xuXG4vKipcbiAqIFByb3ZpZGUgbWV0aG9kcyBmb3Igc2NoZWR1bGluZyB0aGUgZXhlY3V0aW9uIG9mIGEgY2FsbGJhY2suXG4gKi9cbmV4cG9ydCBjb25zdCBzY2hlZHVsZXIgPSB7XG4gIC8qKlxuICAgKiBTY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciBzb21lIGRlbGF5LlxuICAgKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aGVuIGV4ZWN1dGVkIHdpbGwgY2FuY2VsIHRoZSBzY2hlZHVsZWQgZnVuY3Rpb24uXG4gICAqL1xuICBzY2hlZHVsZSh0YXNrRm46ICgpID0+IHZvaWQsIGRlbGF5OiBudW1iZXIpOiAoKSA9PlxuICAgICAgdm9pZHtjb25zdCBpZCA9IHNldFRpbWVvdXQodGFza0ZuLCBkZWxheSk7IHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQoaWQpO30sXG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGUgbmV4dCByZW5kZXIuXG4gICAqIChJZiBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgpYCBpcyBub3QgYXZhaWxhYmxlLCB1c2UgYHNjaGVkdWxlci5zY2hlZHVsZSgpYCBpbnN0ZWFkLilcbiAgICpcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBleGVjdXRlZCB3aWxsIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2NoZWR1bGVCZWZvcmVSZW5kZXIodGFza0ZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZHtcbiAgICAvLyBUT0RPKGdrYWxwYWspOiBJbXBsZW1lbnQgYSBiZXR0ZXIgd2F5IG9mIGFjY2Vzc2luZyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKClgXG4gICAgLy8gICAgICAgICAgICAgICAgKGUuZy4gYWNjb3VudGluZyBmb3IgdmVuZG9yIHByZWZpeCwgU1NSLWNvbXBhdGliaWxpdHksIGV0YykuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBGb3IgU1NSIGp1c3Qgc2NoZWR1bGUgaW1tZWRpYXRlbHkuXG4gICAgICByZXR1cm4gc2NoZWR1bGVyLnNjaGVkdWxlKHRhc2tGbiwgMCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgZnJhbWVNcyA9IDE2O1xuICAgICAgcmV0dXJuIHNjaGVkdWxlci5zY2hlZHVsZSh0YXNrRm4sIGZyYW1lTXMpO1xuICAgIH1cblxuICAgIGNvbnN0IGlkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0YXNrRm4pO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpO1xuICB9LFxufTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgY2FtZWxDYXNlZCBzdHJpbmcgdG8ga2ViYWItY2FzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbFRvRGFzaENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9bQS1aXS9nLCBjaGFyID0+IGAtJHtjaGFyLnRvTG93ZXJDYXNlKCl9YCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgYEN1c3RvbUV2ZW50YCAoZXZlbiBvbiBicm93c2VycyB3aGVyZSBgQ3VzdG9tRXZlbnRgIGlzIG5vdCBhIGNvbnN0cnVjdG9yKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUV2ZW50KGRvYzogRG9jdW1lbnQsIG5hbWU6IHN0cmluZywgZGV0YWlsOiBhbnkpOiBDdXN0b21FdmVudCB7XG4gIGNvbnN0IGJ1YmJsZXMgPSBmYWxzZTtcbiAgY29uc3QgY2FuY2VsYWJsZSA9IGZhbHNlO1xuXG4gIC8vIE9uIElFOS0xMSwgYEN1c3RvbUV2ZW50YCBpcyBub3QgYSBjb25zdHJ1Y3Rvci5cbiAgaWYgKHR5cGVvZiBDdXN0b21FdmVudCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IGV2ZW50ID0gZG9jLmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGV2ZW50LmluaXRDdXN0b21FdmVudChuYW1lLCBidWJibGVzLCBjYW5jZWxhYmxlLCBkZXRhaWwpO1xuICAgIHJldHVybiBldmVudDtcbiAgfVxuXG4gIHJldHVybiBuZXcgQ3VzdG9tRXZlbnQobmFtZSwge2J1YmJsZXMsIGNhbmNlbGFibGUsIGRldGFpbH0pO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IGlzIGFuIGBFbGVtZW50YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRWxlbWVudChub2RlOiBOb2RlIHwgbnVsbCk6IG5vZGUgaXMgRWxlbWVudCB7XG4gIHJldHVybiAhIW5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREU7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgaW5wdXQgaXMgYSBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWU6IGFueSk6IHZhbHVlIGlzIEZ1bmN0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEga2ViYWItY2FzZWQgc3RyaW5nIHRvIGNhbWVsQ2FzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBrZWJhYlRvQ2FtZWxDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvLShbYS16XFxkXSkvZywgKF8sIGNoYXIpID0+IGNoYXIudG9VcHBlckNhc2UoKSk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBgRWxlbWVudGAgbWF0Y2hlcyBhIENTUyBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoZXNTZWxlY3RvcihlbGVtZW50OiBFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBtYXRjaGVzLmNhbGwoZWxlbWVudCwgc2VsZWN0b3IpO1xufVxuXG4vKipcbiAqIFRlc3QgdHdvIHZhbHVlcyBmb3Igc3RyaWN0IGVxdWFsaXR5LCBhY2NvdW50aW5nIGZvciB0aGUgZmFjdCB0aGF0IGBOYU4gIT09IE5hTmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpY3RFcXVhbHModmFsdWUxOiBhbnksIHZhbHVlMjogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB2YWx1ZTEgPT09IHZhbHVlMiB8fCAodmFsdWUxICE9PSB2YWx1ZTEgJiYgdmFsdWUyICE9PSB2YWx1ZTIpO1xufVxuXG4vKiogR2V0cyBhIG1hcCBvZiBkZWZhdWx0IHNldCBvZiBhdHRyaWJ1dGVzIHRvIG9ic2VydmUgYW5kIHRoZSBwcm9wZXJ0aWVzIHRoZXkgYWZmZWN0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRBdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzKFxuICAgIGlucHV0czoge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdKSB7XG4gIGNvbnN0IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gIGlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pID0+IHtcbiAgICBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzW2NhbWVsVG9EYXNoQ2FzZSh0ZW1wbGF0ZU5hbWUpXSA9IHByb3BOYW1lO1xuICB9KTtcblxuICByZXR1cm4gYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cztcbn1cblxuLyoqXG4gKiBHZXRzIGEgY29tcG9uZW50J3Mgc2V0IG9mIGlucHV0cy4gVXNlcyB0aGUgaW5qZWN0b3IgdG8gZ2V0IHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aGVyZSB0aGUgaW5wdXRzXG4gKiBhcmUgZGVmaW5lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudElucHV0cyhcbiAgICBjb21wb25lbnQ6IFR5cGU8YW55PiwgaW5qZWN0b3I6IEluamVjdG9yKToge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdIHtcbiAgY29uc3QgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBpbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeS5pbnB1dHM7XG59XG4iXX0=