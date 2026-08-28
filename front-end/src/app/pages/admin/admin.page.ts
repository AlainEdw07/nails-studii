import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import {
  AdminService,
  CitaAdmin,
  HorarioDisponible,
  PromocionAdmin,
  PromocionCreatePayload,
  ServicioAdmin,
  ServicioCreatePayload,
} from 'src/app/services/admin.service';

type SectionKey = 'promociones' | 'servicios' | 'citas' | 'horarios';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  selectedSection: SectionKey = 'promociones';
  servicios: ServicioAdmin[] = [];
  promociones: PromocionAdmin[] = [];
  citas: CitaAdmin[] = [];
  horarios: HorarioDisponible[] = [];

  loadingSection = false;
  message = '';
  errorMessage = '';

  serviceSearch = '';
  promoSearch = '';
  citaSearch = '';
  horarioSearch = '';

  serviceFilter: 'all' | 'activo' | 'inactivo' = 'all';
  promoFilter: 'all' | 'activo' | 'inactivo' | 'agotado' = 'all';
  horarioFilter: 'all' | 'activo' | 'inactivo' = 'all';

  pageSize = 6;
  currentPage = 1;

  showModal = false;
  modalType: 'servicio' | 'horario' | 'promocion' | 'whatsapp' | null = null;
  modalMode: 'create' | 'edit' = 'create';
  activeService: ServicioAdmin | null = null;
  activeHorario: HorarioDisponible | null = null;
  activePromocion: PromocionAdmin | null = null;
  whatsappPromocion: PromocionAdmin | null = null;

  whatsappFrecuencia: 'sin_envio' | 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual' = 'unica';
  whatsappMensajePersonalizado = '';

  formService: ServicioCreatePayload = {
    nombre: '',
    descripcion: '',
    precio: 0,
    duracion_estimada: 60,
    imagen_principal: '',
    estado: 'activo',
  };

  formHorario = {
    dia_semana: 'Lunes',
    hora_inicio: '09:00',
    hora_fin: '10:00',
    activo: true,
  };

  formPromocion: PromocionCreatePayload = {
    nombre: '',
    descripcion: '',
    tipo_descuento: 'porcentaje',
    valor_descuento: 10,
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_fin: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    condiciones: '',
    codigo_promocional: '',
    usos_maximos: null,
    aplica_todos_servicios: true,
    frecuencia_whatsapp: 'unica',
    estado: 'activo',
    servicio_ids: [],
  };

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.refreshAllData();
  }

  setSection(section: SectionKey) {
    this.selectedSection = section;
    this.message = '';
    this.errorMessage = '';
    this.pageReset();
    this.loadSection(section);
  }

  refreshAllData() {
    this.loadPromociones();
    this.loadServicios();
    this.loadCitas();
    this.loadHorarios();
  }

  loadSection(section: SectionKey) {
    if (section === 'promociones') {
      this.loadPromociones();
    } else if (section === 'servicios') {
      this.loadServicios();
    } else if (section === 'citas') {
      this.loadCitas();
    } else {
      this.loadHorarios();
    }
  }

  private loadPromociones() {
    this.startLoading();
    this.adminService.obtenerPromociones().subscribe({
      next: ({ promociones }) => {
        this.promociones = promociones;
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las promociones.';
        this.stopLoading();
      },
    });
  }

  private loadServicios() {
    this.startLoading();
    this.adminService.obtenerServiciosAdmin().subscribe({
      next: ({ servicios }) => {
        this.servicios = servicios;
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los servicios.';
        this.stopLoading();
      },
    });
  }

  private loadCitas() {
    this.startLoading();
    this.adminService.obtenerCitas().subscribe({
      next: ({ citas }) => {
        this.citas = citas;
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las citas.';
        this.stopLoading();
      },
    });
  }

  private loadHorarios() {
    this.startLoading();
    this.adminService.obtenerHorarios().subscribe({
      next: ({ horarios_disponibles }) => {
        this.horarios = horarios_disponibles;
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los horarios.';
        this.stopLoading();
      },
    });
  }

  private startLoading() {
    this.loadingSection = true;
    this.message = '';
    this.errorMessage = '';
  }

  private stopLoading() {
    this.loadingSection = false;
  }

  openPromocionModal(mode: 'create' | 'edit', promo?: PromocionAdmin) {
    this.message = '';
    this.errorMessage = '';
    this.modalType = 'promocion';
    this.modalMode = mode;
    this.showModal = true;

    if (mode === 'edit' && promo) {
      this.activePromocion = promo;
      this.formPromocion = {
        nombre: promo.nombre,
        descripcion: promo.descripcion ?? '',
        tipo_descuento: promo.tipo_descuento,
        valor_descuento: promo.valor_descuento ? Number(promo.valor_descuento) : null,
        fecha_inicio: promo.fecha_inicio.slice(0, 10),
        fecha_fin: promo.fecha_fin.slice(0, 10),
        condiciones: promo.condiciones ?? '',
        codigo_promocional: promo.codigo_promocional ?? '',
        usos_maximos: promo.usos_maximos ?? null,
        aplica_todos_servicios: promo.aplica_todos_servicios,
        frecuencia_whatsapp: promo.frecuencia_whatsapp ?? 'unica',
        estado: promo.estado,
        servicio_ids: promo.servicios ? promo.servicios.map((s) => s.id) : [],
      };
    } else {
      this.activePromocion = null;
      this.resetPromocionForm();
    }
  }

  openWhatsAppModal(promo: PromocionAdmin) {
    this.message = '';
    this.errorMessage = '';
    this.modalType = 'whatsapp';
    this.whatsappPromocion = promo;
    this.whatsappFrecuencia = promo.frecuencia_whatsapp ?? 'unica';
    this.whatsappMensajePersonalizado = '';
    this.showModal = true;
  }

  openServiceModal(mode: 'create' | 'edit', servicio?: ServicioAdmin) {
    this.message = '';
    this.errorMessage = '';
    this.modalType = 'servicio';
    this.modalMode = mode;
    this.showModal = true;

    if (mode === 'edit' && servicio) {
      this.activeService = servicio;
      this.formService = {
        nombre: servicio.nombre,
        descripcion: servicio.descripcion ?? '',
        precio: Number(servicio.precio) || 0,
        duracion_estimada: Number(servicio.duracion_estimada) || 0,
        imagen_principal: servicio.imagen_principal ?? '',
        estado: servicio.estado,
      };
    } else {
      this.activeService = null;
      this.resetServiceForm();
    }
  }

  openHorarioModal(horario: HorarioDisponible) {
    this.message = '';
    this.errorMessage = '';
    this.modalType = 'horario';
    this.modalMode = 'edit';
    this.activeHorario = horario;
    this.showModal = true;
    this.formHorario = {
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio.slice(0, 5),
      hora_fin: horario.hora_fin.slice(0, 5),
      activo: horario.activo,
    };
  }

  closeModal() {
    this.showModal = false;
    this.modalType = null;
    this.modalMode = 'create';
    this.activeService = null;
    this.activeHorario = null;
    this.activePromocion = null;
    this.whatsappPromocion = null;
    this.resetServiceForm();
    this.resetHorarioForm();
    this.resetPromocionForm();
  }

  savePromocion() {
    this.message = '';
    this.errorMessage = '';

    if (!this.formPromocion.nombre || !this.formPromocion.fecha_inicio || !this.formPromocion.fecha_fin) {
      this.errorMessage = 'Completa el nombre y las fechas de inicio y fin de la promoción.';
      return;
    }

    if (this.formPromocion.fecha_fin < this.formPromocion.fecha_inicio) {
      this.errorMessage = 'La fecha de fin debe ser posterior a la fecha de inicio.';
      return;
    }

    const payload: PromocionCreatePayload = {
      ...this.formPromocion,
      valor_descuento: this.formPromocion.valor_descuento ? Number(this.formPromocion.valor_descuento) : null,
      usos_maximos: this.formPromocion.usos_maximos ? Number(this.formPromocion.usos_maximos) : null,
    };

    this.startLoading();

    if (this.modalMode === 'edit' && this.activePromocion) {
      this.adminService.actualizarPromocion(this.activePromocion.id, payload).subscribe({
        next: () => {
          this.message = 'Promoción actualizada correctamente.';
          this.closeModal();
          this.loadPromociones();
        },
        error: (error) => {
          this.errorMessage = error?.error?.mensaje || 'No se pudo actualizar la promoción.';
          this.stopLoading();
        },
      });
      return;
    }

    this.adminService.crearPromocion(payload).subscribe({
      next: () => {
        this.message = 'Promoción creada correctamente.';
        this.closeModal();
        this.loadPromociones();
      },
      error: (error) => {
        this.errorMessage = error?.error?.mensaje || 'No se pudo crear la promoción.';
        this.stopLoading();
      },
    });
  }

  enviarWhatsAppPromocion() {
    if (!this.whatsappPromocion) {
      return;
    }

    this.startLoading();
    this.adminService
      .enviarPromocionWhatsApp(this.whatsappPromocion.id, {
        frecuencia_whatsapp: this.whatsappFrecuencia,
        mensaje_personalizado: this.whatsappMensajePersonalizado,
      })
      .subscribe({
        next: (resp) => {
          this.message = resp.mensaje || 'Envío por WhatsApp procesado exitosamente.';
          this.closeModal();
          this.loadPromociones();
        },
        error: (error) => {
          this.errorMessage = error?.error?.mensaje || 'Error al enviar promoción por WhatsApp.';
          this.stopLoading();
        },
      });
  }

  eliminarPromocion(promo: PromocionAdmin) {
    if (!confirm(`¿Eliminar la promoción "${promo.nombre}"?`)) {
      return;
    }
    this.startLoading();
    this.adminService.eliminarPromocion(promo.id).subscribe({
      next: () => {
        this.message = 'Promoción eliminada correctamente.';
        this.promociones = this.promociones.filter((item) => item.id !== promo.id);
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar la promoción.';
        this.stopLoading();
      },
    });
  }

  saveService() {
    this.message = '';
    this.errorMessage = '';

    if (!this.formService.nombre || this.formService.precio === null || this.formService.duracion_estimada === null) {
      this.errorMessage = 'Completa el nombre, precio y duración del servicio.';
      return;
    }

    const payload = {
      ...this.formService,
      precio: Number(this.formService.precio),
      duracion_estimada: Number(this.formService.duracion_estimada),
    };

    this.startLoading();

    if (this.modalMode === 'edit' && this.activeService) {
      this.adminService.actualizarServicio(this.activeService.id, payload).subscribe({
        next: () => {
          this.message = 'Servicio actualizado correctamente.';
          this.closeModal();
          this.loadServicios();
        },
        error: (error) => {
          this.errorMessage = error?.error?.mensaje || 'No se pudo actualizar el servicio.';
          this.stopLoading();
        },
      });
      return;
    }

    this.adminService.crearServicio(payload).subscribe({
      next: () => {
        this.message = 'Servicio creado correctamente.';
        this.closeModal();
        this.loadServicios();
      },
      error: (error) => {
        this.errorMessage = error?.error?.mensaje || 'No se pudo crear el servicio.';
        this.stopLoading();
      },
    });
  }

  saveHorario() {
    this.message = '';
    this.errorMessage = '';

    if (!this.formHorario.dia_semana || !this.formHorario.hora_inicio || !this.formHorario.hora_fin) {
      this.errorMessage = 'Completa todos los campos del horario.';
      return;
    }

    if (this.formHorario.hora_fin <= this.formHorario.hora_inicio) {
      this.errorMessage = 'La hora de fin debe ser posterior a la de inicio.';
      return;
    }

    if (!this.activeHorario) {
      this.errorMessage = 'Selecciona un horario para editar.';
      return;
    }

    this.startLoading();
    this.adminService
      .actualizarHorario(this.activeHorario.id, {
        hora_inicio: this.formHorario.hora_inicio,
        hora_fin: this.formHorario.hora_fin,
        activo: this.formHorario.activo,
      })
      .subscribe({
        next: () => {
          this.message = 'Horario actualizado correctamente.';
          this.closeModal();
          this.loadHorarios();
        },
        error: (error) => {
          this.errorMessage = error?.error?.mensaje || 'No se pudo actualizar el horario.';
          this.stopLoading();
        },
      });
  }

  cambiarEstadoServicio(servicio: ServicioAdmin) {
    const nuevoEstado = servicio.estado === 'activo' ? 'inactivo' : 'activo';
    this.startLoading();
    this.adminService.actualizarServicio(servicio.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        servicio.estado = nuevoEstado;
        this.message = `Servicio ${servicio.nombre} actualizado a ${nuevoEstado}.`;
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar el estado del servicio.';
        this.stopLoading();
      },
    });
  }

  eliminarServicio(servicio: ServicioAdmin) {
    if (!confirm(`¿Eliminar servicio ${servicio.nombre}?`)) {
      return;
    }
    this.startLoading();
    this.adminService.eliminarServicio(servicio.id).subscribe({
      next: () => {
        this.message = 'Servicio eliminado correctamente.';
        this.servicios = this.servicios.filter((item) => item.id !== servicio.id);
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el servicio.';
        this.stopLoading();
      },
    });
  }

  cambiarEstadoCita(cita: CitaAdmin, nuevoEstado: string) {
    this.startLoading();
    this.adminService.actualizarCita(cita.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        cita.estado = nuevoEstado;
        this.message = `Cita de ${cita.nombre_cliente} actualizada a ${nuevoEstado}.`;
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar la cita.';
        this.stopLoading();
      },
    });
  }

  eliminarCita(cita: CitaAdmin) {
    if (!confirm(`¿Eliminar cita de ${cita.nombre_cliente}?`)) {
      return;
    }
    this.startLoading();
    this.adminService.eliminarCita(cita.id).subscribe({
      next: () => {
        this.message = 'Cita eliminada correctamente.';
        this.citas = this.citas.filter((item) => item.id !== cita.id);
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar la cita.';
        this.stopLoading();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  resetServiceForm() {
    this.formService = {
      nombre: '',
      descripcion: '',
      precio: 0,
      duracion_estimada: 60,
      imagen_principal: '',
      estado: 'activo',
    };
  }

  resetHorarioForm() {
    this.formHorario = {
      dia_semana: 'Lunes',
      hora_inicio: '09:00',
      hora_fin: '10:00',
      activo: true,
    };
  }

  resetPromocionForm() {
    this.formPromocion = {
      nombre: '',
      descripcion: '',
      tipo_descuento: 'porcentaje',
      valor_descuento: 10,
      fecha_inicio: new Date().toISOString().slice(0, 10),
      fecha_fin: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      condiciones: '',
      codigo_promocional: '',
      usos_maximos: null,
      aplica_todos_servicios: true,
      frecuencia_whatsapp: 'unica',
      estado: 'activo',
      servicio_ids: [],
    };
  }

  pageReset() {
    this.currentPage = 1;
  }

  changePage(step: number) {
    const next = this.currentPage + step;
    this.currentPage = Math.min(Math.max(next, 1), this.totalPages);
  }

  toggleServiceSelection(servicioId: number) {
    if (!this.formPromocion.servicio_ids) {
      this.formPromocion.servicio_ids = [];
    }
    const index = this.formPromocion.servicio_ids.indexOf(servicioId);
    if (index > -1) {
      this.formPromocion.servicio_ids.splice(index, 1);
    } else {
      this.formPromocion.servicio_ids.push(servicioId);
    }
  }

  isServiceSelected(servicioId: number): boolean {
    return !!this.formPromocion.servicio_ids && this.formPromocion.servicio_ids.includes(servicioId);
  }

  get filteredPromociones() {
    const query = this.promoSearch.trim().toLowerCase();
    return this.promociones.filter((item) => {
      if (this.promoFilter !== 'all' && item.estado !== this.promoFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        item.nombre.toLowerCase().includes(query) ||
        item.codigo_promocional?.toLowerCase().includes(query) ||
        item.descripcion?.toLowerCase().includes(query)
      );
    });
  }

  get filteredServicios() {
    const query = this.serviceSearch.trim().toLowerCase();
    return this.servicios.filter((item) => {
      if (this.serviceFilter !== 'all' && item.estado !== this.serviceFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        item.nombre.toLowerCase().includes(query) ||
        item.descripcion?.toLowerCase().includes(query) ||
        String(item.precio).toLowerCase().includes(query)
      );
    });
  }

  get filteredCitas() {
    const query = this.citaSearch.trim().toLowerCase();
    return this.citas.filter((item) => {
      if (!query) {
        return true;
      }
      return (
        item.nombre_cliente.toLowerCase().includes(query) ||
        item.servicio?.nombre.toLowerCase().includes(query) ||
        item.correo?.toLowerCase().includes(query) ||
        item.telefono?.toLowerCase().includes(query)
      );
    });
  }

  get filteredHorarios() {
    const query = this.horarioSearch.trim().toLowerCase();
    return this.horarios.filter((item) => {
      if (this.horarioFilter !== 'all') {
        const expected = this.horarioFilter === 'activo';
        if (item.activo !== expected) {
          return false;
        }
      }
      if (!query) {
        return true;
      }
      return (
        item.dia_semana.toLowerCase().includes(query) ||
        item.hora_inicio.includes(query) ||
        item.hora_fin.includes(query)
      );
    });
  }

  get pagedPromociones() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPromociones.slice(start, start + this.pageSize);
  }

  get pagedServicios() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredServicios.slice(start, start + this.pageSize);
  }

  get pagedCitas() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCitas.slice(start, start + this.pageSize);
  }

  get pagedHorarios() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredHorarios.slice(start, start + this.pageSize);
  }

  get totalPages() {
    const length =
      this.selectedSection === 'promociones'
        ? this.filteredPromociones.length
        : this.selectedSection === 'servicios'
        ? this.filteredServicios.length
        : this.selectedSection === 'citas'
        ? this.filteredCitas.length
        : this.filteredHorarios.length;
    return Math.max(Math.ceil(length / this.pageSize), 1);
  }

  getPromoBadgeClass(status: string) {
    return {
      'admin-badge-soft': true,
      'badge-approved': status === 'activo',
      'badge-pending': status === 'inactivo',
      'badge-rejected': status === 'agotado',
    };
  }

  getServiceBadgeClass(status: string) {
    return {
      'badge-soft': true,
      'badge-active': status === 'activo',
      'badge-inactive': status === 'inactivo',
    };
  }

  getFrecuenciaLabel(frecuencia?: string): string {
    switch (frecuencia) {
      case 'unica':
        return 'Única vez';
      case 'diaria':
        return 'Diaria';
      case 'semanal':
        return 'Semanal';
      case 'quincenal':
        return 'Quincenal';
      case 'mensual':
        return 'Mensual';
      case 'sin_envio':
      default:
        return 'Sin envío';
    }
  }
}
