/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// NOTE: This is a (slightly improved) version of what is used in ngUpgrade's
//       `DowngradeComponentAdapter`.
// TODO(gkalpak): Investigate if it makes sense to share the code.
import { isElement, matchesSelector } from './utils';
export function extractProjectableNodes(host, ngContentSelectors) {
    var nodes = host.childNodes;
    var projectableNodes = ngContentSelectors.map(function () { return []; });
    var wildcardIndex = -1;
    ngContentSelectors.some(function (selector, i) {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    });
    for (var i = 0, ii = nodes.length; i < ii; ++i) {
        var node = nodes[i];
        var ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
        if (ngContentIndex !== -1) {
            projectableNodes[ngContentIndex].push(node);
        }
    }
    return projectableNodes;
}
function findMatchingIndex(node, selectors, defaultIndex) {
    var matchingIndex = defaultIndex;
    if (isElement(node)) {
        selectors.some(function (selector, i) {
            if ((selector !== '*') && matchesSelector(node, selector)) {
                matchingIndex = i;
                return true;
            }
            return false;
        });
    }
    return matchingIndex;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2VsZW1lbnRzL3NyYy9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDZFQUE2RTtBQUM3RSxxQ0FBcUM7QUFDckMsa0VBQWtFO0FBRWxFLE9BQU8sRUFBQyxTQUFTLEVBQUUsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRW5ELE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxJQUFpQixFQUFFLGtCQUE0QjtJQUNyRixJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQzlCLElBQU0sZ0JBQWdCLEdBQWEsa0JBQWtCLENBQUMsR0FBRyxDQUFDLGNBQU0sT0FBQSxFQUFFLEVBQUYsQ0FBRSxDQUFDLENBQUM7SUFDcEUsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFdkIsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFVBQUMsUUFBUSxFQUFFLENBQUM7UUFDbEMsSUFBSSxRQUFRLEtBQUssR0FBRyxFQUFFO1lBQ3BCLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDbEIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQzlDLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFbEYsSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDekIsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdDO0tBQ0Y7SUFFRCxPQUFPLGdCQUFnQixDQUFDO0FBQzFCLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLElBQVUsRUFBRSxTQUFtQixFQUFFLFlBQW9CO0lBQzlFLElBQUksYUFBYSxHQUFHLFlBQVksQ0FBQztJQUVqQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNuQixTQUFTLENBQUMsSUFBSSxDQUFDLFVBQUMsUUFBUSxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLFFBQVEsS0FBSyxHQUFHLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUN6RCxhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQixPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztLQUNKO0lBRUQsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gTk9URTogVGhpcyBpcyBhIChzbGlnaHRseSBpbXByb3ZlZCkgdmVyc2lvbiBvZiB3aGF0IGlzIHVzZWQgaW4gbmdVcGdyYWRlJ3Ncbi8vICAgICAgIGBEb3duZ3JhZGVDb21wb25lbnRBZGFwdGVyYC5cbi8vIFRPRE8oZ2thbHBhayk6IEludmVzdGlnYXRlIGlmIGl0IG1ha2VzIHNlbnNlIHRvIHNoYXJlIHRoZSBjb2RlLlxuXG5pbXBvcnQge2lzRWxlbWVudCwgbWF0Y2hlc1NlbGVjdG9yfSBmcm9tICcuL3V0aWxzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RQcm9qZWN0YWJsZU5vZGVzKGhvc3Q6IEhUTUxFbGVtZW50LCBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdKTogTm9kZVtdW10ge1xuICBjb25zdCBub2RlcyA9IGhvc3QuY2hpbGROb2RlcztcbiAgY29uc3QgcHJvamVjdGFibGVOb2RlczogTm9kZVtdW10gPSBuZ0NvbnRlbnRTZWxlY3RvcnMubWFwKCgpID0+IFtdKTtcbiAgbGV0IHdpbGRjYXJkSW5kZXggPSAtMTtcblxuICBuZ0NvbnRlbnRTZWxlY3RvcnMuc29tZSgoc2VsZWN0b3IsIGkpID0+IHtcbiAgICBpZiAoc2VsZWN0b3IgPT09ICcqJykge1xuICAgICAgd2lsZGNhcmRJbmRleCA9IGk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgaWkgPSBub2Rlcy5sZW5ndGg7IGkgPCBpaTsgKytpKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgIGNvbnN0IG5nQ29udGVudEluZGV4ID0gZmluZE1hdGNoaW5nSW5kZXgobm9kZSwgbmdDb250ZW50U2VsZWN0b3JzLCB3aWxkY2FyZEluZGV4KTtcblxuICAgIGlmIChuZ0NvbnRlbnRJbmRleCAhPT0gLTEpIHtcbiAgICAgIHByb2plY3RhYmxlTm9kZXNbbmdDb250ZW50SW5kZXhdLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByb2plY3RhYmxlTm9kZXM7XG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGluZ0luZGV4KG5vZGU6IE5vZGUsIHNlbGVjdG9yczogc3RyaW5nW10sIGRlZmF1bHRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IG1hdGNoaW5nSW5kZXggPSBkZWZhdWx0SW5kZXg7XG5cbiAgaWYgKGlzRWxlbWVudChub2RlKSkge1xuICAgIHNlbGVjdG9ycy5zb21lKChzZWxlY3RvciwgaSkgPT4ge1xuICAgICAgaWYgKChzZWxlY3RvciAhPT0gJyonKSAmJiBtYXRjaGVzU2VsZWN0b3Iobm9kZSwgc2VsZWN0b3IpKSB7XG4gICAgICAgIG1hdGNoaW5nSW5kZXggPSBpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBtYXRjaGluZ0luZGV4O1xufVxuIl19