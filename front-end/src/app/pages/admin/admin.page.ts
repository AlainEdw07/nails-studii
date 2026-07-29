import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AdminService, CitaAdmin, HorarioDisponible, ResenaAdmin, ServicioAdmin, ServicioCreatePayload } from 'src/app/services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  selectedSection: 'resenas' | 'servicios' | 'citas' | 'horarios' = 'resenas';
  servicios: ServicioAdmin[] = [];
  resenas: ResenaAdmin[] = [];
  citas: CitaAdmin[] = [];
  horarios: HorarioDisponible[] = [];
  loadingSection = false;
  message = '';
  errorMessage = '';

  nuevoServicio: ServicioCreatePayload = {
    nombre: '',
    descripcion: '',
    precio: 0,
    duracion_estimada: 60,
    imagen_principal: '',
    estado: 'activo',
  };

  nuevoHorario = {
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

  setSection(section: 'resenas' | 'servicios' | 'citas' | 'horarios') {
    this.selectedSection = section;
    this.message = '';
    this.errorMessage = '';
    this.loadSection(section);
  }

  refreshAllData() {
    this.loadResenas();
    this.loadServicios();
    this.loadCitas();
    this.loadHorarios();
  }

  loadSection(section: 'resenas' | 'servicios' | 'citas' | 'horarios') {
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
    this.loadingSection = true;
    this.adminService.obtenerResenasAdmin().subscribe({
      next: ({ resenas }) => {
        this.resenas = resenas;
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las reseñas.';
        this.loadingSection = false;
      },
    });
  }

  private loadServicios() {
    this.loadingSection = true;
    this.adminService.obtenerServiciosAdmin().subscribe({
      next: ({ servicios }) => {
        this.servicios = servicios;
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los servicios.';
        this.loadingSection = false;
      },
    });
  }

  private loadCitas() {
    this.loadingSection = true;
    this.adminService.obtenerCitas().subscribe({
      next: ({ citas }) => {
        this.citas = citas;
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las citas.';
        this.loadingSection = false;
      },
    });
  }

  private loadHorarios() {
    this.loadingSection = true;
    this.adminService.obtenerHorarios().subscribe({
      next: ({ horarios_disponibles }) => {
        this.horarios = horarios_disponibles;
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los horarios.';
        this.loadingSection = false;
      },
    });
  }

  crearServicio() {
    this.message = '';
    this.errorMessage = '';
    if (!this.nuevoServicio.nombre || this.nuevoServicio.precio === null || this.nuevoServicio.duracion_estimada === null) {
      this.errorMessage = 'Completa el nombre, el precio y la duración del servicio.';
      return;
    }

    const payload = {
      ...this.nuevoServicio,
      precio: Number(this.nuevoServicio.precio),
      duracion_estimada: Number(this.nuevoServicio.duracion_estimada),
    };

    this.loadingSection = true;
    this.adminService.crearServicio(payload).subscribe({
      next: () => {
        this.message = 'Servicio creado correctamente.';
        this.resetNuevoServicio();
        this.loadServicios();
      },
      error: (error) => {
        this.errorMessage = error?.error?.mensaje || 'No se pudo crear el servicio.';
        this.loadingSection = false;
      },
    });
  }

  cambiarEstadoServicio(servicio: ServicioAdmin) {
    const nuevoEstado = servicio.estado === 'activo' ? 'inactivo' : 'activo';
    this.loadingSection = true;
    this.adminService.actualizarServicio(servicio.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        servicio.estado = nuevoEstado;
        this.message = `Servicio ${servicio.nombre} actualizado a ${nuevoEstado}.`;
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar el estado del servicio.';
        this.loadingSection = false;
      },
    });
  }

  eliminarServicio(servicio: ServicioAdmin) {
    if (!confirm(`¿Eliminar servicio ${servicio.nombre}?`)) {
      return;
    }
    this.loadingSection = true;
    this.adminService.eliminarServicio(servicio.id).subscribe({
      next: () => {
        this.message = 'Servicio eliminado correctamente.';
        this.servicios = this.servicios.filter((item) => item.id !== servicio.id);
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el servicio.';
        this.loadingSection = false;
      },
    });
  }

  aprobarResena(resena: ResenaAdmin) {
    this.loadingSection = true;
    this.adminService.actualizarResena(resena.id, { estado_aprobacion: 'aprobado' }).subscribe({
      next: () => {
        resena.estado_aprobacion = 'aprobado';
        this.message = 'Reseña aprobada correctamente.';
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo aprobar la reseña.';
        this.loadingSection = false;
      },
    });
  }

  rechazarResena(resena: ResenaAdmin) {
    this.loadingSection = true;
    this.adminService.actualizarResena(resena.id, { estado_aprobacion: 'rechazado' }).subscribe({
      next: () => {
        resena.estado_aprobacion = 'rechazado';
        this.message = 'Reseña rechazada correctamente.';
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo rechazar la reseña.';
        this.loadingSection = false;
      },
    });
  }

  eliminarResena(resena: ResenaAdmin) {
    if (!confirm(`¿Eliminar reseña de ${resena.nombre_cliente}?`)) {
      return;
    }
    this.loadingSection = true;
    this.adminService.eliminarResena(resena.id).subscribe({
      next: () => {
        this.message = 'Reseña eliminada correctamente.';
        this.resenas = this.resenas.filter((item) => item.id !== resena.id);
        this.loadingSection = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar la reseña.';
        this.loadingSection = false;
      },
    });
  }

  crearHorario() {
    this.message = '';
    this.errorMessage = '';
    if (!this.nuevoHorario.dia_semana || !this.nuevoHorario.hora_inicio || !this.nuevoHorario.hora_fin) {
      this.errorMessage = 'Completa todos los campos del horario.';
      return;
    }
    if (this.nuevoHorario.hora_fin <= this.nuevoHorario.hora_inicio) {
      this.errorMessage = 'La hora de fin debe ser posterior a la de inicio.';
      return;
    }

    this.loadingSection = true;
    this.adminService.crearHorario(this.nuevoHorario).subscribe({
      next: () => {
        this.message = 'Horario agregado correctamente.';
        this.resetNuevoHorario();
        this.loadHorarios();
      },
      error: (error) => {
        this.errorMessage = error?.error?.mensaje || 'No se pudo crear el horario.';
        this.loadingSection = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resetNuevoServicio() {
    this.nuevoServicio = {
      nombre: '',
      descripcion: '',
      precio: 0,
      duracion_estimada: 60,
      imagen_principal: '',
      estado: 'activo',
    };
  }

  private resetNuevoHorario() {
    this.nuevoHorario = {
      dia_semana: 'Lunes',
      hora_inicio: '09:00',
      hora_fin: '10:00',
      activo: true,
    };
  }
}
