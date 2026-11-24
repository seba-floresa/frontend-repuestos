import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';
import { claseEstado } from '../admin-layout/estados';

@Component({
  selector: 'app-admin-cliente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-cliente-detalle.html'
})
export class AdminClienteDetalleComponent implements OnInit {
  private crud = inject(AdminCrudService);
  private route = inject(ActivatedRoute);

  readonly claseEstado = claseEstado;
  cliente: any = null;
  error = '';

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') || '';
    this.crud.getCliente(email).subscribe({
      next: (c: any) => (this.cliente = c),
      error: (err: any) => (this.error = err.status === 404 ? 'No hay pedidos con ese correo.' : 'No se pudo cargar el cliente.')
    });
  }
}
