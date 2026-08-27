import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { NosotrasPage } from './nosotras.page';

describe('NosotrasPage', () => {
  let component: NosotrasPage;
  let fixture: ComponentFixture<NosotrasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NosotrasPage],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NosotrasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
