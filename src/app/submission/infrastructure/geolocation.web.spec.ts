import { GeolocationWeb } from './geolocation.web';
import { LocationError } from '../domain/models/submission.model';

/** The browser's three failure codes, as `GeolocationPositionError` numbers them. */
const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;
const TIMEOUT = 3;

function failure(code: number, message = 'browser said no'): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED,
    POSITION_UNAVAILABLE,
    TIMEOUT,
  } as GeolocationPositionError;
}

describe('GeolocationWeb', () => {
  let geolocation: GeolocationWeb;

  beforeEach(() => {
    geolocation = new GeolocationWeb();
  });

  function failWith(code: number): void {
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake(
      (_ok: PositionCallback, err?: PositionErrorCallback | null) => err?.(failure(code))
    );
  }

  async function rejection(): Promise<LocationError> {
    try {
      await geolocation.getCurrentPosition();
    } catch (err) {
      if (err instanceof LocationError) return err;
      throw new Error('rejected with something other than a LocationError');
    }
    throw new Error('did not reject');
  }

  it('resolves the device position', async () => {
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((ok: PositionCallback) =>
      ok({ coords: { latitude: 41.38, longitude: 2.16 } } as GeolocationPosition)
    );

    expect(await geolocation.getCurrentPosition()).toEqual({ latitude: 41.38, longitude: 2.16 });
  });

  /**
   * Each case asks the person for a different thing, so each must arrive as
   * its own reason and not as one generic error.
   */
  it('reports a denied permission as permission_denied', async () => {
    failWith(PERMISSION_DENIED);

    expect((await rejection()).reason).toBe('permission_denied');
  });

  it('reports a position that cannot be obtained as unavailable', async () => {
    failWith(POSITION_UNAVAILABLE);

    expect((await rejection()).reason).toBe('unavailable');
  });

  it('reports no fix in time as timeout', async () => {
    failWith(TIMEOUT);

    expect((await rejection()).reason).toBe('timeout');
  });
});
