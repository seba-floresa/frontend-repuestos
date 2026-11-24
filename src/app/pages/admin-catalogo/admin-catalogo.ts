import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { AdminCrudService } from '../../services/admin-crud';

@Component({
  selector: 'app-admin-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-catalogo.html'
})
export class AdminCatalogoComponent implements OnInit {
  private crud = inject(AdminCrudService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private busqueda$ = new Subject<void>();

  readonly porPagina = 20;
  categorias: any[] = [];
  repuestos: any[] = [];
  total = 0;
  pagina = 1;
  cargando = false;
  mensaje: { tipo: 'ok' | 'error'; texto: string } | null = null;

  // Filtros
  q = '';
  categoria = '';
  condicion = '';
  stockCritico = false;

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.porPagina));
  }

  ngOnInit(): void {
    this.crud.getCategorias().subscribe({ next: (d: any) => (this.categorias = d) });
    // Desde el Resumen se llega con ?stock_critico=1
    this.stockCritico = this.route.snapshot.queryParamMap.get('stock_critico') === '1';
    // Espera a que el usuario deje de escribir antes de consultar al servidor
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
    if (this.categoria) filtros['categoria'] = this.categoria;
    if (this.condicion) filtros['condicion'] = this.condicion;
    if (this.stockCritico) filtros['stock_critico'] = 1;

    this.cargando = true;
    this.crud.listarRepuestos(filtros).subscribe({
      next: (d: any) => {
        this.repuestos = d.results;
        this.total = d.count;
        this.cargando = false;
      },
      error: (err: any) => {
        this.cargando = false;
        // La página pedida ya no existe (por ejemplo tras eliminar el último de la página)
        if (err.status === 404 && this.pagina > 1) {
          this.irAPagina(this.pagina - 1);
          return;
        }
        this.avisar('error', 'No se pudo cargar el catálogo.');
      }
    });
  }

  actualizarStock(rep: any, variacion: number): void {
    const nuevo = rep.stock + variacion;
    if (nuevo < 0) return;
    this.crud.actualizarStock(rep.id, nuevo).subscribe({
      next: () => (rep.stock = nuevo),
      error: () => this.avisar('error', 'No se pudo actualizar el stock.')
    });
  }

  cambiarActivo(rep: any): void {
    this.crud.cambiarActivo(rep.id, !rep.activo).subscribe({
      next: () => {
        rep.activo = !rep.activo;
        this.avisar('ok', `${rep.nombre} ${rep.activo ? 'visible' : 'oculto'} en la tienda.`);
      },
      error: () => this.avisar('error', 'No se pudo cambiar la visibilidad.')
    });
  }

  eliminar(rep: any): void {
    if (!confirm(`¿Eliminar "${rep.nombre}" (${rep.sku}) del inventario? Esta acción no se puede deshacer.`)) return;
    this.crud.eliminarRepuesto(rep.id).subscribe({
      next: () => {
        this.avisar('ok', `${rep.nombre} eliminado.`);
        this.cargar();
      },
      // Si tiene pedidos el servidor responde 400 y sugiere desactivarlo
      error: (err: any) => this.avisar('error', err?.error?.error || 'No se pudo eliminar el repuesto.')
    });
  }

  private avisar(tipo: 'ok' | 'error', texto: string): void {
    this.mensaje = { tipo, texto };
  }
}
