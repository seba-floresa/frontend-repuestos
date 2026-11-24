import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { AdminCrudService } from '../../services/admin-crud';

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-clientes.html'
})
export class AdminClientesComponent implements OnInit {
  private crud = inject(AdminCrudService);
  private destroyRef = inject(DestroyRef);
  private busqueda$ = new Subject<void>();

  readonly porPagina = 20;
  clientes: any[] = [];
  total = 0;
  pagina = 1;
  cargando = false;
  error = '';
  q = '';

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.porPagina));
  }

  ngOnInit(): void {
    this.busqueda$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.irAPagina(1));
    this.cargar();
  }

  buscar(): void {
    this.busqueda$.next();
  }

  irAPagina(n: number): void {
    this.pagina = Math.max(1, n);
    this.cargar();
  }

  cargar(): void {
    const filtros: Record<string, string | number> = { page: this.pagina, page_size: this.porPagina };
    if (this.q.trim()) filtros['q'] = this.q.trim();
    this.cargando = true;
    this.crud.listarClientes(filtros).subscribe({
      next: (d: any) => {
        this.clientes = d.results;
        this.total = d.count;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudieron cargar los clientes. Verifica tu sesión de administrador.';
      }
    });
  }
}
