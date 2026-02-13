/**
 * @license Angular v21.1.4+sha-55b501a
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

import { ComponentFactoryResolver, NgZone, ApplicationRef, ɵChangeDetectionScheduler as _ChangeDetectionScheduler, ɵisViewDirty as _isViewDirty, ɵmarkForRefresh as _markForRefresh, Injector, isSignal, Version } from '@angular/core';
import { ReplaySubject, merge, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const scheduler = {
  schedule(taskFn, delay) {
    const id = setTimeout(taskFn, delay);
    return () => clearTimeout(id);
  }
};
function camelToDashCase(input) {
  return input.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
}
function isElement(node) {
  return !!node && node.nodeType === Node.ELEMENT_NODE;
}
let _matches;
function matchesSelector(el, selector) {
  if (!_matches) {
    const elProto = Element.prototype;
    _matches = elProto.matches || elProto.matchesSelector || elProto.mozMatchesSelector || elProto.msMatchesSelector || elProto.oMatchesSelector || elProto.webkitMatchesSelector;
  }
  return el.nodeType === Node.ELEMENT_NODE ? _matches.call(el, selector) : false;
}
function getDefaultAttributeToPropertyInputs(inputs) {
  const attributeToPropertyInputs = {};
  inputs.forEach(({
    propName,
    templateName,
    transform
  }) => {
    attributeToPropertyInputs[camelToDashCase(templateName)] = [propName, transform];
  });
  return attributeToPropertyInputs;
}
function getComponentInputs(component, injector) {
  const componentFactoryResolver = injector.get(ComponentFactoryResolver);
  const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
  return componentFactory.inputs;
}

function extractProjectableNodes(host, ngContentSelectors) {
  const nodes = host.childNodes;
  const projectableNodes = ngContentSelectors.map(() => []);
  let wildcardIndex = -1;
  ngContentSelectors.some((selector, i) => {
    if (selector === '*') {
      wildcardIndex = i;
      return true;
    }
    return false;
  });
  for (let i = 0, ii = nodes.length; i < ii; ++i) {
    const node = nodes[i];
    const ngContentIndex = findMatchingIndex(node, ngContentSelectors, wildcardIndex);
    if (ngContentIndex !== -1) {
      projectableNodes[ngContentIndex].push(node);
    }
  }
  return projectableNodes;
}
function findMatchingIndex(node, selectors, defaultIndex) {
  let matchingIndex = defaultIndex;
  if (isElement(node)) {
    selectors.some((selector, i) => {
      if (selector !== '*' && matchesSelector(node, selector)) {
        matchingIndex = i;
        return true;
      }
      return false;
    });
  }
  return matchingIndex;
}

const DESTROY_DELAY = 10;
class ComponentNgElementStrategyFactory {
  componentFactory;
  inputMap = new Map();
  constructor(component, injector) {
    this.componentFactory = injector.get(ComponentFactoryResolver).resolveComponentFactory(component);
    for (const input of this.componentFactory.inputs) {
      this.inputMap.set(input.propName, input.templateName);
    }
  }
  create(injector) {
    return new ComponentNgElementStrategy(this.componentFactory, injector, this.inputMap);
  }
}
class ComponentNgElementStrategy {
  componentFactory;
  injector;
  inputMap;
  eventEmitters = new ReplaySubject(1);
  events = this.eventEmitters.pipe(switchMap(emitters => merge(...emitters)));
  componentRef = null;
  scheduledDestroyFn = null;
  initialInputValues = new Map();
  ngZone;
  elementZone;
  appRef;
  cdScheduler;
  constructor(componentFactory, injector, inputMap) {
    this.componentFactory = componentFactory;
    this.injector = injector;
    this.inputMap = inputMap;
    this.ngZone = this.injector.get(NgZone);
    this.appRef = this.injector.get(ApplicationRef);
    this.cdScheduler = injector.get(_ChangeDetectionScheduler);
    this.elementZone = typeof Zone === 'undefined' ? null : this.ngZone.run(() => Zone.current);
  }
  connect(element) {
    this.runInZone(() => {
      if (this.scheduledDestroyFn !== null) {
        this.scheduledDestroyFn();
        this.scheduledDestroyFn = null;
        return;
      }
      if (this.componentRef === null) {
        this.initializeComponent(element);
      }
    });
  }
  disconnect() {
    this.runInZone(() => {
      if (this.componentRef === null || this.scheduledDestroyFn !== null) {
        return;
      }
      this.scheduledDestroyFn = scheduler.schedule(() => {
        if (this.componentRef !== null) {
          this.componentRef.destroy();
          this.componentRef = null;
        }
      }, DESTROY_DELAY);
    });
  }
  getInputValue(property) {
    return this.runInZone(() => {
      if (this.componentRef === null) {
        return this.initialInputValues.get(property);
      }
      return this.componentRef.instance[property];
    });
  }
  setInputValue(property, value) {
    if (this.componentRef === null) {
      this.initialInputValues.set(property, value);
      return;
    }
    this.runInZone(() => {
      this.componentRef.setInput(this.inputMap.get(property) ?? property, value);
      if (_isViewDirty(this.componentRef.hostView)) {
        _markForRefresh(this.componentRef.changeDetectorRef);
        this.cdScheduler.notify(6);
      }
    });
  }
  initializeComponent(element) {
    const childInjector = Injector.create({
      providers: [],
      parent: this.injector
    });
    const projectableNodes = extractProjectableNodes(element, this.componentFactory.ngContentSelectors);
    this.componentRef = this.componentFactory.create(childInjector, projectableNodes, element);
    this.initializeInputs();
    this.initializeOutputs(this.componentRef);
    this.appRef.attachView(this.componentRef.hostView);
    this.componentRef.hostView.detectChanges();
  }
  initializeInputs() {
    for (const [propName, value] of this.initialInputValues) {
      this.setInputValue(propName, value);
    }
    this.initialInputValues.clear();
  }
  initializeOutputs(componentRef) {
    const eventEmitters = this.componentFactory.outputs.map(({
      propName,
      templateName
    }) => {
      const emitter = componentRef.instance[propName];
      return new Observable(observer => {
        const sub = emitter.subscribe(value => observer.next({
          name: templateName,
          value
        }));
        return () => sub.unsubscribe();
      });
    });
    this.eventEmitters.next(eventEmitters);
  }
  runInZone(fn) {
    return this.elementZone && Zone.current !== this.elementZone ? this.ngZone.run(fn) : fn();
  }
}

class NgElement extends HTMLElement {
  ngElementEventsSubscription = null;
}
function createCustomElement(component, config) {
  const inputs = getComponentInputs(component, config.injector);
  const strategyFactory = config.strategyFactory || new ComponentNgElementStrategyFactory(component, config.injector);
  const attributeToPropertyInputs = getDefaultAttributeToPropertyInputs(inputs);
  class NgElementImpl extends NgElement {
    injector;
    static ['observedAttributes'] = Object.keys(attributeToPropertyInputs);
    get ngElementStrategy() {
      if (!this._ngElementStrategy) {
        const strategy = this._ngElementStrategy = strategyFactory.create(this.injector || config.injector);
        inputs.forEach(({
          propName,
          transform
        }) => {
          if (!this.hasOwnProperty(propName)) {
            return;
          }
          const value = this[propName];
          delete this[propName];
          strategy.setInputValue(propName, value, transform);
        });
      }
      return this._ngElementStrategy;
    }
    _ngElementStrategy;
    constructor(injector) {
      super();
      this.injector = injector;
    }
    attributeChangedCallback(attrName, oldValue, newValue, namespace) {
      const [propName, transform] = attributeToPropertyInputs[attrName];
      this.ngElementStrategy.setInputValue(propName, newValue, transform);
    }
    connectedCallback() {
      let subscribedToEvents = false;
      if (this.ngElementStrategy.events) {
        this.subscribeToEvents();
        subscribedToEvents = true;
      }
      this.ngElementStrategy.connect(this);
      if (!subscribedToEvents) {
        this.subscribeToEvents();
      }
    }
    disconnectedCallback() {
      if (this._ngElementStrategy) {
        this._ngElementStrategy.disconnect();
      }
      if (this.ngElementEventsSubscription) {
        this.ngElementEventsSubscription.unsubscribe();
        this.ngElementEventsSubscription = null;
      }
    }
    subscribeToEvents() {
      this.ngElementEventsSubscription = this.ngElementStrategy.events.subscribe(e => {
        const customEvent = new CustomEvent(e.name, {
          detail: e.value
        });
        this.dispatchEvent(customEvent);
      });
    }
  }
  inputs.forEach(({
    propName,
    transform,
    isSignal: _isSignal
  }) => {
    Object.defineProperty(NgElementImpl.prototype, propName, {
      get() {
        const inputValue = this.ngElementStrategy.getInputValue(propName);
        return _isSignal && isSignal(inputValue) ? inputValue() : inputValue;
      },
      set(newValue) {
        this.ngElementStrategy.setInputValue(propName, newValue, transform);
      },
      configurable: true,
      enumerable: true
    });
  });
  return NgElementImpl;
}

const VERSION = /* @__PURE__ */new Version('21.1.4+sha-55b501a');

export { NgElement, VERSION, createCustomElement };
//# sourceMappingURL=elements.mjs.map
