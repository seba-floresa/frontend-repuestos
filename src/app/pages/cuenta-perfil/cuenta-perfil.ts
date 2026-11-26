import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CuentaService } from '../../services/cuenta.service';

function clavesIguales(grupo: AbstractControl): ValidationErrors | null {
  return grupo.get('nueva')?.value === grupo.get('confirmar')?.value ? null : { distintas: true };
}

@Component({
  selector: 'app-cuenta-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './cuenta-perfil.html',
})
export class CuentaPerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuenta = inject(CuentaService);

  // Solo lectura
  email = '';
  rut = '';
  cargando = true;
  errorCarga = '';

  perfilForm = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]], // mismo criterio del registro
  });
  guardandoPerfil = false;
  avisoPerfil = '';
  errorPerfil = '';

  claveForm = this.fb.nonNullable.group({
    actual: ['', Validators.required],
    nueva: ['', [Validators.required, Validators.minLength(8)]],
    confirmar: ['', Validators.required],
  }, { validators: clavesIguales });
  guardandoClave = false;
  avisoClave = '';
  errorClave = '';

  vehiculos: any[] = [];
  errorVehiculos = '';

  // Modal "Eliminar mi cuenta"
  modalEliminar = false;
  claveEliminar = '';
  eliminando = false;
  errorEliminar = '';

  ngOnInit(): void {
    this.cuenta.getPerfil().subscribe({
      next: p => {
        this.email = p.email;
        this.rut = p.rut;
        this.perfilForm.setValue({ nombre_completo: p.nombre_completo, telefono: p.celular });
        this.cargando = false;
      },
      error: e => {
        this.errorCarga = this.cuenta.mensajeError(e, 'No se pudo cargar tu perfil.');
        this.cargando = false;
      },
    });
    this.cargarVehiculos();
  }

  invalido(form: 'perfil' | 'clave', campo: string): boolean {
    const c = form === 'perfil' ? this.perfilForm.get(campo) : this.claveForm.get(campo);
    return !!c && c.invalid && c.touched;
  }

  soloDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.perfilForm.controls.telefono.setValue(input.value.replace(/\D/g, ''));
  }

  guardarPerfil(): void {
    this.avisoPerfil = this.errorPerfil = '';
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }
    this.guardandoPerfil = true;
    this.cuenta.actualizarPerfil(this.perfilForm.getRawValue()).subscribe({
      next: p => {
        this.guardandoPerfil = false;
        this.avisoPerfil = 'Tus datos se guardaron.';
        this.perfilForm.setValue({ nombre_completo: p.nombre_completo, telefono: p.celular });
        this.actualizarNombreGuardado(p.nombre);
      },
      error: e => {
        this.guardandoPerfil = false;
        this.errorPerfil = this.cuenta.mensajeError(e, 'No se pudieron guardar tus datos.');
      },
    });
  }

  /** El header y el login leen el nombre desde localStorage */
  private actualizarNombreGuardado(nombre: string): void {
    localStorage.setItem('nombre', nombre);
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) localStorage.setItem('user', JSON.stringify({ ...user, nombre }));
    } catch { /* sin datos previos */ }
    this.cuenta.nombreCambiado$.next(nombre);
  }

  cambiarClave(): void {
    this.avisoClave = this.errorClave = '';
    if (this.claveForm.invalid) {
      this.claveForm.markAllAsTouched();
      return;
    }
    const v = this.claveForm.getRawValue();
    this.guardandoClave = true;
    this.cuenta.cambiarPassword({ password_actual: v.actual, password_nueva: v.nueva }).subscribe({
      next: () => {
        this.guardandoClave = false;
        this.avisoClave = 'Tu contraseña se actualizó.';
        this.claveForm.reset();
      },
      error: e => {
        this.guardandoClave = false;
        this.errorClave = this.cuenta.mensajeError(e, 'No se pudo cambiar la contraseña.');
      },
    });
  }

  cargarVehiculos(): void {
    this.cuenta.getVehiculos().subscribe({
      next: v => (this.vehiculos = v),
      error: e => (this.errorVehiculos = this.cuenta.mensajeError(e, 'No se pudieron cargar tus vehículos.')),
    });
  }

  quitarVehiculo(v: any): void {
    const nombre = `${v.marca} ${v.modelo}${v.patente ? ' (' + v.patente + ')' : ''}`;
    if (!confirm(`¿Quitar ${nombre} de tus vehículos?`)) return;
    this.errorVehiculos = '';
    this.cuenta.quitarVehiculo(v.id).subscribe({
      next: () => (this.vehiculos = this.vehiculos.filter(x => x.id !== v.id)),
      error: e => (this.errorVehiculos = this.cuenta.mensajeError(e, 'No se pudo quitar el vehículo.')),
    });
  }

  abrirEliminar(): void {
    this.claveEliminar = '';
    this.errorEliminar = '';
    this.modalEliminar = true;
  }

  cerrarEliminar(): void {
    if (!this.eliminando) this.modalEliminar = false;
  }

  eliminarCuenta(): void {
    if (!this.claveEliminar) {
      this.errorEliminar = 'Ingresa tu contraseña para confirmar.';
      return;
    }
    this.eliminando = true;
    this.errorEliminar = '';
    this.cuenta.eliminarCuenta(this.claveEliminar).subscribe({
      next: () => {
        // El servidor ya cerró la sesión: se borra todo lo guardado en este navegador y se recarga el sitio
        localStorage.clear();
        window.location.href = '/';
      },
      error: e => {
        this.eliminando = false;
        this.errorEliminar = this.cuenta.mensajeError(e, 'No se pudo eliminar la cuenta.');
      },
    });
  }
}
