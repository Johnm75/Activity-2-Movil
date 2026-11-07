/**
 * Pestaña «Inicio» (`Tab1Page`): presenta el resumen del almacenamiento local
 * y ejecuta el consumo del endpoint API REST protegido (`GET /v1/photos`) mediante JWT.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Component, OnInit, computed, inject } from '@angular/core';
import type { ViewDidEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cloudDownloadOutline,
  imagesOutline,
  personCircleOutline,
  refreshOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

import { PhotoService } from '../services/photo.service';
import { JwtAuthenticationService } from '../services/auth-jwt.service';
import { announcePageNavigation } from '../utils/a11y-announce.util';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, ViewDidEnter {
  private readonly photoService = inject(PhotoService);
  private readonly authenticationService = inject(JwtAuthenticationService);

  readonly savedPhotosCount = computed(() => this.photoService.savedPhotos().length);
  readonly remoteCatalogPhotos = this.photoService.remoteCatalogPhotos;
  readonly isLoadingRemoteCatalog = this.photoService.isLoadingRemoteCatalog;
  readonly remoteCatalogErrorMessage = this.photoService.remoteCatalogErrorMessage;
  readonly maskedTokenPreview = this.authenticationService.maskedTokenPreview;

  constructor() {
    addIcons({
      cloudDownloadOutline,
      imagesOutline,
      personCircleOutline,
      refreshOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    if (this.photoService.savedPhotos().length === 0) {
      void this.photoService.loadSavedPhotos();
    }
    void this.synchronizeRemoteCatalog();
  }

  ionViewDidEnter(): void {
    announcePageNavigation('Inicio — Galería de Fotos', 'tab1-title');
  }

  async synchronizeRemoteCatalog(): Promise<void> {
    await this.photoService.loadRemotePhotoCatalog();
  }
}
