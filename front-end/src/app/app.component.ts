import { Component, ElementRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AnimationBuilder, AnimationController } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { GaleriaModalService } from './services/galeria-modal.service';
import { ReplicateService } from './services/replicate.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  isHome = true;
  showAppShell = true;
  probarDiseno = false;

  // Estado del flujo "probar diseño"
  fotoManoPreview: string | null = null;
  resultadoUrl: string | null = null;
  generando = false;
  errorGenerar: string | null = null;
  private imagenDiseno: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private animationCtrl: AnimationController,
    private router: Router,
    public galeriaModal: GaleriaModalService,
    private replicate: ReplicateService,
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const path = e.urlAfterRedirects.split('?')[0].split('#')[0];
      this.isHome = path === '/home' || path === '/';
      this.showAppShell = path !== '/login' && !path.startsWith('/admin');
    });

    this.galeriaModal.probarDiseno.subscribe(v => {
      this.probarDiseno = v;
      if (!v) this.resetFoto();
    });

    this.galeriaModal.imgSeleccionada$.subscribe(img => {
      this.imagenDiseno = img;
      if (!img) this.resetFoto();
    });
  }

  abrirSelector() {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.resultadoUrl = null;
    this.errorGenerar = null;
    const reader = new FileReader();
    reader.onload = (e) => { this.fotoManoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  async generar() {
    if (!this.fotoManoPreview || !this.imagenDiseno) return;
    this.generando = true;
    this.resultadoUrl = null;
    this.errorGenerar = null;

    // Convertir la imagen del diseño a base64 (puede ser asset local)
    const disenoBase64 = await this.urlABase64(this.imagenDiseno);

    this.replicate.probarDiseno(this.fotoManoPreview, disenoBase64).subscribe({
      next: (res) => {
        this.resultadoUrl = res.url;
        this.generando = false;
      },
      error: () => {
        this.errorGenerar = 'No se pudo generar la imagen. Intenta de nuevo.';
        this.generando = false;
      },
    });
  }

  resetFoto() {
    this.fotoManoPreview = null;
    this.resultadoUrl = null;
    this.generando = false;
    this.errorGenerar = null;
  }

  private urlABase64(url: string): Promise<string> {
    return fetch(url)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }

  readonly curtainUpAnimation: AnimationBuilder = (_base, opts) => {
    const enteringEl = opts.enteringEl;
    const leavingEl = opts.leavingEl;

    const entering = this.animationCtrl
      .create()
      .addElement(enteringEl)
      .beforeStyles({
        position: 'absolute',
        inset: '0',
        width: '100%',
        zIndex: '2',
      })
      .fromTo('transform', 'translateY(100%)', 'translateY(0%)')
      .fromTo('opacity', '0.9', '1')

      const animations = [entering];

      if (leavingEl) {
        const leaving = this.animationCtrl
          .create()
          .addElement(leavingEl)
          .beforeStyles({
            position: 'absolute',
            inset: '0',
            width: '100%',
            zIndex: '1'
          })
          .fromTo('transform', 'translateY(0%)', 'translateY(-100%)')
          .fromTo('opacity', '1', '0.8');

          animations.push(leaving);
      }

      return this.animationCtrl
        .create()
        .duration(500)
        .easing('cubic-bezier(0.22, 1, 0.36, 1)')
        .addAnimation(animations)
  }
}
