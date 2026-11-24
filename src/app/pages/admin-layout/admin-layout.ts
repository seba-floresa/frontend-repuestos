import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent {
  menuAbierto = false;

  secciones = [
    { ruta: 'resumen', texto: 'Resumen', icono: 'bi-speedometer2' },
    { ruta: 'pedidos', texto: 'Pedidos', icono: 'bi-receipt' },
    { ruta: 'clientes', texto: 'Clientes', icono: 'bi-people' },
    { ruta: 'inventario', texto: 'Inventario', icono: 'bi-box-arrow-in-down' },
    { ruta: 'catalogo', texto: 'Catálogo', icono: 'bi-table' },
    { ruta: 'categorias', texto: 'Categorías', icono: 'bi-tags' },
    { ruta: 'vehiculos', texto: 'Vehículos', icono: 'bi-car-front' },
    { ruta: 'solicitudes', texto: 'Solicitudes', icono: 'bi-envelope' },
  ];
}
