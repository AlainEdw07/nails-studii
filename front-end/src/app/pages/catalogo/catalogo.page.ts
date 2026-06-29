import { Component, OnInit } from '@angular/core';
import { GaleriaModalService } from '../../services/galeria-modal.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: false
})
export class CatalogoPage implements OnInit {

  galeria: string[] = [
    'assets/img/img01.jpg',
    'assets/img/img02.jpg',
    'assets/img/img03.jpg',
  ];

  constructor(private galeriaModal: GaleriaModalService) {}

  ngOnInit() {}

  abrirImg(img: string) {
    this.galeriaModal.abrir(img);
  }

}
