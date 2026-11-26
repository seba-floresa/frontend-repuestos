import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CuentaService } from '../../services/cuenta.service';
import { claseEstadoCliente, estadoCliente, textoEstadoCliente } from '../cuenta-pedidos/estado-cliente';

const PASOS = ['PAGADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'];

// Estados fuera de la línea de tiempo
const MENSAJES: Record<string, string> = {
  PENDIENTE_PAGO: 'Estamos esperando la confirmación del pago con Webpay.',
  RECHAZADO: 'El pago fue rechazado, por lo que el pedido no se procesó. No se realizó ningún cobro.',
  ANULADO: 'El pago se anuló y el pedido no se procesó.',
};

@Component({
  selector: 'app-cuenta-pedido-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cuenta-pedido-detalle.html',
  styleUrl: './cuenta-pedido-detalle.css',
})
export class CuentaPedidoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cuenta = inject(CuentaService);

  pedido: any = null;
  cargando = true;
  error = '';
  copiado = '';
  pasos = PASOS;
  textoEstado = textoEstadoCliente;
  claseEstado = claseEstadoCliente;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cuenta.getPedido(id).subscribe({
      next: p => {
        this.pedido = p;
        this.cargando = false;
      },
      error: e => {
        this.error = e.status === 404
          ? 'No encontramos este pedido en tu cuenta.'
          : this.cuenta.mensajeError(e, 'No se pudo cargar el pedido.');
        this.cargando = false;
      },
    });
  }

  /** Posición en la línea de tiempo, o -1 si el estado va aparte (rechazado, anulado, pendiente) */
  get paso(): number {
    return PASOS.indexOf(estadoCliente(this.pedido.estado));
  }

  get mensajeEstado(): string {
    return MENSAJES[this.pedido.estado] ?? '';
  }

  get conSeguimiento(): boolean {
    const p = this.pedido;
    return ['DESPACHADO', 'ENTREGADO'].includes(p.estado) && !!p.empresa_courier && !!p.codigo_seguimiento;
  }

  copiarCodigo(): void {
    const fallo = () => (this.copiado = 'No se pudo copiar: selecciónalo y cópialo a mano.');
    // navigator.clipboard solo existe en https o localhost
    if (!navigator.clipboard) {
      fallo();
      return;
    }
    navigator.clipboard.writeText(this.pedido.codigo_seguimiento).then(() => (this.copiado = 'Código copiado.'), fallo);
  }
}
