import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CarritoService } from '../../services/carrito.service';

/** Valida un RUT chileno (Módulo 11) */
function rutValido(control: AbstractControl): ValidationErrors | null {
  const limpio = String(control.value ?? '').replace(/[.\-\s]/g, '').toUpperCase();
  if (!limpio) return null; // "required" se encarga del vacío
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return { rut: true };
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === esperado ? null : { rut: true };
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  carrito = inject(CarritoService);

  private api = 'http://localhost:8000/api/';

  logueado = !!localStorage.getItem('username');

  // Datos de quien compra / recibe
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    rut: ['', [Validators.required, rutValido]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    direccion: ['', [Validators.required, Validators.minLength(4)]],
    complemento: [''],
    instrucciones: [''],
    patente: [''],
  });
  mostrarInstrucciones = false;

  tarifas: any[] = [];
  region = '';
  tarifaId: number | null = null;

  cotizacion: { subtotal: number; costo_envio: number; monto_total: number; dias_habiles: number } | null = null;
  mensajeError = '';
  enviando = false;
  pedido: any = null; // respuesta cuando el pedido queda confirmado

  ngOnInit(): void {
    // Si hay sesión, pedimos al servidor los datos del cliente y rellenamos el formulario
    if (this.logueado) {
      this.http.get<any>(this.api + 'mi-perfil/', { withCredentials: true }).subscribe({
        next: p =>
          this.form.patchValue({
            email: p.email,
            nombre: p.nombre,
            apellido: p.apellido,
            rut: p.rut,
            telefono: p.telefono,
          }),
        error: () => {}, // sesión vencida o sin perfil: el cliente lo escribe a mano
      });
    }

    this.http.get<any[]>(this.api + 'tarifas-despacho/').subscribe({
      next: t => (this.tarifas = t),
      error: () => (this.mensajeError = 'No se pudieron cargar las comunas de despacho.'),
    });

    this.recalcular();
  }

  // --- Validación visual ---
  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  // --- Despacho ---
  get regiones(): string[] {
    return [...new Set(this.tarifas.map(t => t.region as string))];
  }
  get comunas(): any[] {
    return this.tarifas.filter(t => t.region === this.region);
  }

  elegirRegion(r: string): void {
    this.region = r;
    this.tarifaId = null;
    this.cotizacion = null;
  }

  elegirComuna(id: any): void {
    this.tarifaId = Number(id) || null;
    this.recalcular();
  }

  // --- Carrito ---
  cambiar(id: number, delta: number): void {
    this.carrito.cambiar(id, delta);
    this.recalcular();
  }

  quitar(id: number): void {
    this.carrito.quitar(id);
    this.recalcular();
  }

  /** Pide al servidor el total real (precio, peso y despacho) sin crear el pedido */
  recalcular(): void {
    this.mensajeError = '';
    this.cotizacion = null;
    if (!this.tarifaId || !this.carrito.items.length) return;

    this.http.post<any>(this.api + 'checkout/', this.cuerpo(true), this.opciones()).subscribe({
      next: r => (this.cotizacion = r),
      error: e => (this.mensajeError = this.extraerError(e)),
    });
  }

  get puedePagar(): boolean {
    return !!this.cotizacion && !this.enviando && this.carrito.items.length > 0;
  }

  pagar(): void {
    if (!this.puedePagar) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensajeError = 'Revisa los campos marcados en rojo.';
      return;
    }

    this.enviando = true;
    this.mensajeError = '';

    this.http.post<any>(this.api + 'checkout/', this.cuerpo(false), this.opciones()).subscribe({
      next: r => this.irAWebpay(r.webpay_url, r.webpay_token),
      error: e => {
        this.mensajeError = this.extraerError(e);
        this.enviando = false;
      },
    });
  }

  /** Webpay exige redirigir al cliente con un formulario POST que lleve el token_ws */
  private irAWebpay(url: string, token: string): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = token;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }

  private cuerpo(simular: boolean) {
    const v = this.form.getRawValue();
    return {
      items: this.carrito.items.map(i => ({ id: i.id, cantidad: i.cantidad })),
      tarifa_id: this.tarifaId,
      simular,
      cliente: {
        email: v.email,
        nombre: v.nombre,
        apellido: v.apellido,
        rut: v.rut,
        telefono: v.telefono,
        direccion: v.direccion,
        complemento: v.complemento,
        instrucciones: this.mostrarInstrucciones ? v.instrucciones : '',
        patente: v.patente,
      },
    };
  }

  private opciones() {
    const csrf = document.cookie.match(/(^| )csrftoken=([^;]+)/)?.[2] ?? '';
    return { withCredentials: true, headers: { 'X-CSRFToken': csrf } };
  }

  private extraerError(e: any): string {
    return e?.error?.error ?? 'No se pudo procesar el pedido. Intenta nuevamente.';
  }
}