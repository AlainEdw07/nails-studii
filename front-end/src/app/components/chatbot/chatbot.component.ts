import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatbotService, ChatbotOpcion } from 'src/app/services/chatbot.service';

interface Mensaje {
  texto: string;
  esBot: boolean;
  urlWhatsapp?: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: false
})
export class ChatbotComponent implements OnInit {
  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  isOpen = false;
  mensajes: Mensaje[] = [];
  opcionesActuales: ChatbotOpcion[] = [];
  
  readonly defaultWhatsappUrl = 'https://wa.me/5215555555555?text=Hola,%20quisiera%20consultar%20con%20un%20asesor';

  opcionesIniciales: ChatbotOpcion[] = [
    {
      texto: 'Catálogo de servicios',
      respuesta: 'Aquí puedes consultar los servicios que ofrecemos:',
      opciones: [
        {
          texto: 'Manicure',
          respuesta: 'Ofrecemos manicure clásico, semipermanente y acrigel con materiales de excelente calidad.',
        },
        {
          texto: 'Pedicure',
          respuesta: 'Ofrecemos pedicure básico y pedicure spa con exfoliación e hidratación profunda.',
        },
        {
          texto: 'Acrigel / Diseños',
          respuesta: 'Realizamos uñas en acrigel, esculpidas y diseños personalizados según tu estilo.',
        },
        {
          texto: 'Volver al menú principal',
          respuesta: '¿En qué más te puedo orientar?',
          esVolverInicio: true,
        },
      ],
    },
    {
      texto: 'Precios aproximados',
      respuesta: 'Te mostramos los rangos de precios aproximados de nuestros servicios principales:',
      opciones: [
        {
          texto: 'Precios de Manicure',
          respuesta: 'Manicure clásico: $15.00 | Semipermanente: $25.00 aprox.',
        },
        {
          texto: 'Precios de Pedicure',
          respuesta: 'Pedicure básico: $20.00 | Pedicure Spa: $35.00 aprox.',
        },
        {
          texto: 'Precios de Acrigel y Extensión',
          respuesta: 'Acrigel / Extensión de uñas: $35.00 a $60.00 según el diseño.',
        },
        {
          texto: 'Volver al menú principal',
          respuesta: '¿En qué más te puedo orientar?',
          esVolverInicio: true,
        },
      ],
    },
    {
      texto: 'Horarios disponibles',
      respuesta: 'Nuestros horarios habituales de atención son de Lunes a Sábado de 9:00 AM a 7:00 PM. Domingos cerrado.',
      opciones: [
        {
          texto: 'Volver al menú principal',
          respuesta: '¿En qué más te puedo orientar?',
          esVolverInicio: true,
        },
      ],
    },
    {
      texto: 'Consulta de disponibilidad general',
      respuesta: 'Contamos con disponibilidad general a lo largo del día. Si requieres confirmar un horario exacto, te sugerimos contactarnos vía WhatsApp.',
      opciones: [
        {
          texto: 'Derivar atención a WhatsApp',
          respuesta: 'Haz clic en el botón a continuación para abrir WhatsApp y contactar a un asesor.',
          urlWhatsapp: this.defaultWhatsappUrl,
        },
        {
          texto: 'Volver al menú principal',
          respuesta: '¿En qué más te puedo orientar?',
          esVolverInicio: true,
        },
      ],
    },
    {
      texto: 'Derivar atención a WhatsApp',
      respuesta: 'Si tu consulta no fue resuelta o deseas atención directa con una especialista, contáctanos por WhatsApp.',
      urlWhatsapp: this.defaultWhatsappUrl,
      opciones: [
        {
          texto: 'Volver al menú principal',
          respuesta: '¿En qué más te puedo orientar?',
          esVolverInicio: true,
        },
      ],
    },
  ];

  saludoInicial = '¡Hola! ¿En qué puedo ayudarte hoy? Selecciona una opción del menú:';

  constructor(private chatbotService: ChatbotService) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  private scrollAlFondo() {
    setTimeout(() => {
      const el = this.mensajesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  ngOnInit() {
    this.mensajes = [{ texto: this.saludoInicial, esBot: true }];
    this.opcionesActuales = this.opcionesIniciales;
    this.cargarConfiguracionChatbot();
    this.scrollAlFondo();
  }

  seleccionarOpcion(opcion: ChatbotOpcion) {
    this.mensajes.push({ texto: opcion.texto, esBot: false });
    this.mensajes.push({
      texto: opcion.respuesta,
      esBot: true,
      urlWhatsapp: opcion.urlWhatsapp,
    });

    if (opcion.esVolverInicio) {
      this.opcionesActuales = this.opcionesIniciales;
    } else {
      this.opcionesActuales = opcion.opciones && opcion.opciones.length > 0
        ? opcion.opciones
        : this.opcionesIniciales;
    }

    if (opcion.urlWhatsapp) {
      this.abrirWhatsapp(opcion.urlWhatsapp);
    }

    this.scrollAlFondo();
  }

  abrirWhatsapp(url?: string) {
    const destino = url || this.defaultWhatsappUrl;
    window.open(destino, '_blank');
  }

  private cargarConfiguracionChatbot() {
    this.chatbotService.obtenerConfiguracion().subscribe({
      next: (configuracion) => {
        if (configuracion.saludo) {
          this.saludoInicial = configuracion.saludo;
        }
        if (configuracion.opciones && configuracion.opciones.length > 0) {
          this.opcionesIniciales = configuracion.opciones;
          this.opcionesActuales = configuracion.opciones;
        }
        this.mensajes = [{ texto: this.saludoInicial, esBot: true }];
        this.scrollAlFondo();
      },
      error: () => {
        // Se mantiene el flujo local como respaldo para no dejar el chatbot sin respuesta.
      },
    });
  }
}
