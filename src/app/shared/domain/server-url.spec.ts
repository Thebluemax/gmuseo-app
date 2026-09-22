import { isCleartext, normalizeServerUrl, ServerUrlError } from './server-url';

function refusal(input: string): ServerUrlError {
  try {
    normalizeServerUrl(input);
  } catch (err) {
    if (err instanceof ServerUrlError) return err;
    throw err;
  }
  throw new Error(`expected ${input} to be refused`);
}

describe('normalizeServerUrl', () => {
  it('keeps a full https API base as it is', () => {
    expect(normalizeServerUrl('https://gmuseo.maximilianofernandez.net/api'))
      .toBe('https://gmuseo.maximilianofernandez.net/api');
  });

  it('appends /api to a bare origin so the person need not know the path', () => {
    expect(normalizeServerUrl('https://gmuseo.maximilianofernandez.net'))
      .toBe('https://gmuseo.maximilianofernandez.net/api');
    expect(normalizeServerUrl('https://gmuseo.maximilianofernandez.net/'))
      .toBe('https://gmuseo.maximilianofernandez.net/api');
  });

  it('trims whitespace and trailing slashes', () => {
    expect(normalizeServerUrl('  http://192.168.0.154/api/  ')).toBe('http://192.168.0.154/api');
  });

  it('keeps a port', () => {
    expect(normalizeServerUrl('http://localhost:8080')).toBe('http://localhost:8080/api');
  });

  it('allows http to the cleartext hosts of the APK', () => {
    expect(normalizeServerUrl('http://192.168.0.154')).toBe('http://192.168.0.154/api');
    expect(normalizeServerUrl('http://localhost')).toBe('http://localhost/api');
  });

  it('refuses http to any other host, naming the allowed ones', () => {
    const err = refusal('http://gmuseo.maximilianofernandez.net/api');

    expect(err.kind).toBe('cleartext');
    expect(err.message).toContain('192.168.0.154');
    expect(err.message).toContain('https');
  });

  it('refuses a relative or hostless value', () => {
    expect(refusal('192.168.0.154/api').kind).toBe('invalid');
    expect(refusal('/api').kind).toBe('invalid');
    expect(refusal('').kind).toBe('invalid');
  });

  it('refuses schemes other than http and https', () => {
    expect(refusal('ftp://192.168.0.154/api').kind).toBe('invalid');
  });

  it('refuses credentials, query and fragment in the URL', () => {
    expect(refusal('https://user:pw@example.test/api').kind).toBe('invalid');
    expect(refusal('https://example.test/api?x=1').kind).toBe('invalid');
    expect(refusal('https://example.test/api#x').kind).toBe('invalid');
  });
});

describe('isCleartext', () => {
  it('is true only for http', () => {
    expect(isCleartext('http://192.168.0.154/api')).toBeTrue();
    expect(isCleartext('https://gmuseo.maximilianofernandez.net/api')).toBeFalse();
  });
});
