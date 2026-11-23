import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminCrudService } from '../../services/admin-crud';
import { RouterLink } from '@angular/router'; 

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  repuestos: any[] = [];
  repuestosFiltrados: any[] = [];
  categorias: any[] = [];
  subcategorias: any[] = [];
  subcategoriasFiltradas: any[] = [];
  vehiculosDisponibles: any[] = [];

  repuestoForm!: FormGroup;
  archivoImagen: File | null = null;
  terminoBusqueda: string = '';
  filtroVehiculo: string = '';
  editandoId: number | null = null;
  mensajeError: string = '';
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private adminCrudService: AdminCrudService
  ) {}

  ngOnInit(): void {
    this.repuestoForm = this.fb.group({
      sku: [''], // vacío: el servidor genera uno (RS-FIL-0001)
      codigo_oem: [''],
      nombre: ['', Validators.required],
      descripcion: [''],
      intervalo_cambio_km: [null, Validators.min(1)],
      intervalo_cambio_meses: [null, Validators.min(1)],
      marca_fabricante: ['', Validators.required],
      categoria: ['', Validators.required],
      subcategoria: ['', Validators.required],
      condicion: ['NUEVO', Validators.required],
      detalle_desgaste: [''],
      activo: [true],
      peso_kg: [1.0, [Validators.required, Validators.min(0.01)]],
      precio: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      vehiculos: [[]]
    });

    // Filtra subcategorías según la categoría elegida
    this.repuestoForm.get('categoria')?.valueChanges.subscribe((catId) => {
      this.subcategoriasFiltradas = this.subcategorias.filter(
        (sub) => sub.categoria == catId
      );
      const subActual = this.repuestoForm.get('subcategoria')?.value;
      const pertenece = this.subcategoriasFiltradas.some((sub) => sub.id == subActual);
      if (!pertenece) {
        this.repuestoForm.get('subcategoria')?.setValue('');
      }
    });

    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.adminCrudService.getCategorias().subscribe({
      next: (data: any) => (this.categorias = data),
      error: (err: any) => console.error('Error al cargar categorías:', err)
    });

    this.adminCrudService.getSubcategorias().subscribe({
      next: (data: any) => (this.subcategorias = data),
      error: (err: any) => console.error('Error al cargar subcategorías:', err)
    });

    this.adminCrudService.getVehiculos().subscribe({
      next: (data: any) => (this.vehiculosDisponibles = data),
      error: (err: any) => console.error('Error al cargar vehículos:', err)
    });

    this.cargarRepuestos();
  }

  cargarRepuestos(): void {
    this.adminCrudService.getRepuestos().subscribe({
      next: (data: any) => {
        this.repuestos = data;
        this.filtrarRepuestos();
      },
      error: (err: any) => console.error('Error al cargar repuestos:', err)
    });
  }

  filtrarRepuestos(): void {
    const busqueda = this.terminoBusqueda.toLowerCase().trim();
    if (!busqueda) {
      this.repuestosFiltrados = [...this.repuestos];
      return;
    }

    this.repuestosFiltrados = this.repuestos.filter(
      (rep) =>
        (rep.nombre || '').toLowerCase().includes(busqueda) ||
        (rep.sku || '').toLowerCase().includes(busqueda) ||
        (rep.codigo_oem || '').toLowerCase().includes(busqueda) ||
        (rep.marca_fabricante || '').toLowerCase().includes(busqueda)
    );
  }

  // =========================================================
  // SELECTOR DE VEHÍCULOS CON BUSCADOR Y CHECKMARKS
  // =========================================================

  getEtiquetaVehiculo(v: any): string {
    if (v.nombre && v.nombre.includes('motor')) return v.nombre; // Por si el backend ya lo trae listo
    
    const rango = v.anio_fin ? `${v.anio_inicio}-${v.anio_fin}` : (v.anio_inicio ? `${v.anio_inicio}+` : '');
    const motor = v.motorizacion ? `(Motor ${v.motorizacion})` : '';
    
    return `${v.marca || ''} ${v.modelo || ''} ${rango} ${motor}`.trim();
  }

  get vehiculosFiltrados(): any[] {
    const termino = this.filtroVehiculo.toLowerCase().trim();
    if (!termino) return this.vehiculosDisponibles;

    return this.vehiculosDisponibles.filter((v) =>
      this.getEtiquetaVehiculo(v).toLowerCase().includes(termino)
    );
  }

  get vehiculosSeleccionadosIds(): number[] {
    return this.repuestoForm.get('vehiculos')?.value || [];
  }

  get vehiculosSeleccionadosObj(): any[] {
    const ids = this.vehiculosSeleccionadosIds;
    return this.vehiculosDisponibles.filter((v) => ids.includes(v.id));
  }

  isVehiculoSeleccionado(id: number): boolean {
    return this.vehiculosSeleccionadosIds.includes(id);
  }

  toggleVehiculo(id: number): void {
    const control = this.repuestoForm.get('vehiculos');
    if (!control) return;

    const actuales: number[] = [...(control.value || [])];
    const index = actuales.indexOf(id);

    if (index > -1) {
      actuales.splice(index, 1);
    } else {
      actuales.push(id);
    }

    control.setValue(actuales);
    control.markAsDirty();
  }

  limpiarVehiculos(): void {
    this.repuestoForm.get('vehiculos')?.setValue([]);
  }

  // =========================================================
  // GESTIÓN DE IMAGEN Y CRUD DE REPUESTOS
  // =========================================================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.archivoImagen = file;
  }

  guardarRepuesto(): void {
    if (this.repuestoForm.invalid || this.guardando) return;

    this.mensajeError = '';
    this.guardando = true;

    const formData = new FormData();
    Object.keys(this.repuestoForm.value).forEach((key) => {
      const valor = this.repuestoForm.value[key];
      if (key === 'vehiculos') {
        formData.append(key, JSON.stringify(valor || []));
      } else {
        // Evita enviar la palabra "null" cuando un campo está vacío
        formData.append(key, valor === null || valor === undefined ? '' : valor);
      }
    });

    if (this.archivoImagen) {
      formData.append('imagen', this.archivoImagen, this.archivoImagen.name);
    }

    const peticion$ = this.editandoId
      ? this.adminCrudService.actualizarRepuesto(this.editandoId, formData)
      : this.adminCrudService.crearRepuesto(formData);

    peticion$.subscribe({
      next: () => {
        this.guardando = false;
        this.cargarRepuestos();
        this.cancelarEdicion();
      },
      error: (err: any) => {
        this.guardando = false;
        console.error('Error al guardar repuesto:', err);
        this.mensajeError = this.extraerError(err);
      }
    });
  }

  /** Convierte el error de DRF en un texto legible (ej: "sku: repuesto con este sku ya existe.") */
  private extraerError(err: any): string {
    const e = err?.error;
    if (e && typeof e === 'object') {
      return Object.keys(e)
        .map((k) => `${k}: ${Array.isArray(e[k]) ? e[k].join(' ') : e[k]}`)
        .join(' · ');
    }
    return 'No se pudo guardar el repuesto. Revisa los datos o tu sesión de administrador.';
  }

  get esUsado(): boolean {
    return this.repuestoForm.get('condicion')?.value !== 'NUEVO';
  }

  cargarParaEditar(repuesto: any): void {
    this.mensajeError = '';
    this.editandoId = repuesto.id;
    this.subcategoriasFiltradas = this.subcategorias.filter(
      (sub) => sub.categoria == repuesto.categoria_id
    );

    const vehiculosIds = Array.isArray(repuesto.vehiculos)
      ? repuesto.vehiculos.map((v: any) => (typeof v === 'object' ? v.id : v))
      : [];

    this.repuestoForm.patchValue({
      sku: repuesto.sku,
      codigo_oem: repuesto.codigo_oem || '',
      nombre: repuesto.nombre,
      descripcion: repuesto.descripcion || '',
      intervalo_cambio_km: repuesto.intervalo_cambio_km,
      intervalo_cambio_meses: repuesto.intervalo_cambio_meses,
      marca_fabricante: repuesto.marca_fabricante,
      categoria: repuesto.categoria_id,
      subcategoria: repuesto.subcategoria_id,
      condicion: repuesto.condicion || 'NUEVO',
      detalle_desgaste: repuesto.detalle_desgaste || '',
      activo: repuesto.activo !== false,
      peso_kg: repuesto.peso_kg || 1.0,
      precio: repuesto.precio,
      stock: repuesto.stock,
      vehiculos: vehiculosIds
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.mensajeError = '';
    this.archivoImagen = null;
    this.filtroVehiculo = '';
    this.subcategoriasFiltradas = [];
    this.repuestoForm.reset({
      sku: '',
      codigo_oem: '',
      descripcion: '',
      categoria: '',
      subcategoria: '',
      condicion: 'NUEVO',
      detalle_desgaste: '',
      activo: true,
      peso_kg: 1.0,
      vehiculos: []
    });
  }

  actualizarStockRapido(repuesto: any, variacion: number): void {
    const nuevoStock = repuesto.stock + variacion;
    if (nuevoStock >= 0) {
      this.adminCrudService.actualizarStock(repuesto.id, nuevoStock).subscribe({
        next: () => {
          repuesto.stock = nuevoStock;
        },
        error: (err: any) => console.error('Error al actualizar stock:', err)
      });
    }
  }

  borrarRepuesto(id: number): void {
    if (confirm('¿Estás seguro de eliminar este repuesto del inventario?')) {
      this.adminCrudService.eliminarRepuesto(id).subscribe({
        next: () => this.cargarRepuestos(),
        error: (err: any) => console.error('Error al eliminar repuesto:', err)
      });
    }
  }
}