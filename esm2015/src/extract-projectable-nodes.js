/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isElement, matchesSelector } from './utils';
/**
 * @param {?} host
 * @param {?} ngContentSelectors
 * @return {?}
 */
export function extractProjectableNodes(host, ngContentSelectors) {
    /** @type {?} */
    const nodes = host.childNodes;
    /** @type {?} */
    const projectableNodes = ngContentSelectors.map(() => []);
    /** @type {?} */
    let wildcardIndex = -1;
    ngContentSelectors.some((selector, i) => {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    });
    for (let i = 0, ii = nodes.length; i < ii; ++i) {
        /** @type {?} */
        const node = nodes[i];
        /** @type {?} */
        const ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
        if (ngContentIndex !== -1) {
            projectableNodes[ngContentIndex].push(node);
        }
    }
    return projectableNodes;
}
/**
 * @param {?} node
 * @param {?} selectors
 * @param {?} defaultIndex
 * @return {?}
 */
function findMatchingIndex(node, selectors, defaultIndex) {
    /** @type {?} */
    let matchingIndex = defaultIndex;
    if (isElement(node)) {
        selectors.some((selector, i) => {
            if ((selector !== '*') && matchesSelector(node, selector)) {
                matchingIndex = i;
                return true;
            }
            return false;
        });
    }
    return matchingIndex;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2VsZW1lbnRzL3NyYy9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBWUEsT0FBTyxFQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7OztBQUVuRCxNQUFNLGtDQUFrQyxJQUFpQixFQUFFLGtCQUE0Qjs7SUFDckYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7SUFDOUIsTUFBTSxnQkFBZ0IsR0FBYSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7O0lBQ3BFLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRXZCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0QyxJQUFJLFFBQVEsS0FBSyxHQUFHLEVBQUU7WUFDcEIsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUNsQixPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsT0FBTyxLQUFLLENBQUM7S0FDZCxDQUFDLENBQUM7SUFFSCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFOztRQUM5QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7O1FBQ3RCLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUVsRixJQUFJLGNBQWMsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUN6QixnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0M7S0FDRjtJQUVELE9BQU8sZ0JBQWdCLENBQUM7Q0FDekI7Ozs7Ozs7QUFFRCwyQkFBMkIsSUFBVSxFQUFFLFNBQW1CLEVBQUUsWUFBb0I7O0lBQzlFLElBQUksYUFBYSxHQUFHLFlBQVksQ0FBQztJQUVqQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNuQixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzdCLElBQUksQ0FBQyxRQUFRLEtBQUssR0FBRyxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDekQsYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELE9BQU8sS0FBSyxDQUFDO1NBQ2QsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxPQUFPLGFBQWEsQ0FBQztDQUN0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gTk9URTogVGhpcyBpcyBhIChzbGlnaHRseSBpbXByb3ZlZCkgdmVyc2lvbiBvZiB3aGF0IGlzIHVzZWQgaW4gbmdVcGdyYWRlJ3Ncbi8vICAgICAgIGBEb3duZ3JhZGVDb21wb25lbnRBZGFwdGVyYC5cbi8vIFRPRE8oZ2thbHBhayk6IEludmVzdGlnYXRlIGlmIGl0IG1ha2VzIHNlbnNlIHRvIHNoYXJlIHRoZSBjb2RlLlxuXG5pbXBvcnQge2lzRWxlbWVudCwgbWF0Y2hlc1NlbGVjdG9yfSBmcm9tICcuL3V0aWxzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RQcm9qZWN0YWJsZU5vZGVzKGhvc3Q6IEhUTUxFbGVtZW50LCBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdKTogTm9kZVtdW10ge1xuICBjb25zdCBub2RlcyA9IGhvc3QuY2hpbGROb2RlcztcbiAgY29uc3QgcHJvamVjdGFibGVOb2RlczogTm9kZVtdW10gPSBuZ0NvbnRlbnRTZWxlY3RvcnMubWFwKCgpID0+IFtdKTtcbiAgbGV0IHdpbGRjYXJkSW5kZXggPSAtMTtcblxuICBuZ0NvbnRlbnRTZWxlY3RvcnMuc29tZSgoc2VsZWN0b3IsIGkpID0+IHtcbiAgICBpZiAoc2VsZWN0b3IgPT09ICcqJykge1xuICAgICAgd2lsZGNhcmRJbmRleCA9IGk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgaWkgPSBub2Rlcy5sZW5ndGg7IGkgPCBpaTsgKytpKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgIGNvbnN0IG5nQ29udGVudEluZGV4ID0gZmluZE1hdGNoaW5nSW5kZXgobm9kZSwgbmdDb250ZW50U2VsZWN0b3JzLCB3aWxkY2FyZEluZGV4KTtcblxuICAgIGlmIChuZ0NvbnRlbnRJbmRleCAhPT0gLTEpIHtcbiAgICAgIHByb2plY3RhYmxlTm9kZXNbbmdDb250ZW50SW5kZXhdLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByb2plY3RhYmxlTm9kZXM7XG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGluZ0luZGV4KG5vZGU6IE5vZGUsIHNlbGVjdG9yczogc3RyaW5nW10sIGRlZmF1bHRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IG1hdGNoaW5nSW5kZXggPSBkZWZhdWx0SW5kZXg7XG5cbiAgaWYgKGlzRWxlbWVudChub2RlKSkge1xuICAgIHNlbGVjdG9ycy5zb21lKChzZWxlY3RvciwgaSkgPT4ge1xuICAgICAgaWYgKChzZWxlY3RvciAhPT0gJyonKSAmJiBtYXRjaGVzU2VsZWN0b3Iobm9kZSwgc2VsZWN0b3IpKSB7XG4gICAgICAgIG1hdGNoaW5nSW5kZXggPSBpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBtYXRjaGluZ0luZGV4O1xufVxuIl19