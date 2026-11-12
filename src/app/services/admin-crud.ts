import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminCrudService {
  private apiUrl = 'http://localhost:8000/api/';

  constructor(private http: HttpClient) {}

  // Consulta de categorías para llenar el selector
  getCategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}categorias/`);
  }

  // MÉTODOS PARA REPUESTOS (PRODUCTOS)
  getRepuestos(): Observable<any> {
    return this.http.get(`${this.apiUrl}repuestos/`);
  }

  crearRepuesto(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}repuestos/`, formData);
  }

  eliminarRepuesto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}repuestos/${id}/`);
  }
}