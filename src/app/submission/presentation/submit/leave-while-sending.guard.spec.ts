import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';

import { leaveWhileSendingGuard } from './leave-while-sending.guard';
import { SubmitPage } from './submit.page';

describe('leaveWhileSendingGuard', () => {
  let created: unknown[];
  let dismissWith: string;

  function run(submitting: boolean): Promise<boolean> {
    const page = { submitting: signal(submitting) } as unknown as SubmitPage;
    const snapshot = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(
      () => leaveWhileSendingGuard(page, snapshot, state, state) as Promise<boolean>
    );
  }

  beforeEach(() => {
    created = [];
    dismissWith = 'cancel';
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AlertController,
          useValue: {
            create: (opts: unknown) => {
              created.push(opts);
              return Promise.resolve({
                present: () => Promise.resolve(),
                onDidDismiss: () => Promise.resolve({ role: dismissWith }),
              });
            },
          },
        },
      ],
    });
  });

  it('lets the person leave without asking when nothing is being sent', async () => {
    expect(await run(false)).toBeTrue();
    expect(created.length).toBe(0);
  });

  it('asks while a send is in flight and keeps the page when the person waits', async () => {
    dismissWith = 'cancel';

    expect(await run(true)).toBeFalse();
    expect(created.length).toBe(1);
  });

  /** Leaving is allowed: the send keeps going on the server, and the alert said so. */
  it('lets the person leave once warned', async () => {
    dismissWith = 'destructive';

    expect(await run(true)).toBeTrue();
  });
});
