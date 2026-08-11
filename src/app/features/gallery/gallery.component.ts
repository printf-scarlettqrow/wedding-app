import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService, Photo } from '../../core/services/supabase.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-brand">
          <p class="brand-title">Josué <em>&amp;</em> Ahinoam</p>
          <p class="brand-date">29 · agosto · 2026</p>
        </div>
        <div class="gallery-meta">
          <span class="photo-count">{{ supabase.photos().length }} fotos</span>
        </div>
      </header>

      <!-- Gallery -->
      <main class="gallery-main pb-nav">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner spinner-sage" style="width:40px;height:40px;border-width:3px"></div>
            <p>Cargando galería…</p>
          </div>
        } @else if (supabase.photos().length === 0) {
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <h2 class="empty-title">La galería está vacía</h2>
            <p class="empty-sub">¡Sé el primer invitado en subir una foto!</p>
            <a routerLink="/" class="btn btn-primary mt-2" id="go-upload-btn">Subir una foto</a>
          </div>
        } @else {
          <div class="photo-grid" role="list">
            @for (photo of supabase.photos(); track photo.id) {
              <button
                class="photo-cell"
                (click)="openLightbox(photo)"
                [id]="'photo-' + photo.id"
                role="listitem"
                [attr.aria-label]="'Ver foto' + (photo.uploader_name ? ' de ' + photo.uploader_name : '')"
              >
                <img
                  [src]="photo.public_url"
                  [alt]="'Foto' + (photo.uploader_name ? ' de ' + photo.uploader_name : '')"
                  loading="lazy"
                  decoding="async"
                />
                @if (photo.uploader_name) {
                  <span class="photo-author">{{ photo.uploader_name }}</span>
                }
                @if (photo.description) {
                  <span class="photo-description" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 8px 8px; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; font-size: 11px; z-index: 10;">
                    {{ photo.description }}
                  </span>
                }
              </button>
            }
          </div>
        }
      </main>

      <!-- Bottom nav -->
      <nav class="bottom-nav" aria-label="Navegación">
        <a routerLink="/subir" class="bottom-nav-tab" id="nav-upload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Subir
        </a>
        <a routerLink="/galeria" class="bottom-nav-tab active" id="nav-gallery">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          Galería
        </a>
      </nav>

      <!-- Lightbox -->
      @if (lightboxPhoto()) {
        <div
          class="lightbox-backdrop"
          (click)="closeLightbox()"
          id="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada"
        >
          <button class="lightbox-close" (click)="closeLightbox()" id="lightbox-close" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img
            class="lightbox-img"
            [src]="lightboxPhoto()!.public_url"
            [alt]="'Foto' + (lightboxPhoto()!.uploader_name ? ' de ' + lightboxPhoto()!.uploader_name : '')"
            (click)="$event.stopPropagation()"
          />
          @if (lightboxPhoto()!.uploader_name) {
            <p class="lightbox-caption">📸 {{ lightboxPhoto()!.uploader_name }}</p>
          }
          @if (lightboxPhoto()!.description) {
            <p class="lightbox-caption" style="margin-top: 4px; font-size: 14px; opacity: 0.9;">
              {{ lightboxPhoto()!.description }}
            </p>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./gallery.component.css'],
})
export class GalleryComponent implements OnInit, OnDestroy {
  supabase = inject(SupabaseService);
  isLoading = signal(true);
  lightboxPhoto = signal<Photo | null>(null);

  async ngOnInit() {
    await this.supabase.loadPhotos();
    this.isLoading.set(false);
    this.supabase.subscribeToPhotos();
  }

  ngOnDestroy() {
    this.supabase.unsubscribe();
  }

  openLightbox(photo: Photo) {
    this.lightboxPhoto.set(photo);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.lightboxPhoto.set(null);
    document.body.style.overflow = '';
  }
}
