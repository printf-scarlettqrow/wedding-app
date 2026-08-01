import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface Photo {
  id: string;
  storage_path: string;
  public_url: string;
  uploaded_at: string;
  uploader_name?: string;
  drive_file_id?: string;
  media_type?: 'image' | 'video';
}

export interface DriveStatus {
  connected: boolean;
  folder_url?: string;
  email?: string;
  connected_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;

  readonly BUCKET     = 'wedding-photos';
  readonly ORIG_BUCKET = 'wedding-originals';
  readonly ADMIN_KEY  = 'ayj2026';
  readonly FUNCTIONS_URL = `${environment.supabaseUrl}/functions/v1`;

  photos = signal<Photo[]>([]);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  /** Load all photos ordered by upload date desc */
  async loadPhotos(): Promise<void> {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error loading photos:', error);
      return;
    }
    this.photos.set(data as Photo[]);
  }

  /** Subscribe to realtime inserts/deletes */
  subscribeToPhotos(): void {
    this.channel = this.supabase
      .channel('photos-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos' },
        (payload) => {
          const newPhoto = payload.new as Photo;
          this.photos.update((current) => [newPhoto, ...current]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'photos' },
        (payload) => {
          const deleted = payload.old as Photo;
          this.photos.update((current) =>
            current.filter((p) => p.id !== deleted.id)
          );
        }
      )
      .subscribe();
  }

  unsubscribe(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  /** Upload a compressed image or original video to gallery, returns photoId + publicUrl */
  async uploadPhoto(
    file: File,
    uploaderName?: string,
    mediaType: 'image' | 'video' = 'image'
  ): Promise<{ success: boolean; error?: string; photoId?: string; publicUrl?: string }> {
    const ext      = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: storageError } = await this.supabase.storage
      .from(this.BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    const { data: urlData } = this.supabase.storage
      .from(this.BUCKET)
      .getPublicUrl(fileName);

    const { data: dbData, error: dbError } = await this.supabase
      .from('photos')
      .insert({
        storage_path:  fileName,
        public_url:    urlData.publicUrl,
        uploader_name: uploaderName ?? null,
        media_type:    mediaType,
      })
      .select('id')
      .single();

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true, photoId: dbData.id, publicUrl: urlData.publicUrl };
  }

  /**
   * Upload original file to private bucket (before Drive backup).
   * Fire-and-forget: returns null silently on error.
   */
  async uploadOriginalForDrive(file: File): Promise<string | null> {
    const ext      = file.name.split('.').pop() ?? 'bin';
    const fileName = `orig_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.ORIG_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.warn('Could not upload original to backup bucket:', error.message);
      return null;
    }
    return fileName;
  }

  /**
   * Trigger Drive backup via Edge Function — completely fire-and-forget.
   * Never throws, never blocks the UI.
   */
  triggerDriveUpload(params: {
    photoId: string;
    originalStoragePath: string | null;
    publicUrl: string;
    mimeType: string;
    fileName: string;
  }): void {
    fetch(`${this.FUNCTIONS_URL}/drive-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: environment.supabaseKey,
      },
      body: JSON.stringify(params),
    }).catch((err) => console.warn('Drive backup failed silently:', err));
  }

  /** Get Drive connection status (never exposes the token) */
  async getDriveStatus(): Promise<DriveStatus> {
    try {
      const res = await fetch(`${this.FUNCTIONS_URL}/drive-status`, {
        headers: { apikey: environment.supabaseKey },
      });
      return await res.json();
    } catch {
      return { connected: false };
    }
  }

  /** Build Google OAuth URL for Drive authorization */
  getDriveOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id:     environment.googleClientId,
      redirect_uri:  `${environment.supabaseUrl}/functions/v1/drive-oauth-callback`,
      response_type: 'code',
      scope:         'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
      access_type:   'offline',
      prompt:        'consent', // Fuerza el refresh_token siempre
      state:         encodeURIComponent(window.location.origin + '/admin'),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /** Delete photo from Storage + DB (admin only) */
  async deletePhoto(photo: Photo): Promise<{ success: boolean; error?: string }> {
    const { error: storageError } = await this.supabase.storage
      .from(this.BUCKET)
      .remove([photo.storage_path]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    const { error: dbError } = await this.supabase
      .from('photos')
      .delete()
      .eq('id', photo.id);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };
  }

  isAdminKey(key: string): boolean {
    return key === this.ADMIN_KEY;
  }
}
