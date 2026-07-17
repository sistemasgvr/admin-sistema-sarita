/**
 * IDs de `gen_lista` para GET /catalogos/listas/:idLista/opciones
 *
 * Fuente: SELECT id, nombre FROM gen_lista ORDER BY id;
 */
export const ListaIds = {
  /** gen_lista.nombre = TipoPersona */
  TIPO_PERSONA: 1,
  /** gen_lista.nombre = TipoCliente */
  TIPO_CLIENTE: 2,
  /** gen_lista.nombre = TipoDocumento */
  TIPO_DOCUMENTO: 3,
  /** gen_lista.nombre = TipoMovInv */
  TIPO_MOV_INV: 4,
  /** gen_lista.nombre = TipoCatalogoPrecio */
  TIPO_CATALOGO_PRECIO: 5,
  /** gen_lista.nombre = TipoDocumentoRef */
  TIPO_DOCUMENTO_REF: 6,
  /** gen_lista.nombre = UnidadMedida */
  UNIDAD_MEDIDA: 7,
  /** gen_lista.nombre = AmbienteSunat */
  AMBIENTE_SUNAT: 8,
  /** gen_lista.nombre = ReferenciaCilindro */
  REFERENCIA_CILINDRO: 9,
  /** gen_lista.nombre = EstadoCilindroVenta */
  ESTADO_CILINDRO_VENTA: 10,
  /** gen_lista.nombre = EstadoMantenimiento */
  ESTADO_MANTENIMIENTO: 11,
  /** gen_lista.nombre = EstadoAlquiler */
  ESTADO_ALQUILER: 12,
  /** gen_lista.nombre = EstadoPrestamo */
  ESTADO_PRESTAMO: 13,
  /** gen_lista.nombre = PropietarioBalon */
  PROPIETARIO_BALON: 14,
  /** gen_lista.nombre = EstadoBalon */
  ESTADO_BALON: 15,
  /** gen_lista.nombre = TipoMantenimiento */
  TIPO_MANTENIMIENTO: 16,
  /** gen_lista.nombre = TipoMovBalon */
  TIPO_MOV_BALON: 17,
  /** gen_lista.nombre = TipoPrestamo */
  TIPO_PRESTAMO: 18,
  /** gen_lista.nombre = EstadoPrestamoDetalle */
  ESTADO_PRESTAMO_DETALLE: 19,
  /** gen_lista.nombre = MotivoBajaBalon */
  MOTIVO_BAJA_BALON: 20,
  /** gen_lista.nombre = MarcaCilindro */
  MARCA_CILINDRO: 21,
  /** gen_lista.nombre = OrganoInspectorCilindro */
  ORGANO_INSPECTOR_CILINDRO: 22,
  /** gen_lista.nombre = tipoLicencia */
  TIPO_LICENCIA: 34,
  /** gen_lista.nombre = categoriaLicencia */
  CATEGORIA_LICENCIA: 35,
  /** gen_lista.nombre = TipoVehiculo */
  TIPO_VEHICULO: 38,
  /** gen_lista.nombre = TipoCuenta (AHORROS, CCI, YAPE, PLIN) */
  TIPO_CUENTA: 41,
  /** gen_lista.nombre = Banco (BCP, BBVA, etc.) */
  BANCO: 40,
  /** gen_lista.nombre = MotivoBajaCliente */
  MOTIVO_BAJA_CLIENTE: 46,
} as const

export type ListaIdKey = keyof typeof ListaIds
