import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminCrudService } from '../../services/admin-crud';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  categorias: any[] = [];
  subcategorias: any[] = [];
  subcategoriasFiltradas: any[] = [];
  vehiculosDisponibles: any[] = [];

  repuestoForm!: FormGroup;
  archivoImagen: File | null = null;
  filtroVehiculo: string = '';
  editandoId: number | null = null;
  mensajeError: string = '';
  mensajeExito = '';
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private adminCrudService: AdminCrudService,
    private route: ActivatedRoute,
    private router: Router
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
    forkJoin({
      categorias: this.adminCrudService.getCategorias(),
      subcategorias: this.adminCrudService.getSubcategorias(),
      vehiculos: this.adminCrudService.getVehiculos()
    }).subscribe({
      next: (d: any) => {
        this.categorias = d.categorias;
        this.subcategorias = d.subcategorias;
        this.vehiculosDisponibles = d.vehiculos;
        // Edición desde el Catálogo: /admin/inventario?editar=<id>
        const id = Number(this.route.snapshot.queryParamMap.get('editar'));
        if (id) {
          this.adminCrudService.getRepuesto(id).subscribe({
            next: (rep: any) => this.cargarParaEditar(rep),
            error: () => (this.mensajeError = 'No se encontró el repuesto a editar.')
          });
        }
      },
      error: () => (this.mensajeError = 'No se pudieron cargar categorías y vehículos. Revisa la conexión con el servidor.')
    });
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
    this.mensajeExito = '';
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
      next: (rep: any) => {
        this.guardando = false;
        if (this.editandoId) {
          this.router.navigate(['/admin/catalogo']);
          return;
        }
        this.cancelarEdicion();
        this.mensajeExito = `Repuesto ${rep.sku} registrado: ${rep.nombre}.`;
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
  }

  cancelarEdicion(): void {
    if (this.editandoId) {
      this.router.navigate(['/admin/inventario']);  // quita ?editar= de la URL
    }
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
}
