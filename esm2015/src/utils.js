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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLHdCQUF3QixFQUFpQixNQUFNLGVBQWUsQ0FBQzs7OztBQUV0RCxHQUFHLEVBQUU7O1VBQ2QsT0FBTyxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxTQUFTLEVBQU87SUFDeEMsT0FBTyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFDLGtCQUFrQjtRQUMzRSxPQUFPLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztBQUM3RixDQUFDOztNQUpLLE9BQU8sR0FBRyxNQUlkLEVBQUU7Ozs7O0FBS0osTUFBTSxPQUFPLFNBQVMsR0FBRzs7Ozs7Ozs7O0lBTXZCLFFBQVEsQ0FBQyxNQUFrQixFQUFFLEtBQWE7VUFDM0IsRUFBRSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUU7OztJQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFBLENBQUM7Ozs7Ozs7OztJQVE5RSxvQkFBb0IsQ0FBQyxNQUFrQjtRQUNyQywrRUFBK0U7UUFDL0UsOEVBQThFO1FBQzlFLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1lBQ2pDLHFDQUFxQztZQUNyQyxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsSUFBSSxPQUFPLE1BQU0sQ0FBQyxxQkFBcUIsS0FBSyxXQUFXLEVBQUU7O2tCQUNqRCxPQUFPLEdBQUcsRUFBRTtZQUNsQixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVDOztjQUVLLEVBQUUsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDO1FBQy9DOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLEVBQUM7SUFDL0MsQ0FBQztDQUNGOzs7Ozs7QUFLRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQWE7SUFDM0MsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVE7Ozs7SUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLEVBQUMsQ0FBQztBQUNuRSxDQUFDOzs7Ozs7OztBQUtELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxHQUFhLEVBQUUsSUFBWSxFQUFFLE1BQVc7O1VBQ2xFLE9BQU8sR0FBRyxLQUFLOztVQUNmLFVBQVUsR0FBRyxLQUFLO0lBRXhCLGlEQUFpRDtJQUNqRCxJQUFJLE9BQU8sV0FBVyxLQUFLLFVBQVUsRUFBRTs7Y0FDL0IsS0FBSyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQzVDLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekQsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7Ozs7OztBQUtELE1BQU0sVUFBVSxTQUFTLENBQUMsSUFBaUI7SUFDekMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQztBQUN2RCxDQUFDOzs7Ozs7QUFLRCxNQUFNLFVBQVUsVUFBVSxDQUFDLEtBQVU7SUFDbkMsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQzs7Ozs7O0FBS0QsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQWE7SUFDNUMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWE7Ozs7O0lBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUMsQ0FBQztBQUN2RSxDQUFDOzs7Ozs7O0FBS0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUFnQixFQUFFLFFBQWdCO0lBQ2hFLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDekMsQ0FBQzs7Ozs7OztBQUtELE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVyxFQUFFLE1BQVc7SUFDbkQsT0FBTyxNQUFNLEtBQUssTUFBTSxJQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLEtBQUssTUFBTSxDQUFDLENBQUM7QUFDdkUsQ0FBQzs7Ozs7O0FBR0QsTUFBTSxVQUFVLG1DQUFtQyxDQUMvQyxNQUFrRDs7VUFDOUMseUJBQXlCLEdBQTRCLEVBQUU7SUFDN0QsTUFBTSxDQUFDLE9BQU87Ozs7SUFBQyxDQUFDLEVBQUMsUUFBUSxFQUFFLFlBQVksRUFBQyxFQUFFLEVBQUU7UUFDMUMseUJBQXlCLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO0lBQ3RFLENBQUMsRUFBQyxDQUFDO0lBRUgsT0FBTyx5QkFBeUIsQ0FBQztBQUNuQyxDQUFDOzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsU0FBb0IsRUFBRSxRQUFrQjs7VUFDcEMsd0JBQXdCLEdBQTZCLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUM7O1VBQzNGLGdCQUFnQixHQUFHLHdCQUF3QixDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQztJQUNwRixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIEluamVjdG9yLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuY29uc3QgbWF0Y2hlcyA9ICgoKSA9PiB7XG4gIGNvbnN0IGVsUHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZSBhcyBhbnk7XG4gIHJldHVybiBlbFByb3RvLm1hdGNoZXMgfHwgZWxQcm90by5tYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by5tb3pNYXRjaGVzU2VsZWN0b3IgfHxcbiAgICAgIGVsUHJvdG8ubXNNYXRjaGVzU2VsZWN0b3IgfHwgZWxQcm90by5vTWF0Y2hlc1NlbGVjdG9yIHx8IGVsUHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yO1xufSkoKTtcblxuLyoqXG4gKiBQcm92aWRlIG1ldGhvZHMgZm9yIHNjaGVkdWxpbmcgdGhlIGV4ZWN1dGlvbiBvZiBhIGNhbGxiYWNrLlxuICovXG5leHBvcnQgY29uc3Qgc2NoZWR1bGVyID0ge1xuICAvKipcbiAgICogU2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgYWZ0ZXIgc29tZSBkZWxheS5cbiAgICpcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBleGVjdXRlZCB3aWxsIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2NoZWR1bGUodGFza0ZuOiAoKSA9PiB2b2lkLCBkZWxheTogbnVtYmVyKTogKCkgPT5cbiAgICAgIHZvaWR7Y29uc3QgaWQgPSBzZXRUaW1lb3V0KHRhc2tGbiwgZGVsYXkpOyByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KGlkKTt9LFxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhlIG5leHQgcmVuZGVyLlxuICAgKiAoSWYgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWAgaXMgbm90IGF2YWlsYWJsZSwgdXNlIGBzY2hlZHVsZXIuc2NoZWR1bGUoKWAgaW5zdGVhZC4pXG4gICAqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdoZW4gZXhlY3V0ZWQgd2lsbCBjYW5jZWwgdGhlIHNjaGVkdWxlZCBmdW5jdGlvbi5cbiAgICovXG4gIHNjaGVkdWxlQmVmb3JlUmVuZGVyKHRhc2tGbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWR7XG4gICAgLy8gVE9ETyhna2FscGFrKTogSW1wbGVtZW50IGEgYmV0dGVyIHdheSBvZiBhY2Nlc3NpbmcgYHJlcXVlc3RBbmltYXRpb25GcmFtZSgpYFxuICAgIC8vICAgICAgICAgICAgICAgIChlLmcuIGFjY291bnRpbmcgZm9yIHZlbmRvciBwcmVmaXgsIFNTUi1jb21wYXRpYmlsaXR5LCBldGMpLlxuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gRm9yIFNTUiBqdXN0IHNjaGVkdWxlIGltbWVkaWF0ZWx5LlxuICAgICAgcmV0dXJuIHNjaGVkdWxlci5zY2hlZHVsZSh0YXNrRm4sIDApO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnN0IGZyYW1lTXMgPSAxNjtcbiAgICAgIHJldHVybiBzY2hlZHVsZXIuc2NoZWR1bGUodGFza0ZuLCBmcmFtZU1zKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGFza0ZuKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbiAgfSxcbn07XG5cbi8qKlxuICogQ29udmVydCBhIGNhbWVsQ2FzZWQgc3RyaW5nIHRvIGtlYmFiLWNhc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FtZWxUb0Rhc2hDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvW0EtWl0vZywgY2hhciA9PiBgLSR7Y2hhci50b0xvd2VyQ2FzZSgpfWApO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGBDdXN0b21FdmVudGAgKGV2ZW4gb24gYnJvd3NlcnMgd2hlcmUgYEN1c3RvbUV2ZW50YCBpcyBub3QgYSBjb25zdHJ1Y3RvcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDdXN0b21FdmVudChkb2M6IERvY3VtZW50LCBuYW1lOiBzdHJpbmcsIGRldGFpbDogYW55KTogQ3VzdG9tRXZlbnQge1xuICBjb25zdCBidWJibGVzID0gZmFsc2U7XG4gIGNvbnN0IGNhbmNlbGFibGUgPSBmYWxzZTtcblxuICAvLyBPbiBJRTktMTEsIGBDdXN0b21FdmVudGAgaXMgbm90IGEgY29uc3RydWN0b3IuXG4gIGlmICh0eXBlb2YgQ3VzdG9tRXZlbnQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCBldmVudCA9IGRvYy5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQobmFtZSwgYnViYmxlcywgY2FuY2VsYWJsZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZXZlbnQ7XG4gIH1cblxuICByZXR1cm4gbmV3IEN1c3RvbUV2ZW50KG5hbWUsIHtidWJibGVzLCBjYW5jZWxhYmxlLCBkZXRhaWx9KTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhbiBgRWxlbWVudGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0VsZW1lbnQobm9kZTogTm9kZSB8IG51bGwpOiBub2RlIGlzIEVsZW1lbnQge1xuICByZXR1cm4gISFub2RlICYmIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IGlzIGEgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBGdW5jdGlvbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59XG5cbi8qKlxuICogQ29udmVydCBhIGtlYmFiLWNhc2VkIHN0cmluZyB0byBjYW1lbENhc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24ga2ViYWJUb0NhbWVsQ2FzZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoLy0oW2EtelxcZF0pL2csIChfLCBjaGFyKSA9PiBjaGFyLnRvVXBwZXJDYXNlKCkpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gYEVsZW1lbnRgIG1hdGNoZXMgYSBDU1Mgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWxlbWVudDogRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbWF0Y2hlcy5jYWxsKGVsZW1lbnQsIHNlbGVjdG9yKTtcbn1cblxuLyoqXG4gKiBUZXN0IHR3byB2YWx1ZXMgZm9yIHN0cmljdCBlcXVhbGl0eSwgYWNjb3VudGluZyBmb3IgdGhlIGZhY3QgdGhhdCBgTmFOICE9PSBOYU5gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaWN0RXF1YWxzKHZhbHVlMTogYW55LCB2YWx1ZTI6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFsdWUxID09PSB2YWx1ZTIgfHwgKHZhbHVlMSAhPT0gdmFsdWUxICYmIHZhbHVlMiAhPT0gdmFsdWUyKTtcbn1cblxuLyoqIEdldHMgYSBtYXAgb2YgZGVmYXVsdCBzZXQgb2YgYXR0cmlidXRlcyB0byBvYnNlcnZlIGFuZCB0aGUgcHJvcGVydGllcyB0aGV5IGFmZmVjdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyhcbiAgICBpbnB1dHM6IHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXSkge1xuICBjb25zdCBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBpbnB1dHMuZm9yRWFjaCgoe3Byb3BOYW1lLCB0ZW1wbGF0ZU5hbWV9KSA9PiB7XG4gICAgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c1tjYW1lbFRvRGFzaENhc2UodGVtcGxhdGVOYW1lKV0gPSBwcm9wTmFtZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHM7XG59XG5cbi8qKlxuICogR2V0cyBhIGNvbXBvbmVudCdzIHNldCBvZiBpbnB1dHMuIFVzZXMgdGhlIGluamVjdG9yIHRvIGdldCB0aGUgY29tcG9uZW50IGZhY3Rvcnkgd2hlcmUgdGhlIGlucHV0c1xuICogYXJlIGRlZmluZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRJbnB1dHMoXG4gICAgY29tcG9uZW50OiBUeXBlPGFueT4sIGluamVjdG9yOiBJbmplY3Rvcik6IHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXSB7XG4gIGNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gaW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcik7XG4gIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnkuaW5wdXRzO1xufVxuIl19