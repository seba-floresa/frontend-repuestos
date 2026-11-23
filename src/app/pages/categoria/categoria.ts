import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AdminCrudService } from '../../services/admin-crud';
import { CatalogoFiltroService } from '../../services/catalogo-filtro';
import { VehiculoSeleccionService } from '../../services/vehiculo-seleccion.service';
import { TarjetaRepuesto } from '../tarjeta-repuesto/tarjeta-repuesto';
import { FormsModule } from '@angular/forms';

type Condicion = 'TODOS' | 'NUEVO' | 'DESARMADURIA';
type Orden = 'stock' | 'precio_asc' | 'precio_desc' | 'nombre';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TarjetaRepuesto],
  templateUrl: './categoria.html',
  styleUrl: './categoria.css',
})
export class Categoria implements OnInit, OnDestroy {
  categorias: any[] = [];
  subcategorias: any[] = [];
  repuestos: any[] = [];
  cargando = true;
  error = false;

  categoriaId: number | null = null;
  subcategoriaId: number | null = null;

  condicion: Condicion = 'TODOS';
  marcasSel: string[] = [];
  orden: Orden = 'stock';

  condiciones: { valor: Condicion; label: string }[] = [
    { valor: 'TODOS', label: 'Todos' },
    { valor: 'NUEVO', label: 'Nuevos' },
    { valor: 'DESARMADURIA', label: 'Desarmaduría' },
  ];

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private crud: AdminCrudService,
    private filtro: CatalogoFiltroService,
    public veh: VehiculoSeleccionService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.route.paramMap.subscribe(params => {
      this.categoriaId = Number(params.get('categoriaId')) || null;
      const s = params.get('subcategoriaId');
      this.subcategoriaId = s ? Number(s) : null;
      this.condicion = 'TODOS';
      this.marcasSel = [];
      this.marcarMenu();
    }));
    this.cargar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.filtro.limpiar(); // al salir, el Home vuelve a verse normal
  }

  cargar(): void {
    this.cargando = true;
    this.error = false;
    const arr = (d: any) => (Array.isArray(d) ? d : (d?.results ?? []));
    forkJoin({
      c: this.crud.getCategorias(),
      s: this.crud.getSubcategorias(),
      r: this.crud.getRepuestos(),
    }).subscribe({
      next: ({ c, s, r }) => {
        this.categorias = arr(c);
        this.subcategorias = arr(s);
        this.repuestos = arr(r);
        this.cargando = false;
        this.marcarMenu();
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      },
    });
  }

  /** Deja resaltada la categoría en el menú lateral */
  private marcarMenu(): void {
    if (!this.categoria) return;
    const etiqueta = this.subcategoria ? `${this.categoria.nombre} › ${this.subcategoria.nombre}` : this.categoria.nombre;
    this.filtro.seleccionar(this.categoriaId, this.subcategoriaId, etiqueta);
  }

  // --- Datos de la página ---
  get categoria(): any | null {
    return this.categorias.find(c => c.id === this.categoriaId) ?? null;
  }
  get subcategoria(): any | null {
    return this.subcategorias.find(s => s.id === this.subcategoriaId) ?? null;
  }
  get subcategoriasDeCategoria(): any[] {
    return this.subcategorias.filter(s => s.categoria === this.categoriaId);
  }
  get titulo(): string {
    return this.subcategoria?.nombre ?? this.categoria?.nombre ?? 'Categoría';
  }

  get esCategoriaDesarmaduria(): boolean {
    return String(this.categoria?.nombre ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('desarmaduria');
  }

  /** En Desarmaduría se llama "Desarmaduría"; en las demás categorías, "Reacondicionados" */
  get condicionesVista(): { valor: Condicion; label: string }[] {
    return this.condiciones.map(c =>
      c.valor === 'DESARMADURIA'
        ? { ...c, label: this.esCategoriaDesarmaduria ? 'Desarmaduría' : 'Reacondicionados' }
        : c
    );
  }

  esDesarmaduria(p: any): boolean {
    return p.condicion !== 'NUEVO';
  }

  /** Repuestos de esta categoría/subcategoría que calzan con el vehículo elegido */
  private get base(): any[] {
    return this.repuestos.filter(p =>
      p.activo !== false &&
      p.categoria === this.categoriaId &&
      (this.subcategoriaId === null || p.subcategoria === this.subcategoriaId) &&
      this.veh.coincide(p)
    );
  }

  private get porCondicion(): any[] {
    return this.base.filter(p => {
      if (this.condicion === 'NUEVO') return !this.esDesarmaduria(p);
      if (this.condicion === 'DESARMADURIA') return this.esDesarmaduria(p);
      return true;
    });
  }

  get marcas(): { nombre: string; cantidad: number }[] {
    const cuenta = new Map<string, number>();
    this.porCondicion.forEach(p => {
      const m = p.marca_fabricante || 'Sin marca';
      cuenta.set(m, (cuenta.get(m) ?? 0) + 1);
    });
    return [...cuenta.entries()]
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get lista(): any[] {
    let l = this.porCondicion.filter(p =>
      !this.marcasSel.length || this.marcasSel.includes(p.marca_fabricante || 'Sin marca')
    );
    l = [...l];
    if (this.orden === 'stock') l.sort((a, b) => b.stock - a.stock);
    if (this.orden === 'precio_asc') l.sort((a, b) => a.precio - b.precio);
    if (this.orden === 'precio_desc') l.sort((a, b) => b.precio - a.precio);
    if (this.orden === 'nombre') l.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return l;
  }

  conteo(tab: Condicion): number {
    if (tab === 'NUEVO') return this.base.filter(p => !this.esDesarmaduria(p)).length;
    if (tab === 'DESARMADURIA') return this.base.filter(p => this.esDesarmaduria(p)).length;
    return this.base.length;
  }

  conteoSub(id: number): number {
    return this.repuestos.filter(p => p.activo !== false && p.subcategoria === id && this.veh.coincide(p)).length;
  }

  // --- Acciones de los filtros ---
  elegirCondicion(c: Condicion): void {
    this.condicion = c;
    this.marcasSel = [];
  }

  marcaActiva(m: string): boolean {
    return this.marcasSel.includes(m);
  }

  toggleMarca(m: string): void {
    this.marcasSel = this.marcaActiva(m) ? this.marcasSel.filter(x => x !== m) : [...this.marcasSel, m];
  }

  limpiarFiltros(): void {
    this.condicion = 'TODOS';
    this.marcasSel = [];
  }

  get hayFiltros(): boolean {
    return this.condicion !== 'TODOS' || this.marcasSel.length > 0;
  }
}