import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminCrudService } from '../../services/admin-crud';
import { CatalogoFiltroService, FiltroCatalogo } from '../../services/catalogo-filtro';
import { VehiculoSeleccionService } from '../../services/vehiculo-seleccion.service';
import { TarjetaRepuesto } from '../tarjeta-repuesto/tarjeta-repuesto';

const MAX_DESTACADOS = 10;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TarjetaRepuesto],
  templateUrl: './home.html',
})
export class Home implements OnInit, OnDestroy {
  repuestos: any[] = [];
  cargando = true;
  error = false;

  filtro: FiltroCatalogo = { categoriaId: null, subcategoriaId: null, etiqueta: '', texto: '' };
  verTodo = false;

  /** id de la categoría "Desarmaduría" (para el botón del banner) */
  desarmaduriaId: number | null = null;

  // Buscador grande de vehículo
  tabVeh: 'datos' | 'patente' | 'vin' = 'datos';
  errorVeh = '';

  private subs = new Subscription();

  constructor(
    private crud: AdminCrudService,
    private catalogoFiltro: CatalogoFiltroService,
    public veh: VehiculoSeleccionService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.catalogoFiltro.filtro$.subscribe(f => {
      this.filtro = f;
      this.verTodo = false;
    }));
    this.cargarRepuestos();
    this.buscarCategoriaDesarmaduria();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  cargarRepuestos(): void {
    this.cargando = true;
    this.error = false;
    this.crud.getRepuestos().subscribe({
      next: (data: any) => {
        const lista = Array.isArray(data) ? data : (data?.results ?? []);
        this.repuestos = lista.filter((p: any) => p.activo !== false);
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar repuestos:', err);
        this.error = true;
        this.cargando = false;
      }
    });
  }

  private buscarCategoriaDesarmaduria(): void {
    this.crud.getCategorias().subscribe({
      next: (data: any) => {
        const lista = Array.isArray(data) ? data : (data?.results ?? []);
        const c = lista.find((x: any) => this.norm(x.nombre).includes('desarmaduria'));
        this.desarmaduriaId = c ? c.id : null;
      },
      error: () => (this.desarmaduriaId = null)
    });
  }

  // --- Filtros ---------------------------------------------------------

  esDesarmaduria(p: any): boolean {
    return p.condicion !== 'NUEVO';
  }

  private norm(s: any): string {
    return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /** ¿Hay búsqueda del header o vehículo elegido? */
  get hayFiltro(): boolean {
    return this.filtro.categoriaId !== null || !!this.filtro.texto || !!this.veh.actual;
  }

  /** Repuestos que cumplen búsqueda + vehículo */
  get repuestosPorCategoria(): any[] {
    const texto = this.norm(this.filtro.texto);
    return this.repuestos.filter(p => {
      if (this.filtro.categoriaId !== null && p.categoria !== this.filtro.categoriaId) return false;
      if (this.filtro.subcategoriaId !== null && p.subcategoria !== this.filtro.subcategoriaId) return false;
      if (!this.veh.coincide(p)) return false;
      if (texto) {
        const pajar = this.norm([
          p.nombre, p.sku, p.codigo_oem, p.marca_fabricante,
          p.categoria_nombre, p.subcategoria_nombre, (p.vehiculos_nombres || []).join(' ')
        ].join(' '));
        if (!pajar.includes(texto)) return false;
      }
      return true;
    });
  }

  /** Portada sin filtros: solo repuestos nuevos (la Desarmaduría tiene su banner) */
  private get portada(): any[] {
    return this.repuestosPorCategoria.filter(p => !this.esDesarmaduria(p));
  }

  /** Con búsqueda o vehículo: todos los resultados. Sin filtros: los 10 nuevos con más stock. */
  get repuestosFiltrados(): any[] {
    if (this.hayFiltro) return this.repuestosPorCategoria;
    const lista = this.portada;
    if (this.verTodo) return lista;
    return [...lista].sort((a, b) => b.stock - a.stock).slice(0, MAX_DESTACADOS);
  }

  get recortado(): boolean {
    return !this.hayFiltro && !this.verTodo && this.portada.length > MAX_DESTACADOS;
  }

  get totalPortada(): number {
    return this.portada.length;
  }

  get titulo(): string {
    if (this.filtro.texto) return `Resultados para "${this.filtro.texto}"`;
    if (this.filtro.etiqueta) return this.filtro.etiqueta;
    return this.hayFiltro ? 'Repuestos compatibles' : 'Más disponibles 🔥';
  }

  quitarFiltro(): void {
    this.catalogoFiltro.limpiar();
  }

  // --- Buscador grande de vehículo ------------------------------------

  cambiarTabVeh(t: 'datos' | 'patente' | 'vin'): void {
    this.tabVeh = t;
    this.errorVeh = '';
  }

  buscarPorDatos(): void {
    if (this.veh.aplicarDatos()) this.irAlCatalogo();
  }

  buscarPorIdentificador(valor: string): void {
    this.errorVeh = '';
    const v = (valor || '').trim();
    if (!v) return;
    this.veh.buscarIdentificador(v).subscribe({
      next: () => this.irAlCatalogo(),
      error: () => (this.errorVeh = 'Vehículo no encontrado. Verifica los datos ingresados.')
    });
  }

  private irAlCatalogo(): void {
    setTimeout(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }
}