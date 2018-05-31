/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
import { ComponentFactoryResolver } from '@angular/core';
const /** @type {?} */ elProto = /** @type {?} */ (Element.prototype);
const /** @type {?} */ matches = elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector ||
    elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
/**
 * Provide methods for scheduling the execution of a callback.
 */
export const /** @type {?} */ scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     *
     * Returns a function that when executed will cancel the scheduled function.
     * @param {?} taskFn
     * @param {?} delay
     * @return {?}
     */
    schedule(taskFn, delay) { const /** @type {?} */ id = setTimeout(taskFn, delay); return () => clearTimeout(id); },
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
            const /** @type {?} */ frameMs = 16;
            return scheduler.schedule(taskFn, frameMs);
        }
        const /** @type {?} */ id = window.requestAnimationFrame(taskFn);
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
    const /** @type {?} */ attributeToPropertyInputs = {};
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
    const /** @type {?} */ componentFactoryResolver = injector.get(ComponentFactoryResolver);
    const /** @type {?} */ componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQU9BLE9BQU8sRUFBQyx3QkFBd0IsRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFFdkUsdUJBQU0sT0FBTyxxQkFBRyxPQUFPLENBQUMsU0FBZ0IsQ0FBQSxDQUFDO0FBQ3pDLHVCQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFDLGtCQUFrQjtJQUNwRixPQUFPLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQzs7OztBQUszRixNQUFNLENBQUMsdUJBQU0sU0FBUyxHQUFHOzs7Ozs7Ozs7SUFNdkIsUUFBUSxDQUFDLE1BQWtCLEVBQUUsS0FBYSxJQUNqQyx1QkFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUM7Ozs7Ozs7OztJQVE5RSxvQkFBb0IsQ0FBQyxNQUFrQjs7O1FBR3JDLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFOztZQUVqQyxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsSUFBSSxPQUFPLE1BQU0sQ0FBQyxxQkFBcUIsS0FBSyxXQUFXLEVBQUU7WUFDdkQsdUJBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNuQixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVDO1FBRUQsdUJBQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoRCxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM5QztDQUNGLENBQUM7Ozs7OztBQUtGLE1BQU0sMEJBQTBCLEtBQWE7SUFDM0MsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztDQUNsRTs7Ozs7Ozs7QUFLRCxNQUFNLDRCQUE0QixHQUFhLEVBQUUsSUFBWSxFQUFFLE1BQVc7SUFDeEUsdUJBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQztJQUN0Qix1QkFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDOztJQUd6QixJQUFJLE9BQU8sV0FBVyxLQUFLLFVBQVUsRUFBRTtRQUNyQyx1QkFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QyxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztDQUM3RDs7Ozs7O0FBS0QsTUFBTSxvQkFBb0IsSUFBVTtJQUNsQyxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQztDQUM1Qzs7Ozs7O0FBS0QsTUFBTSxxQkFBcUIsS0FBVTtJQUNuQyxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztDQUNwQzs7Ozs7O0FBS0QsTUFBTSwyQkFBMkIsS0FBYTtJQUM1QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7Q0FDdEU7Ozs7Ozs7QUFLRCxNQUFNLDBCQUEwQixPQUFnQixFQUFFLFFBQWdCO0lBQ2hFLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Q0FDeEM7Ozs7Ozs7QUFLRCxNQUFNLHVCQUF1QixNQUFXLEVBQUUsTUFBVztJQUNuRCxPQUFPLE1BQU0sS0FBSyxNQUFNLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQztDQUN0RTs7Ozs7O0FBR0QsTUFBTSw4Q0FDRixNQUFrRDtJQUNwRCx1QkFBTSx5QkFBeUIsR0FBNEIsRUFBRSxDQUFDO0lBQzlELE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUMsRUFBRSxFQUFFO1FBQzFDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztLQUNyRSxDQUFDLENBQUM7SUFFSCxPQUFPLHlCQUF5QixDQUFDO0NBQ2xDOzs7Ozs7OztBQU1ELE1BQU0sNkJBQ0YsU0FBb0IsRUFBRSxRQUFrQjtJQUMxQyx1QkFBTSx3QkFBd0IsR0FBNkIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQ2xHLHVCQUFNLGdCQUFnQixHQUFHLHdCQUF3QixDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3JGLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0NBQ2hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIEluamVjdG9yLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuY29uc3QgZWxQcm90byA9IEVsZW1lbnQucHJvdG90eXBlIGFzIGFueTtcbmNvbnN0IG1hdGNoZXMgPSBlbFByb3RvLm1hdGNoZXMgfHwgZWxQcm90by5tYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by5tb3pNYXRjaGVzU2VsZWN0b3IgfHxcbiAgICBlbFByb3RvLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGVsUHJvdG8ub01hdGNoZXNTZWxlY3RvciB8fCBlbFByb3RvLndlYmtpdE1hdGNoZXNTZWxlY3RvcjtcblxuLyoqXG4gKiBQcm92aWRlIG1ldGhvZHMgZm9yIHNjaGVkdWxpbmcgdGhlIGV4ZWN1dGlvbiBvZiBhIGNhbGxiYWNrLlxuICovXG5leHBvcnQgY29uc3Qgc2NoZWR1bGVyID0ge1xuICAvKipcbiAgICogU2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgYWZ0ZXIgc29tZSBkZWxheS5cbiAgICpcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBleGVjdXRlZCB3aWxsIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2NoZWR1bGUodGFza0ZuOiAoKSA9PiB2b2lkLCBkZWxheTogbnVtYmVyKTogKCkgPT5cbiAgICAgIHZvaWR7Y29uc3QgaWQgPSBzZXRUaW1lb3V0KHRhc2tGbiwgZGVsYXkpOyByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KGlkKTt9LFxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhlIG5leHQgcmVuZGVyLlxuICAgKiAoSWYgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWAgaXMgbm90IGF2YWlsYWJsZSwgdXNlIGBzY2hlZHVsZXIuc2NoZWR1bGUoKWAgaW5zdGVhZC4pXG4gICAqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdoZW4gZXhlY3V0ZWQgd2lsbCBjYW5jZWwgdGhlIHNjaGVkdWxlZCBmdW5jdGlvbi5cbiAgICovXG4gIHNjaGVkdWxlQmVmb3JlUmVuZGVyKHRhc2tGbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWR7XG4gICAgLy8gVE9ETyhna2FscGFrKTogSW1wbGVtZW50IGEgYmV0dGVyIHdheSBvZiBhY2Nlc3NpbmcgYHJlcXVlc3RBbmltYXRpb25GcmFtZSgpYFxuICAgIC8vICAgICAgICAgICAgICAgIChlLmcuIGFjY291bnRpbmcgZm9yIHZlbmRvciBwcmVmaXgsIFNTUi1jb21wYXRpYmlsaXR5LCBldGMpLlxuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gRm9yIFNTUiBqdXN0IHNjaGVkdWxlIGltbWVkaWF0ZWx5LlxuICAgICAgcmV0dXJuIHNjaGVkdWxlci5zY2hlZHVsZSh0YXNrRm4sIDApO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnN0IGZyYW1lTXMgPSAxNjtcbiAgICAgIHJldHVybiBzY2hlZHVsZXIuc2NoZWR1bGUodGFza0ZuLCBmcmFtZU1zKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGFza0ZuKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbiAgfSxcbn07XG5cbi8qKlxuICogQ29udmVydCBhIGNhbWVsQ2FzZWQgc3RyaW5nIHRvIGtlYmFiLWNhc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FtZWxUb0Rhc2hDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvW0EtWl0vZywgY2hhciA9PiBgLSR7Y2hhci50b0xvd2VyQ2FzZSgpfWApO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGBDdXN0b21FdmVudGAgKGV2ZW4gb24gYnJvd3NlcnMgd2hlcmUgYEN1c3RvbUV2ZW50YCBpcyBub3QgYSBjb25zdHJ1Y3RvcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDdXN0b21FdmVudChkb2M6IERvY3VtZW50LCBuYW1lOiBzdHJpbmcsIGRldGFpbDogYW55KTogQ3VzdG9tRXZlbnQge1xuICBjb25zdCBidWJibGVzID0gZmFsc2U7XG4gIGNvbnN0IGNhbmNlbGFibGUgPSBmYWxzZTtcblxuICAvLyBPbiBJRTktMTEsIGBDdXN0b21FdmVudGAgaXMgbm90IGEgY29uc3RydWN0b3IuXG4gIGlmICh0eXBlb2YgQ3VzdG9tRXZlbnQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCBldmVudCA9IGRvYy5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQobmFtZSwgYnViYmxlcywgY2FuY2VsYWJsZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZXZlbnQ7XG4gIH1cblxuICByZXR1cm4gbmV3IEN1c3RvbUV2ZW50KG5hbWUsIHtidWJibGVzLCBjYW5jZWxhYmxlLCBkZXRhaWx9KTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhbiBgRWxlbWVudGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0VsZW1lbnQobm9kZTogTm9kZSk6IG5vZGUgaXMgRWxlbWVudCB7XG4gIHJldHVybiBub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZTogYW55KTogdmFsdWUgaXMgRnVuY3Rpb24ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBrZWJhYi1jYXNlZCBzdHJpbmcgdG8gY2FtZWxDYXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtlYmFiVG9DYW1lbENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC8tKFthLXpcXGRdKS9nLCAoXywgY2hhcikgPT4gY2hhci50b1VwcGVyQ2FzZSgpKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGBFbGVtZW50YCBtYXRjaGVzIGEgQ1NTIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQ6IEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIG1hdGNoZXMuY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG59XG5cbi8qKlxuICogVGVzdCB0d28gdmFsdWVzIGZvciBzdHJpY3QgZXF1YWxpdHksIGFjY291bnRpbmcgZm9yIHRoZSBmYWN0IHRoYXQgYE5hTiAhPT0gTmFOYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmljdEVxdWFscyh2YWx1ZTE6IGFueSwgdmFsdWUyOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlMSA9PT0gdmFsdWUyIHx8ICh2YWx1ZTEgIT09IHZhbHVlMSAmJiB2YWx1ZTIgIT09IHZhbHVlMik7XG59XG5cbi8qKiBHZXRzIGEgbWFwIG9mIGRlZmF1bHQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gb2JzZXJ2ZSBhbmQgdGhlIHByb3BlcnRpZXMgdGhleSBhZmZlY3QuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMoXG4gICAgaW5wdXRzOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10pIHtcbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSkgPT4ge1xuICAgIGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHNbY2FtZWxUb0Rhc2hDYXNlKHRlbXBsYXRlTmFtZSldID0gcHJvcE5hbWU7XG4gIH0pO1xuXG4gIHJldHVybiBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzO1xufVxuXG4vKipcbiAqIEdldHMgYSBjb21wb25lbnQncyBzZXQgb2YgaW5wdXRzLiBVc2VzIHRoZSBpbmplY3RvciB0byBnZXQgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdoZXJlIHRoZSBpbnB1dHNcbiAqIGFyZSBkZWZpbmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50SW5wdXRzKFxuICAgIGNvbXBvbmVudDogVHlwZTxhbnk+LCBpbmplY3RvcjogSW5qZWN0b3IpOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10ge1xuICBjb25zdCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IGluamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIHJldHVybiBjb21wb25lbnRGYWN0b3J5LmlucHV0cztcbn1cbiJdfQ==