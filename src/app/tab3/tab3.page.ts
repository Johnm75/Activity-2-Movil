/**
 * Pestaña «Cuenta» (`Tab3Page`): expone los datos de la sesión JWT activa
 * y ejecuta el cierre de sesión conservando intactas las fotografías locales.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Component, inject } from '@angular/core';
import type { AlertButton, ViewDidEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { keyOutline, logOutOutline, person, timeOutline } from 'ionicons/icons';

import { JwtAuthenticationService } from '../services/auth-jwt.service';
import { announcePageNavigation } from '../utils/a11y-announce.util';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements ViewDidEnter {
  private readonly authenticationService = inject(JwtAuthenticationService);

  readonly activeSession = this.authenticationService.activeSession;
  readonly maskedTokenPreview = this.authenticationService.maskedTokenPreview;
  readonly remainingSessionMinutes = this.authenticationService.remainingSessionMinutes;

  readonly signOutConfirmationButtons: AlertButton[] = [
    {
      text: 'Cancelar',
      role: 'cancel',
    },
    {
      text: 'Cerrar sesión',
      role: 'destructive',
      handler: () => {
        this.confirmSignOut();
      },
    },
  ];

  constructor() {
    addIcons({
      person,
      keyOutline,
      timeOutline,
      logOutOutline,
    });
  }

  ionViewDidEnter(): void {
    announcePageNavigation('Cuenta — Galería de Fotos', 'account-title');
  }

  confirmSignOut(): void {
    void this.authenticationService.signOutSession();
  }
}
