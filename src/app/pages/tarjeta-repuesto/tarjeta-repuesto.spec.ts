import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaRepuesto } from './tarjeta-repuesto';

describe('TarjetaRepuesto', () => {
  let component: TarjetaRepuesto;
  let fixture: ComponentFixture<TarjetaRepuesto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaRepuesto],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaRepuesto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
