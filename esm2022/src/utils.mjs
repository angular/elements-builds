/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentFactoryResolver } from '@angular/core';
/**
 * Provide methods for scheduling the execution of a callback.
 */
export const scheduler = {
    /**
     * Schedule a callback to be called after some delay.
     *
     * Returns a function that when executed will cancel the scheduled function.
     */
    schedule(taskFn, delay) {
        const id = setTimeout(taskFn, delay);
        return () => clearTimeout(id);
    },
    /**
     * Schedule a callback to be called before the next render.
     * (If `window.requestAnimationFrame()` is not available, use `scheduler.schedule()` instead.)
     *
     * Returns a function that when executed will cancel the scheduled function.
     */
    scheduleBeforeRender(taskFn) {
        // TODO(gkalpak): Implement a better way of accessing `requestAnimationFrame()`
        //                (e.g. accounting for vendor prefix, SSR-compatibility, etc).
        if (typeof window === 'undefined') {
            // For SSR just schedule immediately.
            return scheduler.schedule(taskFn, 0);
        }
        if (typeof window.requestAnimationFrame === 'undefined') {
            const frameMs = 16;
            return scheduler.schedule(taskFn, frameMs);
        }
        const id = window.requestAnimationFrame(taskFn);
        return () => window.cancelAnimationFrame(id);
    },
};
/**
 * Convert a camelCased string to kebab-cased.
 */
