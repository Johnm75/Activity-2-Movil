/**
 * Pestaña «Galería» (`Tab2Page`): coordina la cuadrícula de fotografías locales,
 * la captura mediante `@capacitor/camera` y la eliminación física desde `IonActionSheet`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import type { ActionSheetButton, ViewDidEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle, camera, closeOutline, images, trashOutline } from 'ionicons/icons';

import { PhotoService } from '../services/photo.service';
import type { GalleryErrorCode, SavedPhoto } from '../models/photo.model';
import { announcePageNavigation, restoreElementFocus } from '../utils/a11y-announce.util';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, ViewDidEnter {
  private readonly photoService = inject(PhotoService);

  readonly savedPhotos = this.photoService.savedPhotos;
  readonly isLoadingGallery = this.photoService.isLoadingGallery;
  readonly isGalleryEmpty = this.photoService.isGalleryEmpty;
  readonly totalSavedPhotos = computed(() => this.savedPhotos().length);

  readonly galleryErrorMessage = computed<string | null>(() => {
    const errorCode = this.photoService.galleryErrorCode();
    return errorCode ? this.mapGalleryErrorToMessage(errorCode) : null;
  });

  readonly selectedPhotoForActions = signal<SavedPhoto | null>(null);
  readonly isPhotoActionSheetOpen = computed(() => this.selectedPhotoForActions() !== null);

  readonly isFeedbackToastOpen = signal<boolean>(false);
  readonly feedbackToastMessage = signal<string>('');

  readonly photoActionSheetButtons: ActionSheetButton[] = [
    {
      text: 'Eliminar fotografía',
      role: 'destructive',
      icon: 'trash-outline',
      handler: () => {
        void this.confirmDeleteSelectedPhoto();
      },
    },
    {
      text: 'Cancelar',
      role: 'cancel',
      icon: 'close-outline',
    },
  ];

  constructor() {
    addIcons({
      camera,
      images,
      'alert-circle': alertCircle,
      'trash-outline': trashOutline,
      'close-outline': closeOutline,
    });
  }

  ngOnInit(): void {
    void this.photoService.loadSavedPhotos();
  }

  ionViewDidEnter(): void {
    announcePageNavigation('Galería — Galería de Fotos', 'gallery-title');
  }

  async captureNewPhoto(): Promise<void> {
    const triggerElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    try {
      const createdPhoto = await this.photoService.captureAndSavePhoto();
      if (createdPhoto) {
        this.presentFeedbackToast('Fotografía guardada en almacenamiento local');
      }
    } catch {
      const errorCode = this.photoService.galleryErrorCode();
      this.presentFeedbackToast(
        errorCode ? this.mapGalleryErrorToMessage(errorCode) : 'No se pudo completar la captura'
      );
    } finally {
      restoreElementFocus(triggerElement);
    }
  }

  openPhotoOptions(photo: SavedPhoto): void {
    this.selectedPhotoForActions.set(photo);
  }

  closePhotoOptions(): void {
    this.selectedPhotoForActions.set(null);
  }

  async confirmDeleteSelectedPhoto(): Promise<void> {
    const targetPhoto = this.selectedPhotoForActions();
    if (!targetPhoto) {
      return;
    }

    await this.photoService.deleteSavedPhoto(targetPhoto.id);
    this.selectedPhotoForActions.set(null);
    this.presentFeedbackToast('Fotografía eliminada del dispositivo');
  }

  retryLoadingGallery(): void {
    void this.photoService.loadSavedPhotos();
  }

  dismissFeedbackToast(): void {
    this.isFeedbackToastOpen.set(false);
  }

  formatCaptureDate(isoTimestamp: string): string {
    const parsedDate = new Date(isoTimestamp);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'fecha desconocida';
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate);
  }

  /**
   * Limita el retardo escalonado a las primeras 10 celdas para no penalizar galerías extensas.
   */
  calculateStaggerDelayMs(itemIndex: number): number {
    return Math.min(itemIndex, 9) * 40;
  }

  private presentFeedbackToast(message: string): void {
    this.feedbackToastMessage.set(message);
    this.isFeedbackToastOpen.set(true);
  }

  private mapGalleryErrorToMessage(errorCode: GalleryErrorCode): string {
    switch (errorCode) {
      case 'permission_denied':
        return 'Sin acceso a la cámara. Verifica los permisos de la aplicación en tu dispositivo.';
      case 'write_failed':
        return 'No se pudo escribir la fotografía en el sistema de archivos local.';
      case 'read_failed':
        return 'No fue posible leer las fotografías almacenadas.';
      case 'index_corrupt':
        return 'El índice local presentaba inconsistencias y fue restablecido.';
      case 'unsupported_format':
        return 'El formato de imagen seleccionado no es compatible.';
      case 'cancelled':
        return 'Captura cancelada.';
      default:
        return 'Ocurrió un error inesperado en la galería.';
    }
  }
}
