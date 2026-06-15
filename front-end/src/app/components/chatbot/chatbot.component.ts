import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

interface Mensaje {
  texto: string;
  esBot: boolean;
}

interface Opcion {
  texto: string;
  respuesta: string;
  opciones?: Opcion[];
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
  opcionesActuales: Opcion[] = [];
  opcionesIniciales: Opcion[] = [
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

  toggleChat(){
    this.isOpen = !this.isOpen;
  }

  constructor() { }

  private scrollAlFondo() {
    setTimeout(()=>{
      const el = this.mensajesContainer?.nativeElement;
      if(el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  ngOnInit() {
    this.mensajes = [{texto: '¡Hola! ¿En que te puedo ayudarte?', esBot: true}];
    this.opcionesActuales = this.opcionesIniciales;
    this.scrollAlFondo();
  }

  seleccionarOpcion(opcion: Opcion) {
    this.mensajes.push({ texto:opcion.texto, esBot: false });
    this.mensajes.push({ texto: opcion.respuesta, esBot: true });
    this.opcionesActuales = opcion.opciones ?? this.opcionesIniciales;
    this.scrollAlFondo();
  }

}
