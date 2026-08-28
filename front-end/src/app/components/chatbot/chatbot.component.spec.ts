import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ChatbotComponent } from './chatbot.component';
import { ChatbotService } from 'src/app/services/chatbot.service';

describe('ChatbotComponent (C3/C7: chatbot.component)', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChatbotComponent],
      imports: [IonicModule.forRoot(), FormsModule],
      providers: [
        {
          provide: ChatbotService,
          useValue: {
            obtenerConfiguracion: () =>
              of({
                saludo: '¡Hola! ¿En qué puedo ayudarte hoy?',
                opciones: [
                  { texto: 'Catálogo de servicios', respuesta: 'Aquí puedes ver el catálogo de servicios.' },
                  { texto: 'Precios aproximados', respuesta: 'Los precios son los siguientes...' },
                  { texto: 'Horarios disponibles', respuesta: 'Atendemos de Lunes a Sábado.' },
                  { texto: 'Consulta de disponibilidad general', respuesta: 'Tenemos disponibilidad.' },
                  { texto: 'Derivar atención a WhatsApp', respuesta: 'Derivando a WhatsApp...', urlWhatsapp: 'https://wa.me/123456789' },
                ],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create chatbot component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle chat window open and closed', () => {
    expect(component.isOpen).toBeFalse();

    component.toggleChat();
    expect(component.isOpen).toBeTrue();

    component.toggleChat();
    expect(component.isOpen).toBeFalse();
  });

  it('should add initial greeting message on init', () => {
    expect(component.mensajes.length).toBeGreaterThan(0);
    expect(component.mensajes[0].texto).toContain('Hola');
  });

  it('should handle selecting an option and update chat messages', () => {
    const opcion = { texto: 'Catálogo de servicios', respuesta: 'Aquí puedes ver el catálogo de servicios.' };
    component.seleccionarOpcion(opcion);

    expect(component.mensajes.length).toBe(3); // saludo + user msg + bot resp
    expect(component.mensajes[1].texto).toBe('Catálogo de servicios');
    expect(component.mensajes[2].texto).toBe('Aquí puedes ver el catálogo de servicios.');
  });

  it('should trigger abrirWhatsapp when selecting an option with urlWhatsapp', () => {
    spyOn(window, 'open');
    const opcion = {
      texto: 'Derivar atención a WhatsApp',
      respuesta: 'Derivando a WhatsApp...',
      urlWhatsapp: 'https://wa.me/123456789',
    };

    component.seleccionarOpcion(opcion);
    expect(window.open).toHaveBeenCalledWith('https://wa.me/123456789', '_blank');
  });

  it('should return to main menu when option has esVolverInicio', () => {
    const opcionVolver = {
      texto: 'Volver al menú principal',
      respuesta: '¿En qué más te puedo orientar?',
      esVolverInicio: true,
    };

    component.seleccionarOpcion(opcionVolver);
    expect(component.opcionesActuales).toEqual(component.opcionesIniciales);
  });
});
