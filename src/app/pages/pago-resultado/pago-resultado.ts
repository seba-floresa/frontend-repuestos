import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-pago-resultado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pago-resultado.html',
  styleUrl: './pago-resultado.css',
})
export class PagoResultado implements OnInit {
  private route = inject(ActivatedRoute);
  private carrito = inject(CarritoService);

  estado = '';
  pedido = '';
  monto = 0;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.estado = q.get('estado') ?? 'error';
    this.pedido = q.get('pedido') ?? '';
    this.monto = Number(q.get('monto') ?? 0);

    if (this.estado === 'ok') this.carrito.vaciar();
  }

  clp(valor: number): string {
    return '$' + Number(valor).toLocaleString('es-CL');
  }
}