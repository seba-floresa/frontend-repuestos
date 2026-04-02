import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
})
export class Login {
  email: string = '';
  password: string = '';

  onLogin() {
    // Por ahora solo veremos por consola que el botón funciona
    console.log('Intentando iniciar sesión con:', this.email);
    alert('¡Pronto conectaremos este formulario con los usuarios de Django!');
  }
}