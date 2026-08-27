import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { PromoModalComponent } from './promo-modal.component';
import { ApiService } from 'src/app/services/api.service';
import { TvPublicidadService } from 'src/app/services/tv-publicidad.service';

describe('PromoModalComponent (C2: promo-modal.component)', () => {
  let component: PromoModalComponent;
  let fixture: ComponentFixture<PromoModalComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let tvService: TvPublicidadService;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    await TestBed.configureTestingModule({
      declarations: [PromoModalComponent],
      imports: [IonicModule.forRoot(), FormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: spy },
        TvPublicidadService,
      ],
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    tvService = TestBed.inject(TvPublicidadService);
    localStorage.clear();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PromoModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show modal after delay if hide promo is not set', fakeAsync(() => {
    component.ngOnInit();
    expect(component.mostrarModal).toBeFalse();
    tick(450);
    expect(component.mostrarModal).toBeTrue();
  }));

  it('should not show modal if STORAGE_KEY_HIDE is set to true', fakeAsync(() => {
    localStorage.setItem(component.STORAGE_KEY_HIDE, 'true');
    component.ngOnInit();
    tick(450);
    expect(component.mostrarModal).toBeFalse();
  }));

  it('should show error when accepting invalid phone number', () => {
    component.telefono = '123';
    component.aceptar();
    expect(component.errorTelefono).toBe('Por favor ingresa un número de teléfono válido.');
    expect(apiServiceSpy.post).not.toHaveBeenCalled();
  });

  it('should call apiService.post on valid phone acceptance and handle success', fakeAsync(() => {
    apiServiceSpy.post.and.returnValue(of({ mensaje: 'Registrado con éxito' }));
    component.telefono = '4921234567';

    component.aceptar();
    expect(component.cargando).toBeFalse();
    expect(apiServiceSpy.post).toHaveBeenCalledWith('/promo/registrar', {
      number: '4921234567',
      whatsapp_consent: true,
    });
    expect(component.exitoMensaje).toBeTrue();
    expect(localStorage.getItem(component.STORAGE_KEY_PHONE)).toBe('4921234567');
    expect(localStorage.getItem(component.STORAGE_KEY_HIDE)).toBe('true');

    tick(1900);
    expect(component.mostrarModal).toBeFalse();
  }));

  it('should display error message if promo registration fails', () => {
    apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { mensaje: 'Error de servidor' } })));
    component.telefono = '4921234567';

    component.aceptar();
    expect(component.cargando).toBeFalse();
    expect(component.errorTelefono).toBe('Error de servidor');
  });

  it('should store hide flag when noVolverAMostrar is called', () => {
    component.mostrarModal = true;
    component.noVolverAMostrar();

    expect(localStorage.getItem(component.STORAGE_KEY_HIDE)).toBe('true');
    expect(component.mostrarModal).toBeFalse();
  });
});
