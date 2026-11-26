import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/** Solo con sesión iniciada (el login guarda "username"). El servidor vuelve a validar la sesión en cada llamada. */
export const authGuard: CanActivateFn = () =>
  localStorage.getItem('username') ? true : inject(Router).createUrlTree(['/login']);
