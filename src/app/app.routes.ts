import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/upload/upload.component').then(
        (m) => m.UploadComponent
      ),
  },
  {
    path: 'galeria',
    loadComponent: () =>
      import('./features/gallery/gallery.component').then(
        (m) => m.GalleryComponent
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then(
        (m) => m.AdminComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
