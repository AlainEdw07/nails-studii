import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TvPublicidadService } from './tv-publicidad.service';

describe('TvPublicidadService (C11: tv-publicidad.service)', () => {
  let service: TvPublicidadService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    (spy as any).url = '/home';

    TestBed.configureTestingModule({
      providers: [
        TvPublicidadService,
        { provide: Router, useValue: spy },
      ],
    });

    localStorage.clear();
    service = TestBed.inject(TvPublicidadService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and default to isTvMode = false', () => {
    expect(service).toBeTruthy();
    expect(service.isTvMode).toBeFalse();
    expect(service.isPaused).toBeFalse();
  });

  it('should toggle and activate TV mode', () => {
    const estado = service.toggleModoTv();
    expect(estado).toBeTrue();
    expect(service.isTvMode).toBeTrue();
    expect(localStorage.getItem('nails_tv_mode')).toBe('true');

    service.activarModoTv(false);
    expect(service.isTvMode).toBeFalse();
    expect(localStorage.getItem('nails_tv_mode')).toBe('false');
  });

  it('should handle user interaction notification and pause tv mode', fakeAsync(() => {
    service.activarModoTv(true);
    service.notificarInteraccion();

    expect(service.isPaused).toBeTrue();

    tick(16000);
    expect(service.isPaused).toBeFalse();
  }));

  it('should pause and resume manually', () => {
    service.pausarManualmente();
    expect(service.isPaused).toBeTrue();

    service.reanudarManualmente();
    expect(service.isPaused).toBeFalse();
  });
});
