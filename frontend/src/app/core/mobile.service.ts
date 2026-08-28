import { Injectable, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

@Injectable({ providedIn: 'root' })
export class MobileService {
  readonly isNative = signal<boolean>(Capacitor.isNativePlatform());
  readonly platform = signal<string>(Capacitor.getPlatform());
  readonly isAndroid = signal<boolean>(Capacitor.getPlatform() === 'android');
  readonly isIos = signal<boolean>(Capacitor.getPlatform() === 'ios');

  private backButtonCallbacks: (() => boolean)[] = [];

  constructor(private location: Location, private router: Router) {
    this.init();
  }

  async init(): Promise<void> {
    if (!this.isNative()) {
      return;
    }

    try {
      // 1. Configure Native Status Bar
      if (this.isAndroid() || this.isIos()) {
        await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        if (this.isAndroid()) {
          await StatusBar.setBackgroundColor({ color: '#0e8f4f' }).catch(() => {});
          await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        }
      }

      // 2. Hide Splash Screen smoothly once Angular boots
      setTimeout(async () => {
        await SplashScreen.hide({ fadeOutDuration: 350 }).catch(() => {});
      }, 500);

      // 3. Android Hardware Back Button Support
      App.addListener('backButton', ({ canGoBack }) => {
        // Run registered custom handlers first (e.g. closing modals)
        for (let i = this.backButtonCallbacks.length - 1; i >= 0; i--) {
          const handled = this.backButtonCallbacks[i]();
          if (handled) return;
        }

        // Default navigation behavior
        if (canGoBack && this.router.url !== '/today' && this.router.url !== '/login') {
          this.location.back();
        } else {
          App.minimizeApp();
        }
      });
    } catch (e) {
      console.warn('Native mobile initialization skipped or unavailable:', e);
    }
  }

  /** Register a callback for Android hardware back button. Return true to prevent default back navigation. */
  registerBackButtonHandler(handler: () => boolean): () => void {
    this.backButtonCallbacks.push(handler);
    return () => {
      this.backButtonCallbacks = this.backButtonCallbacks.filter(h => h !== handler);
    };
  }
}
