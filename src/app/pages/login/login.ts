import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  loginForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      // Usamos la misma validación estricta del registro
      correo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required]]
    });
  }

  onLogin(): void {
    // Si el formulario es inválido, mostramos los errores y bloqueamos el envío
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Si es válido, preparamos las credenciales para Django
    const credentials = {
      email: this.loginForm.value.correo,
      password: this.loginForm.value.password
    };

    console.log('Credenciales listas para pedir token a Django:', credentials);
    alert('¡Login válido y listo para conectar con la base de datos!');
  }
}