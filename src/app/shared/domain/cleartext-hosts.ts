/**
 * Hosts the app may talk to over plain `http`.
 *
 * Mirrors `android/app/src/main/res/xml/network_security_config.xml`: Android
 * blocks cleartext to every other host at the socket, so offering `http` to
 * one not listed there would save a server the phone can never reach. The
 * bundle cannot read that XML, hence the copy — change both together.
 */
export const CLEARTEXT_HOSTS: readonly string[] = ['192.168.0.154', 'localhost'];

export function allowsCleartext(hostname: string): boolean {
  return CLEARTEXT_HOSTS.includes(hostname);
}
