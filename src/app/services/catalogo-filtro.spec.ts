import { TestBed } from '@angular/core/testing';

import { CatalogoFiltro } from './catalogo-filtro';

describe('CatalogoFiltro', () => {
  let service: CatalogoFiltro;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogoFiltro);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
