import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-solicitar-repuesto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './solicitar-repuesto.html',
  styleUrl: './solicitar-repuesto.css',
})
export class SolicitarRepuesto {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  form = this.fb.group({
    vehiculo: [''],
    pieza: ['', [Validators.required, Validators.maxLength(200)]],
    urgencia: ['MEDIA'],
  });

  enviando = false;
  estado: '' | 'ok' | 'login' = '';
  mensajeError = '';

  enviar(): void {
    if (this.form.invalid) return;
    this.estado = '';
    this.mensajeError = '';

    if (!localStorage.getItem('username')) {
      this.estado = 'login';
      return;
    }

    const csrf = document.cookie.match(/(^| )csrftoken=([^;]+)/)?.[2] ?? '';
    this.enviando = true;
    this.http.post('http://localhost:8000/api/solicitudes/', this.form.value, {
      withCredentials: true,
      headers: { 'X-CSRFToken': csrf },
    }).subscribe({
      next: () => {
        this.enviando = false;
        this.estado = 'ok';
        this.form.reset({ vehiculo: '', pieza: '', urgencia: 'MEDIA' });
      },
      error: (e) => {
        this.enviando = false;
        this.mensajeError = e?.error?.error ?? 'No se pudo enviar la solicitud. Intenta nuevamente.';
      },
    });
  }
}