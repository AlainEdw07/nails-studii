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
                saludo: '¡Hola! ¿En qué puedo ayudarte?',
                opciones: [
                  { texto: 'Ver catálogo', respuesta: 'Aquí puedes ver el catálogo.' },
                  { texto: 'Agendar cita', respuesta: 'Puedes agendar cita desde la app.' },
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
    const opcion = { texto: 'Ver catálogo', respuesta: 'Aquí puedes ver el catálogo.' };
    component.seleccionarOpcion(opcion);

    expect(component.mensajes.length).toBe(3); // saludo + user msg + bot resp
    expect(component.mensajes[1].texto).toBe('Ver catálogo');
    expect(component.mensajes[2].texto).toBe('Aquí puedes ver el catálogo.');
  });
});
