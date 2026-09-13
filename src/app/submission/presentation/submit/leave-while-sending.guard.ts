import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { SubmitPage } from './submit.page';

/**
 * Leaving the form mid-send is allowed but not silent: the request keeps
 * going on the server whatever the person does here, so walking away and
 * publishing again would make a second piece. The alert says so; the send is
 * never cancelled from here — the server may already have the piece.
 * Android's back button goes through the router, so this covers it too.
 */
export const leaveWhileSendingGuard: CanDeactivateFn<SubmitPage> = async (page) => {
  if (!page.submitting()) return true;

  const alerts = inject(AlertController);
  const alert = await alerts.create({
    header: 'Alta en marcha',
    message: 'La obra se está publicando. Salir no lo detiene: si vuelves a publicar, se creará otra vez.',
    buttons: [
      { text: 'Seguir esperando', role: 'cancel' },
      { text: 'Salir', role: 'destructive' },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'destructive';
};
