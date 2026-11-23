import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';

@Component({
  selector: 'app-admin-carga-masiva',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-carga-masiva.html',
})
export class AdminCargaMasivaComponent {
  archivo: File | null = null;
  informe: any = null;
  error = '';
  enviando = false;

  constructor(private crud: AdminCrudService) {}

  onArchivo(event: any): void {
    this.archivo = event.target.files[0] || null;
    this.informe = null; // un archivo nuevo obliga a validar de nuevo
    this.error = '';
  }

  enviar(modo: 'validar' | 'importar'): void {
    if (!this.archivo || this.enviando) return;
    if (modo === 'importar' && !confirm(`Se crearán ${this.informe?.validas} repuestos. ¿Continuar?`)) return;

    this.enviando = true;
    this.error = '';
    this.crud.cargaMasiva(this.archivo, modo).subscribe({
      next: (data: any) => {
        this.informe = data;
        this.enviando = false;
      },
      error: (err: any) => {
        this.enviando = false;
        this.error = err?.error?.error || err?.error?.detail || 'No se pudo procesar el archivo. Revisa tu sesión de administrador.';
      }
    });
  }

  /** Solo se puede importar lo que ya se validó y aún no se importó */
  get puedeImportar(): boolean {
    return this.informe?.modo === 'validar' && this.informe.validas > 0;
  }
}
