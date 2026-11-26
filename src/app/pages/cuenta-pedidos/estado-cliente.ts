import { claseEstado, textoEstado } from '../admin-layout/estados';

// REVISAR_STOCK es un aviso interno del panel: para el cliente el pedido está "Pagado"
export const estadoCliente = (e: string) => (e === 'REVISAR_STOCK' ? 'PAGADO' : e);
export const textoEstadoCliente = (e: string) => textoEstado(estadoCliente(e));
export const claseEstadoCliente = (e: string) => claseEstado(estadoCliente(e));
