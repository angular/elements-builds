/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
const elProto = (/** @type {?} */ (Element.prototype));
/** @type {?} */
const matches = elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
    elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
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
    const id = setTimeout(taskFn, delay); return () => clearTimeout(id); },
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
        return () => window.cancelAnimationFrame(id);
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 * @param {?} input
 * @return {?}
 */
export function camelToDashCase(input) {
    return input.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
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
    return input.replace(/-([a-z\d])/g, (_, char) => char.toUpperCase());
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
    inputs.forEach(({ propName, templateName }) => {
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
    /** @type {?} */
    const componentFactoryResolver = injector.get(ComponentFactoryResolver);
    /** @type {?} */
    const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsd0JBQXdCLEVBQWlCLE1BQU0sZUFBZSxDQUFDOztNQUVqRSxPQUFPLEdBQUcsbUJBQUEsT0FBTyxDQUFDLFNBQVMsRUFBTzs7TUFDbEMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUMsa0JBQWtCO0lBQ3BGLE9BQU8sQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLElBQUksT0FBTyxDQUFDLHFCQUFxQjs7Ozs7QUFLMUYsTUFBTSxPQUFPLFNBQVMsR0FBRzs7Ozs7Ozs7O0lBTXZCLFFBQVEsQ0FBQyxNQUFrQixFQUFFLEtBQWE7VUFDM0IsRUFBRSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQSxDQUFDOzs7Ozs7Ozs7SUFROUUsb0JBQW9CLENBQUMsTUFBa0I7UUFDckMsK0VBQStFO1FBQy9FLDhFQUE4RTtRQUM5RSxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRTtZQUNqQyxxQ0FBcUM7WUFDckMsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN0QztRQUVELElBQUksT0FBTyxNQUFNLENBQUMscUJBQXFCLEtBQUssV0FBVyxFQUFFOztrQkFDakQsT0FBTyxHQUFHLEVBQUU7WUFDbEIsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM1Qzs7Y0FFSyxFQUFFLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQztRQUMvQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBQ0Y7Ozs7OztBQUtELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBYTtJQUMzQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ25FLENBQUM7Ozs7Ozs7O0FBS0QsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEdBQWEsRUFBRSxJQUFZLEVBQUUsTUFBVzs7VUFDbEUsT0FBTyxHQUFHLEtBQUs7O1VBQ2YsVUFBVSxHQUFHLEtBQUs7SUFFeEIsaURBQWlEO0lBQ2pELElBQUksT0FBTyxXQUFXLEtBQUssVUFBVSxFQUFFOztjQUMvQixLQUFLLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDNUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RCxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQzs7Ozs7O0FBS0QsTUFBTSxVQUFVLFNBQVMsQ0FBQyxJQUFpQjtJQUN6QyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3ZELENBQUM7Ozs7OztBQUtELE1BQU0sVUFBVSxVQUFVLENBQUMsS0FBVTtJQUNuQyxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDOzs7Ozs7QUFLRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBYTtJQUM1QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDdkUsQ0FBQzs7Ozs7OztBQUtELE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBZ0IsRUFBRSxRQUFnQjtJQUNoRSxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7Ozs7Ozs7QUFLRCxNQUFNLFVBQVUsWUFBWSxDQUFDLE1BQVcsRUFBRSxNQUFXO0lBQ25ELE9BQU8sTUFBTSxLQUFLLE1BQU0sSUFBSSxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7Ozs7OztBQUdELE1BQU0sVUFBVSxtQ0FBbUMsQ0FDL0MsTUFBa0Q7O1VBQzlDLHlCQUF5QixHQUE0QixFQUFFO0lBQzdELE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUMsRUFBRSxFQUFFO1FBQzFDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztJQUN0RSxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8seUJBQXlCLENBQUM7QUFDbkMsQ0FBQzs7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLFNBQW9CLEVBQUUsUUFBa0I7O1VBQ3BDLHdCQUF3QixHQUE2QixRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDOztVQUMzRixnQkFBZ0IsR0FBRyx3QkFBd0IsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUM7SUFDcEYsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7QUFDakMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBJbmplY3RvciwgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmNvbnN0IGVsUHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZSBhcyBhbnk7XG5jb25zdCBtYXRjaGVzID0gZWxQcm90by5tYXRjaGVzIHx8IGVsUHJvdG8ubWF0Y2hlc1NlbGVjdG9yIHx8IGVsUHJvdG8ubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgZWxQcm90by5tc01hdGNoZXNTZWxlY3RvciB8fCBlbFByb3RvLm9NYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by53ZWJraXRNYXRjaGVzU2VsZWN0b3I7XG5cbi8qKlxuICogUHJvdmlkZSBtZXRob2RzIGZvciBzY2hlZHVsaW5nIHRoZSBleGVjdXRpb24gb2YgYSBjYWxsYmFjay5cbiAqL1xuZXhwb3J0IGNvbnN0IHNjaGVkdWxlciA9IHtcbiAgLyoqXG4gICAqIFNjaGVkdWxlIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIHNvbWUgZGVsYXkuXG4gICAqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdoZW4gZXhlY3V0ZWQgd2lsbCBjYW5jZWwgdGhlIHNjaGVkdWxlZCBmdW5jdGlvbi5cbiAgICovXG4gIHNjaGVkdWxlKHRhc2tGbjogKCkgPT4gdm9pZCwgZGVsYXk6IG51bWJlcik6ICgpID0+XG4gICAgICB2b2lke2NvbnN0IGlkID0gc2V0VGltZW91dCh0YXNrRm4sIGRlbGF5KTsgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dChpZCk7fSxcblxuICAvKipcbiAgICogU2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgYmVmb3JlIHRoZSBuZXh0IHJlbmRlci5cbiAgICogKElmIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKClgIGlzIG5vdCBhdmFpbGFibGUsIHVzZSBgc2NoZWR1bGVyLnNjaGVkdWxlKClgIGluc3RlYWQuKVxuICAgKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aGVuIGV4ZWN1dGVkIHdpbGwgY2FuY2VsIHRoZSBzY2hlZHVsZWQgZnVuY3Rpb24uXG4gICAqL1xuICBzY2hlZHVsZUJlZm9yZVJlbmRlcih0YXNrRm46ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lke1xuICAgIC8vIFRPRE8oZ2thbHBhayk6IEltcGxlbWVudCBhIGJldHRlciB3YXkgb2YgYWNjZXNzaW5nIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWBcbiAgICAvLyAgICAgICAgICAgICAgICAoZS5nLiBhY2NvdW50aW5nIGZvciB2ZW5kb3IgcHJlZml4LCBTU1ItY29tcGF0aWJpbGl0eSwgZXRjKS5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIEZvciBTU1IganVzdCBzY2hlZHVsZSBpbW1lZGlhdGVseS5cbiAgICAgIHJldHVybiBzY2hlZHVsZXIuc2NoZWR1bGUodGFza0ZuLCAwKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb25zdCBmcmFtZU1zID0gMTY7XG4gICAgICByZXR1cm4gc2NoZWR1bGVyLnNjaGVkdWxlKHRhc2tGbiwgZnJhbWVNcyk7XG4gICAgfVxuXG4gICAgY29uc3QgaWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRhc2tGbik7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH0sXG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBjYW1lbENhc2VkIHN0cmluZyB0byBrZWJhYi1jYXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbWVsVG9EYXNoQ2FzZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1tBLVpdL2csIGNoYXIgPT4gYC0ke2NoYXIudG9Mb3dlckNhc2UoKX1gKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBgQ3VzdG9tRXZlbnRgIChldmVuIG9uIGJyb3dzZXJzIHdoZXJlIGBDdXN0b21FdmVudGAgaXMgbm90IGEgY29uc3RydWN0b3IpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRXZlbnQoZG9jOiBEb2N1bWVudCwgbmFtZTogc3RyaW5nLCBkZXRhaWw6IGFueSk6IEN1c3RvbUV2ZW50IHtcbiAgY29uc3QgYnViYmxlcyA9IGZhbHNlO1xuICBjb25zdCBjYW5jZWxhYmxlID0gZmFsc2U7XG5cbiAgLy8gT24gSUU5LTExLCBgQ3VzdG9tRXZlbnRgIGlzIG5vdCBhIGNvbnN0cnVjdG9yLlxuICBpZiAodHlwZW9mIEN1c3RvbUV2ZW50ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgZXZlbnQgPSBkb2MuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZXZlbnQuaW5pdEN1c3RvbUV2ZW50KG5hbWUsIGJ1YmJsZXMsIGNhbmNlbGFibGUsIGRldGFpbCk7XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9XG5cbiAgcmV0dXJuIG5ldyBDdXN0b21FdmVudChuYW1lLCB7YnViYmxlcywgY2FuY2VsYWJsZSwgZGV0YWlsfSk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgaW5wdXQgaXMgYW4gYEVsZW1lbnRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFbGVtZW50KG5vZGU6IE5vZGUgfCBudWxsKTogbm9kZSBpcyBFbGVtZW50IHtcbiAgcmV0dXJuICEhbm9kZSAmJiBub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZTogYW55KTogdmFsdWUgaXMgRnVuY3Rpb24ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBrZWJhYi1jYXNlZCBzdHJpbmcgdG8gY2FtZWxDYXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtlYmFiVG9DYW1lbENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC8tKFthLXpcXGRdKS9nLCAoXywgY2hhcikgPT4gY2hhci50b1VwcGVyQ2FzZSgpKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGBFbGVtZW50YCBtYXRjaGVzIGEgQ1NTIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQ6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIG1hdGNoZXMuY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG59XG5cbi8qKlxuICogVGVzdCB0d28gdmFsdWVzIGZvciBzdHJpY3QgZXF1YWxpdHksIGFjY291bnRpbmcgZm9yIHRoZSBmYWN0IHRoYXQgYE5hTiAhPT0gTmFOYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmljdEVxdWFscyh2YWx1ZTE6IGFueSwgdmFsdWUyOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlMSA9PT0gdmFsdWUyIHx8ICh2YWx1ZTEgIT09IHZhbHVlMSAmJiB2YWx1ZTIgIT09IHZhbHVlMik7XG59XG5cbi8qKiBHZXRzIGEgbWFwIG9mIGRlZmF1bHQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gb2JzZXJ2ZSBhbmQgdGhlIHByb3BlcnRpZXMgdGhleSBhZmZlY3QuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMoXG4gICAgaW5wdXRzOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10pIHtcbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSkgPT4ge1xuICAgIGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHNbY2FtZWxUb0Rhc2hDYXNlKHRlbXBsYXRlTmFtZSldID0gcHJvcE5hbWU7XG4gIH0pO1xuXG4gIHJldHVybiBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzO1xufVxuXG4vKipcbiAqIEdldHMgYSBjb21wb25lbnQncyBzZXQgb2YgaW5wdXRzLiBVc2VzIHRoZSBpbmplY3RvciB0byBnZXQgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdoZXJlIHRoZSBpbnB1dHNcbiAqIGFyZSBkZWZpbmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50SW5wdXRzKFxuICAgIGNvbXBvbmVudDogVHlwZTxhbnk+LCBpbmplY3RvcjogSW5qZWN0b3IpOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10ge1xuICBjb25zdCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IGluamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIHJldHVybiBjb21wb25lbnRGYWN0b3J5LmlucHV0cztcbn1cbiJdfQ==