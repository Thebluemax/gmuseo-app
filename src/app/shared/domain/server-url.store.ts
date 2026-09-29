/**
 * Where the device remembers which API it was pointed at.
 *
 * The value is the API base URL as the app uses it (`https://host/api`), or
 * nothing: no entry means "the build's default". It is not a secret — the
 * same URL is in every request — so it does not belong in the keystore next
 * to the tokens; it does have to survive a restart, which the in-memory web
 * fallback of the token storage would not.
 */
export abstract class ServerUrlStore {
  abstract get(): Promise<string | null>;
  abstract set(url: string): Promise<void>;
  abstract clear(): Promise<void>;
}
