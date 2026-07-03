import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ChatbotOpcion {
  texto: string;
  respuesta: string;
  opciones?: ChatbotOpcion[];
}

export interface ChatbotConfigResponse {
  saludo: string;
  opciones: ChatbotOpcion[];
}

interface PreguntaApi {
  id: number;
  pregunta: string;
  opciones_respuesta: string[] | null;
  accion: string | null;
}

interface ServicioApi {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number | string | null;
  duracion_estimada: string | null;
}

interface HorarioApi {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

interface ChatbotApiResponse {
  preguntas: PreguntaApi[];
  servicios: ServicioApi[];
  horarios_disponibles: HorarioApi[];
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly apiUrl = environment.apiUrl;
  private readonly headers = new HttpHeaders({ Accept: 'application/json' });

  constructor(private http: HttpClient) {}

  obtenerConfiguracion(): Observable<ChatbotConfigResponse> {
    return this.http
      .get<ChatbotApiResponse>(`${this.apiUrl}/chatbot/preguntas`, {
        headers: this.headers,
      })
      .pipe(map((data) => this.transformarConfiguracion(data)));
  }

  private transformarConfiguracion(data: ChatbotApiResponse): ChatbotConfigResponse {
    const preguntasPorAccion = new Map(
      data.preguntas
        .filter((pregunta) => !!pregunta.accion)
        .map((pregunta) => [pregunta.accion as string, pregunta]),
    );

    const menuPrincipal = preguntasPorAccion.get('menu_principal');
    const saludo = menuPrincipal?.pregunta ?? '¡Hola! ¿En que te puedo ayudarte?';
    const opcionesMenu = menuPrincipal?.opciones_respuesta ?? [];

    const opciones = opcionesMenu.map((texto) => {
      const etiqueta = texto.toLowerCase();

      if (etiqueta.includes('servicio')) {
        return {
          texto,
          respuesta:
            preguntasPorAccion.get('listar_servicios')?.pregunta ?? 'Estos son nuestros servicios disponibles.',
          opciones: this.construirOpcionesServicios(data.servicios),
        } as ChatbotOpcion;
      }

      if (etiqueta.includes('horario')) {
        return {
          texto,
          respuesta:
            preguntasPorAccion.get('mostrar_horarios')?.pregunta ??
            'Estos son nuestros horarios disponibles.',
          opciones: this.construirOpcionesHorarios(data.horarios_disponibles),
        } as ChatbotOpcion;
      }

      if (etiqueta.includes('agendar')) {
        return {
          texto,
          respuesta:
            preguntasPorAccion.get('pedir_servicio')?.pregunta ??
            'Perfecto. Cuéntanos qué servicio deseas reservar.',
          opciones: this.construirFlujoAgendamiento(data, preguntasPorAccion),
        } as ChatbotOpcion;
      }

      return {
        texto,
        respuesta:
          'Te conectamos con un asesor. También puedes escribirnos por WhatsApp para una atención más rápida.',
      } as ChatbotOpcion;
    });

    return {
      saludo,
      opciones,
    };
  }

  private construirOpcionesServicios(servicios: ServicioApi[]): ChatbotOpcion[] {
    if (!servicios.length) {
      return [{ texto: 'Sin servicios disponibles', respuesta: 'Ahora mismo no hay servicios cargados.' }];
    }

    return servicios.map((servicio) => {
      const precio =
        servicio.precio !== null && servicio.precio !== undefined
          ? `$${Number(servicio.precio).toFixed(2)}`
          : 'Precio por confirmar';
      const duracion = servicio.duracion_estimada ?? 'Duración por confirmar';
      const descripcion = servicio.descripcion?.trim() || 'Sin descripción adicional.';

      return {
        texto: servicio.nombre,
        respuesta: `${descripcion} Precio: ${precio}. Duración estimada: ${duracion}.`,
      };
    });
  }

  private construirOpcionesHorarios(horarios: HorarioApi[]): ChatbotOpcion[] {
    if (!horarios.length) {
      return [{ texto: 'Sin horarios disponibles', respuesta: 'No tenemos horarios activos en este momento.' }];
    }

    return horarios.map((horario) => ({
      texto: `${horario.dia_semana}: ${horario.hora_inicio} - ${horario.hora_fin}`,
      respuesta: `Tenemos disponibilidad el ${horario.dia_semana} de ${horario.hora_inicio} a ${horario.hora_fin}.`,
    }));
  }

  private construirFlujoAgendamiento(
    data: ChatbotApiResponse,
    preguntasPorAccion: Map<string, PreguntaApi>,
  ): ChatbotOpcion[] {
    const preguntaFecha = preguntasPorAccion.get('pedir_fecha')?.pregunta ?? 'Selecciona la fecha para tu cita.';
    const preguntaHora = preguntasPorAccion.get('pedir_hora')?.pregunta ?? 'Selecciona la hora que te convenga.';
    const confirmacion =
      preguntasPorAccion.get('confirmacion_cita')?.pregunta ??
      'Tu cita quedó registrada. Confirma los datos desde el módulo de reservas.';

    const horariosPorDia = new Map<string, HorarioApi[]>();
    for (const horario of data.horarios_disponibles) {
      const existentes = horariosPorDia.get(horario.dia_semana) ?? [];
      existentes.push(horario);
      horariosPorDia.set(horario.dia_semana, existentes);
    }

    return data.servicios.map((servicio) => ({
      texto: servicio.nombre,
      respuesta: preguntaFecha,
      opciones: Array.from(horariosPorDia.entries()).map(([dia, horarios]) => ({
        texto: dia,
        respuesta: preguntaHora,
        opciones: horarios.map((horario) => ({
          texto: `${horario.hora_inicio} - ${horario.hora_fin}`,
          respuesta: `${confirmacion} Servicio: ${servicio.nombre}. Día: ${dia}. Hora: ${horario.hora_inicio}.`,
        })),
      })),
    }));
  }
}