export function camelToDashCase(input) {
    return input.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
/**
 * Check whether the input is an `Element`.
 */
export function isElement(node) {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
}
/**
 * Check whether the input is a function.
 */
export function isFunction(value) {
    return typeof value === 'function';
}
/**
 * Convert a kebab-cased string to camelCased.
 */
export function kebabToCamelCase(input) {
    return input.replace(/-([a-z\d])/g, (_, char) => char.toUpperCase());
}
let _matches;
/**
 * Check whether an `Element` matches a CSS selector.
 * NOTE: this is duplicated from @angular/upgrade, and can
 * be consolidated in the future
 */
export function matchesSelector(el, selector) {
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
/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 */
export function strictEquals(value1, value2) {
    return value1 === value2 || (value1 !== value1 && value2 !== value2);
}
/** Gets a map of default set of attributes to observe and the properties they affect. */
export function getDefaultAttributeToPropertyInputs(inputs) {
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
export function getComponentInputs(component, injector) {
    const componentFactoryResolver = injector.get(ComponentFactoryResolver);
    const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
    return componentFactory.inputs;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLHdCQUF3QixFQUFpQixNQUFNLGVBQWUsQ0FBQztBQUV2RTs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRztJQUN2Qjs7OztPQUlHO0lBQ0gsUUFBUSxDQUFDLE1BQWtCLEVBQUUsS0FBYTtRQUN4QyxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILG9CQUFvQixDQUFDLE1BQWtCO1FBQ3JDLCtFQUErRTtRQUMvRSw4RUFBOEU7UUFDOUUsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNsQyxxQ0FBcUM7WUFDckMsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxPQUFPLE1BQU0sQ0FBQyxxQkFBcUIsS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUN4RCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDbkIsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hELE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDRixDQUFDO0FBRUY7O0dBRUc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQWE7SUFDM0MsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxTQUFTLENBQUMsSUFBaUI7SUFDekMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQztBQUN2RCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLEtBQVU7SUFDbkMsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQWE7SUFDNUMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFFRCxJQUFJLFFBQWtELENBQUM7QUFFdkQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsRUFBTyxFQUFFLFFBQWdCO0lBQ3ZELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE1BQU0sT0FBTyxHQUFRLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDdkMsUUFBUTtZQUNOLE9BQU8sQ0FBQyxPQUFPO2dCQUNmLE9BQU8sQ0FBQyxlQUFlO2dCQUN2QixPQUFPLENBQUMsa0JBQWtCO2dCQUMxQixPQUFPLENBQUMsaUJBQWlCO2dCQUN6QixPQUFPLENBQUMsZ0JBQWdCO2dCQUN4QixPQUFPLENBQUMscUJBQXFCLENBQUM7SUFDbEMsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ2pGLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVyxFQUFFLE1BQVc7SUFDbkQsT0FBTyxNQUFNLEtBQUssTUFBTSxJQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLEtBQUssTUFBTSxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUVELHlGQUF5RjtBQUN6RixNQUFNLFVBQVUsbUNBQW1DLENBQ2pELE1BQW1GO0lBRW5GLE1BQU0seUJBQXlCLEdBRTNCLEVBQUUsQ0FBQztJQUNQLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFDLEVBQUUsRUFBRTtRQUNyRCx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNuRixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8seUJBQXlCLENBQUM7QUFDbkMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDaEMsU0FBb0IsRUFDcEIsUUFBa0I7SUFNbEIsTUFBTSx3QkFBd0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDeEUsTUFBTSxnQkFBZ0IsR0FBRyx3QkFBd0IsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNyRixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgSW5qZWN0b3IsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIFByb3ZpZGUgbWV0aG9kcyBmb3Igc2NoZWR1bGluZyB0aGUgZXhlY3V0aW9uIG9mIGEgY2FsbGJhY2suXG4gKi9cbmV4cG9ydCBjb25zdCBzY2hlZHVsZXIgPSB7XG4gIC8qKlxuICAgKiBTY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciBzb21lIGRlbGF5LlxuICAgKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aGVuIGV4ZWN1dGVkIHdpbGwgY2FuY2VsIHRoZSBzY2hlZHVsZWQgZnVuY3Rpb24uXG4gICAqL1xuICBzY2hlZHVsZSh0YXNrRm46ICgpID0+IHZvaWQsIGRlbGF5OiBudW1iZXIpOiAoKSA9PiB2b2lkIHtcbiAgICBjb25zdCBpZCA9IHNldFRpbWVvdXQodGFza0ZuLCBkZWxheSk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dChpZCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGUgbmV4dCByZW5kZXIuXG4gICAqIChJZiBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgpYCBpcyBub3QgYXZhaWxhYmxlLCB1c2UgYHNjaGVkdWxlci5zY2hlZHVsZSgpYCBpbnN0ZWFkLilcbiAgICpcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBleGVjdXRlZCB3aWxsIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2NoZWR1bGVCZWZvcmVSZW5kZXIodGFza0ZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgLy8gVE9ETyhna2FscGFrKTogSW1wbGVtZW50IGEgYmV0dGVyIHdheSBvZiBhY2Nlc3NpbmcgYHJlcXVlc3RBbmltYXRpb25GcmFtZSgpYFxuICAgIC8vICAgICAgICAgICAgICAgIChlLmcuIGFjY291bnRpbmcgZm9yIHZlbmRvciBwcmVmaXgsIFNTUi1jb21wYXRpYmlsaXR5LCBldGMpLlxuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gRm9yIFNTUiBqdXN0IHNjaGVkdWxlIGltbWVkaWF0ZWx5LlxuICAgICAgcmV0dXJuIHNjaGVkdWxlci5zY2hlZHVsZSh0YXNrRm4sIDApO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnN0IGZyYW1lTXMgPSAxNjtcbiAgICAgIHJldHVybiBzY2hlZHVsZXIuc2NoZWR1bGUodGFza0ZuLCBmcmFtZU1zKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGFza0ZuKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbiAgfSxcbn07XG5cbi8qKlxuICogQ29udmVydCBhIGNhbWVsQ2FzZWQgc3RyaW5nIHRvIGtlYmFiLWNhc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FtZWxUb0Rhc2hDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvW0EtWl0vZywgKGNoYXIpID0+IGAtJHtjaGFyLnRvTG93ZXJDYXNlKCl9YCk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgaW5wdXQgaXMgYW4gYEVsZW1lbnRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFbGVtZW50KG5vZGU6IE5vZGUgfCBudWxsKTogbm9kZSBpcyBFbGVtZW50IHtcbiAgcmV0dXJuICEhbm9kZSAmJiBub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZTogYW55KTogdmFsdWUgaXMgRnVuY3Rpb24ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBrZWJhYi1jYXNlZCBzdHJpbmcgdG8gY2FtZWxDYXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtlYmFiVG9DYW1lbENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC8tKFthLXpcXGRdKS9nLCAoXywgY2hhcikgPT4gY2hhci50b1VwcGVyQ2FzZSgpKTtcbn1cblxubGV0IF9tYXRjaGVzOiAodGhpczogYW55LCBzZWxlY3Rvcjogc3RyaW5nKSA9PiBib29sZWFuO1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gYEVsZW1lbnRgIG1hdGNoZXMgYSBDU1Mgc2VsZWN0b3IuXG4gKiBOT1RFOiB0aGlzIGlzIGR1cGxpY2F0ZWQgZnJvbSBAYW5ndWxhci91cGdyYWRlLCBhbmQgY2FuXG4gKiBiZSBjb25zb2xpZGF0ZWQgaW4gdGhlIGZ1dHVyZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yKGVsOiBhbnksIHNlbGVjdG9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKCFfbWF0Y2hlcykge1xuICAgIGNvbnN0IGVsUHJvdG8gPSA8YW55PkVsZW1lbnQucHJvdG90eXBlO1xuICAgIF9tYXRjaGVzID1cbiAgICAgIGVsUHJvdG8ubWF0Y2hlcyB8fFxuICAgICAgZWxQcm90by5tYXRjaGVzU2VsZWN0b3IgfHxcbiAgICAgIGVsUHJvdG8ubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICBlbFByb3RvLm1zTWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICBlbFByb3RvLm9NYXRjaGVzU2VsZWN0b3IgfHxcbiAgICAgIGVsUHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yO1xuICB9XG4gIHJldHVybiBlbC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgPyBfbWF0Y2hlcy5jYWxsKGVsLCBzZWxlY3RvcikgOiBmYWxzZTtcbn1cblxuLyoqXG4gKiBUZXN0IHR3byB2YWx1ZXMgZm9yIHN0cmljdCBlcXVhbGl0eSwgYWNjb3VudGluZyBmb3IgdGhlIGZhY3QgdGhhdCBgTmFOICE9PSBOYU5gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaWN0RXF1YWxzKHZhbHVlMTogYW55LCB2YWx1ZTI6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFsdWUxID09PSB2YWx1ZTIgfHwgKHZhbHVlMSAhPT0gdmFsdWUxICYmIHZhbHVlMiAhPT0gdmFsdWUyKTtcbn1cblxuLyoqIEdldHMgYSBtYXAgb2YgZGVmYXVsdCBzZXQgb2YgYXR0cmlidXRlcyB0byBvYnNlcnZlIGFuZCB0aGUgcHJvcGVydGllcyB0aGV5IGFmZmVjdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0QXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cyhcbiAgaW5wdXRzOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7IHRyYW5zZm9ybT86ICh2YWx1ZTogYW55KSA9PiBhbnl9W10sXG4pIHtcbiAgY29uc3QgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0czoge1xuICAgIFtrZXk6IHN0cmluZ106IFtwcm9wTmFtZTogc3RyaW5nLCB0cmFuc2Zvcm06ICgodmFsdWU6IGFueSkgPT4gYW55KSB8IHVuZGVmaW5lZF07XG4gIH0gPSB7fTtcbiAgaW5wdXRzLmZvckVhY2goKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lLCB0cmFuc2Zvcm19KSA9PiB7XG4gICAgYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0c1tjYW1lbFRvRGFzaENhc2UodGVtcGxhdGVOYW1lKV0gPSBbcHJvcE5hbWUsIHRyYW5zZm9ybV07XG4gIH0pO1xuXG4gIHJldHVybiBhdHRyaWJ1dGVUb1Byb3BlcnR5SW5wdXRzO1xufVxuXG4vKipcbiAqIEdldHMgYSBjb21wb25lbnQncyBzZXQgb2YgaW5wdXRzLiBVc2VzIHRoZSBpbmplY3RvciB0byBnZXQgdGhlIGNvbXBvbmVudCBmYWN0b3J5IHdoZXJlIHRoZSBpbnB1dHNcbiAqIGFyZSBkZWZpbmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50SW5wdXRzKFxuICBjb21wb25lbnQ6IFR5cGU8YW55PixcbiAgaW5qZWN0b3I6IEluamVjdG9yLFxuKToge1xuICBwcm9wTmFtZTogc3RyaW5nO1xuICB0ZW1wbGF0ZU5hbWU6IHN0cmluZztcbiAgdHJhbnNmb3JtPzogKHZhbHVlOiBhbnkpID0+IGFueTtcbn1bXSB7XG4gIGNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IGluamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG4gIHJldHVybiBjb21wb25lbnRGYWN0b3J5LmlucHV0cztcbn1cbiJdfQ==