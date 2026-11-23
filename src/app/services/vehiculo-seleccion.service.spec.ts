import { TestBed } from '@angular/core/testing';

import { VehiculoSeleccionService } from './vehiculo-seleccion.service';

describe('VehiculoSeleccionService', () => {
  let service: VehiculoSeleccionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VehiculoSeleccionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
