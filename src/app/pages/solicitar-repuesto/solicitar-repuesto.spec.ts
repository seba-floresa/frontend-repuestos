import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarRepuesto } from './solicitar-repuesto';

describe('SolicitarRepuesto', () => {
  let component: SolicitarRepuesto;
  let fixture: ComponentFixture<SolicitarRepuesto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarRepuesto],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitarRepuesto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
