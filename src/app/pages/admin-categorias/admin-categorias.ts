import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminCrudService } from '../../services/admin-crud';

@Component({
  selector: 'app-admin-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-categorias.html',
})
export class AdminCategoriasComponent implements OnInit {
  categorias: any[] = [];
  subcategorias: any[] = [];
  repuestos: any[] = []; // solo para contar cuántos repuestos tiene cada categoría/subcategoría

  catForm!: FormGroup;
  subForm!: FormGroup;
  editandoCatId: number | null = null;
  editandoSubId: number | null = null;

  mensaje: { tipo: 'ok' | 'error'; texto: string } | null = null;

  constructor(private fb: FormBuilder, private crud: AdminCrudService) {}

  ngOnInit(): void {
    this.catForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
    this.subForm = this.fb.group({
      categoria: ['', Validators.required],
      nombre: ['', Validators.required]
    });
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.crud.getCategorias().subscribe({
      next: (d: any) => (this.categorias = d),
      error: () => this.avisar('error', 'No se pudieron cargar las categorías.')
    });
    this.crud.getSubcategorias().subscribe({
      next: (d: any) => (this.subcategorias = d),
      error: () => this.avisar('error', 'No se pudieron cargar las subcategorías.')
    });
    this.crud.getRepuestos().subscribe({
      next: (d: any) => (this.repuestos = Array.isArray(d) ? d : (d?.results ?? [])),
      error: () => {}
    });
  }

  // --- Ayudas de lectura ----------------------------------------------------

  subcategoriasDe(categoriaId: number): any[] {
    return this.subcategorias.filter(s => s.categoria === categoriaId);
  }

  repuestosDeCategoria(id: number): number {
    return this.repuestos.filter(r => r.categoria_id === id).length;
  }

  repuestosDeSubcategoria(id: number): number {
    return this.repuestos.filter(r => r.subcategoria_id === id).length;
  }

  // --- Categorías -----------------------------------------------------------

  guardarCategoria(): void {
    if (this.catForm.invalid) return;
    const datos = {
      nombre: this.catForm.value.nombre.trim(),
      descripcion: (this.catForm.value.descripcion || '').trim()
    };

    const peticion$ = this.editandoCatId
      ? this.crud.actualizarCategoria(this.editandoCatId, datos)
      : this.crud.crearCategoria(datos);

    peticion$.subscribe({
      next: () => {
        this.avisar('ok', this.editandoCatId ? 'Categoría actualizada.' : 'Categoría creada.');
        this.cancelarCategoria();
        this.cargarTodo();
      },
      error: (err: any) => this.avisar('error', this.extraerError(err))
    });
  }

  editarCategoria(c: any): void {
    this.editandoCatId = c.id;
    this.catForm.patchValue({ nombre: c.nombre, descripcion: c.descripcion || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarCategoria(): void {
    this.editandoCatId = null;
    this.catForm.reset({ nombre: '', descripcion: '' });
  }

  eliminarCategoria(c: any): void {
    const subs = this.subcategoriasDe(c.id).length;
    const aviso = subs
      ? `¿Eliminar la categoría "${c.nombre}" y sus ${subs} subcategorías?`
      : `¿Eliminar la categoría "${c.nombre}"?`;
    if (!confirm(aviso)) return;

    this.crud.eliminarCategoria(c.id).subscribe({
      next: () => {
        this.avisar('ok', 'Categoría eliminada.');
        this.cargarTodo();
      },
      error: (err: any) => this.avisar('error', this.extraerError(err))
    });
  }

  // --- Subcategorías --------------------------------------------------------

  guardarSubcategoria(): void {
    if (this.subForm.invalid) return;
    const datos = {
      categoria: Number(this.subForm.value.categoria),
      nombre: this.subForm.value.nombre.trim()
    };

    const peticion$ = this.editandoSubId
      ? this.crud.actualizarSubcategoria(this.editandoSubId, datos)
      : this.crud.crearSubcategoria(datos);

    peticion$.subscribe({
      next: () => {
        this.avisar('ok', this.editandoSubId ? 'Subcategoría actualizada.' : 'Subcategoría creada.');
        this.cancelarSubcategoria();
        this.cargarTodo();
      },
      error: (err: any) => this.avisar('error', this.extraerError(err))
    });
  }

  editarSubcategoria(s: any): void {
    this.editandoSubId = s.id;
    this.subForm.patchValue({ categoria: s.categoria, nombre: s.nombre });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarSubcategoria(): void {
    this.editandoSubId = null;
    this.subForm.reset({ categoria: '', nombre: '' });
  }

  eliminarSubcategoria(s: any): void {
    if (!confirm(`¿Eliminar la subcategoría "${s.nombre}"?`)) return;

    this.crud.eliminarSubcategoria(s.id).subscribe({
      next: () => {
        this.avisar('ok', 'Subcategoría eliminada.');
        this.cargarTodo();
      },
      error: (err: any) => this.avisar('error', this.extraerError(err))
    });
  }

  // --- Mensajes -------------------------------------------------------------

  private avisar(tipo: 'ok' | 'error', texto: string): void {
    this.mensaje = { tipo, texto };
    setTimeout(() => {
      if (this.mensaje?.texto === texto) this.mensaje = null;
    }, 5000);
  }

  private extraerError(err: any): string {
    const e = err?.error;
    if (e && typeof e === 'object') {
      if (typeof e.error === 'string') return e.error;
      if (typeof e.detail === 'string') return e.detail;
      return Object.keys(e)
        .map(k => `${k}: ${Array.isArray(e[k]) ? e[k].join(' ') : e[k]}`)
        .join(' · ');
    }
    return 'No se pudo completar la acción. Revisa tu sesión de administrador.';
  }
}