import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
})
export class Register {
  nombre: string = '';
  apellidos: string = '';
  rut: string = '';
  telefono: string = '';
  correo: string = '';
  password: string = '';
  confirmPassword: string = '';

  onRegister() {
    // Aquí después irá la conexión real con Django
    console.log('Solicitud de registro enviada por:', this.nombre, this.rut);
    alert('¡Solicitud enviada! Un administrador revisará tu cuenta pronto.');
  }
}