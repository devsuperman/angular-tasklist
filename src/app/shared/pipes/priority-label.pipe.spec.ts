import { PriorityLabelPipe } from './priority-label.pipe';

describe('PriorityLabelPipe', () => {
  it('labels each priority', () => {
    const pipe = new PriorityLabelPipe();
    expect(['low', 'medium', 'high'].map((p) => pipe.transform(p as never))).toEqual([
      'Low',
      'Medium',
      'High',
    ]);
  });
});
