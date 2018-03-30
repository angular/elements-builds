/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
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
    var /** @type {?} */ nodes = host.childNodes;
    var /** @type {?} */ projectableNodes = ngContentSelectors.map(function () { return []; });
    var /** @type {?} */ wildcardIndex = -1;
    ngContentSelectors.some(function (selector, i) {
        if (selector === '*') {
            wildcardIndex = i;
            return true;
        }
        return false;
    });
    for (var /** @type {?} */ i = 0, /** @type {?} */ ii = nodes.length; i < ii; ++i) {
        var /** @type {?} */ node = nodes[i];
        var /** @type {?} */ ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
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
    var /** @type {?} */ matchingIndex = defaultIndex;
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
//# sourceMappingURL=extract-projectable-nodes.js.map