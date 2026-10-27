import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { aTask } from '../../../testing/test-data';
import { TaskItemComponent } from './task-item';

describe('TaskItemComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  async function render(task = aTask()) {
    const fixture = TestBed.createComponent(TaskItemComponent);
    fixture.componentRef.setInput('task', task); // set a signal input
    fixture.componentRef.setInput('project', { id: 'p1', name: 'Home', color: '#16a34a' });
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the title, project, priority and a link to the edit page', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Buy coffee');
    expect(el.textContent).toContain('Home');
    expect(el.querySelector('.badge')?.textContent?.trim()).toBe('High');
    expect(el.querySelector('a.title')?.getAttribute('href')).toBe('/tasks/t1');
  });

  it('emits toggleDone and remove with the task id', async () => {
    const { fixture, el } = await render();
    const toggled = vi.fn();
    const removed = vi.fn();
    fixture.componentInstance.toggleDone.subscribe(toggled); // listen to an output
    fixture.componentInstance.remove.subscribe(removed);

    el.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    el.querySelector<HTMLButtonElement>('button.icon')!.click();

    expect(toggled).toHaveBeenCalledWith('t1');
    expect(removed).toHaveBeenCalledWith('t1');
  });

  it('marks done tasks', async () => {
    const { el } = await render(aTask({ done: true }));
    expect(el.querySelector('.task')!.classList).toContain('done');
    expect(el.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(true);
  });

  it('highlights overdue tasks, but not done ones', async () => {
    const overdue = await render(aTask({ dueDate: '2000-01-01' }));
    expect(overdue.el.querySelector('.task')!.classList).toContain('overdue');

    const done = await render(aTask({ dueDate: '2000-01-01', done: true }));
    expect(done.el.querySelector('.task')!.classList).not.toContain('overdue');
  });
});
