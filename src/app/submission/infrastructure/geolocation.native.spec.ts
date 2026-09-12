import { TestBed } from '@angular/core/testing';
import { Geolocation } from '@capacitor/geolocation';

import { GEOLOCATION_PLUGIN, GeolocationNative, GeolocationPlugin } from './geolocation.native';
import { LocationError } from '../domain/models/submission.model';

type Permissions = Awaited<ReturnType<typeof Geolocation.checkPermissions>>;
type Position = Awaited<ReturnType<typeof Geolocation.getCurrentPosition>>;

/** Stands in for the Capacitor plugin: answers per call with what the test set. */
class FakePlugin implements GeolocationPlugin {
  current: Permissions = { location: 'granted', coarseLocation: 'granted' };
  afterRequest: Permissions = { location: 'granted', coarseLocation: 'granted' };
  position: Promise<Position> = Promise.resolve({
    coords: { latitude: 41.38, longitude: 2.16 },
  } as Position);

  checkPermissions(): Promise<Permissions> {
    return Promise.resolve(this.current);
  }

  requestPermissions(): Promise<Permissions> {
    return Promise.resolve(this.afterRequest);
  }

  getCurrentPosition(): Promise<Position> {
    return this.position;
  }
}

describe('GeolocationNative', () => {
  let geolocation: GeolocationNative;
  let plugin: FakePlugin;

  beforeEach(() => {
    plugin = new FakePlugin();
    TestBed.configureTestingModule({
      providers: [GeolocationNative, { provide: GEOLOCATION_PLUGIN, useValue: plugin }],
    });
    geolocation = TestBed.inject(GeolocationNative);
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  async function rejection(pending: Promise<unknown>): Promise<LocationError> {
    try {
      await pending;
    } catch (err) {
      if (err instanceof LocationError) return err;
      throw new Error('rejected with something other than a LocationError');
    }
    throw new Error('did not reject');
  }

  it('resolves the device position', async () => {
    expect(await geolocation.getCurrentPosition()).toEqual({ latitude: 41.38, longitude: 2.16 });
  });

  it('reports a permission the person refused as permission_denied', async () => {
    plugin.current = { location: 'prompt', coarseLocation: 'prompt' };
    plugin.afterRequest = { location: 'denied', coarseLocation: 'denied' };

    expect((await rejection(geolocation.getCurrentPosition())).reason).toBe('permission_denied');
  });

  /** The plugin's own wording for location switched off at the OS level. */
  it('reports location services switched off as unavailable', async () => {
    plugin.position = Promise.reject(new Error('Location services are not enabled'));

    expect((await rejection(geolocation.getCurrentPosition())).reason).toBe('unavailable');
  });

  /**
   * The plugin never rejects on its own timeout, so the adapter bounds the
   * wait itself: a fix that has not arrived by then is a timeout, not a hang.
   */
  it('reports no fix within the time limit as timeout', async () => {
    plugin.position = new Promise(() => undefined);

    const pending = rejection(geolocation.getCurrentPosition());
    // Let the permission check settle before the clock moves.
    await Promise.resolve();
    await Promise.resolve();
    jasmine.clock().tick(10001);

    expect((await pending).reason).toBe('timeout');
  });
});
