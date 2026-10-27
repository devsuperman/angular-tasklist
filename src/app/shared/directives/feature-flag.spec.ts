import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../../core/config/app-config';
import { TEST_CONFIG } from '../../testing/test-data';
import { FeatureFlagDirective } from './feature-flag';

@Component({
  imports: [FeatureFlagDirective],
  template: `
    <p *appFeatureFlag="'statistics'">stats</p>
    <p *appFeatureFlag="'dragAndDrop'">drag</p>
  `,
})
class Host {}

describe('FeatureFlagDirective', () => {
  it('renders only the content whose flag is on', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: { ...TEST_CONFIG, features: { statistics: true, dragAndDrop: false } },
        },
      ],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('stats');
    expect(fixture.nativeElement.textContent).not.toContain('drag');
  });
});
