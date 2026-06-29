import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GaleriaModalService {
  private img$ = new BehaviorSubject<string | null>(null);
  private probarDiseno$ = new BehaviorSubject<boolean>(false);

  imgSeleccionada$ = this.img$.asObservable();
  probarDiseno = this.probarDiseno$.asObservable();

  abrir(img: string) { this.img$.next(img); }
  cerrar() { this.img$.next(null); this.probarDiseno$.next(false); }
  activarProbar() { this.probarDiseno$.next(true); }
  desactivarProbar() { this.probarDiseno$.next(false); }
}