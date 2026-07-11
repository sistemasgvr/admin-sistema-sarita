/**
 * IDs de `gen_lista` para GET /catalogos/listas/:idLista/opciones
 *
 * Consulta en BD: SELECT id, nombre FROM gen_lista ORDER BY id;
 * Reemplaza cada 0 con el id real de tu entorno.
 */
export const ListaIds = {
  /** gen_lista.nombre = TipoPersona */
  TIPO_PERSONA: 1,
  /** gen_lista.nombre = TipoCliente */
  TIPO_CLIENTE: 2,
  /** gen_lista.nombre = TipoDocumento */
  TIPO_DOCUMENTO: 3,
  /** gen_lista.nombre = UnidadMedida */
  UNIDAD_MEDIDA: 7,
  /** gen_lista.nombre = TipoMovInv */
  TIPO_MOV_INV: 4,
  /** gen_lista.nombre = TipoDocumentoRef */
  TIPO_DOCUMENTO_REF: 6,
  /** gen_lista.nombre = TipoCatalogoPrecio */
  TIPO_CATALOGO_PRECIO: 5,
  /** gen_lista.nombre = AmbienteSunat */
  AMBIENTE_SUNAT: 8,
  /** gen_lista.nombre = tipoLicencia */
  TIPO_LICENCIA: 34,
  /** gen_lista.nombre = categoriaLicencia */
  CATEGORIA_LICENCIA: 35,
  /** gen_lista.nombre = TipoVehiculo */
  TIPO_VEHICULO: 38,
} as const

export type ListaIdKey = keyof typeof ListaIds
