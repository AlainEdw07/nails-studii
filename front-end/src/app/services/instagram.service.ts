import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
}

export interface InstagramResponse {
  data: InstagramMedia[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class InstagramService {
  private readonly apiUrl = 'https://graph.instagram.com/me/media';

  constructor(private http: HttpClient) {}

  obtenerFotosFeed(limit: number = 10): Observable<string[]> {
    const token = environment.instagramAccessToken || '';

    if (!token) {
      console.warn('Instagram Access Token no configurado en environment.ts');
      return of([]);
    }

    const params = new HttpParams()
      .set('fields', 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp')
      .set('access_token', token)
      .set('limit', limit.toString());

    return this.http.get<InstagramResponse>(this.apiUrl, { params }).pipe(
      map((res) => {
        if (!res || !res.data) {
          return [];
        }
        return res.data
          .filter((item) => item.media_url || item.thumbnail_url)
          .map((item) => item.thumbnail_url || item.media_url || '');
      }),
      catchError((err) => {
        console.error('Error al obtener imágenes de Instagram API:', err);
        return of([]);
      })
    );
  }
}
