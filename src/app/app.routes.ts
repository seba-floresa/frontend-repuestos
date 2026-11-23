import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AdminComponent } from './pages/admin/admin';
import { AdminCategoriasComponent } from './pages/admin-categorias/admin-categorias';
import { AdminCargaMasivaComponent } from './pages/admin-carga-masiva/admin-carga-masiva';
import { Devoluciones } from './pages/devoluciones/devoluciones';
import { SolicitarRepuesto } from './pages/solicitar-repuesto/solicitar-repuesto';
import { RepuestoDetalle } from './pages/repuesto-detalle/repuesto-detalle';
import { adminGuard } from './guards/admin-guard';
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
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'admin/categorias', component: AdminCategoriasComponent, canActivate: [adminGuard] },
  { path: 'admin/carga-masiva', component: AdminCargaMasivaComponent, canActivate: [adminGuard] },
  { path: 'pago-resultado', component: PagoResultado },
  { path: '**', redirectTo: '' } // Si escriben mal la URL, los manda al inicio
];