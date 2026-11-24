// Estados del panel (mismos valores que catalog/models.py) y el color de su etiqueta
export const ESTADOS_PEDIDO = [
  { valor: 'PENDIENTE_PAGO', texto: 'Pendiente de pago', clase: 'bg-secondary' },
  { valor: 'PAGADO', texto: 'Pagado', clase: 'bg-success' },
  { valor: 'REVISAR_STOCK', texto: 'Pagado, revisar stock', clase: 'bg-warning text-dark' },
  { valor: 'EN_PREPARACION', texto: 'En preparación', clase: 'bg-info text-dark' },
  { valor: 'DESPACHADO', texto: 'Despachado', clase: 'bg-primary' },
  { valor: 'ENTREGADO', texto: 'Entregado', clase: 'bg-light text-dark' },
  { valor: 'RECHAZADO', texto: 'Rechazado', clase: 'bg-danger' },
  { valor: 'ANULADO', texto: 'Anulado', clase: 'bg-dark border border-secondary' },
];

export const ESTADOS_SOLICITUD = [
  { valor: 'PENDIENTE', texto: 'Pendiente', clase: 'bg-warning text-dark' },
  { valor: 'EN_GESTION', texto: 'En gestión', clase: 'bg-info text-dark' },
  { valor: 'COTIZADA', texto: 'Cotizada', clase: 'bg-primary' },
  { valor: 'RESUELTA', texto: 'Resuelta', clase: 'bg-success' },
  { valor: 'NO_DISPONIBLE', texto: 'No disponible', clase: 'bg-danger' },
];

const todos = [...ESTADOS_PEDIDO, ...ESTADOS_SOLICITUD];

export function textoEstado(valor: string): string {
  return todos.find(e => e.valor === valor)?.texto ?? valor;
}

export function claseEstado(valor: string): string {
  return todos.find(e => e.valor === valor)?.clase ?? 'bg-secondary';
}
