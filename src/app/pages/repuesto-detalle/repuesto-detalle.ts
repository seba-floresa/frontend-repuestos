import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';
import { CatalogoFiltroService } from '../../services/catalogo-filtro';
import { CarritoService } from '../../services/carrito.service';
import { VehiculoSeleccionService } from '../../services/vehiculo-seleccion.service';

@Component({
  selector: 'app-repuesto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './repuesto-detalle.html',
})
export class RepuestoDetalle implements OnInit {
  repuesto: any = null;
  cargando = true;
  noEncontrado = false;
  cantidad = 1;
  fotoActiva = 0;
  pestana: 'descripcion' | 'compat' = 'descripcion';
  filtroCompat = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crud: AdminCrudService,
    private filtro: CatalogoFiltroService,
    private carrito: CarritoService,
    private seleccion: VehiculoSeleccionService
  ) {}

  ngOnInit(): void {
    // paramMap permite que la página cambie si cambia el :id en la URL
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) {
        this.cargando = false;
        this.noEncontrado = true;
        return;
      }
      this.cargar(id);
    });
  }

  cargar(id: number): void {
    this.cargando = true;
    this.noEncontrado = false;
    this.cantidad = 1;
    this.fotoActiva = 0;
    this.pestana = 'descripcion';
    this.filtroCompat = '';

    this.crud.getRepuesto(id).subscribe({
      next: (data: any) => {
        this.repuesto = data;
        this.cargando = false;
      },
      error: () => {
        this.repuesto = null;
        this.noEncontrado = true;
        this.cargando = false;
      }
    });
  }

  // --- Presentación ------------------------------------------------------

  get esDesarmaduria(): boolean {
    return !!this.repuesto && this.repuesto.condicion !== 'NUEVO';
  }

  get enDesarmaduria(): boolean {
    return String(this.repuesto?.categoria_nombre ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('desarmaduria');
  }

  // --- Compatibilidades ---------------------------------------------------

  /**
   * Filas Marca / Modelo / Motor / Año. La API del repuesto trae solo ids y nombres armados,
   * así que se cruzan los ids con /api/vehiculos/ (ya cargado por VehiculoSeleccionService).
   * Se recalcula solo si cambia el repuesto o termina de cargar el catálogo.
   */
  get compatibilidades(): { marca: string; modelo: string; motor: string; anio: string }[] {
    const catalogo = this.seleccion.catalogo;
    if (this.cacheCompat.repuesto !== this.repuesto || this.cacheCompat.catalogo !== catalogo) {
      const ids: number[] = this.repuesto?.vehiculos || [];
      this.cacheCompat = {
        repuesto: this.repuesto,
        catalogo,
        filas: catalogo
          .filter(v => ids.includes(v.id))
          .map(v => ({
            marca: v.marca,
            modelo: v.modelo,
            motor: v.motorizacion || '',
            anio: v.anio_fin ? `${v.anio_inicio}-${v.anio_fin}` : `${v.anio_inicio}+`,
          }))
          .sort((a, b) => `${a.marca} ${a.modelo} ${a.anio}`.localeCompare(`${b.marca} ${b.modelo} ${b.anio}`, 'es')),
      };
    }
    return this.cacheCompat.filas;
  }
  private cacheCompat: { repuesto: any; catalogo: any[] | null; filas: any[] } = { repuesto: null, catalogo: null, filas: [] };

  get compatibilidadesFiltradas() {
    const texto = this.filtroCompat.trim().toLowerCase();
    if (!texto) return this.compatibilidades;
    return this.compatibilidades.filter(v =>
      `${v.marca} ${v.modelo} ${v.motor} ${v.anio}`.toLowerCase().includes(texto)
    );
  }

  /** Vehículo elegido por el cliente, como texto ("Toyota Yaris 2015-2020"); null si no eligió */
  get vehiculoElegido(): string | null {
    const v = this.seleccion.actual;
    return v ? `${v.marca} ${v.modelo}${v.anio ? ' ' + v.anio : ''}` : null;
  }

  get esCompatible(): boolean {
    return !!this.repuesto && this.seleccion.coincide(this.repuesto);
  }

  /** "cada 10.000 km o 12 meses"; vacío si no tiene intervalos */
  get cambioRecomendado(): string {
    const km = this.repuesto?.intervalo_cambio_km;
    const meses = this.repuesto?.intervalo_cambio_meses;
    const partes = [];
    if (km) partes.push(`${km.toLocaleString('es-CL')} km`);
    if (meses) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
    return partes.length ? 'cada ' + partes.join(' o ') : '';
  }

  /** Imagen principal + fotos reales (urls_fotos_reales) si existen */
  get fotos(): string[] {
    if (!this.repuesto) return [];
    const lista: string[] = [];
    if (this.repuesto.imagen) lista.push(this.absoluta(this.repuesto.imagen));
    const reales = this.repuesto.urls_fotos_reales;
    if (Array.isArray(reales)) reales.forEach((u: string) => lista.push(this.absoluta(u)));
    return lista;
  }

  private absoluta(url: string): string {
    return url.startsWith('http') ? url : 'http://localhost:8000' + url;
  }


  cambiarCantidad(delta: number): void {
    const nueva = this.cantidad + delta;
    if (nueva >= 1 && nueva <= (this.repuesto?.stock || 1)) this.cantidad = nueva;
  }

  agregarAlCarrito(): void {
    const r = this.repuesto;
    if (!r) return;
    this.carrito.agregar(
      { id: r.id, nombre: r.nombre, sku: r.sku, precio: r.precio, imagen: this.fotos[0] ?? null, stock: r.stock },
      this.cantidad
    );
    const el = document.getElementById('panelCarrito');
    const bs = (window as any).bootstrap;
    if (el && bs) bs.Offcanvas.getOrCreateInstance(el).show();
  }

    /** Va a la página de la categoría (o subcategoría) de este repuesto */
  verCategoria(conSubcategoria: boolean): void {
    const r = this.repuesto;
    if (!r) return;
    if (conSubcategoria && r.subcategoria_id) {
      this.router.navigate(['/categoria', r.categoria_id, r.subcategoria_id]);
    } else {
      this.router.navigate(['/categoria', r.categoria_id]);
    }
  }
}