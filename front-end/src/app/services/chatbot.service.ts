import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ChatbotOpcion {
  texto: string;
  respuesta: string;
  opciones?: ChatbotOpcion[];
  urlWhatsapp?: string;
  esVolverInicio?: boolean;
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
  private readonly defaultWhatsappUrl = 'https://wa.me/5215555555555?text=Hola,%20necesito%20informaci%C3%B3n';

  constructor(private http: HttpClient) { }

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
    const saludo = menuPrincipal?.pregunta ?? '¡Hola! ¿En qué puedo ayudarte hoy?';
    const opcionesMenu = menuPrincipal?.opciones_respuesta ?? [
      'Catálogo de servicios',
      'Precios aproximados',
      'Horarios disponibles',
      'Consulta de disponibilidad general',
      'Derivar atención a WhatsApp',
    ];

    const opciones = opcionesMenu.map((texto) => {
      const etiqueta = texto.toLowerCase();

      if (etiqueta.includes('servicio') || etiqueta.includes('catálogo') || etiqueta.includes('catalogo')) {
        return {
          texto,
          respuesta:
            preguntasPorAccion.get('listar_servicios')?.pregunta ??
            'Aquí puedes consultar nuestro catálogo de servicios:',
          opciones: this.construirOpcionesServicios(data.servicios),
        } as ChatbotOpcion;
      }

      if (etiqueta.includes('precio')) {
        return {
          texto,
          respuesta:
            preguntasPorAccion.get('mostrar_precios')?.pregunta ??
            'Los precios aproximados de nuestros servicios son los siguientes:',
          opciones: this.construirOpcionesPrecios(data.servicios),
        } as ChatbotOpcion;
      }

      if (etiqueta.includes('horario')) {
        return {
          texto,
          respuesta:
            preguntasPorAccion.get('mostrar_horarios')?.pregunta ??
            'Nuestros horarios habituales de atención son los siguientes:',
          opciones: this.construirOpcionesHorarios(data.horarios_disponibles),
        } as ChatbotOpcion;
      }

      if (etiqueta.includes('disponibilidad')) {
        return {
          texto,
          respuesta:
            preguntasPorAccion.get('consultar_disponibilidad')?.pregunta ??
            'Mantenemos atención general en nuestros horarios establecidos. Si requieres confirmar un horario específico, podemos derivarte a WhatsApp.',
          opciones: [
            {
              texto: 'Derivar atención a WhatsApp',
              respuesta: 'Haz clic abajo para contactar a un asesor por WhatsApp y verificar disponibilidad.',
              urlWhatsapp: this.defaultWhatsappUrl,
            },
            {
              texto: 'Volver al menú principal',
              respuesta: '¿En qué más te puedo orientar?',
              esVolverInicio: true,
            },
          ],
        } as ChatbotOpcion;
      }

      // Default fallback / Derivar atención a WhatsApp
      return {
        texto,
        respuesta:
          preguntasPorAccion.get('derivar_whatsapp')?.pregunta ??
          'Selecciona "Volver al menú principal" para mostras las opciones disponibles nuevamente.',
        urlWhatsapp: this.defaultWhatsappUrl,
        opciones: [
          {
            texto: 'Volver al menú principal',
            respuesta: '¿En qué más te puedo ayudar?',
            esVolverInicio: true,
          },
        ],
      } as ChatbotOpcion;
    });

    return {
      saludo,
      opciones,
    };
  }

  private construirOpcionesServicios(servicios: ServicioApi[]): ChatbotOpcion[] {
    const lista: ChatbotOpcion[] = [];
    if (!servicios.length) {
      lista.push({
        texto: 'Ver servicios generales',
        respuesta: 'Ofrecemos manicure clásico, semipermanente, pedicure spa y acrigel.',
      });
    } else {
      servicios.forEach((servicio) => {
        const precio =
          servicio.precio !== null && servicio.precio !== undefined
            ? `$${Number(servicio.precio).toFixed(2)}`
            : 'Precio por consultar';
        const duracion = servicio.duracion_estimada ?? '30-60 min';
        const descripcion = servicio.descripcion?.trim() || 'Servicio profesional de cuidado de uñas.';

        lista.push({
          texto: servicio.nombre,
          respuesta: `${servicio.nombre}: ${descripcion} Precio: ${precio}. Duración aprox.: ${duracion}.`,
        });
      });
    }

    lista.push({
      texto: 'Volver al menú principal',
      respuesta: '¿En qué más te puedo orientar?',
      esVolverInicio: true,
    });

    return lista;
  }

  private construirOpcionesPrecios(servicios: ServicioApi[]): ChatbotOpcion[] {
    const lista: ChatbotOpcion[] = [];

    if (!servicios.length) {
      lista.push(
        { texto: 'Manicure', respuesta: 'Manicure clásico o semipermanente: $15 - $30 aprox.' },
        { texto: 'Pedicure', respuesta: 'Pedicure básico o spa: $20 - $40 aprox.' },
        { texto: 'Acrigel / Uñas', respuesta: 'Sistemas de Acrigel o Uñas Esculpidas: $35 - $60 aprox.' },
      );
    } else {
      servicios.forEach((servicio) => {
        const precio =
          servicio.precio !== null && servicio.precio !== undefined
            ? `$${Number(servicio.precio).toFixed(2)}`
            : 'Consultar precio exacto';
        lista.push({
          texto: `Precio ${servicio.nombre}`,
          respuesta: `El precio aproximado para ${servicio.nombre} es de ${precio}.`,
        });
      });
    }

    lista.push({
      texto: 'Volver al menú principal',
      respuesta: '¿En qué más te puedo orientar?',
      esVolverInicio: true,
    });

    return lista;
  }

  private construirOpcionesHorarios(horarios: HorarioApi[]): ChatbotOpcion[] {
    const lista: ChatbotOpcion[] = [];

    if (!horarios.length) {
      lista.push({
        texto: 'Horario general',
        respuesta: 'Atendemos de Lunes a Sábado de 9:00 AM a 7:00 PM. Domingos cerrado.',
      });
    } else {
      horarios.forEach((h) => {
        lista.push({
          texto: h.dia_semana,
          respuesta: `Los días ${h.dia_semana} atendemos de ${h.hora_inicio} a ${h.hora_fin}.`,
        });
      });
    }

    lista.push({
      texto: 'Volver al menú principal',
      respuesta: '¿En qué más te puedo orientar?',
      esVolverInicio: true,
    });

    return lista;
  }
}
