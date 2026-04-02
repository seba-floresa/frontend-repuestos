import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: Home }, // La página principal
  { path: 'nosotros', component: About },
  { path: 'login', component: Login },
  { path: 'registro', component: Register },
  { path: '**', redirectTo: '' } // Si escriben mal la URL, los manda al inicio
];