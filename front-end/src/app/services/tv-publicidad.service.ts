import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';

export interface RutaPublicidad {
  path: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class TvPublicidadService {
  private readonly STORAGE_KEY = 'nails_tv_mode';
  private readonly PAUSE_ON_INTERACTION_MS = 15000; // 15 segundos de pausa tras interacción

  private tvModeSubject = new BehaviorSubject<boolean>(false);
  public isTvMode$: Observable<boolean> = this.tvModeSubject.asObservable();

  private isPausedSubject = new BehaviorSubject<boolean>(false);
  public isPaused$: Observable<boolean> = this.isPausedSubject.asObservable();

  private rotacionRutas: RutaPublicidad[] = [
    { path: '/home', duration: 7000 },
    { path: '/catalogo', duration: 10000 }, // 10 segundos para dar tiempo al auto-scroll completo
  ];
  private rutaActualIndex = 0;

  private rotationSubscription?: Subscription;
  private pauseTimerSubscription?: Subscription;

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {
    this.inicializarEstado();
  }

  public get isTvMode(): boolean {
    return this.tvModeSubject.value;
  }

  public get isPaused(): boolean {
    return this.isPausedSubject.value;
  }

  private inicializarEstado() {
    // 1. Verificar parámetro en la URL actual (?tv=true o ?publicidad=true)
    const urlParams = new URLSearchParams(window.location.search);
    const tvParam = urlParams.get('tv') === 'true' || urlParams.get('publicidad') === 'true';

    // 2. Verificar localStorage
    const storageParam = localStorage.getItem(this.STORAGE_KEY) === 'true';

    if (tvParam || storageParam) {
      this.activarModoTv(true);
    }
  }

  public activarModoTv(activar: boolean) {
    this.tvModeSubject.next(activar);
    localStorage.setItem(this.STORAGE_KEY, activar ? 'true' : 'false');

    if (activar) {
      this.iniciarRotacion();
    } else {
      this.detenerRotacion();
    }
  }

  public toggleModoTv(): boolean {
    const nuevoEstado = !this.tvModeSubject.value;
    this.activarModoTv(nuevoEstado);
    return nuevoEstado;
  }

  public notificarInteraccion() {
    if (!this.isTvMode) return;

    // Pausar la rotación por interacción del usuario
    this.isPausedSubject.next(true);

    if (this.pauseTimerSubscription) {
      this.pauseTimerSubscription.unsubscribe();
    }

    // Reanudar automáticamente tras PAUSE_ON_INTERACTION_MS ms sin interacción
    this.pauseTimerSubscription = timer(this.PAUSE_ON_INTERACTION_MS).subscribe(() => {
      this.ngZone.run(() => {
        this.isPausedSubject.next(false);
      });
    });
  }

  public pausarManualmente() {
    this.isPausedSubject.next(true);
    if (this.pauseTimerSubscription) {
      this.pauseTimerSubscription.unsubscribe();
    }
  }

  public reanudarManualmente() {
    this.isPausedSubject.next(false);
    if (this.pauseTimerSubscription) {
      this.pauseTimerSubscription.unsubscribe();
    }
  }

  private iniciarRotacion() {
    this.detenerRotacion();

    // Sincronizar ruta actual si ya se está en una de las rutas registradas
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    const foundIdx = this.rotacionRutas.findIndex(r => r.path === currentUrl);
    if (foundIdx !== -1) {
      this.rutaActualIndex = foundIdx;
    }

    this.programarSiguientePaso();
  }

  private programarSiguientePaso() {
    if (this.rotationSubscription) {
      this.rotationSubscription.unsubscribe();
    }

    const itemActual = this.rotacionRutas[this.rutaActualIndex];
    const duracion = itemActual?.duration ?? 7000;

    this.rotationSubscription = timer(duracion).subscribe(() => {
      this.ngZone.run(() => {
        if (!this.isPaused && this.isTvMode) {
          this.siguientePestana();
        } else {
          // Si está pausado, volver a intentar en 1 segundo
          this.programarSiguientePaso();
        }
      });
    });
  }

  private siguientePestana() {
    this.rutaActualIndex = (this.rutaActualIndex + 1) % this.rotacionRutas.length;
    const proximaRuta = this.rotacionRutas[this.rutaActualIndex].path;
    this.router.navigateByUrl(proximaRuta);
    this.programarSiguientePaso();
  }

  private detenerRotacion() {
    if (this.rotationSubscription) {
      this.rotationSubscription.unsubscribe();
      this.rotationSubscription = undefined;
    }
    if (this.pauseTimerSubscription) {
      this.pauseTimerSubscription.unsubscribe();
      this.pauseTimerSubscription = undefined;
    }
    this.isPausedSubject.next(false);
  }
}
