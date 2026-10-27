import { Component, Injectable, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// Phase 3 exercise: the same service, provided in two scopes.

@Injectable({ providedIn: 'root' })
class CounterService {
  readonly count = signal(0);
}

@Component({ selector: 'app-shared-counter', template: '' })
class SharedCounter {
  readonly counter = inject(CounterService); // the root instance
}

@Component({ selector: 'app-own-counter', template: '', providers: [CounterService] })
class OwnCounter {
  readonly counter = inject(CounterService); // one instance per component
}

describe('provider scopes', () => {
  it('shares one root instance between components', () => {
    const a = TestBed.createComponent(SharedCounter).componentInstance;
    const b = TestBed.createComponent(SharedCounter).componentInstance;
    a.counter.count.set(5);
    expect(b.counter).toBe(a.counter);
    expect(b.counter.count()).toBe(5);
  });

  it('gives each component its own instance with a component provider', () => {
    const a = TestBed.createComponent(OwnCounter).componentInstance;
    const b = TestBed.createComponent(OwnCounter).componentInstance;
    a.counter.count.set(5);
    expect(b.counter).not.toBe(a.counter);
    expect(b.counter.count()).toBe(0);
    expect(TestBed.inject(CounterService).count()).toBe(0);
  });
});
