import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CuentaService } from '../../services/cuenta.service';
import { claseEstadoCliente, textoEstadoCliente } from './estado-cliente';

@Component({
  selector: 'app-cuenta-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cuenta-pedidos.html',
})
export class CuentaPedidosComponent implements OnInit {
  private cuenta = inject(CuentaService);

  pedidos: any[] = [];
  cargando = true;
  error = '';
  textoEstado = textoEstadoCliente;
  claseEstado = claseEstadoCliente;

  ngOnInit(): void {
    this.cuenta.getPedidos().subscribe({
      next: p => {
        this.pedidos = p;
        this.cargando = false;
      },
      error: e => {
        this.error = this.cuenta.mensajeError(e, 'No se pudieron cargar tus pedidos.');
        this.cargando = false;
      },
    });
  }
}
