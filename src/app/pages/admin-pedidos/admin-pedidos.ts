import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { AdminCrudService } from '../../services/admin-crud';
import { ESTADOS_PEDIDO, claseEstado } from '../admin-layout/estados';

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-pedidos.html'
})
export class AdminPedidosComponent implements OnInit {
  private crud = inject(AdminCrudService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private busqueda$ = new Subject<void>();

  readonly estados = ESTADOS_PEDIDO;
  readonly claseEstado = claseEstado;
  readonly porPagina = 20;

  pedidos: any[] = [];
  total = 0;
  pagina = 1;
  cargando = false;
  error = '';

  q = '';
  estado = '';
  desde = '';
  hasta = '';

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.porPagina));
  }

  ngOnInit(): void {
    // Desde el Resumen se llega con ?estado=REVISAR_STOCK
    this.estado = this.route.snapshot.queryParamMap.get('estado') || '';
    this.busqueda$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.irAPagina(1));
    this.cargar();
  }

  buscar(): void {
    this.busqueda$.next();
  }

  limpiar(): void {
    this.q = this.estado = this.desde = this.hasta = '';
    this.irAPagina(1);
  }

  irAPagina(n: number): void {
    this.pagina = Math.max(1, n);
    this.cargar();
  }

  cargar(): void {
    const filtros: Record<string, string | number> = { page: this.pagina, page_size: this.porPagina };
    if (this.q.trim()) filtros['q'] = this.q.trim();
    if (this.estado) filtros['estado'] = this.estado;
    if (this.desde) filtros['desde'] = this.desde;
    if (this.hasta) filtros['hasta'] = this.hasta;

    this.cargando = true;
    this.error = '';
    this.crud.listarPedidos(filtros).subscribe({
      next: (d: any) => {
        this.pedidos = d.results;
        this.total = d.count;
        this.cargando = false;
      },
      error: (err: any) => {
        this.cargando = false;
        const e = err?.error;
        this.error = e?.desde || e?.hasta || 'No se pudieron cargar los pedidos. Verifica tu sesión de administrador.';
      }
    });
  }
}
