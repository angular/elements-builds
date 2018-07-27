/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { ComponentFactoryResolver } from '@angular/core';
/** @type {?} */
const elProto = /** @type {?} */ (Element.prototype);
/** @type {?} */
const matches = elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
    elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
/** *
 * Provide methods for scheduling the execution of a callback.
  @type {?} */
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
        return () => clearTimeout(id);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQU9BLE9BQU8sRUFBQyx3QkFBd0IsRUFBaUIsTUFBTSxlQUFlLENBQUM7O0FBRXZFLE1BQU0sT0FBTyxxQkFBRyxPQUFPLENBQUMsU0FBZ0IsRUFBQzs7QUFDekMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBQyxrQkFBa0I7SUFDcEYsT0FBTyxDQUFDLGlCQUFpQixJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLENBQUMscUJBQXFCLENBQUM7Ozs7QUFLM0YsYUFBYSxTQUFTLEdBQUc7Ozs7Ozs7OztJQU12QixRQUFRLENBQUMsTUFBa0IsRUFBRSxLQUFhOztRQUNqQyxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7S0FBQzs7Ozs7Ozs7O0lBUTlFLG9CQUFvQixDQUFDLE1BQWtCOzs7UUFHckMsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7O1lBRWpDLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDdEM7UUFFRCxJQUFJLE9BQU8sTUFBTSxDQUFDLHFCQUFxQixLQUFLLFdBQVcsRUFBRTs7WUFDdkQsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ25CLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDNUM7O1FBRUQsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hELE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQzlDO0NBQ0YsQ0FBQzs7Ozs7O0FBS0YsTUFBTSwwQkFBMEIsS0FBYTtJQUMzQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0NBQ2xFOzs7Ozs7OztBQUtELE1BQU0sNEJBQTRCLEdBQWEsRUFBRSxJQUFZLEVBQUUsTUFBVzs7SUFDeEUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDOztJQUN0QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUM7O0lBR3pCLElBQUksT0FBTyxXQUFXLEtBQUssVUFBVSxFQUFFOztRQUNyQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzdDLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekQsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO0NBQzdEOzs7Ozs7QUFLRCxNQUFNLG9CQUFvQixJQUFVO0lBQ2xDLE9BQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDO0NBQzVDOzs7Ozs7QUFLRCxNQUFNLHFCQUFxQixLQUFVO0lBQ25DLE9BQU8sT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO0NBQ3BDOzs7Ozs7QUFLRCxNQUFNLDJCQUEyQixLQUFhO0lBQzVDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztDQUN0RTs7Ozs7OztBQUtELE1BQU0sMEJBQTBCLE9BQWdCLEVBQUUsUUFBZ0I7SUFDaEUsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztDQUN4Qzs7Ozs7OztBQUtELE1BQU0sdUJBQXVCLE1BQVcsRUFBRSxNQUFXO0lBQ25ELE9BQU8sTUFBTSxLQUFLLE1BQU0sSUFBSSxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDO0NBQ3RFOzs7Ozs7QUFHRCxNQUFNLDhDQUNGLE1BQWtEOztJQUNwRCxNQUFNLHlCQUF5QixHQUE0QixFQUFFLENBQUM7SUFDOUQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFFLFlBQVksRUFBQyxFQUFFLEVBQUU7UUFDMUMseUJBQXlCLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO0tBQ3JFLENBQUMsQ0FBQztJQUVILE9BQU8seUJBQXlCLENBQUM7Q0FDbEM7Ozs7Ozs7O0FBTUQsTUFBTSw2QkFDRixTQUFvQixFQUFFLFFBQWtCOztJQUMxQyxNQUFNLHdCQUF3QixHQUE2QixRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7O0lBQ2xHLE1BQU0sZ0JBQWdCLEdBQUcsd0JBQXdCLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckYsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7Q0FDaEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgSW5qZWN0b3IsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5jb25zdCBlbFByb3RvID0gRWxlbWVudC5wcm90b3R5cGUgYXMgYW55O1xuY29uc3QgbWF0Y2hlcyA9IGVsUHJvdG8ubWF0Y2hlcyB8fCBlbFByb3RvLm1hdGNoZXNTZWxlY3RvciB8fCBlbFByb3RvLm1vek1hdGNoZXNTZWxlY3RvciB8fFxuICAgIGVsUHJvdG8ubXNNYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by5vTWF0Y2hlc1NlbGVjdG9yIHx8IGVsUHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yO1xuXG4vKipcbiAqIFByb3ZpZGUgbWV0aG9kcyBmb3Igc2NoZWR1bGluZyB0aGUgZXhlY3V0aW9uIG9mIGEgY2FsbGJhY2suXG4gKi9cbmV4cG9ydCBjb25zdCBzY2hlZHVsZXIgPSB7XG4gIC8qKlxuICAgKiBTY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciBzb21lIGRlbGF5LlxuICAgKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aGVuIGV4ZWN1dGVkIHdpbGwgY2FuY2VsIHRoZSBzY2hlZHVsZWQgZnVuY3Rpb24uXG4gICAqL1xuICBzY2hlZHVsZSh0YXNrRm46ICgpID0+IHZvaWQsIGRlbGF5OiBudW1iZXIpOiAoKSA9PlxuICAgICAgdm9pZHtjb25zdCBpZCA9IHNldFRpbWVvdXQodGFza0ZuLCBkZWxheSk7IHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQoaWQpO30sXG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGUgbmV4dCByZW5kZXIuXG4gICAqIChJZiBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgpYCBpcyBub3QgYXZhaWxhYmxlLCB1c2UgYHNjaGVkdWxlci5zY2hlZHVsZSgpYCBpbnN0ZWFkLilcbiAgICpcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBleGVjdXRlZCB3aWxsIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2NoZWR1bGVCZWZvcmVSZW5kZXIodGFza0ZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZHtcbiAgICAvLyBUT0RPKGdrYWxwYWspOiBJbXBsZW1lbnQgYSBiZXR0ZXIgd2F5IG9mIGFjY2Vzc2luZyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKClgXG4gICAgLy8gICAgICAgICAgICAgICAgKGUuZy4gYWNjb3VudGluZyBmb3IgdmVuZG9yIHByZWZpeCwgU1NSLWNvbXBhdGliaWxpdHksIGV0YykuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBGb3IgU1NSIGp1c3Qgc2NoZWR1bGUgaW1tZWRpYXRlbHkuXG4gICAgICByZXR1cm4gc2NoZWR1bGVyLnNjaGVkdWxlKHRhc2tGbiwgMCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgZnJhbWVNcyA9IDE2O1xuICAgICAgcmV0dXJuIHNjaGVkdWxlci5zY2hlZHVsZSh0YXNrRm4sIGZyYW1lTXMpO1xuICAgIH1cblxuICAgIGNvbnN0IGlkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0YXNrRm4pO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpO1xuICB9LFxufTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgY2FtZWxDYXNlZCBzdHJpbmcgdG8ga2ViYWItY2FzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbFRvRGFzaENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9bQS1aXS9nLCBjaGFyID0+IGAtJHtjaGFyLnRvTG93ZXJDYXNlKCl9YCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgYEN1c3RvbUV2ZW50YCAoZXZlbiBvbiBicm93c2VycyB3aGVyZSBgQ3VzdG9tRXZlbnRgIGlzIG5vdCBhIGNvbnN0cnVjdG9yKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUV2ZW50KGRvYzogRG9jdW1lbnQsIG5hbWU6IHN0cmluZywgZGV0YWlsOiBhbnkpOiBDdXN0b21FdmVudCB7XG4gIGNvbnN0IGJ1YmJsZXMgPSBmYWxzZTtcbiAgY29uc3QgY2FuY2VsYWJsZSA9IGZhbHNlO1xuXG4gIC8vIE9uIElFOS0xMSwgYEN1c3RvbUV2ZW50YCBpcyBub3QgYSBjb25zdHJ1Y3Rvci5cbiAgaWYgKHR5cGVvZiBDdXN0b21FdmVudCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IGV2ZW50ID0gZG9jLmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGV2ZW50LmluaXRDdXN0b21FdmVudChuYW1lLCBidWJibGVzLCBjYW5jZWxhYmxlLCBkZXRhaWwpO1xuICAgIHJldHVybiBldmVudDtcbiAgfVxuXG4gIHJldHVybiBuZXcgQ3VzdG9tRXZlbnQobmFtZSwge2J1YmJsZXMsIGNhbmNlbGFibGUsIGRldGFpbH0pO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IGlzIGFuIGBFbGVtZW50YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRWxlbWVudChub2RlOiBOb2RlKTogbm9kZSBpcyBFbGVtZW50IHtcbiAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IGlzIGEgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBGdW5jdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59XG5cbi8qKlxuICogQ29udmVydCBhIGtlYmFiLWNhc2VkIHN0cmluZyB0byBjYW1lbENhc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24ga2ViYWJUb0NhbWVsQ2FzZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoLy0oW2EtelxcZF0pL2csIChfLCBjaGFyKSA9PiBjaGFyLnRvVXBwZXJDYXNlKCkpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gYEVsZW1lbnRgIG1hdGNoZXMgYSBDU1Mgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWxlbWVudDogRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbWF0Y2hlcy5jYWxsKGVsZW1lbnQsIHNlbGVjdG9yKTtcbn1cblxuLyoqXG4gKiBUZXN0IHR3byB2YWx1ZXMgZm9yIHN0cmljdCBlcXVhbGl0eSwgYWNjb3VudGluZyBmb3IgdGhlIGZhY3QgdGhhdCBgTmFOICE9PSBOYU5gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaWN0RXF1YWxzKHZhbHVlMTogYW55LCB2YWx1ZTI6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFsdWUxID09PSB2YWx1ZTIgfHwgKHZhbHVlMSAhPT0gdmFsdWUxICYmIHZhbHVlMiAhPT0gdmFsdWUyKTtcbn1cblxuLyoqIEdldHMgYSBtYXAgb2YgZGVmYXVsdCBzZXQgb2YgYXR0cmlidXRlcyB0byBvYnNlcnZlIGFuZCB0aGUgcHJvcGVydGllcyB0aGV5IGFmZmVjdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyhcbiAgICBpbnB1dHM6IHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXSkge1xuICBjb25zdCBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KSA9PiB7XG4gICAgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c1tjYW1lbFRvRGFzaENhc2UodGVtcGxhdGVOYW1lKV0gPSBwcm9wTmFtZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHM7XG59XG5cbi8qKlxuICogR2V0cyBhIGNvbXBvbmVudCdzIHNldCBvZiBpbnB1dHMuIFVzZXMgdGhlIGluamVjdG9yIHRvIGdldCB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2hlcmUgdGhlIGlucHV0c1xuICogYXJlIGRlZmluZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRJbnB1dHMoXG4gICAgY29tcG9uZW50OiBUeXBlPGFueT4sIGluamVjdG9yOiBJbmplY3Rvcik6IHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXSB7XG4gIGNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gaW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcik7XG4gIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnkuaW5wdXRzO1xufVxuIl19