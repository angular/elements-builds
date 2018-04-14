/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Interface for the events emitted through the NgElementStrategy.
 *
 * \@experimental
 * @record
 */
export function NgElementStrategyEvent() { }
function NgElementStrategyEvent_tsickle_Closure_declarations() {
    /** @type {?} */
    NgElementStrategyEvent.prototype.name;
    /** @type {?} */
    NgElementStrategyEvent.prototype.value;
}
/**
 * Underlying strategy used by the NgElement to create/destroy the component and react to input
 * changes.
 *
 * \@experimental
 * @record
 */
export function NgElementStrategy() { }
function NgElementStrategy_tsickle_Closure_declarations() {
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
}
/**
 * Factory used to create new strategies for each NgElement instance.
 *
 * \@experimental
 * @record
 */
export function NgElementStrategyFactory() { }
function NgElementStrategyFactory_tsickle_Closure_declarations() {
    /**
     * Creates a new instance to be used for an NgElement.
     * @type {?}
     */
    NgElementStrategyFactory.prototype.create;
}
//# sourceMappingURL=element-strategy.js.map