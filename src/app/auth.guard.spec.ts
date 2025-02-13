import { TestBed ,waitForAsync} from '@angular/core/testing';

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(AuthGuard);
  }));

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
