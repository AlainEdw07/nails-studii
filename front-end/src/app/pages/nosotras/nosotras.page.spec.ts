import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NosotrasPage } from './nosotras.page';

describe('NosotrasPage', () => {
  let component: NosotrasPage;
  let fixture: ComponentFixture<NosotrasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NosotrasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
