import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ServicioAdmin {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number | string | null;
  duracion_estimada: number | string | null;
  imagen_principal: string | null;
  estado: 'activo' | 'inactivo';
}

export interface ResenaAdmin {
  id: number;
  nombre_cliente: string;
  comentario: string | null;
  calificacion: number;
  fecha: string;
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface ServicioCreatePayload {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  duracion_estimada: number;
  imagen_principal?: string | null;
  estado?: 'activo' | 'inactivo';
}

export interface CitaAdmin {
  id: number;
  nombre_cliente: string;
  telefono: string | null;
  correo: string | null;
  servicio: {
    id: number;
    nombre: string;
    precio: number | string | null;
    duracion_estimada: number | string | null;
  } | null;
  fecha_cita: string;
  hora_cita: string;
  notas_adicionales: string | null;
  estado: string | null;
}

export interface HorarioDisponible {
  id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  obtenerServiciosAdmin(): Observable<{ servicios: ServicioAdmin[] }> {
    return this.api.getAuthorized('/admin/servicios');
  }

  crearServicio(datos: ServicioCreatePayload) {
    return this.api.postAuthorized('/admin/servicios', datos);
  }

  actualizarServicio(id: number, datos: Partial<ServicioCreatePayload>) {
    return this.api.patchAuthorized(`/admin/servicios/${id}`, datos);
  }

  eliminarServicio(id: number) {
    return this.api.deleteAuthorized(`/admin/servicios/${id}`);
  }

  obtenerResenasAdmin(): Observable<{ resenas: ResenaAdmin[] }> {
    return this.api.getAuthorized('/admin/resenas');
  }

  actualizarResena(id: number, datos: Partial<Pick<ResenaAdmin, 'estado_aprobacion'>>) {
    return this.api.patchAuthorized(`/admin/resenas/${id}`, datos);
  }

  eliminarResena(id: number) {
    return this.api.deleteAuthorized(`/admin/resenas/${id}`);
  }

  obtenerCitas(): Observable<{ citas: CitaAdmin[] }> {
    return this.api.getAuthorized('/admin/citas');
  }

  obtenerHorarios(): Observable<{ horarios_disponibles: HorarioDisponible[] }> {
    return this.api.get('/horarios/disponibles');
  }

  crearHorario(datos: { dia_semana: string; hora_inicio: string; hora_fin: string; activo?: boolean }) {
    return this.api.postAuthorized('/admin/horarios', datos);
  }
}
