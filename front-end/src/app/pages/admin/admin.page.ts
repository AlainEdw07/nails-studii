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
  ResenaAdmin,
  ServicioAdmin,
  ServicioCreatePayload,
} from 'src/app/services/admin.service';

type SectionKey = 'resenas' | 'servicios' | 'citas' | 'horarios';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  selectedSection: SectionKey = 'resenas';
  servicios: ServicioAdmin[] = [];
  resenas: ResenaAdmin[] = [];
  citas: CitaAdmin[] = [];
  horarios: HorarioDisponible[] = [];

  loadingSection = false;
  message = '';
  errorMessage = '';

  serviceSearch = '';
  reviewSearch = '';
  citaSearch = '';
  horarioSearch = '';

  serviceFilter: 'all' | 'activo' | 'inactivo' = 'all';
  reviewFilter: 'all' | 'pendiente' | 'aprobado' | 'rechazado' = 'all';
  horarioFilter: 'all' | 'activo' | 'inactivo' = 'all';

  pageSize = 6;
  currentPage = 1;

  showModal = false;
  modalType: 'servicio' | 'horario' | null = null;
  modalMode: 'create' | 'edit' = 'create';
  activeService: ServicioAdmin | null = null;
  activeHorario: HorarioDisponible | null = null;

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
    this.loadResenas();
    this.loadServicios();
    this.loadCitas();
    this.loadHorarios();
  }

  loadSection(section: SectionKey) {
    if (section === 'resenas') {
      this.loadResenas();
    } else if (section === 'servicios') {
      this.loadServicios();
    } else if (section === 'citas') {
      this.loadCitas();
    } else {
      this.loadHorarios();
    }
  }

  private loadResenas() {
    this.startLoading();
    this.adminService.obtenerResenasAdmin().subscribe({
      next: ({ resenas }) => {
        this.resenas = resenas;
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las reseñas.';
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
    if (this.hasPendingModalChanges()) {
      return;
    }
    this.showModal = false;
    this.modalType = null;
    this.modalMode = 'create';
    this.activeService = null;
    this.activeHorario = null;
    this.resetServiceForm();
    this.resetHorarioForm();
  }

  private hasPendingModalChanges(): boolean {
    if (!this.showModal || !this.modalType) {
      return false;
    }

    if (this.modalType === 'servicio') {
      if (this.modalMode === 'create') {
        return (
          this.formService.nombre !== '' ||
          this.formService.descripcion !== '' ||
          Number(this.formService.precio) !== 0 ||
          Number(this.formService.duracion_estimada) !== 60 ||
          (this.formService.imagen_principal ?? '') !== '' ||
          this.formService.estado !== 'activo'
        );
      }
      if (!this.activeService) {
        return false;
      }
      return (
        this.formService.nombre !== this.activeService.nombre ||
        (this.formService.descripcion ?? '') !== (this.activeService.descripcion ?? '') ||
        Number(this.formService.precio) !== Number(this.activeService.precio) ||
        Number(this.formService.duracion_estimada) !== Number(this.activeService.duracion_estimada) ||
        (this.formService.imagen_principal ?? '') !== (this.activeService.imagen_principal ?? '') ||
        this.formService.estado !== this.activeService.estado
      );
    }

    if (this.modalType === 'horario') {
      if (!this.activeHorario) {
        return (
          this.formHorario.dia_semana !== 'Lunes' ||
          this.formHorario.hora_inicio !== '09:00' ||
          this.formHorario.hora_fin !== '10:00' ||
          this.formHorario.activo !== true
        );
      }

      return (
        this.formHorario.dia_semana !== this.activeHorario.dia_semana ||
        this.formHorario.hora_inicio !== this.activeHorario.hora_inicio.slice(0, 5) ||
        this.formHorario.hora_fin !== this.activeHorario.hora_fin.slice(0, 5) ||
        this.formHorario.activo !== this.activeHorario.activo
      );
    }

    return false;
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
    this.adminService.actualizarHorario(this.activeHorario.id, {
      hora_inicio: this.formHorario.hora_inicio,
      hora_fin: this.formHorario.hora_fin,
      activo: this.formHorario.activo,
    }).subscribe({
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

  aprobarResena(resena: ResenaAdmin) {
    this.startLoading();
    this.adminService.actualizarResena(resena.id, { estado_aprobacion: 'aprobado' }).subscribe({
      next: () => {
        resena.estado_aprobacion = 'aprobado';
        this.message = 'Reseña aprobada correctamente.';
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo aprobar la reseña.';
        this.stopLoading();
      },
    });
  }

  rechazarResena(resena: ResenaAdmin) {
    this.startLoading();
    this.adminService.actualizarResena(resena.id, { estado_aprobacion: 'rechazado' }).subscribe({
      next: () => {
        resena.estado_aprobacion = 'rechazado';
        this.message = 'Reseña rechazada correctamente.';
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo rechazar la reseña.';
        this.stopLoading();
      },
    });
  }

  eliminarResena(resena: ResenaAdmin) {
    if (!confirm(`¿Eliminar reseña de ${resena.nombre_cliente}?`)) {
      return;
    }
    this.startLoading();
    this.adminService.eliminarResena(resena.id).subscribe({
      next: () => {
        this.message = 'Reseña eliminada correctamente.';
        this.resenas = this.resenas.filter((item) => item.id !== resena.id);
        this.stopLoading();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar la reseña.';
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

  pageReset() {
    this.currentPage = 1;
  }

  changePage(step: number) {
    const next = this.currentPage + step;
    this.currentPage = Math.min(Math.max(next, 1), this.totalPages);
  }

  get filteredResenas() {
    const query = this.reviewSearch.trim().toLowerCase();
    return this.resenas
      .filter((item) => {
        if (this.reviewFilter !== 'all' && item.estado_aprobacion !== this.reviewFilter) {
          return false;
        }
        if (!query) {
          return true;
        }
        return (
          item.nombre_cliente.toLowerCase().includes(query) ||
          item.comentario?.toLowerCase().includes(query) ||
          item.estado_aprobacion.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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

  get pagedResenas() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredResenas.slice(start, start + this.pageSize);
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
      this.selectedSection === 'resenas'
        ? this.filteredResenas.length
        : this.selectedSection === 'servicios'
        ? this.filteredServicios.length
        : this.selectedSection === 'citas'
        ? this.filteredCitas.length
        : this.filteredHorarios.length;
    return Math.max(Math.ceil(length / this.pageSize), 1);
  }

  getBadgeClass(status: string) {
    return {
      'admin-badge-soft': true,
      'badge-approved': status === 'aprobado',
      'badge-pending': status === 'pendiente',
      'badge-rejected': status === 'rechazado',
    };
  }

  getServiceBadgeClass(status: string) {
    return {
      'badge-soft': true,
      'badge-active': status === 'activo',
      'badge-inactive': status === 'inactivo',
    };
  }
}
