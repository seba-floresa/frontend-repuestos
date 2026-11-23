import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  imagen: string | null;
  stock: number;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private clave = 'carrito';
  readonly items$ = new BehaviorSubject<ItemCarrito[]>(this.leer());

  get items(): ItemCarrito[] { return this.items$.value; }
  get cantidadTotal(): number { return this.items.reduce((s, i) => s + i.cantidad, 0); }
  get total(): number { return this.items.reduce((s, i) => s + i.precio * i.cantidad, 0); }

  agregar(p: { id: number; nombre: string; sku: string; precio: number; imagen: string | null; stock: number }, cantidad = 1): void {
    const lista = this.items.map(i => ({ ...i }));
    const existente = lista.find(i => i.id === p.id);
    if (existente) {
      existente.stock = p.stock;
      existente.cantidad = Math.min(existente.cantidad + cantidad, p.stock);
    } else {
      lista.push({ ...p, precio: Number(p.precio), cantidad: Math.min(cantidad, p.stock) });
    }
    this.guardar(lista);
  }

  cambiar(id: number, delta: number): void {
    const lista = this.items
      .map(i => (i.id === id ? { ...i, cantidad: Math.min(i.cantidad + delta, i.stock) } : { ...i }))
      .filter(i => i.cantidad > 0);
    this.guardar(lista);
  }

  quitar(id: number): void { this.guardar(this.items.filter(i => i.id !== id)); }
  vaciar(): void { this.guardar([]); }

  private guardar(lista: ItemCarrito[]): void {
    this.items$.next(lista);
    try { localStorage.setItem(this.clave, JSON.stringify(lista)); } catch { /* sin storage */ }
  }

  private leer(): ItemCarrito[] {
    try { return JSON.parse(localStorage.getItem(this.clave) || '[]'); } catch { return []; }
  }
}