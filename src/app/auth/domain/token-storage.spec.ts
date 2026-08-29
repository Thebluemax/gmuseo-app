import { SecureTokenStorage } from './token-storage';
import { SecureTokenStorageWeb } from '../infrastructure/secure-token.storage.web';

const ACCESS = '1|access-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REFRESH = '2|refresh-token-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

/**
 * The contract every implementation of the port has to honour, native or not.
 * The device-backed one cannot run here — there is no bridge in a browser — so
 * what CI can check is the shape of the contract and that nothing reaches the
 * page's own storage. The Keystore itself is verified by hand on a device.
 */
describe('SecureTokenStorage contract', () => {
  let storage: SecureTokenStorage;

  beforeEach(() => {
    storage = new SecureTokenStorageWeb();
  });

  it('returns nothing before anything is stored', async () => {
    expect(await storage.getAccessToken()).toBeNull();
    expect(await storage.getRefreshToken()).toBeNull();
  });

  it('returns what was stored', async () => {
    await storage.setTokens(ACCESS, REFRESH);

    expect(await storage.getAccessToken()).toBe(ACCESS);
    expect(await storage.getRefreshToken()).toBe(REFRESH);
  });

  it('returns nothing after clear', async () => {
    await storage.setTokens(ACCESS, REFRESH);
    await storage.clear();

    expect(await storage.getAccessToken()).toBeNull();
    expect(await storage.getRefreshToken()).toBeNull();
  });

  it('does not survive a new instance off the device', async () => {
    await storage.setTokens(ACCESS, REFRESH);

    // Specified behaviour, not a defect: with no OS keystore the tokens live in
    // memory only, so reloading the page costs the session. Persisting them in
    // browser storage would put them within reach of any injected script.
    expect(await new SecureTokenStorageWeb().getAccessToken()).toBeNull();
  });

  it('leaves no token anywhere the page can read', async () => {
    await storage.setTokens(ACCESS, REFRESH);

    // Searching every key rather than the ones we know about: the failure that
    // matters is the one written under a name nobody anticipated.
    const holds = (store: Storage): boolean =>
      Object.keys(store).some((key) => {
        const value = store.getItem(key) ?? '';

        return value.includes(ACCESS) || value.includes(REFRESH);
      });

    expect(holds(localStorage)).toBeFalse();
    expect(holds(sessionStorage)).toBeFalse();
    expect(document.cookie.includes(ACCESS)).toBeFalse();
    expect(document.cookie.includes(REFRESH)).toBeFalse();
  });
});
