import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-tarjeta-repuesto',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tarjeta-repuesto.html',
  styleUrl: './tarjeta-repuesto.css',
})
export class TarjetaRepuesto {
  @Input({ required: true }) p: any;

  constructor(private carrito: CarritoService) {}

  get esDesarmaduria(): boolean {
    return this.p.condicion !== 'NUEVO';
  }

  /** ¿La pieza está en la categoría Desarmaduría? (si no, un usado se llama "Reacondicionado") */
  get enDesarmaduria(): boolean {
    return String(this.p.categoria_nombre ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('desarmaduria');
  }

  imagenUrl(): string | null {
    if (!this.p.imagen) return null;
    return this.p.imagen.startsWith('http') ? this.p.imagen : 'http://localhost:8000' + this.p.imagen;
  }


  compatibilidad(): string {
    const lista: string[] = this.p.vehiculos_nombres || [];
    if (!lista.length) return 'Compatibilidad no especificada';
    return lista.length > 1 ? `${lista[0]} +${lista.length - 1} más` : lista[0];
  }

  agregar(): void {
    this.carrito.agregar({
      id: this.p.id, nombre: this.p.nombre, sku: this.p.sku, precio: this.p.precio,
      imagen: this.imagenUrl(), stock: this.p.stock
    });
    const el = document.getElementById('panelCarrito');
    const bs = (window as any).bootstrap;
    if (el && bs) bs.Offcanvas.getOrCreateInstance(el).show();
  }
}