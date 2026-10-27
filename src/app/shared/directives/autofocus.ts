import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Focuses the element once, right after it is first rendered. */
@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => element.focus());
  }
}
