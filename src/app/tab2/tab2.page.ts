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

  // Estado reactivo de la galería local expuesto hacia el template.
  readonly savedPhotos = this.photoService.savedPhotos;
  readonly isLoadingGallery = this.photoService.isLoadingGallery;
  readonly isGalleryEmpty = this.photoService.isGalleryEmpty;
  readonly totalSavedPhotos = computed(() => this.savedPhotos().length);

  readonly galleryErrorMessage = computed<string | null>(() => {
    const errorCode = this.photoService.galleryErrorCode();
    return errorCode ? this.mapGalleryErrorToMessage(errorCode) : null;
  });

  // Control de la foto seleccionada en el ActionSheet y avisos breves en Toast.
  readonly selectedPhotoForActions = signal<SavedPhoto | null>(null);
  readonly isPhotoActionSheetOpen = computed(() => this.selectedPhotoForActions() !== null);

  readonly isFeedbackToastOpen = signal<boolean>(false);
  readonly feedbackToastMessage = signal<string>('');

  // Acciones disponibles al pulsar una miniatura dentro de la cuadrícula.
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

  /**
   * Registra los iconos de cámara, estados vacíos y hoja de acciones de la galería.
   */
  constructor() {
    addIcons({
      camera,
      images,
      'alert-circle': alertCircle,
      'trash-outline': trashOutline,
      'close-outline': closeOutline,
    });
  }

  /**
   * Carga las fotografías persistidas al inicializar la vista por primera vez.
   */
  ngOnInit(): void {
    void this.photoService.loadSavedPhotos();
  }

  /**
   * Notifica la entrada a la galería y lleva el foco accesible al título principal.
   */
  ionViewDidEnter(): void {
    announcePageNavigation('Galería — Galería de Fotos', 'gallery-title');
  }

  /**
   * Abre la cámara o selector de imagen, persiste la captura y devuelve el foco al botón origen.
   */
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

  /**
   * Marca la fotografía activa para desplegar su hoja de opciones (`IonActionSheet`).
   */
  openPhotoOptions(photo: SavedPhoto): void {
    this.selectedPhotoForActions.set(photo);
  }

  /**
   * Limpia la selección actual cuando se cierra la hoja de acciones.
   */
  closePhotoOptions(): void {
    this.selectedPhotoForActions.set(null);
  }

  /**
   * Elimina del disco e índice la fotografía seleccionada y confirma la operación en pantalla.
   */
  async confirmDeleteSelectedPhoto(): Promise<void> {
    const targetPhoto = this.selectedPhotoForActions();
    if (!targetPhoto) {
      return;
    }

    await this.photoService.deleteSavedPhoto(targetPhoto.id);
    this.selectedPhotoForActions.set(null);
    this.presentFeedbackToast('Fotografía eliminada del dispositivo');
  }

  /**
   * Reintenta la lectura del almacenamiento privado tras un fallo previo de carga.
   */
  retryLoadingGallery(): void {
    void this.photoService.loadSavedPhotos();
  }

  /**
   * Restablece la bandera del `IonToast` al finalizar su visualización.
   */
  dismissFeedbackToast(): void {
    this.isFeedbackToastOpen.set(false);
  }

  /**
   * Formatea la marca ISO de captura en fecha y hora legible para etiquetas y textos alternativos.
   */
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

  /**
   * Actualiza el texto informativo y activa el toast inferior de retroalimentación.
   */
  private presentFeedbackToast(message: string): void {
    this.feedbackToastMessage.set(message);
    this.isFeedbackToastOpen.set(true);
  }

  /**
   * Traduce los códigos de fallo del servicio de galería a mensajes comprensibles.
   */
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
