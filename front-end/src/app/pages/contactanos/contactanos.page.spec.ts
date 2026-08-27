import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { ContactanosPage } from './contactanos.page';

describe('ContactanosPage', () => {
  let component: ContactanosPage;
  let fixture: ComponentFixture<ContactanosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContactanosPage],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactanosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
