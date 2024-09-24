/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9lbGVtZW50cy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLHdCQUF3QixFQUFpQixNQUFNLGVBQWUsQ0FBQztBQUV2RTs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRztJQUN2Qjs7OztPQUlHO0lBQ0gsUUFBUSxDQUFDLE1BQWtCLEVBQUUsS0FBYTtRQUN4QyxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILG9CQUFvQixDQUFDLE1BQWtCO1FBQ3JDLCtFQUErRTtRQUMvRSw4RUFBOEU7UUFDOUUsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNsQyxxQ0FBcUM7WUFDckMsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxPQUFPLE1BQU0sQ0FBQyxxQkFBcUIsS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUN4RCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDbkIsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hELE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDRixDQUFDO0FBRUY7O0dBRUc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQWE7SUFDM0MsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxTQUFTLENBQUMsSUFBaUI7SUFDekMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQztBQUN2RCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLEtBQVU7SUFDbkMsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQWE7SUFDNUMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFFRCxJQUFJLFFBQWtELENBQUM7QUFFdkQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsRUFBTyxFQUFFLFFBQWdCO0lBQ3ZELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE1BQU0sT0FBTyxHQUFRLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDdkMsUUFBUTtZQUNOLE9BQU8sQ0FBQyxPQUFPO2dCQUNmLE9BQU8sQ0FBQyxlQUFlO2dCQUN2QixPQUFPLENBQUMsa0JBQWtCO2dCQUMxQixPQUFPLENBQUMsaUJBQWlCO2dCQUN6QixPQUFPLENBQUMsZ0JBQWdCO2dCQUN4QixPQUFPLENBQUMscUJBQXFCLENBQUM7SUFDbEMsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ2pGLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVyxFQUFFLE1BQVc7SUFDbkQsT0FBTyxNQUFNLEtBQUssTUFBTSxJQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLEtBQUssTUFBTSxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUVELHlGQUF5RjtBQUN6RixNQUFNLFVBQVUsbUNBQW1DLENBQ2pELE1BQW1GO0lBRW5GLE1BQU0seUJBQXlCLEdBRTNCLEVBQUUsQ0FBQztJQUNQLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFDLEVBQUUsRUFBRTtRQUNyRCx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNuRixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8seUJBQXlCLENBQUM7QUFDbkMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDaEMsU0FBb0IsRUFDcEIsUUFBa0I7SUFNbEIsTUFBTSx3QkFBd0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDeEUsTUFBTSxnQkFBZ0IsR0FBRyx3QkFBd0IsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNyRixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIEluamVjdG9yLCBUeXBlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBQcm92aWRlIG1ldGhvZHMgZm9yIHNjaGVkdWxpbmcgdGhlIGV4ZWN1dGlvbiBvZiBhIGNhbGxiYWNrLlxuICovXG5leHBvcnQgY29uc3Qgc2NoZWR1bGVyID0ge1xuICAvKipcbiAgICogU2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgYWZ0ZXIgc29tZSBkZWxheS5cbiAgICpcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBleGVjdXRlZCB3aWxsIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2NoZWR1bGUodGFza0ZuOiAoKSA9PiB2b2lkLCBkZWxheTogbnVtYmVyKTogKCkgPT4gdm9pZCB7XG4gICAgY29uc3QgaWQgPSBzZXRUaW1lb3V0KHRhc2tGbiwgZGVsYXkpO1xuICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQoaWQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhlIG5leHQgcmVuZGVyLlxuICAgKiAoSWYgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWAgaXMgbm90IGF2YWlsYWJsZSwgdXNlIGBzY2hlZHVsZXIuc2NoZWR1bGUoKWAgaW5zdGVhZC4pXG4gICAqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdoZW4gZXhlY3V0ZWQgd2lsbCBjYW5jZWwgdGhlIHNjaGVkdWxlZCBmdW5jdGlvbi5cbiAgICovXG4gIHNjaGVkdWxlQmVmb3JlUmVuZGVyKHRhc2tGbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgIC8vIFRPRE8oZ2thbHBhayk6IEltcGxlbWVudCBhIGJldHRlciB3YXkgb2YgYWNjZXNzaW5nIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWBcbiAgICAvLyAgICAgICAgICAgICAgICAoZS5nLiBhY2NvdW50aW5nIGZvciB2ZW5kb3IgcHJlZml4LCBTU1ItY29tcGF0aWJpbGl0eSwgZXRjKS5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIEZvciBTU1IganVzdCBzY2hlZHVsZSBpbW1lZGlhdGVseS5cbiAgICAgIHJldHVybiBzY2hlZHVsZXIuc2NoZWR1bGUodGFza0ZuLCAwKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb25zdCBmcmFtZU1zID0gMTY7XG4gICAgICByZXR1cm4gc2NoZWR1bGVyLnNjaGVkdWxlKHRhc2tGbiwgZnJhbWVNcyk7XG4gICAgfVxuXG4gICAgY29uc3QgaWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRhc2tGbik7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH0sXG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBjYW1lbENhc2VkIHN0cmluZyB0byBrZWJhYi1jYXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbWVsVG9EYXNoQ2FzZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1tBLVpdL2csIChjaGFyKSA9PiBgLSR7Y2hhci50b0xvd2VyQ2FzZSgpfWApO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIGlucHV0IGlzIGFuIGBFbGVtZW50YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRWxlbWVudChub2RlOiBOb2RlIHwgbnVsbCk6IG5vZGUgaXMgRWxlbWVudCB7XG4gIHJldHVybiAhIW5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREU7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgaW5wdXQgaXMgYSBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWU6IGFueSk6IHZhbHVlIGlzIEZ1bmN0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEga2ViYWItY2FzZWQgc3RyaW5nIHRvIGNhbWVsQ2FzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBrZWJhYlRvQ2FtZWxDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvLShbYS16XFxkXSkvZywgKF8sIGNoYXIpID0+IGNoYXIudG9VcHBlckNhc2UoKSk7XG59XG5cbmxldCBfbWF0Y2hlczogKHRoaXM6IGFueSwgc2VsZWN0b3I6IHN0cmluZykgPT4gYm9vbGVhbjtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGBFbGVtZW50YCBtYXRjaGVzIGEgQ1NTIHNlbGVjdG9yLlxuICogTk9URTogdGhpcyBpcyBkdXBsaWNhdGVkIGZyb20gQGFuZ3VsYXIvdXBncmFkZSwgYW5kIGNhblxuICogYmUgY29uc29saWRhdGVkIGluIHRoZSBmdXR1cmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoZXNTZWxlY3RvcihlbDogYW55LCBzZWxlY3Rvcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmICghX21hdGNoZXMpIHtcbiAgICBjb25zdCBlbFByb3RvID0gPGFueT5FbGVtZW50LnByb3RvdHlwZTtcbiAgICBfbWF0Y2hlcyA9XG4gICAgICBlbFByb3RvLm1hdGNoZXMgfHxcbiAgICAgIGVsUHJvdG8ubWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICBlbFByb3RvLm1vek1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgZWxQcm90by5tc01hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgZWxQcm90by5vTWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICBlbFByb3RvLndlYmtpdE1hdGNoZXNTZWxlY3RvcjtcbiAgfVxuICByZXR1cm4gZWwubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFID8gX21hdGNoZXMuY2FsbChlbCwgc2VsZWN0b3IpIDogZmFsc2U7XG59XG5cbi8qKlxuICogVGVzdCB0d28gdmFsdWVzIGZvciBzdHJpY3QgZXF1YWxpdHksIGFjY291bnRpbmcgZm9yIHRoZSBmYWN0IHRoYXQgYE5hTiAhPT0gTmFOYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmljdEVxdWFscyh2YWx1ZTE6IGFueSwgdmFsdWUyOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlMSA9PT0gdmFsdWUyIHx8ICh2YWx1ZTEgIT09IHZhbHVlMSAmJiB2YWx1ZTIgIT09IHZhbHVlMik7XG59XG5cbi8qKiBHZXRzIGEgbWFwIG9mIGRlZmF1bHQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gb2JzZXJ2ZSBhbmQgdGhlIHByb3BlcnRpZXMgdGhleSBhZmZlY3QuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdEF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHMoXG4gIGlucHV0czoge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nOyB0cmFuc2Zvcm0/OiAodmFsdWU6IGFueSkgPT4gYW55fVtdLFxuKSB7XG4gIGNvbnN0IGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHM6IHtcbiAgICBba2V5OiBzdHJpbmddOiBbcHJvcE5hbWU6IHN0cmluZywgdHJhbnNmb3JtOiAoKHZhbHVlOiBhbnkpID0+IGFueSkgfCB1bmRlZmluZWRdO1xuICB9ID0ge307XG4gIGlucHV0cy5mb3JFYWNoKCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZSwgdHJhbnNmb3JtfSkgPT4ge1xuICAgIGF0dHJpYnV0ZVRvUHJvcGVydHlJbnB1dHNbY2FtZWxUb0Rhc2hDYXNlKHRlbXBsYXRlTmFtZSldID0gW3Byb3BOYW1lLCB0cmFuc2Zvcm1dO1xuICB9KTtcblxuICByZXR1cm4gYXR0cmlidXRlVG9Qcm9wZXJ0eUlucHV0cztcbn1cblxuLyoqXG4gKiBHZXRzIGEgY29tcG9uZW50J3Mgc2V0IG9mIGlucHV0cy4gVXNlcyB0aGUgaW5qZWN0b3IgdG8gZ2V0IHRoZSBjb21wb25lbnQgZmFjdG9yeSB3aGVyZSB0aGUgaW5wdXRzXG4gKiBhcmUgZGVmaW5lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudElucHV0cyhcbiAgY29tcG9uZW50OiBUeXBlPGFueT4sXG4gIGluamVjdG9yOiBJbmplY3Rvcixcbik6IHtcbiAgcHJvcE5hbWU6IHN0cmluZztcbiAgdGVtcGxhdGVOYW1lOiBzdHJpbmc7XG4gIHRyYW5zZm9ybT86ICh2YWx1ZTogYW55KSA9PiBhbnk7XG59W10ge1xuICBjb25zdCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBpbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeS5pbnB1dHM7XG59XG4iXX0=