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

export interface ServicioCreatePayload {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  duracion_estimada: number;
  imagen_principal?: string | null;
  estado?: 'activo' | 'inactivo';
}

export interface PromocionAdmin {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo' | '2x1' | 'servicio_gratis';
  valor_descuento: number | string | null;
  fecha_inicio: string;
  fecha_fin: string;
  condiciones: string | null;
  codigo_promocional: string | null;
  usos_maximos: number | null;
  usos_actuales: number;
  estado: 'activo' | 'inactivo' | 'agotado';
  aplica_todos_servicios: boolean;
  frecuencia_whatsapp?: 'sin_envio' | 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual';
  servicios?: Array<{ id: number; nombre: string; precio: number | string | null }>;
}

export interface PromocionCreatePayload {
  nombre: string;
  descripcion?: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo' | '2x1' | 'servicio_gratis';
  valor_descuento?: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  condiciones?: string | null;
  codigo_promocional?: string | null;
  usos_maximos?: number | null;
  aplica_todos_servicios?: boolean;
  frecuencia_whatsapp?: 'sin_envio' | 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual';
  estado?: 'activo' | 'inactivo' | 'agotado';
  servicio_ids?: number[];
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

export interface EnviarWhatsAppResponse {
  mensaje: string;
  frecuencia_programada?: string;
  total_usuarios?: number;
  enviados_exitosamente?: number;
  fallidos?: number;
  numeros_fallidos?: string[];
  promocion?: PromocionAdmin;
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

  obtenerPromociones(): Observable<{ promociones: PromocionAdmin[] }> {
    return this.api.getAuthorized('/admin/promociones');
  }

  crearPromocion(datos: PromocionCreatePayload): Observable<{ mensaje: string; promocion: PromocionAdmin }> {
    return this.api.postAuthorized('/admin/promociones', datos);
  }

  actualizarPromocion(id: number, datos: Partial<PromocionCreatePayload>): Observable<{ mensaje: string; promocion: PromocionAdmin }> {
    return this.api.patchAuthorized(`/admin/promociones/${id}`, datos);
  }

  eliminarPromocion(id: number): Observable<{ mensaje: string }> {
    return this.api.deleteAuthorized(`/admin/promociones/${id}`);
  }

  enviarPromocionWhatsApp(
    id: number,
    datos?: { frecuencia_whatsapp?: string; mensaje_personalizado?: string }
  ): Observable<EnviarWhatsAppResponse> {
    return this.api.postAuthorized(`/admin/promociones/${id}/enviar-whatsapp`, datos || {});
  }

  obtenerCitas(): Observable<{ citas: CitaAdmin[] }> {
    return this.api.getAuthorized('/admin/citas');
  }

  actualizarCita(id: number, datos: Partial<CitaAdmin>): Observable<{ mensaje: string; cita: CitaAdmin }> {
    return this.api.patchAuthorized(`/admin/citas/${id}`, datos);
  }

  eliminarCita(id: number): Observable<{ mensaje: string }> {
    return this.api.deleteAuthorized(`/admin/citas/${id}`);
  }

  obtenerHorarios(): Observable<{ horarios_disponibles: HorarioDisponible[] }> {
    return this.api.get('/horarios/disponibles');
  }

  crearHorario(datos: { dia_semana: string; hora_inicio: string; hora_fin: string; activo?: boolean }) {
    return this.api.postAuthorized('/admin/horarios', datos);
  }

  actualizarHorario(id: number, datos: { hora_inicio: string; hora_fin: string; activo?: boolean }) {
    return this.api.patchAuthorized(`/admin/horarios/${id}`, datos);
  }

  eliminarHorario(id: number): Observable<{ mensaje: string }> {
    return this.api.deleteAuthorized(`/admin/horarios/${id}`);
  }
}
