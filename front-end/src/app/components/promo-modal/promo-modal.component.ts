import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

import { TvPublicidadService } from 'src/app/services/tv-publicidad.service';

@Component({
  selector: 'app-promo-modal',
  templateUrl: './promo-modal.component.html',
  styleUrls: ['./promo-modal.component.scss'],
  standalone: false,
})
export class PromoModalComponent implements OnInit {
  mostrarModal = false;
  telefono = '';
  whatsappConsent = false;
  errorTelefono = '';
  exitoMensaje = false;
  cargando = false;

  readonly STORAGE_KEY_HIDE = 'nails_hide_promo_modal';
  readonly STORAGE_KEY_PHONE = 'nails_promo_phone';

  constructor(
    private apiService: ApiService,
    private tvPublicidadService: TvPublicidadService
  ) {}

  ngOnInit() {
    this.verificarEstadoModal();
  }

  verificarEstadoModal() {
    if (this.tvPublicidadService.isTvMode) {
      return; // No mostrar modal en modo TV / publicidad
    }

    const hideModal = localStorage.getItem(this.STORAGE_KEY_HIDE);
    if (hideModal !== 'true') {
      // Pequeño retraso para que la animación de entrada sea fluida
      setTimeout(() => {
        if (!this.tvPublicidadService.isTvMode) {
          this.mostrarModal = true;
        }
      }, 400);
    }
  }

  aceptar() {
    if (this.cargando) return;

    const telLimpio = this.telefono.trim();
    if (!telLimpio || telLimpio.length < 7) {
      this.errorTelefono = 'Por favor ingresa un número de teléfono válido.';
      return;
    }

    this.errorTelefono = '';
    this.cargando = true;
    this.whatsappConsent = true; // Acepta el consentimiento al hacer clic en "Aceptar"

    this.apiService.post('/promo/registrar', { number: telLimpio, whatsapp_consent: this.whatsappConsent }).subscribe({
      next: () => {
        this.cargando = false;
        localStorage.setItem(this.STORAGE_KEY_PHONE, telLimpio);
        localStorage.setItem(this.STORAGE_KEY_HIDE, 'true');

        this.exitoMensaje = true;
        setTimeout(() => {
          this.cerrarModal();
        }, 1800);
      },
      error: (err) => {
        this.cargando = false;
        const msg = err?.error?.mensaje ?? 'Ocurrió un error al registrar tu número. Por favor intenta de nuevo.';
        this.errorTelefono = msg;
      },
    });
  }

  cancelar() {
    // Cierra el modal solo por esta sesión (no guarda la opción de ocultar permamentemente)
    this.cerrarModal();
  }

  noVolverAMostrar() {
    // Guarda en storage para no volver a mostrar el modal en próximas visitas
    localStorage.setItem(this.STORAGE_KEY_HIDE, 'true');
    this.cerrarModal();
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.exitoMensaje = false;
  }
}
