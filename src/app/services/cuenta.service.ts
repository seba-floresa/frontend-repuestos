import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

/** Cuenta del cliente con sesión iniciada: perfil, contraseña, vehículos y pedidos. */
@Injectable({ providedIn: 'root' })
export class CuentaService {
  private api = 'http://localhost:8000/api/';

  /** Avisa al header el nuevo nombre ("Hola, <nombre>") cuando se guarda el perfil */
  readonly nombreCambiado$ = new Subject<string>();

  constructor(private http: HttpClient) {}

  private opciones() {
    const csrf = document.cookie.match(/(^| )csrftoken=([^;]+)/)?.[2] ?? '';
    return { headers: new HttpHeaders({ 'X-CSRFToken': csrf }), withCredentials: true };
  }

  getPerfil(): Observable<any> {
    return this.http.get(`${this.api}mi-perfil/`, { withCredentials: true });
  }

  actualizarPerfil(data: { nombre_completo: string; telefono: string }): Observable<any> {
    return this.http.patch(`${this.api}mi-perfil/`, data, this.opciones());
  }

  cambiarPassword(data: { password_actual: string; password_nueva: string }): Observable<any> {
    return this.http.post(`${this.api}mi-perfil/cambiar-password/`, data, this.opciones());
  }

  eliminarCuenta(password: string): Observable<any> {
    return this.http.post(`${this.api}mi-perfil/eliminar-cuenta/`, { password }, this.opciones());
  }

  getVehiculos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}mis-vehiculos/`, { withCredentials: true });
  }

  quitarVehiculo(id: number): Observable<any> {
    return this.http.delete(`${this.api}mis-vehiculos/${id}/`, this.opciones());
  }

  getPedidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}mis-pedidos/`, { withCredentials: true });
  }

  getPedido(id: number): Observable<any> {
    return this.http.get(`${this.api}mis-pedidos/${id}/`, { withCredentials: true });
  }

  /** Mensaje en español del servidor (ej: "Debes iniciar sesión para continuar.") o uno genérico */
  mensajeError(err: any, porDefecto: string): string {
    return err?.error?.error || porDefecto;
  }
}
