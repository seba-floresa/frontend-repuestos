import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';
import { CatalogoFiltroService } from '../../services/catalogo-filtro';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-repuesto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './repuesto-detalle.html',
})
export class RepuestoDetalle implements OnInit {
  repuesto: any = null;
  cargando = true;
  noEncontrado = false;
  cantidad = 1;
  fotoActiva = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crud: AdminCrudService,
    private filtro: CatalogoFiltroService,
    private carrito: CarritoService
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