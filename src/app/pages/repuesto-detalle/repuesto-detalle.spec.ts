import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepuestoDetalle } from './repuesto-detalle';

describe('RepuestoDetalle', () => {
  let component: RepuestoDetalle;
  let fixture: ComponentFixture<RepuestoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepuestoDetalle],
    }).compileComponents();

    fixture = TestBed.createComponent(RepuestoDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
