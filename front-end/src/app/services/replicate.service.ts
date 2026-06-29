import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProbarDisenoResponse {
  status: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class ReplicateService {
  private readonly apiUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  private readonly headers = new HttpHeaders({ Accept: 'application/json' });

  probarDiseno(
    fotoMano: string,
    disenoImg: string,
    descripcion?: string
  ): Observable<ProbarDisenoResponse> {
    return this.http.post<ProbarDisenoResponse>(
      `${this.apiUrl}/replicate/probar-diseno`,
      { foto_mano: fotoMano, diseno_img: disenoImg, descripcion },
      { headers: this.headers }
    );
  }
}
