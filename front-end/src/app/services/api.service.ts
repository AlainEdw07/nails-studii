import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly defaultHeaders = new HttpHeaders({ Accept: 'application/json' });

  constructor(private http: HttpClient) {}

  get<T>(path: string, headers: HttpHeaders = this.defaultHeaders): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { headers });
  }

  post<T>(path: string, body: unknown, headers: HttpHeaders = this.defaultHeaders): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body, { headers });
  }

  getAuthorized<T>(path: string): Observable<T> {
    const headers = this.defaultHeaders.set(
      'Authorization',
      `Bearer ${localStorage.getItem('adminToken') ?? ''}`,
    );
    return this.http.get<T>(`${this.apiUrl}${path}`, { headers });
  }

  postAuthorized<T>(path: string, body: unknown): Observable<T> {
    const headers = this.defaultHeaders.set(
      'Authorization',
      `Bearer ${localStorage.getItem('adminToken') ?? ''}`,
    );
    return this.http.post<T>(`${this.apiUrl}${path}`, body, { headers });
  }
}
