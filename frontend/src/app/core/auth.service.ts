import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { Api } from './api.service';
import { storage } from './storage';
import { AppUser } from './models';

interface LoginResponse { token: string; user: AppUser; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token: string | null = storage.get('pp_token');
  readonly user = signal<AppUser | null>(this.loadUser());

  constructor(private api: Api, private router: Router) {}

  private loadUser(): AppUser | null {
    try {
      const raw = storage.get('pp_user');
      return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch { return null; }
  }

  getToken(): string | null { return this.token; }

  get isAdmin(): boolean { return this.user()?.role === 'admin'; }
  get isLoggedIn(): boolean { return !!this.token && this.user() !== null; }

  /** verify stored session with the server */
  restore(): Observable<AppUser> {
    return this.api.get<{ user: AppUser }>('/auth/me').pipe(
      tap(res => {
        this.token = storage.get('pp_token');
        this.user.set(res.user);
        storage.set('pp_user', JSON.stringify(res.user));
      }),
      map(res => res.user),
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', { email, password }).pipe(
      tap(res => this.applySession(res)),
    );
  }

  register(name: string, email: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/register', { name, email, password }).pipe(
      tap(res => this.applySession(res)),
    );
  }

  private applySession(res: LoginResponse): void {
    this.token = res.token;
    this.user.set(res.user);
    storage.set('pp_token', res.token);
    storage.set('pp_user', JSON.stringify(res.user));
  }

  logout(): void {
    // clear the server-side auth cookie too (fire-and-forget)
    this.api.post('/auth/logout', {}).subscribe({ error: () => {} });
    this.clearLocal();
    this.router.navigate(['/login']);
  }

  clearLocal(): void {
    this.token = null;
    this.user.set(null);
    storage.remove('pp_token');
    storage.remove('pp_user');
  }
}
