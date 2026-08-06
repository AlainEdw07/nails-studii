import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  mensaje: string;
  token: string;
  tipo_token: string;
  expires_in: number;
  administrador: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'adminToken';
  private readonly adminKey = 'adminInfo';

  constructor(private api: ApiService) {}

  login(correo: string, contrasena: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/admin/login', { correo, contrasena })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.adminKey, JSON.stringify(response.administrador));
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
