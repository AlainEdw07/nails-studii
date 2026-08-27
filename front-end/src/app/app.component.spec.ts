import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AnimationController, IonicModule } from '@ionic/angular';

import { AppComponent } from './app.component';
import { GaleriaModalService } from './services/galeria-modal.service';
import { ReplicateService } from './services/replicate.service';
import { TvPublicidadService } from './services/tv-publicidad.service';

describe('AppComponent (C1: app.component.nav)', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AnimationController,
        GaleriaModalService,
        ReplicateService,
        TvPublicidadService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app and initialize navigation defaults', () => {
    expect(component).toBeTruthy();
    expect(component.isHome).toBeTrue();
    expect(component.showAppShell).toBeTrue();
  });

  it('should toggle probarDiseno state when galeriaModal emits value', () => {
    const galeriaModalService = TestBed.inject(GaleriaModalService);
    galeriaModalService.activarProbar();
    expect(component.probarDiseno).toBeTrue();

    galeriaModalService.desactivarProbar();
    expect(component.probarDiseno).toBeFalse();
  });

  it('should reset foto states when resetFoto is called', () => {
    component.fotoManoPreview = 'data:image/png;base64,123';
    component.resultadoUrl = 'http://example.com/res.png';
    component.generando = true;
    component.errorGenerar = 'Error';

    component.resetFoto();

    expect(component.fotoManoPreview).toBeNull();
    expect(component.resultadoUrl).toBeNull();
    expect(component.generando).toBeFalse();
    expect(component.errorGenerar).toBeNull();
  });
});
