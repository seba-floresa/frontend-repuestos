import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';

@Component({
  selector: 'app-admin-resumen',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-resumen.html',
  styleUrl: './admin-resumen.css'
})
export class AdminResumenComponent implements OnInit {
  private crud = inject(AdminCrudService);

  periodos = [
    { valor: 'hoy', texto: 'Hoy' },
    { valor: '7d', texto: '7 días' },
    { valor: '30d', texto: '30 días' },
    { valor: 'todo', texto: 'Todo' },
  ];
  nombresEstado: Record<string, string> = {
    PAGADO: 'Pagados',
    PENDIENTE_PAGO: 'Pendientes de pago',
    REVISAR_STOCK: 'Revisar stock',
    RECHAZADO: 'Rechazados',
    ANULADO: 'Anulados',
  };

  periodo = '7d';
  datos: any = null;
  cargando = false;
  error = '';
  maxDia = 0;

  ngOnInit(): void {
    this.cargar('7d');
  }

  cargar(periodo: string): void {
    this.periodo = periodo;
    this.cargando = true;
    this.error = '';
    this.crud.getResumen(periodo).subscribe({
      next: (d: any) => {
        this.datos = d;
        this.maxDia = Math.max(0, ...d.ventas_por_dia.map((x: any) => x.total));
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudo cargar el resumen. Verifica tu sesión de administrador.';
      }
    });
  }

  get estados(): { estado: string; cantidad: number }[] {
    const e = this.datos?.pedidos_por_estado || {};
    return Object.keys(e).map(estado => ({ estado, cantidad: e[estado] }));
  }

  get totalPedidos(): number {
    return this.estados.reduce((s, e) => s + e.cantidad, 0);
  }

  altura(total: number): number {
    return this.maxDia ? Math.max(2, (total / this.maxDia) * 100) : 2;
  }

  // "2026-11-24" -> "24/11" sin pasar por Date (evita el desfase UTC)
  diaCorto(fecha: string): string {
    return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
  }
}
