/**
 * @fileoverview added by tsickle
 * Generated from: packages/elements/src/element-strategy.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Interface for the events emitted through the NgElementStrategy.
 *
 * \@publicApi
 * @record
 */
export function NgElementStrategyEvent() { }
if (false) {
    /** @type {?} */
    NgElementStrategyEvent.prototype.name;
    /** @type {?} */
    NgElementStrategyEvent.prototype.value;
}
/**
 * Underlying strategy used by the NgElement to create/destroy the component and react to input
 * changes.
 *
 * \@publicApi
 * @record
 */
export function NgElementStrategy() { }
if (false) {
    /** @type {?} */
    NgElementStrategy.prototype.events;
    /**
     * @param {?} element
     * @return {?}
     */
    NgElementStrategy.prototype.connect = function (element) { };
    /**
     * @return {?}
     */
    NgElementStrategy.prototype.disconnect = function () { };
    /**
     * @param {?} propName
     * @return {?}
     */
    NgElementStrategy.prototype.getInputValue = function (propName) { };
    /**
     * @param {?} propName
     * @param {?} value
     * @return {?}
     */
    NgElementStrategy.prototype.setInputValue = function (propName, value) { };
}
/**
 * Factory used to create new strategies for each NgElement instance.
 *
 * \@publicApi
 * @record
 */
export function NgElementStrategyFactory() { }
if (false) {
    /**
     * Creates a new instance to be used for an NgElement.
     * @param {?} injector
     * @return {?}
     */
    NgElementStrategyFactory.prototype.create = function (injector) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC1zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2VsZW1lbnRzL3NyYy9lbGVtZW50LXN0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZUEsNENBR0M7OztJQUZDLHNDQUFhOztJQUNiLHVDQUFXOzs7Ozs7Ozs7QUFTYix1Q0FPQzs7O0lBTkMsbUNBQTJDOzs7OztJQUUzQyw2REFBb0M7Ozs7SUFDcEMseURBQW1COzs7OztJQUNuQixvRUFBcUM7Ozs7OztJQUNyQywyRUFBcUQ7Ozs7Ozs7O0FBUXZELDhDQUdDOzs7Ozs7O0lBREMsb0VBQThDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgdGhlIGV2ZW50cyBlbWl0dGVkIHRocm91Z2ggdGhlIE5nRWxlbWVudFN0cmF0ZWd5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRTdHJhdGVneUV2ZW50IHtcbiAgbmFtZTogc3RyaW5nO1xuICB2YWx1ZTogYW55O1xufVxuXG4vKipcbiAqIFVuZGVybHlpbmcgc3RyYXRlZ3kgdXNlZCBieSB0aGUgTmdFbGVtZW50IHRvIGNyZWF0ZS9kZXN0cm95IHRoZSBjb21wb25lbnQgYW5kIHJlYWN0IHRvIGlucHV0XG4gKiBjaGFuZ2VzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ0VsZW1lbnRTdHJhdGVneSB7XG4gIGV2ZW50czogT2JzZXJ2YWJsZTxOZ0VsZW1lbnRTdHJhdGVneUV2ZW50PjtcblxuICBjb25uZWN0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcbiAgZGlzY29ubmVjdCgpOiB2b2lkO1xuICBnZXRJbnB1dFZhbHVlKHByb3BOYW1lOiBzdHJpbmcpOiBhbnk7XG4gIHNldElucHV0VmFsdWUocHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG59XG5cbi8qKlxuICogRmFjdG9yeSB1c2VkIHRvIGNyZWF0ZSBuZXcgc3RyYXRlZ2llcyBmb3IgZWFjaCBOZ0VsZW1lbnQgaW5zdGFuY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudFN0cmF0ZWd5RmFjdG9yeSB7XG4gIC8qKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIHRvIGJlIHVzZWQgZm9yIGFuIE5nRWxlbWVudC4gKi9cbiAgY3JlYXRlKGluamVjdG9yOiBJbmplY3Rvcik6IE5nRWxlbWVudFN0cmF0ZWd5O1xufVxuIl19