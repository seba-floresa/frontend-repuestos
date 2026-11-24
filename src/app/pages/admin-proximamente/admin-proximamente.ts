import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Secciones del panel aún sin contenido (Pedidos, Solicitudes)
@Component({
  selector: 'app-admin-proximamente',
  standalone: true,
  template: `
    <div class="text-white">
      <h2 class="fw-bold mb-3">{{ titulo }}</h2>
      <div class="alert bg-dark border-secondary text-light">
        <i class="bi bi-hourglass-split me-2" aria-hidden="true"></i>Próximamente: esta sección está en construcción.
      </div>
    </div>
  `
})
export class AdminProximamenteComponent {
  titulo = inject(ActivatedRoute).snapshot.data['titulo'];
}
