import { InjectionToken } from '@angular/core';

/** The four methods CapacitorHttp patches on `XMLHttpRequest.prototype` and keeps the originals of. */
type PatchedMethod = 'open' | 'send' | 'setRequestHeader' | 'abort';
const PATCHED_METHODS: readonly PatchedMethod[] = ['open', 'send', 'setRequestHeader', 'abort'];

type CapacitorWebXhr = Partial<Record<PatchedMethod, unknown>>;

/**
 * An `XMLHttpRequest` that goes through the WebView, not through CapacitorHttp.
 *
 * The plugin, enabled globally, serialises request bodies as text on native
 * and corrupts the binary parts of a multipart `FormData`. It patches the
 * prototype, so any instance comes out patched — but it keeps the original
 * methods in `window.CapacitorWebXMLHttpRequest`. Assigned as own properties
 * of the instance they shadow the patched ones, and the request behaves like
 * the browser's. On the web that global is absent and the plain XHR is used.
 *
 * Same exception, same reason, as the upload used to make with
 * `CapacitorWebFetch`; XHR replaces fetch because only XHR reports how much
 * of the body has been sent.
 */
export function createUploadRequest(): XMLHttpRequest {
  const xhr = new XMLHttpRequest();
  const original = (globalThis as { CapacitorWebXMLHttpRequest?: CapacitorWebXhr }).CapacitorWebXMLHttpRequest;
  if (!original) return xhr;

  for (const method of PATCHED_METHODS) {
    const fn = original[method];
    if (typeof fn !== 'function') {
      throw new Error(`CapacitorWebXMLHttpRequest no conserva ${method}: la subida no puede saltarse CapacitorHttp.`);
    }
    Object.defineProperty(xhr, method, { value: fn, configurable: true, writable: true });
  }
  return xhr;
}

export const UPLOAD_REQUEST = new InjectionToken<() => XMLHttpRequest>('UPLOAD_REQUEST', {
  providedIn: 'root',
  factory: () => createUploadRequest,
});
