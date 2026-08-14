import { Component, OnInit } from '@angular/core';
import { GaleriaModalService } from '../../services/galeria-modal.service';
import { InstagramService } from '../../services/instagram.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: false
})
export class CatalogoPage implements OnInit {

  galeria: string[] = [];
  cargando: boolean = false;

  constructor(
    private galeriaModal: GaleriaModalService,
    private instagramService: InstagramService
  ) {}

  ngOnInit() {
    this.cargarGaleria();
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
      },
      error: () => {
        this.galeria = [
          'assets/img/img01.jpg',
          'assets/img/img02.jpg',
          'assets/img/img03.jpg',
        ];
        this.cargando = false;
      }
    });
  }

  abrirImg(img: string) {
    this.galeriaModal.abrir(img);
  }

}
