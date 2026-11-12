import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Verifica que exista token y que el usuario tenga rol de admin/staff
  if (user && user.is_staff) {
    return true;
  }

  // Redirige al inicio de sesión si no es admin
  router.navigate(['/login']);
  return false;
};