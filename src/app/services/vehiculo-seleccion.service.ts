import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { BuscadorVehiculoService } from './buscador-vehiculo.service';

export interface VehiculoElegido {
  id?: number;
  marca: string;
  modelo: string;
  anio?: string | number;
  motorizacion?: string;
}

/** Vehículo elegido por el cliente: lo comparten el header, el modal y el Home. */
@Injectable({ providedIn: 'root' })
export class VehiculoSeleccionService {
  private api = 'http://localhost:8000/api/vehiculos/';
  private clave = 'vehiculo';

  readonly vehiculo$ = new BehaviorSubject<VehiculoElegido | null>(this.leer());

  catalogo: any[] = [];          // vehículos de la BD (para los selects)
  marca = '';
  modelo = '';
  versionId: number | null = null;

  constructor(private http: HttpClient, private buscador: BuscadorVehiculoService) {
    this.http.get<any>(this.api).subscribe({
      next: d => (this.catalogo = Array.isArray(d) ? d : (d?.results ?? [])),
      error: e => console.error('Error al cargar vehículos:', e)
    });
  }

  get actual(): VehiculoElegido | null {
    return this.vehiculo$.value;
  }

  // --- Selects Marca / Modelo / Versión ---
  get marcas(): string[] {
    return [...new Set(this.catalogo.map(v => v.marca as string))].sort();
  }
  get modelos(): string[] {
    return [...new Set(this.catalogo.filter(v => v.marca === this.marca).map(v => v.modelo as string))].sort();
  }
  get versiones(): any[] {
    return this.catalogo.filter(v => v.marca === this.marca && v.modelo === this.modelo);
  }
  etiquetaVersion(v: any): string {
    const rango = v.anio_fin ? `${v.anio_inicio}-${v.anio_fin}` : `${v.anio_inicio}+`;
    return v.motorizacion ? `${rango} · Motor ${v.motorizacion}` : rango;
  }

  elegirMarca(m: string): void { this.marca = m; this.modelo = ''; this.versionId = null; }
  elegirModelo(m: string): void { this.modelo = m; this.versionId = null; }
  elegirVersion(id: any): void { this.versionId = Number(id) || null; }

  /** Pestaña "Datos": guarda la versión elegida */
  aplicarDatos(): boolean {
    const v = this.catalogo.find(x => x.id === this.versionId);
    if (!v) return false;
    this.guardar({
      id: v.id,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio_fin ? `${v.anio_inicio}-${v.anio_fin}` : `${v.anio_inicio}+`,
      motorizacion: v.motorizacion || ''
    });
    return true;
  }

  /** Pestañas Patente / VIN */
  buscarIdentificador(valor: string): Observable<any> {
    return this.buscador.buscar(valor).pipe(
      tap(d => this.guardar({ marca: d.marca, modelo: d.modelo, anio: d.anio, motorizacion: d.motorizacion }))
    );
  }

  limpiar(): void {
    this.marca = ''; this.modelo = ''; this.versionId = null;
    this.guardar(null);
  }

  /** ¿El repuesto es compatible con el vehículo elegido? (sin vehículo → true) */
  coincide(p: any): boolean {
    const v = this.actual;
    if (!v) return true;
    if (v.id && Array.isArray(p.vehiculos) && p.vehiculos.includes(v.id)) return true;
    const prefijo = `${v.marca} ${v.modelo}`.toLowerCase();
    return (p.vehiculos_nombres || []).some((n: string) => n.toLowerCase().startsWith(prefijo));
  }

  private guardar(v: VehiculoElegido | null): void {
    this.vehiculo$.next(v);
    try {
      if (v) localStorage.setItem(this.clave, JSON.stringify(v));
      else localStorage.removeItem(this.clave);
    } catch { /* sin storage */ }
  }

  private leer(): VehiculoElegido | null {
    try { return JSON.parse(localStorage.getItem(this.clave) || 'null'); } catch { return null; }
  }
}