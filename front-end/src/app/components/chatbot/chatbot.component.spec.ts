import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';

import { ChatbotComponent } from './chatbot.component';
import { ChatbotService } from 'src/app/services/chatbot.service';

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatbotComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: ChatbotService,
          useValue: {
            obtenerConfiguracion: () =>
              of({
                saludo: 'Hola',
                opciones: [],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
