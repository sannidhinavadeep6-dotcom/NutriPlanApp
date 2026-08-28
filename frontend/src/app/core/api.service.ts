import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';

const STORAGE_SERVER_KEY = 'nutriplan_server_url';

@Injectable({ providedIn: 'root' })
export class Api {
  readonly serverUrl = signal<string>(this.getInitialServerUrl());

  constructor(private http: HttpClient) {}

  private getInitialServerUrl(): string {
    const saved = localStorage.getItem(STORAGE_SERVER_KEY);
    if (saved) {
      return saved.trim().replace(/\/+$/, '');
    }

    if (Capacitor.isNativePlatform()) {
      if (Capacitor.getPlatform() === 'android') {
        // 10.0.2.2 is the default Android emulator loopback to host PC
        return 'http://10.0.2.2:8000';
      }
      return 'http://localhost:8000';
    }

    return '';
  }

  setServerUrl(url: string): void {
    const cleaned = (url || '').trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_SERVER_KEY, cleaned);
    this.serverUrl.set(cleaned);
  }

  resetServerUrl(): void {
    localStorage.removeItem(STORAGE_SERVER_KEY);
    this.serverUrl.set(this.getInitialServerUrl());
  }

  apiUrl(endpoint: string): string {
    const base = this.serverUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}/api${cleanEndpoint}`;
  }

  mediaUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = this.serverUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }

  get<T>(url: string, params?: Record<string, string | number>): Observable<T> {
    let p: HttpParams | undefined;
    if (params) {
      p = new HttpParams();
      Object.keys(params).forEach(k => { p = p!.set(k, String(params[k])); });
    }
    return this.http.get<T>(this.apiUrl(url), { params: p, withCredentials: true });
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.apiUrl(url), body, { withCredentials: true });
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.apiUrl(url), body, { withCredentials: true });
  }

  patch<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.apiUrl(url), body, { withCredentials: true });
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.apiUrl(url), { withCredentials: true });
  }
}
