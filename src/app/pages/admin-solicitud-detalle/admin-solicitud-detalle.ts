import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';
import { ESTADOS_SOLICITUD, claseEstado } from '../admin-layout/estados';

@Component({
  selector: 'app-admin-solicitud-detalle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-solicitud-detalle.html'
})
export class AdminSolicitudDetalleComponent implements OnInit {
  private crud = inject(AdminCrudService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  readonly estados = ESTADOS_SOLICITUD;
  readonly claseEstado = claseEstado;

  solicitud: any = null;
  error = '';
  aviso = '';
  avisoCorreo = '';
  guardando = false;

  form = this.fb.group({
    estado: ['PENDIENTE', Validators.required],
    valor_cotizado: [null as number | null, Validators.min(0)],
    comentario_admin: [''],
    notificar_cliente: [false],
    mensaje_cliente: ['', Validators.maxLength(1000)]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.crud.getSolicitud(id).subscribe({
      next: (s: any) => this.mostrar(s),
      error: (err: any) => (this.error = err.status === 404 ? 'La solicitud no existe.' : 'No se pudo cargar la solicitud.')
    });
  }

  private mostrar(s: any): void {
    this.solicitud = s;
    this.form.reset({
      estado: s.estado, valor_cotizado: s.valor_cotizado, comentario_admin: s.comentario_admin || '',
      notificar_cliente: false, mensaje_cliente: ''
    });
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) return;
    const v = this.form.value;
    this.guardando = true;
    this.error = '';
    this.aviso = '';
    this.avisoCorreo = '';
    const notificar = !!v.notificar_cliente;
    this.crud.actualizarSolicitud(this.solicitud.id, {
      estado: v.estado!,
      valor_cotizado: v.valor_cotizado ?? null,
      comentario_admin: (v.comentario_admin || '').trim(),
      notificar_cliente: notificar,
      mensaje_cliente: notificar ? (v.mensaje_cliente || '').trim() : ''
    }).subscribe({
      next: (s: any) => {
        this.guardando = false;
        this.mostrar(s);
        if (!notificar) {
          this.aviso = 'Solicitud actualizada.';
        } else if (s.correo_enviado) {
          this.aviso = `Solicitud actualizada. Correo enviado a ${s.correo_destino}.`;
        } else {
          // El cambio se guardó aunque el correo no haya salido
          this.aviso = 'Solicitud actualizada.';
          this.avisoCorreo = `No se pudo enviar el correo al cliente. ${s.motivo_correo || ''}`.trim();
        }
      },
      error: (err: any) => {
        this.guardando = false;
        const e = err?.error || {};
        this.error = [e.estado, e.valor_cotizado, e.comentario_admin, e.mensaje_cliente].flat().filter(Boolean).join(' ') || 'No se pudo guardar la solicitud.';
      }
    });
  }
}
