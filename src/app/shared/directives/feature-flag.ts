import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../../core/config/app-config';

/** Structural directive: `<section *appFeatureFlag="'statistics'">` renders only when the flag is on. */
@Directive({ selector: '[appFeatureFlag]' })
export class FeatureFlagDirective {
  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private readonly features = inject(APP_CONFIG).features;

  readonly appFeatureFlag = input.required<keyof AppConfig['features']>();

  constructor() {
    effect(() => {
      this.container.clear();
      if (this.features[this.appFeatureFlag()]) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
