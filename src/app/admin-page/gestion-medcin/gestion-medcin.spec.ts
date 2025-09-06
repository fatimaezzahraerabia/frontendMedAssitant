import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionMedcin } from './gestion-medcin';

describe('GestionMedcin', () => {
  let component: GestionMedcin;
  let fixture: ComponentFixture<GestionMedcin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionMedcin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionMedcin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
