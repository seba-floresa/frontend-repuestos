import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminCrudService } from '../../services/admin-crud';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.html',
})
export class AdminComponent implements OnInit {
  repuestos: any[] = [];
  categorias: any[] = [];
  repuestoForm!: FormGroup;
  archivoImagen: File | null = null;

  constructor(
    private fb: FormBuilder,
    private adminCrudService: AdminCrudService
  ) {}

  ngOnInit(): void {
    this.repuestoForm = this.fb.group({
      nombre: ['', Validators.required],
      sku: ['', Validators.required],
      categoria: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      compatibilidad: [''], // Ej: Toyota Hilux 2015-2022 / Motor 2.8
      descripcion: ['']
    });

    this.cargarDatos();
  }

  cargarDatos(): void {
    this.adminCrudService.getCategorias().subscribe({
      next: (data: any) => this.categorias = data,
      error: (err: any) => console.error('Error al cargar categorías', err)
    });

    this.adminCrudService.getRepuestos().subscribe({
      next: (data: any) => this.repuestos = data,
      error: (err: any) => console.error('Error al cargar repuestos', err)
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoImagen = file;
    }
  }

  guardarRepuesto(): void {
    if (this.repuestoForm.invalid) return;

    const formData = new FormData();
    Object.keys(this.repuestoForm.value).forEach(key => {
      formData.append(key, this.repuestoForm.value[key]);
    });

    if (this.archivoImagen) {
      formData.append('imagen', this.archivoImagen, this.archivoImagen.name);
    }

    this.adminCrudService.crearRepuesto(formData).subscribe({
      next: (res: any) => {
        this.cargarDatos();
        this.repuestoForm.reset();
        this.archivoImagen = null;
      },
      error: (err: any) => console.error('Error al guardar repuesto', err)
    });
  }

  borrarRepuesto(id: number): void {
    if (confirm('¿Estás seguro de eliminar este repuesto del inventario?')) {
      this.adminCrudService.eliminarRepuesto(id).subscribe({
        next: (res: any) => this.cargarDatos(),
        error: (err: any) => console.error('Error al eliminar repuesto', err)
      });
    }
  }
}