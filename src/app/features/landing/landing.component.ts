import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

interface DetailPhoto {
  url: string;
  alt: string;
}

interface PolaroidCard {
  id: number;
  imageUrl: string;
  description: string;
  person: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private router = Router ? inject(Router) : null;

  currentYear = new Date().getFullYear();

  /* ── Métricas ── */
  totalMoments = signal<number>(0);
  lastActivity = signal<string>('—');
  uniqueGuests = signal<number>(0);

  /* ── Galería de 4 imágenes ── */
  detailPhotos: DetailPhoto[] = [
    { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop', alt: 'Detalle de flores de boda' },
    { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop', alt: 'Ramo de novia elegante' },
    { url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop', alt: 'Invitados y ceremonia' },
    { url: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=800&auto=format&fit=crop', alt: 'Traje de novio y detalles' },
  ];

  /* ── Carrusel ── */
  polaroids: PolaroidCard[] = [
    {
      id: 1,
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop',
      description: 'Primera Descripción',
      person: 'First',
    },
    {
      id: 2,
      imageUrl: 'https://images.unsplash.com/photo-1509924603848-aca550f96323?q=80&w=800&auto=format&fit=crop',
      description: 'Segunda Descripción',
      person: 'Second',
    },
    {
      id: 3,
      imageUrl: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?q=80&w=800&auto=format&fit=crop',
      description: 'Tercera Descripción',
      person: 'Third',
    },
  ];

  currentSlide = signal(0);
  private autoplayInterval: any;

  async ngOnInit() {
    await this.loadCounterMetrics();
    this.startAutoplay();
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  async loadCounterMetrics() {
    try {
      const photos = this.supabase.photos();
      if (photos.length > 0) {
        this.totalMoments.set(photos.length);

        const guests = new Set(photos.map((p) => p.uploader_name).filter(Boolean));
        this.uniqueGuests.set(guests.size > 0 ? guests.size : 1);

        const latest = photos[0]?.uploaded_at;
        if (latest) {
          const date = new Date(latest);
          const now = new Date();

          if (date.toDateString() === now.toDateString()) {
            this.lastActivity.set(
              date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })
            );
          } else {
            this.lastActivity.set(
              date.toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
            );
          }
        }
      } else {
        this.totalMoments.set(0);
        this.lastActivity.set('—');
        this.uniqueGuests.set(0);
      }
    } catch {
      this.totalMoments.set(0);
      this.lastActivity.set('—');
      this.uniqueGuests.set(0);
    }
  }

  /* ── Carrusel + Autoplay ── */
  nextSlide() {
    const total = this.polaroids.length;
    this.currentSlide.update(i => (i + 1) % total);
  }

  prevSlide() {
    const total = this.polaroids.length;
    this.currentSlide.update(i => (i - 1 + total) % total);
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.restartAutoplay(); // reinicia el timer al hacer click
  }

  private startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // cambia cada 5 segundos
  }

  private stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  private restartAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  onStartClick() {
    if (this.router) {
      this.router.navigate(['/subir']);
    }
  }
}