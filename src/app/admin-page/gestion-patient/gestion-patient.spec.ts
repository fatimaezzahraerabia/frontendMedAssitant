import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPatient } from './gestion-patient';

describe('GestionPatient', () => {
  let component: GestionPatient;
  let fixture: ComponentFixture<GestionPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPatient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPatient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
