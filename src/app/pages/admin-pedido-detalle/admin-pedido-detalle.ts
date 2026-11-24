import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';
import { claseEstado, textoEstado } from '../admin-layout/estados';

@Component({
  selector: 'app-admin-pedido-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-pedido-detalle.html'
})
export class AdminPedidoDetalleComponent implements OnInit {
  private crud = inject(AdminCrudService);
  private route = inject(ActivatedRoute);

  readonly claseEstado = claseEstado;
  readonly textoEstado = textoEstado;

  pedido: any = null;
  error = '';
  aviso = '';
  guardando = false;
  courier = '';
  seguimiento = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.crud.getPedido(id).subscribe({
      next: (p: any) => (this.pedido = p),
      error: (err: any) => (this.error = err.status === 404 ? 'El pedido no existe.' : 'No se pudo cargar el pedido.')
    });
  }

  get pideDespacho(): boolean {
    return this.pedido?.siguiente_estado === 'DESPACHADO';
  }

  avanzar(): void {
    const siguiente = this.pedido.siguiente_estado;
    if (!siguiente || this.guardando) return;
    if (this.pideDespacho && (!this.courier.trim() || !this.seguimiento.trim())) {
      this.error = 'Para despachar indica la empresa de courier y el código de seguimiento.';
      return;
    }
    if (!confirm(`¿Pasar el pedido #${this.pedido.id} a "${textoEstado(siguiente)}"?`)) return;

    this.guardando = true;
    this.error = '';
    const datos = this.pideDespacho
      ? { estado: siguiente, empresa_courier: this.courier.trim(), codigo_seguimiento: this.seguimiento.trim() }
      : { estado: siguiente };
    this.crud.avanzarPedido(this.pedido.id, datos).subscribe({
      next: (p: any) => {
        this.pedido = p;
        this.guardando = false;
        this.aviso = `Pedido actualizado a "${p.estado_nombre}".`;
      },
      error: (err: any) => {
        this.guardando = false;
        const e = err?.error || {};
        this.error = e.error || e.empresa_courier || e.codigo_seguimiento || 'No se pudo actualizar el pedido.';
      }
    });
  }
}
