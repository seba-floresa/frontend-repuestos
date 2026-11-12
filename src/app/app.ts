import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { BuscadorVehiculoService } from './services/buscador-vehiculo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  buscadorForm!: FormGroup;
  vehiculoEncontrado: any = null;
  mensajeError: string = '';
  
  // Variable para controlar qué pestaña está activa y mover el subrayado
  activeTab: string = 'datos'; 

  constructor(
    private fb: FormBuilder,
    private buscadorService: BuscadorVehiculoService
  ) {}

  ngOnInit(): void {
    this.buscadorForm = this.fb.group({
      patente: [''],
      vin: ['']
    });
  }

  cambiarTab(tab: string): void {
    this.activeTab = tab;
  }

  ejecutarBusqueda(tipo: 'patente' | 'vin'): void {
    this.mensajeError = '';
    
    const valor = this.buscadorForm.get(tipo)?.value;
    if (!valor) return;

    this.buscadorService.buscar(valor).subscribe({
      next: (data) => {
        this.vehiculoEncontrado = data;
        // Cierra el modal automáticamente al tener éxito
        document.getElementById('btnCerrarModal')?.click();
      },
      error: (err) => {
        this.mensajeError = 'Vehículo no encontrado. Verifica los datos ingresados.';
      }
    });
  }

  limpiarVehiculo(): void {
    this.vehiculoEncontrado = null;
    this.buscadorForm.reset();
  }
}