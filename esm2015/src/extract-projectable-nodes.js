/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/extract-projectable-nodes.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/**
 * @param {?} host
 * @param {?} ngContentSelectors
 * @return {?}
 */
export function extractProjectableNodes(host, ngContentSelectors) {
    /** @type {?} */
    const nodes = host.childNodes;
    /** @type {?} */
    const projectableNodes = ngContentSelectors.map((/**
     * @return {?}
     */
    () => []));
    /** @type {?} */
    let wildcardIndex = -1;
    ngContentSelectors.some((/**
     * @param {?} selector
     * @param {?} i
     * @return {?}
     */
    (selector, i) => {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    }));
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
        selectors.some((/**
         * @param {?} selector
         * @param {?} i
         * @return {?}
         */
        (selector, i) => {
            if ((selector !== '*') && matchesSelector(node, selector)) {
                matchingIndex = i;
                return true;
            }
            return false;
        }));
    }
    return matchingIndex;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdC1wcm9qZWN0YWJsZS1ub2Rlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2VsZW1lbnRzL3NyYy9leHRyYWN0LXByb2plY3RhYmxlLW5vZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFBQyxTQUFTLEVBQUUsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7Ozs7QUFFbkQsTUFBTSxVQUFVLHVCQUF1QixDQUFDLElBQWlCLEVBQUUsa0JBQTRCOztVQUMvRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVU7O1VBQ3ZCLGdCQUFnQixHQUFhLGtCQUFrQixDQUFDLEdBQUc7OztJQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBQzs7UUFDL0QsYUFBYSxHQUFHLENBQUMsQ0FBQztJQUV0QixrQkFBa0IsQ0FBQyxJQUFJOzs7OztJQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3RDLElBQUksUUFBUSxLQUFLLEdBQUcsRUFBRTtZQUNwQixhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMsRUFBQyxDQUFDO0lBRUgsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTs7Y0FDeEMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7O2NBQ2YsY0FBYyxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRSxhQUFhLENBQUM7UUFFakYsSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDekIsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdDO0tBQ0Y7SUFFRCxPQUFPLGdCQUFnQixDQUFDO0FBQzFCLENBQUM7Ozs7Ozs7QUFFRCxTQUFTLGlCQUFpQixDQUFDLElBQVUsRUFBRSxTQUFtQixFQUFFLFlBQW9COztRQUMxRSxhQUFhLEdBQUcsWUFBWTtJQUVoQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNuQixTQUFTLENBQUMsSUFBSTs7Ozs7UUFBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3QixJQUFJLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ3pELGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBQyxDQUFDO0tBQ0o7SUFFRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBOT1RFOiBUaGlzIGlzIGEgKHNsaWdodGx5IGltcHJvdmVkKSB2ZXJzaW9uIG9mIHdoYXQgaXMgdXNlZCBpbiBuZ1VwZ3JhZGUnc1xuLy8gICAgICAgYERvd25ncmFkZUNvbXBvbmVudEFkYXB0ZXJgLlxuLy8gVE9ETyhna2FscGFrKTogSW52ZXN0aWdhdGUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2hhcmUgdGhlIGNvZGUuXG5cbmltcG9ydCB7aXNFbGVtZW50LCBtYXRjaGVzU2VsZWN0b3J9IGZyb20gJy4vdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFByb2plY3RhYmxlTm9kZXMoaG9zdDogSFRNTEVsZW1lbnQsIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW10pOiBOb2RlW11bXSB7XG4gIGNvbnN0IG5vZGVzID0gaG9zdC5jaGlsZE5vZGVzO1xuICBjb25zdCBwcm9qZWN0YWJsZU5vZGVzOiBOb2RlW11bXSA9IG5nQ29udGVudFNlbGVjdG9ycy5tYXAoKCkgPT4gW10pO1xuICBsZXQgd2lsZGNhcmRJbmRleCA9IC0xO1xuXG4gIG5nQ29udGVudFNlbGVjdG9ycy5zb21lKChzZWxlY3RvciwgaSkgPT4ge1xuICAgIGlmIChzZWxlY3RvciA9PT0gJyonKSB7XG4gICAgICB3aWxkY2FyZEluZGV4ID0gaTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuXG4gIGZvciAobGV0IGkgPSAwLCBpaSA9IG5vZGVzLmxlbmd0aDsgaSA8IGlpOyArK2kpIHtcbiAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgY29uc3QgbmdDb250ZW50SW5kZXggPSBmaW5kTWF0Y2hpbmdJbmRleChub2RlLCBuZ0NvbnRlbnRTZWxlY3RvcnMsIHdpbGRjYXJkSW5kZXgpO1xuXG4gICAgaWYgKG5nQ29udGVudEluZGV4ICE9PSAtMSkge1xuICAgICAgcHJvamVjdGFibGVOb2Rlc1tuZ0NvbnRlbnRJbmRleF0ucHVzaChub2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJvamVjdGFibGVOb2Rlcztcbn1cblxuZnVuY3Rpb24gZmluZE1hdGNoaW5nSW5kZXgobm9kZTogTm9kZSwgc2VsZWN0b3JzOiBzdHJpbmdbXSwgZGVmYXVsdEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgbWF0Y2hpbmdJbmRleCA9IGRlZmF1bHRJbmRleDtcblxuICBpZiAoaXNFbGVtZW50KG5vZGUpKSB7XG4gICAgc2VsZWN0b3JzLnNvbWUoKHNlbGVjdG9yLCBpKSA9PiB7XG4gICAgICBpZiAoKHNlbGVjdG9yICE9PSAnKicpICYmIG1hdGNoZXNTZWxlY3Rvcihub2RlLCBzZWxlY3RvcikpIHtcbiAgICAgICAgbWF0Y2hpbmdJbmRleCA9IGk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIG1hdGNoaW5nSW5kZXg7XG59XG4iXX0=