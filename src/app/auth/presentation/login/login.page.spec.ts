import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { LoginPage } from './login.page';
import { AuthService } from '../../application/auth.service';
import { ChangeServerUseCase } from '../../application/change-server.use-case';
import { ServerConfig } from '../../../shared/application/server-config';
import { ServerUrlStore } from '../../../shared/domain/server-url.store';
import { ServerUrlError } from '../../../shared/domain/server-url';

const LAN = 'http://192.168.0.154/api';

class StubStore extends ServerUrlStore {
  url: string | null = null;
  async get(): Promise<string | null> {
    return this.url;
  }
  async set(url: string): Promise<void> {
    this.url = url;
  }
  async clear(): Promise<void> {
    this.url = null;
  }
}

class StubChangeServer {
  refuse: ServerUrlError | null = null;
  received: string[] = [];
  async execute(url: string): Promise<void> {
    this.received.push(url);
    if (this.refuse) throw this.refuse;
  }
}

describe('LoginPage — server', () => {
  let fixture: ComponentFixture<LoginPage>;
  let store: StubStore;
  let changeServer: StubChangeServer;
  let config: ServerConfig;

  const text = (selector: string): string | null =>
    (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.trim() ?? null;
  const click = (selector: string): void => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector)!.click();
  };

  async function mount(savedUrl: string | null): Promise<void> {
    store = new StubStore();
    store.url = savedUrl;
    changeServer = new StubChangeServer();
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ServerUrlStore, useValue: store },
        { provide: ChangeServerUseCase, useValue: changeServer },
        { provide: AuthService, useValue: { login: jasmine.createSpy('login') } },
      ],
    });
    config = TestBed.inject(ServerConfig);
    await config.load();
    fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
  }

  it('shows the server every request goes to — the build default when none is saved', async () => {
    await mount(null);

    expect(text('.server__url')).toBe(config.defaultApiUrl);
    expect(text('.server__warning')).toBeNull();
  });

  it('shows the saved server and warns when it is reached in plain text', async () => {
    await mount(LAN);

    expect(text('.server__url')).toBe(LAN);
    expect(text('.server__warning')).toContain('http');
  });

  it('hands the typed URL to the use case and closes the form when it is accepted', async () => {
    await mount(null);
    click('.server__toggle');
    await fixture.whenStable();

    fixture.componentInstance.serverUrl = ' http://192.168.0.154 ';
    click('.server__save');
    await fixture.whenStable();

    expect(changeServer.received).toEqual([' http://192.168.0.154 ']);
    expect(fixture.componentInstance.serverOpen()).toBeFalse();
    expect(text('.login__error')).toBeNull();
  });

  it('keeps the form open and says why when the server is refused', async () => {
    await mount(null);
    changeServer.refuse = new ServerUrlError('unreachable', 'https://x/api/v1/version no responde. No se ha guardado.');
    click('.server__toggle');
    await fixture.whenStable();

    fixture.componentInstance.serverUrl = 'https://x';
    click('.server__save');
    await fixture.whenStable();

    expect(fixture.componentInstance.serverOpen()).toBeTrue();
    expect(text('.login__error')).toBe('https://x/api/v1/version no responde. No se ha guardado.');
    expect(text('.server__url')).toBe(config.defaultApiUrl);
  });

  it('offers the way back to the default only when another server is in use', async () => {
    await mount(null);
    click('.server__toggle');
    await fixture.whenStable();
    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.server__toggle'))
        .map((el) => el.textContent?.trim())
    ).not.toContain('Volver al servidor por defecto');

    TestBed.resetTestingModule();
    await mount(LAN);
    click('.server__toggle');
    await fixture.whenStable();
    click('.server__toggle'); // the first toggle inside the open form is "back to default"
    await fixture.whenStable();

    expect(changeServer.received).toEqual([config.defaultApiUrl]);
  });
});
