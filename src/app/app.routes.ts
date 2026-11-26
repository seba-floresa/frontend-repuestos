import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Devoluciones } from './pages/devoluciones/devoluciones';
import { SolicitarRepuesto } from './pages/solicitar-repuesto/solicitar-repuesto';
import { RepuestoDetalle } from './pages/repuesto-detalle/repuesto-detalle';
import { adminGuard } from './guards/admin-guard';
import { authGuard } from './guards/auth-guard';
import { Categoria } from './pages/categoria/categoria';
import { Checkout } from './pages/checkout/checkout';
import { PagoResultado } from './pages/pago-resultado/pago-resultado';


export const routes: Routes = [
  { path: '', component: Home }, // La página principal
  { path: 'repuesto/:id', component: RepuestoDetalle }, // Página de cada repuesto
  { path: 'categoria/:categoriaId', component: Categoria },
  { path: 'categoria/:categoriaId/:subcategoriaId', component: Categoria },
  { path: 'nosotros', component: About },
  { path: 'devoluciones', component: Devoluciones },
  { path: 'solicitar-repuesto', component: SolicitarRepuesto },
  { path: 'checkout', component: Checkout },
  { path: 'login', component: Login },
  { path: 'registro', component: Register },
  // El panel se carga solo al entrar (no pesa en el bundle de la tienda)
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen', loadComponent: () => import('./pages/admin-resumen/admin-resumen').then(m => m.AdminResumenComponent) },
      { path: 'pedidos', loadComponent: () => import('./pages/admin-pedidos/admin-pedidos').then(m => m.AdminPedidosComponent) },
      { path: 'pedidos/:id', loadComponent: () => import('./pages/admin-pedido-detalle/admin-pedido-detalle').then(m => m.AdminPedidoDetalleComponent) },
      { path: 'clientes', loadComponent: () => import('./pages/admin-clientes/admin-clientes').then(m => m.AdminClientesComponent) },
      { path: 'clientes/detalle', loadComponent: () => import('./pages/admin-cliente-detalle/admin-cliente-detalle').then(m => m.AdminClienteDetalleComponent) },
      { path: 'inventario', loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent) },
      { path: 'inventario/carga-masiva', loadComponent: () => import('./pages/admin-carga-masiva/admin-carga-masiva').then(m => m.AdminCargaMasivaComponent) },
      { path: 'carga-masiva', redirectTo: 'inventario/carga-masiva' }, // enlace antiguo
      { path: 'catalogo', loadComponent: () => import('./pages/admin-catalogo/admin-catalogo').then(m => m.AdminCatalogoComponent) },
      { path: 'categorias', loadComponent: () => import('./pages/admin-categorias/admin-categorias').then(m => m.AdminCategoriasComponent) },
      { path: 'vehiculos', loadComponent: () => import('./pages/admin-vehiculos/admin-vehiculos').then(m => m.AdminVehiculosComponent) },
      { path: 'solicitudes', loadComponent: () => import('./pages/admin-solicitudes/admin-solicitudes').then(m => m.AdminSolicitudesComponent) },
      { path: 'solicitudes/:id', loadComponent: () => import('./pages/admin-solicitud-detalle/admin-solicitud-detalle').then(m => m.AdminSolicitudDetalleComponent) },
    ]
  },
  // Cuenta del cliente: solo con sesión; se carga al entrar
  {
    path: 'cuenta',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },
      { path: 'perfil', loadComponent: () => import('./pages/cuenta-perfil/cuenta-perfil').then(m => m.CuentaPerfilComponent) },
      { path: 'pedidos', loadComponent: () => import('./pages/cuenta-pedidos/cuenta-pedidos').then(m => m.CuentaPedidosComponent) },
      { path: 'pedidos/:id', loadComponent: () => import('./pages/cuenta-pedido-detalle/cuenta-pedido-detalle').then(m => m.CuentaPedidoDetalleComponent) },
    ]
  },
  { path: 'pago-resultado', component: PagoResultado },
  { path: '**', redirectTo: '' } // Si escriben mal la URL, los manda al inicio
];