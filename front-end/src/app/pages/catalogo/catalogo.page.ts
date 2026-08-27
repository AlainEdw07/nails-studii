import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { GaleriaModalService } from '../../services/galeria-modal.service';
import { InstagramService } from '../../services/instagram.service';
import { TvPublicidadService } from '../../services/tv-publicidad.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: false
})
export class CatalogoPage implements OnInit {
  @ViewChild('content', { static: false }) content!: IonContent;

  galeria: string[] = [];
  cargando: boolean = false;
  private scrollTimer: any;

  constructor(
    private galeriaModal: GaleriaModalService,
    private instagramService: InstagramService,
    public tvPublicidadService: TvPublicidadService
  ) {}

  ngOnInit() {
    this.cargarGaleria();
  }

  ionViewDidEnter() {
    this.iniciarAutoScroll();
  }

  ionViewWillLeave() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
  }

  private iniciarAutoScroll() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }

    if (!this.tvPublicidadService.isTvMode) return;

    // Resetear posición al inicio
    this.content?.scrollToTop(0);

    // Esperar a que rendericen las imágenes y desplazar suavemente hasta el final
    this.scrollTimer = setTimeout(() => {
      if (this.tvPublicidadService.isTvMode && !this.tvPublicidadService.isPaused) {
        // Scroll suave durante 6.5 segundos (6500ms)
        this.content?.scrollToBottom(6500);
      }
    }, 800);
  }

  cargarGaleria() {
    this.cargando = true;
    this.instagramService.obtenerFotosFeed(10).subscribe({
      next: (fotos) => {
        if (fotos && fotos.length > 0) {
          this.galeria = fotos;
        } else {
          this.galeria = [
            'assets/img/img01.jpg',
            'assets/img/img02.jpg',
            'assets/img/img03.jpg',
          ];
        }
        this.cargando = false;
        if (this.tvPublicidadService.isTvMode) {
          this.iniciarAutoScroll();
        }
      },
      error: () => {
        this.galeria = [
          'assets/img/img01.jpg',
          'assets/img/img02.jpg',
          'assets/img/img03.jpg',
        ];
        this.cargando = false;
        if (this.tvPublicidadService.isTvMode) {
          this.iniciarAutoScroll();
        }
      }
    });
  }

  abrirImg(img: string) {
    this.galeriaModal.abrir(img);
  }

}
