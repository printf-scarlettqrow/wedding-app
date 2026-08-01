import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'wedding_guest_name';
const ONBOARDING_KEY = 'wedding_onboarding_done';

@Injectable({ providedIn: 'root' })
export class GuestService {
  /** Reactive signal with the guest's name */
  guestName = signal<string>(this.loadName());

  /** Whether onboarding has been completed on this device */
  onboardingDone = signal<boolean>(this.loadOnboardingDone());

  private loadName(): string {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  }

  private loadOnboardingDone(): boolean {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }

  saveName(name: string): void {
    const trimmed = name.trim();
    this.guestName.set(trimmed);
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  completeOnboarding(): void {
    this.onboardingDone.set(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  resetOnboarding(): void {
    this.onboardingDone.set(false);
    localStorage.removeItem(ONBOARDING_KEY);
  }
}
