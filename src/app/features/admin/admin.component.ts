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
import JSZip from 'jszip';
import { SupabaseService, Photo, DriveStatus } from '../../core/services/supabase.service';

type AdminView = 'login' | 'panel';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  supabase = inject(SupabaseService);

  /* ── Auth ── */
  view = signal<AdminView>('login');
  keyInput = '';
  loginError = signal(false);

  /* ── State ── */
  isLoading = signal(false);
  isDeleting = signal(false);
  isDownloading = signal(false);
  downloadProgress = signal(0);

  /* ── Drive ── */
  driveStatus  = signal<DriveStatus>({ connected: false });
  driveLoading = signal(false);

  /* ── Drive callback banner (en login page) ── */
  driveCallbackResult = signal<'connected' | 'error' | 'no_refresh_token' | null>(null);

  /* ── Multi-select ── */
  selectionMode = signal(false);
  selectedIds   = signal<Set<string>>(new Set());

  selectedCount = computed(() => this.selectedIds().size);
  allSelected   = computed(
    () =>
      this.supabase.photos().length > 0 &&
      this.selectedIds().size === this.supabase.photos().length
  );

  /* ── Toasts ── */
  toasts = signal<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  private toastCounter = 0;

  /* ── Lifecycle ── */
  ngOnInit() {
    // Detectar resultado del OAuth de Google Drive
    const params = new URLSearchParams(window.location.search);
    const drive  = params.get('drive');

    if (drive === 'connected') {
      this.driveCallbackResult.set('connected');
      history.replaceState({}, '', '/admin');
    } else if (drive === 'error') {
      this.driveCallbackResult.set('error');
      history.replaceState({}, '', '/admin');
    } else if (drive === 'no_refresh_token') {
      this.driveCallbackResult.set('no_refresh_token');
      history.replaceState({}, '', '/admin');
    }
  }

  /* ── Auth ── */
  async onLogin(event: Event) {
    event.preventDefault();
    if (this.supabase.isAdminKey(this.keyInput)) {
      this.loginError.set(false);
      this.view.set('panel');
      await this.loadPhotos();
      await this.loadDriveStatus();

      // Mostrar toast del resultado del OAuth después de loguearse
      const cb = this.driveCallbackResult();
      if (cb === 'connected') {
        this.showToast('¡Google Drive conectado exitosamente! 🚀', 'success');
      } else if (cb === 'error') {
        this.showToast('Error al conectar con Google Drive', 'error');
      } else if (cb === 'no_refresh_token') {
        this.showToast('Error: no se recibió el token. Intenta reconectar.', 'error');
      }
    } else {
      this.loginError.set(true);
    }
  }

  async loadPhotos() {
    this.isLoading.set(true);
    await this.supabase.loadPhotos();
    this.isLoading.set(false);
  }

  /* ── Drive ── */
  async loadDriveStatus() {
    this.driveLoading.set(true);
    const status = await this.supabase.getDriveStatus();
    this.driveStatus.set(status);
    this.driveLoading.set(false);
  }

  connectDrive() {
    window.location.href = this.supabase.getDriveOAuthUrl();
  }

  /* ── Selection ── */
  toggleSelectionMode() {
    this.selectionMode.update((v) => !v);
    if (!this.selectionMode()) this.clearSelection();
  }

  togglePhoto(id: string) {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleAll() {
    if (this.allSelected()) {
      this.clearSelection();
    } else {
      this.selectedIds.set(new Set(this.supabase.photos().map((p) => p.id)));
    }
  }

  clearSelection() { this.selectedIds.set(new Set()); }

  isSelected(id: string): boolean { return this.selectedIds().has(id); }

  /* ── Delete ── */
  async deleteSelected() {
    const ids = this.selectedIds();
    if (!ids.size) return;
    const photos = this.supabase.photos().filter((p) => ids.has(p.id));
    const confirmed = window.confirm(
      `¿Eliminar ${photos.length} foto${photos.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    this.isDeleting.set(true);
    let errors = 0;
    for (const photo of photos) {
      const r = await this.supabase.deletePhoto(photo);
      if (!r.success) errors++;
    }
    this.isDeleting.set(false);
    this.clearSelection();
    this.selectionMode.set(false);

    if (errors === 0) {
      this.showToast(`${photos.length} foto${photos.length !== 1 ? 's' : ''} eliminada${photos.length !== 1 ? 's' : ''}`, 'success');
    } else {
      this.showToast(`${errors} foto${errors !== 1 ? 's' : ''} no se pudieron eliminar`, 'error');
    }
  }

  async deleteSingle(photo: Photo) {
    const confirmed = window.confirm(
      `¿Eliminar esta foto${photo.uploader_name ? ' de ' + photo.uploader_name : ''}?`
    );
    if (!confirmed) return;
    const result = await this.supabase.deletePhoto(photo);
    if (result.success) {
      this.showToast('Foto eliminada', 'success');
    } else {
      this.showToast('Error al eliminar: ' + result.error, 'error');
    }
  }

  /* ── Download ZIP ── */
  async downloadZip(onlySelected: boolean) {
    const photos = onlySelected
      ? this.supabase.photos().filter((p) => this.selectedIds().has(p.id))
      : this.supabase.photos();

    if (!photos.length) {
      this.showToast('No hay fotos para descargar', 'error');
      return;
    }

    this.isDownloading.set(true);
    this.downloadProgress.set(0);

    const zip    = new JSZip();
    const folder = zip.folder('fotos-boda-josue-ahinoam')!;

    let done  = 0;
    const total = photos.length;

    const fetchPhoto = async (photo: Photo, index: number) => {
      try {
        const response = await fetch(photo.public_url);
        const blob     = await response.blob();
        const ext  = photo.storage_path.split('.').pop() ?? 'jpg';
        const name = photo.uploader_name
          ? `${String(index + 1).padStart(3, '0')}_${photo.uploader_name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/g, '_')}.${ext}`
          : `${String(index + 1).padStart(3, '0')}_foto.${ext}`;
        folder.file(name, blob);
      } catch {
        console.warn('Could not fetch photo:', photo.public_url);
      }
      done++;
      this.downloadProgress.set(Math.round((done / total) * 100));
    };

    const BATCH = 5;
    for (let i = 0; i < photos.length; i += BATCH) {
      await Promise.all(photos.slice(i, i + BATCH).map((p, j) => fetchPhoto(p, i + j)));
    }

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `fotos-boda-josue-ahinoam-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    this.isDownloading.set(false);
    this.showToast(`${photos.length} fotos descargadas en ZIP`, 'success');
  }

  /* ── Helpers ── */
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-MX', {
      day:    '2-digit',
      month:  'short',
      hour:   '2-digit',
      minute: '2-digit',
    });
  }

  private showToast(message: string, type: 'success' | 'error') {
    const id = ++this.toastCounter;
    this.toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 4000);
  }
}
