import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatbotService, ChatbotOpcion } from 'src/app/services/chatbot.service';

interface Mensaje {
  texto: string;
  esBot: boolean;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: false
})

export class ChatbotComponent  implements OnInit {
  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  isOpen = false;
  mensajes: Mensaje[] = [];
  opcionesActuales: ChatbotOpcion[] = [];
  opcionesIniciales: ChatbotOpcion[] = [
    {
      texto: '¿Cuáles son los horarios?',
      respuesta: 'Atendemos de Lunes a Sábado de 9am a 7pm.',
    },
    {
      texto: '¿Qué servicios ofrecen?',
      respuesta: '¿Qué tipo de servicio te interesa?',
      opciones: [
        { texto: 'Manicure', respuesta: 'Ofrecemos manicure clásico, semipermanente y acrigel.' },
        { texto: 'Pedicure', respuesta: 'Ofrecemos pedicure básico y spa.' },
      ],
    },
    {
      texto: '¿Cómo hago una cita?',
      respuesta: 'Puedes agendar tu cita desde la sección "Reservar" en la app.',
    },
  ];
  saludoInicial = '¡Hola! ¿En que te puedo ayudarte?';

  toggleChat(){
    this.isOpen = !this.isOpen;
  }

  constructor(private chatbotService: ChatbotService) { }

  private scrollAlFondo() {
    setTimeout(()=>{
      const el = this.mensajesContainer?.nativeElement;
      if(el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  ngOnInit() {
    this.mensajes = [{texto: this.saludoInicial, esBot: true}];
    this.opcionesActuales = this.opcionesIniciales;
    this.cargarConfiguracionChatbot();
    this.scrollAlFondo();
  }

  seleccionarOpcion(opcion: ChatbotOpcion) {
    this.mensajes.push({ texto:opcion.texto, esBot: false });
    this.mensajes.push({ texto: opcion.respuesta, esBot: true });
    this.opcionesActuales = opcion.opciones ?? this.opcionesIniciales;
    this.scrollAlFondo();
  }

  private cargarConfiguracionChatbot() {
    this.chatbotService.obtenerConfiguracion().subscribe({
      next: (configuracion) => {
        this.saludoInicial = configuracion.saludo;
        this.opcionesIniciales = configuracion.opciones;
        this.opcionesActuales = configuracion.opciones;
        this.mensajes = [{ texto: configuracion.saludo, esBot: true }];
        this.scrollAlFondo();
      },
      error: () => {
        // Se mantiene el flujo local como respaldo para no dejar el chatbot sin respuesta.
      },
    });
  }

}
