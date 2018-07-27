/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * Interface for the events emitted through the NgElementStrategy.
 *
 * \@experimental
 * @record
 */
export function NgElementStrategyEvent() { }
/** @type {?} */
NgElementStrategyEvent.prototype.name;
/** @type {?} */
NgElementStrategyEvent.prototype.value;
/**
 * Underlying strategy used by the NgElement to create/destroy the component and react to input
 * changes.
 *
 * \@experimental
 * @record
 */
export function NgElementStrategy() { }
/** @type {?} */
NgElementStrategy.prototype.events;
/** @type {?} */
NgElementStrategy.prototype.connect;
/** @type {?} */
NgElementStrategy.prototype.disconnect;
/** @type {?} */
NgElementStrategy.prototype.getInputValue;
/** @type {?} */
NgElementStrategy.prototype.setInputValue;
/**
 * Factory used to create new strategies for each NgElement instance.
 *
 * \@experimental
 * @record
 */
export function NgElementStrategyFactory() { }
/**
 * Creates a new instance to be used for an NgElement.
 * @type {?}
 */
NgElementStrategyFactory.prototype.create;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC1zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2VsZW1lbnRzL3NyYy9lbGVtZW50LXN0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIEluamVjdG9yfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciB0aGUgZXZlbnRzIGVtaXR0ZWQgdGhyb3VnaCB0aGUgTmdFbGVtZW50U3RyYXRlZ3kuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZhbHVlOiBhbnk7XG59XG5cbi8qKlxuICogVW5kZXJseWluZyBzdHJhdGVneSB1c2VkIGJ5IHRoZSBOZ0VsZW1lbnQgdG8gY3JlYXRlL2Rlc3Ryb3kgdGhlIGNvbXBvbmVudCBhbmQgcmVhY3QgdG8gaW5wdXRcbiAqIGNoYW5nZXMuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nRWxlbWVudFN0cmF0ZWd5IHtcbiAgZXZlbnRzOiBPYnNlcnZhYmxlPE5nRWxlbWVudFN0cmF0ZWd5RXZlbnQ+O1xuXG4gIGNvbm5lY3QoZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuICBkaXNjb25uZWN0KCk6IHZvaWQ7XG4gIGdldElucHV0VmFsdWUocHJvcE5hbWU6IHN0cmluZyk6IGFueTtcbiAgc2V0SW5wdXRWYWx1ZShwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbn1cblxuLyoqXG4gKiBGYWN0b3J5IHVzZWQgdG8gY3JlYXRlIG5ldyBzdHJhdGVnaWVzIGZvciBlYWNoIE5nRWxlbWVudCBpbnN0YW5jZS5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdFbGVtZW50U3RyYXRlZ3lGYWN0b3J5IHtcbiAgLyoqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2UgdG8gYmUgdXNlZCBmb3IgYW4gTmdFbGVtZW50LiAqL1xuICBjcmVhdGUoaW5qZWN0b3I6IEluamVjdG9yKTogTmdFbGVtZW50U3RyYXRlZ3k7XG59XG4iXX0=