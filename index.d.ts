/**
 * @license Angular v20.2.0-next.2+sha-c66e9fe
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { Injector, Type, Version } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

/**
 * Interface for the events emitted through the NgElementStrategy.
 *
 * @publicApi
 */
interface NgElementStrategyEvent {
    name: string;
    value: any;
}
/**
 * Underlying strategy used by the NgElement to create/destroy the component and react to input
 * changes.
 *
 * @publicApi
 */
interface NgElementStrategy {
    events: Observable<NgElementStrategyEvent>;
    connect(element: HTMLElement): void;
    disconnect(): void;
    getInputValue(propName: string): any;
    setInputValue(propName: string, value: string, transform?: (value: any) => any): void;
}
/**
 * Factory used to create new strategies for each NgElement instance.
 *
 * @publicApi
 */
interface NgElementStrategyFactory {
    /** Creates a new instance to be used for an NgElement. */
    create(injector: Injector): NgElementStrategy;
}

/**
 * Prototype for a class constructor based on an Angular component
 * that can be used for custom element registration. Implemented and returned
 * by the {@link createCustomElement createCustomElement() function}.
 *
 * @see [Angular Elements Overview](guide/elements "Turning Angular components into custom elements")
 *
 * @publicApi
 */
interface NgElementConstructor<P> {
    /**
     * An array of observed attribute names for the custom element,
     * derived by transforming input property names from the source component.
     */
    readonly observedAttributes: string[];
    /**
     * Initializes a constructor instance.
     * @param injector If provided, overrides the configured injector.
     */
    new (injector?: Injector): NgElement & WithProperties<P>;
}
/**
 * Implements the functionality needed for a custom element.
 *
 * @publicApi
 */
declare abstract class NgElement extends HTMLElement {
    /**
     * The strategy that controls how a component is transformed in a custom element.
     */
    protected abstract ngElementStrategy: NgElementStrategy;
    /**
     * A subscription to change, connect, and disconnect events in the custom element.
     */
    protected ngElementEventsSubscription: Subscription | null;
    /**
     * Prototype for a handler that responds to a change in an observed attribute.
     * @param attrName The name of the attribute that has changed.
     * @param oldValue The previous value of the attribute.
     * @param newValue The new value of the attribute.
     * @param namespace The namespace in which the attribute is defined.
     * @returns Nothing.
     */
    abstract attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string, namespace?: string): void;
    /**
     * Prototype for a handler that responds to the insertion of the custom element in the DOM.
     * @returns Nothing.
     */
    abstract connectedCallback(): void;
    /**
     * Prototype for a handler that responds to the deletion of the custom element from the DOM.
     * @returns Nothing.
     */
    abstract disconnectedCallback(): void;
}
/**
 * Additional type information that can be added to the NgElement class,
 * for properties that are added based
 * on the inputs and methods of the underlying component.
 *
 * @publicApi
 */
type WithProperties<P> = {
    [property in keyof P]: P[property];
};
/**
 * A configuration that initializes an NgElementConstructor with the
 * dependencies and strategy it needs to transform a component into
 * a custom element class.
 *
 * @publicApi
 */
interface NgElementConfig {
    /**
     * The injector to use for retrieving the component's factory.
     */
    injector: Injector;
    /**
     * An optional custom strategy factory to use instead of the default.
     * The strategy controls how the transformation is performed.
     */
    strategyFactory?: NgElementStrategyFactory;
}
/**
 *  @description Creates a custom element class based on an Angular component.
 *
 * Builds a class that encapsulates the functionality of the provided component and
 * uses the configuration information to provide more context to the class.
 * Takes the component factory's inputs and outputs to convert them to the proper
 * custom element API and add hooks to input changes.
 *
 * The configuration's injector is the initial injector set on the class,
 * and used by default for each created instance.This behavior can be overridden with the
 * static property to affect all newly created instances, or as a constructor argument for
 * one-off creations.
 *
 * @see [Angular Elements Overview](guide/elements "Turning Angular components into custom elements")
 *
 * @param component The component to transform.
 * @param config A configuration that provides initialization information to the created class.
 * @returns The custom-element construction class, which can be registered with
 * a browser's `CustomElementRegistry`.
 *
 * @publicApi
 */
declare function createCustomElement<P>(component: Type<any>, config: NgElementConfig): NgElementConstructor<P>;

/**
 * @publicApi
 */
declare const VERSION: Version;

export { NgElement, VERSION, createCustomElement };
export type { NgElementConfig, NgElementConstructor, NgElementStrategy, NgElementStrategyEvent, NgElementStrategyFactory, WithProperties };
