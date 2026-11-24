import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminCrudService {
  private apiUrl = 'http://localhost:8000/api/';

  constructor(private http: HttpClient) {}

  // Función auxiliar para extraer el token CSRF que envía Django en las cookies
  private getCsrfToken(): string {
    const name = 'csrftoken';
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
  }

  // Método privado para generar los headers con credenciales y CSRF
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-CSRFToken': this.getCsrfToken()
    });
  }

  // Consultas para selectores del formulario (GET no requiere CSRF)
  getCategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}categorias/`);
  }

  getSubcategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}subcategorias/`);
  }

  getVehiculos(): Observable<any> {
    return this.http.get(`${this.apiUrl}vehiculos/`);
  }

  // CRUD completo para repuestos
  getRepuestos(): Observable<any> {
    return this.http.get(`${this.apiUrl}repuestos/`);
  }

  // Listado paginado del panel: { count, results }. Filtros: q, categoria, condicion, stock_critico
  listarRepuestos(filtros: Record<string, string | number>): Observable<any> {
    return this.http.get(`${this.apiUrl}repuestos/`, { params: filtros, withCredentials: true });
  }

  cambiarActivo(id: number, activo: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}repuestos/${id}/`, { activo }, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // Indicadores del panel (solo administradores)
  getResumen(periodo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/resumen/`, { params: { periodo }, withCredentials: true });
  }

  // Pedidos (solo lectura + avance de estado validado en el servidor)
  listarPedidos(filtros: Record<string, string | number>): Observable<any> {
    return this.http.get(`${this.apiUrl}pedidos/`, { params: filtros, withCredentials: true });
  }

  getPedido(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}pedidos/${id}/`, { withCredentials: true });
  }

  avanzarPedido(id: number, data: { estado: string; empresa_courier?: string; codigo_seguimiento?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}pedidos/${id}/avanzar-estado/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // Solicitudes especiales (HU-02)
  listarSolicitudes(filtros: Record<string, string | number>): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/solicitudes/`, { params: filtros, withCredentials: true });
  }

  getSolicitud(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/solicitudes/${id}/`, { withCredentials: true });
  }

  actualizarSolicitud(id: number, data: {
    estado: string; valor_cotizado: number | null; comentario_admin: string; notificar_cliente: boolean; mensaje_cliente: string
  }): Observable<any> {
    return this.http.patch(`${this.apiUrl}admin/solicitudes/${id}/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // Clientes (derivados de los pedidos)
  listarClientes(filtros: Record<string, string | number>): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/clientes/`, { params: filtros, withCredentials: true });
  }

  getCliente(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/clientes/detalle/`, { params: { email }, withCredentials: true });
  }

  crearVehiculo(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}vehiculos/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  actualizarVehiculo(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}vehiculos/${id}/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  crearRepuesto(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}repuestos/`, formData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  actualizarRepuesto(id: number, formData: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}repuestos/${id}/`, formData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  actualizarStock(id: number, stock: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}repuestos/${id}/`, { stock }, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  eliminarRepuesto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}repuestos/${id}/`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }


  // Carga masiva por CSV: modo "validar" (no guarda) o "importar"
  cargaMasiva(archivo: File, modo: 'validar' | 'importar'): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    formData.append('modo', modo);
    return this.http.post(`${this.apiUrl}repuestos/carga-masiva/`, formData, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

    // Un solo repuesto (página de detalle)
  getRepuesto(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}repuestos/${id}/`);
  }

  // CRUD de categorías
  crearCategoria(data: { nombre: string; descripcion?: string; prefijo_sku?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}categorias/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  actualizarCategoria(id: number, data: { nombre: string; descripcion?: string; prefijo_sku?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}categorias/${id}/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}categorias/${id}/`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // CRUD de subcategorías
  crearSubcategoria(data: { categoria: number; nombre: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}subcategorias/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  actualizarSubcategoria(id: number, data: { categoria: number; nombre: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}subcategorias/${id}/`, data, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  eliminarSubcategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}subcategorias/${id}/`, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}logout/`, {}, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }

  // Método para autenticar al usuario contra la base de datos
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}login/`, credentials, {
      headers: this.getAuthHeaders(),
      withCredentials: true
    });
  }
}