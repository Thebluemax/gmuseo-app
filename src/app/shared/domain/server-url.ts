import { allowsCleartext, CLEARTEXT_HOSTS } from './cleartext-hosts';

export type ServerUrlErrorKind = 'invalid' | 'cleartext' | 'unreachable';

/** Why a server URL was refused, with the sentence the screen shows. */
export class ServerUrlError extends Error {
  constructor(readonly kind: ServerUrlErrorKind, message: string) {
    super(message);
    this.name = 'ServerUrlError';
  }
}

/**
 * Turn what the person typed into the API base URL the app uses, or refuse
 * it with a reason.
 *
 * Accepted: an absolute `https` URL, or `http` to one of the cleartext hosts
 * the APK is allowed to reach in plain text. The origin alone is enough —
 * `/api` is appended when missing, because that is where every server
 * publishes the API and the person should not have to know it.
 */
export function normalizeServerUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new ServerUrlError(
      'invalid',
      'Escribe una URL absoluta, con http:// o https:// y el nombre del servidor.'
    );
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ServerUrlError('invalid', 'La URL del servidor debe empezar por https:// o http://.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new ServerUrlError(
      'invalid',
      'La URL del servidor no puede llevar usuario, contraseña, parámetros ni #.'
    );
  }
  if (url.protocol === 'http:' && !allowsCleartext(url.hostname)) {
    throw new ServerUrlError(
      'cleartext',
      `http solo se admite para ${CLEARTEXT_HOSTS.join(' y ')}; para cualquier otro servidor usa https.`
    );
  }

  let path = url.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/api')) {
    path += '/api';
  }
  return `${url.protocol}//${url.host}${path}`;
}

/** True when `url` will travel in plain text — the screen warns about it. */
export function isCleartext(url: string): boolean {
  return url.startsWith('http:');
}
