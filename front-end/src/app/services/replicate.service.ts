import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ProbarDisenoResponse {
  status: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class ReplicateService {
  private readonly apiUrl = environment.apiUrl;

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
