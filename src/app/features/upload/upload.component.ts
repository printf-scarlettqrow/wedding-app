import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import imageCompression from 'browser-image-compression';
import { SupabaseService } from '../../core/services/supabase.service';
import { GuestService } from '../../core/services/guest.service';

type AppScreen = 'welcome' | 'instructions' | 'name' | 'upload';

interface FileItem {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  isVideo: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const STEPS = [
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
    title: 'Toma o elige tus fotos y videos',
    body: 'Abre tu cámara o selecciona fotos y videos de tu galería. Puedes subir todo lo que quieras.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    title: 'Súbelas con un toque',
    body: 'Las fotos se comprimen automáticamente para que todo vaya rápido. Los videos se suben en su calidad original.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    title: 'Aparecen al instante',
    body: 'Cada foto o video que subes aparece de inmediato en la galería para todos los invitados, en tiempo real.',
  },
];

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnInit {
  private supabase = inject(SupabaseService);
  guest = inject(GuestService);

  /* ── Onboarding ── */
  screen = signal<AppScreen>('welcome');
  instructionStep = signal(0);
  steps = STEPS;
  nameInput = '';

  /* ── Upload ── */
  files = signal<FileItem[]>([]);
  isDragging = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);
  pendingCountAtStart = signal(0);
  toasts = signal<Toast[]>([]);

  pendingCount = computed(() =>
    this.files().filter((f) => f.status === 'pending').length
  );

  ngOnInit() {
    this.nameInput = this.guest.guestName();
    if (this.guest.onboardingDone()) {
      this.screen.set('upload');
    }
  }

  /* ── Onboarding navigation ── */
  goToInstructions() { this.screen.set('instructions'); }

  nextStep() {
    if (this.instructionStep() < this.steps.length - 1) {
      this.instructionStep.update((s) => s + 1);
    } else {
      this.screen.set('name');
    }
  }

  skipInstructions() { this.screen.set('name'); }
  goToWelcome()      { this.screen.set('welcome'); }

  submitName() {
    this.guest.saveName(this.nameInput);
    this.guest.completeOnboarding();
    this.screen.set('upload');
  }

  changeName() {
    this.screen.set('name');
    this.guest.resetOnboarding();
  }

  /* ── File handling ── */
  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const transferred = Array.from(e.dataTransfer?.files ?? []).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    this.addFiles(transferred);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  private addFiles(newFiles: File[]) {
    const items: FileItem[] = newFiles.map((f) => ({
      file:    f,
      preview: URL.createObjectURL(f),
      status:  'pending',
      isVideo: f.type.startsWith('video/'),
    }));
    this.files.update((curr) => [...curr, ...items]);
  }

  clearAll() {
    this.files().forEach((f) => URL.revokeObjectURL(f.preview));
    this.files.set([]);
  }

  async uploadAll() {
    const pending = this.files().filter((f) => f.status === 'pending');
    if (!pending.length) return;

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.pendingCountAtStart.set(pending.length);

    let successCount = 0;
    let errorCount   = 0;

    for (const item of pending) {
      this.updateStatus(item, 'uploading');
      try {
        const isVideo = item.isVideo;

        // Para imágenes: comprime. Para videos: sube tal cual (calidad original)
        let fileForGallery: File;
        if (isVideo) {
          fileForGallery = item.file;
        } else {
          fileForGallery = await imageCompression(item.file, {
            maxSizeMB:        1,
            maxWidthOrHeight: 1920,
            useWebWorker:     true,
          }) as File;
        }

        // 1. Subir a Supabase Storage (galería en vivo)
        const result = await this.supabase.uploadPhoto(
          fileForGallery,
          this.guest.guestName() || undefined,
          isVideo ? 'video' : 'image'
        );

        if (result.success && result.photoId) {
          successCount++;
          this.updateStatus(item, 'done');

          // 2. Backup a Drive — completamente en segundo plano, sin await
          if (isVideo) {
            // Videos: la Edge Function descarga desde la URL pública (ya es el original)
            this.supabase.triggerDriveUpload({
              photoId:             result.photoId,
              originalStoragePath: null,
              publicUrl:           result.publicUrl ?? '',
              mimeType:            item.file.type || 'video/mp4',
              fileName:            item.file.name,
            });
          } else {
            // Imágenes: subir el original al bucket privado, luego trigger Drive
            this.supabase.uploadOriginalForDrive(item.file).then((originalPath) => {
              this.supabase.triggerDriveUpload({
                photoId:             result.photoId!,
                originalStoragePath: originalPath,
                publicUrl:           result.publicUrl ?? '',
                mimeType:            item.file.type || 'image/jpeg',
                fileName:            item.file.name,
              });
            }).catch((err) => console.warn('Drive original upload skipped:', err));
          }
        } else {
          errorCount++;
          this.updateStatus(item, 'error', result.error);
        }
      } catch {
        errorCount++;
        this.updateStatus(item, 'error', 'Error al subir');
      }
      this.uploadProgress.update((p) => p + 1);
    }

    this.isUploading.set(false);

    const mediaWord = (n: number) =>
      n === 1 ? 'archivo subido' : 'archivos subidos';

    if (successCount > 0) {
      this.showToast(`${successCount} ${mediaWord(successCount)} con éxito 🎉`, 'success');
    }
    if (errorCount > 0) {
      this.showToast(`${errorCount} archivo${errorCount !== 1 ? 's' : ''} fallaron`, 'error');
    }
  }

  private updateStatus(item: FileItem, status: FileItem['status'], error?: string) {
    this.files.update((curr) =>
      curr.map((f) => (f.preview === item.preview ? { ...f, status, error } : f))
    );
  }

  private toastCounter = 0;
  showToast(message: string, type: 'success' | 'error') {
    const id = ++this.toastCounter;
    this.toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 4000);
  }
}
