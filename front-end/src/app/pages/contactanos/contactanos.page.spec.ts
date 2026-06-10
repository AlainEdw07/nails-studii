import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactanosPage } from './contactanos.page';

describe('ContactanosPage', () => {
  let component: ContactanosPage;
  let fixture: ComponentFixture<ContactanosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactanosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
