import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminCrudService } from '../../services/admin-crud';

@Component({
  selector: 'app-admin-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-vehiculos.html'
})
export class AdminVehiculosComponent implements OnInit {
  private crud = inject(AdminCrudService);
  private fb = inject(FormBuilder);

  vehiculos: any[] = [];
  filtro = '';
  editandoId: number | null = null;
  guardando = false;
  mensaje: { tipo: 'ok' | 'error'; texto: string } | null = null;

  form = this.fb.group({
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    anio_inicio: [null as number | null, [Validators.required, Validators.min(1900), Validators.max(2100)]],
    anio_fin: [null as number | null, [Validators.min(1900), Validators.max(2100)]],
    motorizacion: ['']
  });

  ngOnInit(): void {
    this.cargar();
  }

  get vehiculosFiltrados(): any[] {
    const t = this.filtro.toLowerCase().trim();
    return t ? this.vehiculos.filter(v => (v.nombre || '').toLowerCase().includes(t)) : this.vehiculos;
  }

  cargar(): void {
    this.crud.getVehiculos().subscribe({
      next: (d: any) => (this.vehiculos = d),
      error: () => (this.mensaje = { tipo: 'error', texto: 'No se pudieron cargar los vehículos.' })
    });
  }

  editar(v: any): void {
    this.editandoId = v.id;
    this.mensaje = null;
    this.form.reset({
      marca: v.marca, modelo: v.modelo, anio_inicio: v.anio_inicio, anio_fin: v.anio_fin, motorizacion: v.motorizacion || ''
    });
  }

  cancelar(): void {
    this.editandoId = null;
    this.form.reset({ marca: '', modelo: '', anio_inicio: null, anio_fin: null, motorizacion: '' });
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) return;
    const v = this.form.value;
    // Vacío se guarda como null: "en producción" / "sin motor indicado"
    const datos = { ...v, anio_fin: v.anio_fin || null, motorizacion: v.motorizacion?.trim() || null };
    const peticion$ = this.editandoId
      ? this.crud.actualizarVehiculo(this.editandoId, datos)
      : this.crud.crearVehiculo(datos);

    this.guardando = true;
    peticion$.subscribe({
      next: (r: any) => {
        this.guardando = false;
        this.mensaje = { tipo: 'ok', texto: `${r.nombre} ${this.editandoId ? 'actualizado' : 'creado'}.` };
        this.cancelar();
        this.cargar();
      },
      error: (err: any) => {
        this.guardando = false;
        const e = err?.error;
        const texto = e && typeof e === 'object'
          ? Object.values(e).map((m: any) => (Array.isArray(m) ? m.join(' ') : m)).join(' · ')
          : 'No se pudo guardar el vehículo. Revisa tu sesión de administrador.';
        this.mensaje = { tipo: 'error', texto };
      }
    });
  }
}
