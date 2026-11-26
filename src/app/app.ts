import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminCrudService } from './services/admin-crud';
import { CatalogoFiltroService } from './services/catalogo-filtro';
import { VehiculoSeleccionService } from './services/vehiculo-seleccion.service';
import { CarritoService } from './services/carrito.service';
import { CuentaService } from './services/cuenta.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  buscadorForm!: FormGroup;
  mensajeError: string = '';

  usuario: { username: string; nombre?: string; is_staff: boolean } | null = null;
  activeTab: string = 'datos';

  categorias: any[] = [];
  subcategorias: any[] = [];
  categoriaAbierta: number | null = null;
  errorCategorias = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private crud: AdminCrudService,
    public filtro: CatalogoFiltroService,
    public veh: VehiculoSeleccionService,
    public carrito: CarritoService,
    private cuenta: CuentaService
  ) {}

  /** En /admin/* se oculta lo que es solo de la tienda (ej: "Mi Vehículo") */
  get enAdmin(): boolean {
    return this.router.url.startsWith('/admin');
  }

  /** El header lee el vehículo desde el servicio compartido */
  get vehiculoEncontrado() {
    return this.veh.actual;
  }

  ngOnInit(): void {
    this.buscadorForm = this.fb.group({ patente: [''], vin: [''] });
    this.verificarSesion();
    this.cargarCategorias();
    // "Hola, <nombre>" cambia al guardar el perfil
    this.cuenta.nombreCambiado$.subscribe(nombre => {
      if (this.usuario) this.usuario = { ...this.usuario, nombre };
    });
  }

  verificarSesion(): void {
    const username = localStorage.getItem('username');
    const isStaff = localStorage.getItem('is_staff') === 'true';
    const userRaw = localStorage.getItem('user');
    const userObj = userRaw ? JSON.parse(userRaw) : null;

    if (username) {
      this.usuario = {
        username,
        nombre: localStorage.getItem('nombre') || userObj?.nombre,
        is_staff: isStaff
      };
    }
  }

  logout(): void {
    const limpiar = () => {
      localStorage.removeItem('username');
      localStorage.removeItem('nombre');
      localStorage.removeItem('is_staff');
      localStorage.removeItem('user');
      this.usuario = null;
      this.router.navigate(['/login']);
    };
    // Cierra también la sesión de Django; si falla, igual se limpia el navegador
    this.crud.logout().subscribe({ next: limpiar, error: limpiar });
  }

  cambiarTab(tab: string): void {
    this.activeTab = tab;
    this.mensajeError = '';
  }

  // --- Vehículo (modal) ---
  ejecutarBusqueda(tipo: 'patente' | 'vin'): void {
    this.mensajeError = '';
    const valor = this.buscadorForm.get(tipo)?.value;
    if (!valor) return;

    this.veh.buscarIdentificador(valor).subscribe({
      next: () => document.getElementById('btnCerrarModal')?.click(),
      error: () => (this.mensajeError = 'Vehículo no encontrado. Verifica los datos ingresados.')
    });
  }

  agregarPorDatos(): void {
    if (this.veh.aplicarDatos()) {
      document.getElementById('btnCerrarModal')?.click();
    }
  }

  limpiarVehiculo(): void {
    this.veh.limpiar();
    this.buscadorForm.reset();
  }

  // --- Buscador del header ---
  buscar(event: Event, texto: string): void {
    event.preventDefault();
    this.filtro.buscarTexto(texto);
    this.router.navigate(['/']);
  }

  // --- Carrito ---

  // --- Categorías ---
  cargarCategorias(): void {
    this.errorCategorias = false;

    this.crud.getCategorias().subscribe({
      next: (data: any) => (this.categorias = Array.isArray(data) ? data : (data?.results ?? [])),
      error: (err: any) => {
        console.error('Error al cargar categorías:', err);
        this.errorCategorias = true;
      }
    });

    this.crud.getSubcategorias().subscribe({
      next: (data: any) => (this.subcategorias = Array.isArray(data) ? data : (data?.results ?? [])),
      error: (err: any) => console.error('Error al cargar subcategorías:', err)
    });
  }

  subcategoriasDe(categoriaId: number): any[] {
    return this.subcategorias.filter(s => s.categoria === categoriaId);
  }

  toggleCategoria(categoriaId: number): void {
    this.categoriaAbierta = this.categoriaAbierta === categoriaId ? null : categoriaId;
  }

  /** Redirige a la página de la categoría/subcategoría (o al Home si es "Todos") */
  filtrarCatalogo(categoria: any | null, subcategoria: any | null = null): void {
    if (!categoria) {
      this.filtro.limpiar();
      this.router.navigate(['/']);
      return;
    }
    this.categoriaAbierta = categoria.id;
    this.router.navigate(subcategoria ? ['/categoria', categoria.id, subcategoria.id] : ['/categoria', categoria.id]);
  }
}