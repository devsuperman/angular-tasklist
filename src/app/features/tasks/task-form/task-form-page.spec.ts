import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { APP_CONFIG } from '../../../core/config/app-config';
import { MemoryStorageService, StorageService } from '../../../core/services/storage.service';
import { TaskStore } from '../../../core/services/task-store';
import { TEST_CONFIG, aTask } from '../../../testing/test-data';
import { TaskFormPage } from './task-form-page';

describe('TaskFormPage', () => {
  let fixture: ComponentFixture<TaskFormPage>;
  let el: HTMLElement;
  let store: TaskStore;

  const saved = {
    version: 1,
    projects: [
      { id: 'p1', name: 'One', color: '#000000' },
      { id: 'p2', name: 'Two', color: '#ffffff' },
    ],
    tasks: [aTask({ id: 'existing', title: 'Buy coffee', projectId: 'p1' })],
  };

  beforeEach(async () => {
    const storage = new MemoryStorageService();
    storage.setItem(TEST_CONFIG.storageKey, JSON.stringify(saved));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StorageService, useValue: storage },
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
      ],
    });
    store = TestBed.inject(TaskStore);
    fixture = TestBed.createComponent(TaskFormPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
  const submit = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;

  async function type(id: string, value: string) {
    const field = input(id);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    await new Promise((resolve) => setTimeout(resolve, 200)); // the async validator waits 150 ms
    await fixture.whenStable();
  }

  it('starts invalid, with the save button disabled', () => {
    expect(el.querySelector('h2')?.textContent).toContain('New task');
    expect(submit().disabled).toBe(true);
  });

  it('shows "required" and "min length" messages after the field is touched', async () => {
    await type('title', '');
    expect(el.querySelector('#title-error')?.textContent).toContain('The title is required.');
    await type('title', 'ab');
    expect(el.querySelector('#title-error')?.textContent).toContain('Use at least 3 characters.');
    expect(input('title').getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects a title already used in the same project (async validator)', async () => {
    await type('title', 'buy coffee');
    expect(el.querySelector('#title-error')?.textContent).toContain('already has a task');
    expect(submit().disabled).toBe(true);
  });

  it('creates a task and goes back to the list', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await type('title', 'Write the tests');
    expect(submit().disabled).toBe(false);

    submit().click();

    expect(store.tasks().map((t) => t.title)).toContain('Write the tests');
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
  });

  it('fills the form from the resolved task when editing', async () => {
    fixture.componentRef.setInput('id', 'existing');
    fixture.componentRef.setInput('task', store.byId('existing'));
    await fixture.whenStable();

    expect(el.querySelector('h2')?.textContent).toContain('Edit task');
    expect(input('title').value).toBe('Buy coffee');
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);

    await type('title', 'Buy tea');
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
  });
});
