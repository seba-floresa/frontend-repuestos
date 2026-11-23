import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FiltroCatalogo {
  categoriaId: number | null;
  subcategoriaId: number | null;
  etiqueta: string;
  texto: string; // búsqueda del header
}

@Injectable({ providedIn: 'root' })
export class CatalogoFiltroService {
  private estado = new BehaviorSubject<FiltroCatalogo>({
    categoriaId: null, subcategoriaId: null, etiqueta: '', texto: ''
  });

  readonly filtro$ = this.estado.asObservable();

  get actual(): FiltroCatalogo {
    return this.estado.value;
  }

  seleccionar(categoriaId: number | null, subcategoriaId: number | null = null, etiqueta = ''): void {
    this.estado.next({ categoriaId, subcategoriaId, etiqueta, texto: '' });
  }

  buscarTexto(texto: string): void {
    this.estado.next({ categoriaId: null, subcategoriaId: null, etiqueta: '', texto: texto.trim() });
  }

  limpiar(): void {
    this.seleccionar(null, null, '');
  }
}